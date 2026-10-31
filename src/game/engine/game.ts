// Le moteur : une scène Phaser qui dessine la carte et les personnages dans un seul canevas de 384 × 216,
// déplace le héros, gère les portes, et offre aux chapitres une petite boîte à outils (dire, choisir,
// marcher, montrer un gros plan…). Le contenu de l'histoire vit dans src/game/chapters/.
import Phaser from 'phaser';
import { actionExit, active, blocked, footAt, overlap, takesExit, blockedBy, inRect, nearestFree, reachOf, sortLine, sortThings, type PlacedObject, type Dir, type Drawable, type GameMap, type Rect } from './maps';
import { drawActor, dirOf, makeActor, vec, type Actor, type Look } from './actors';
import { applyEffects, has, state, type Effects } from './state';
import { ui, wait } from './ui';
import * as A from 'virtual:rpg-art';

export const VIEW_W = 384;
export const VIEW_H = 216;
const SPEED = 60;

/** Un gros plan : dessine tout l'écran, t = millisecondes depuis son début. */
export type PlanFn = (ctx: CanvasRenderingContext2D, t: number) => void;
export type PortraitFn = (ctx: CanvasRenderingContext2D, t: number, talking: boolean, expr?: string) => void;

export interface Speaker { name: string; look?: Look; portrait?: PortraitFn | null }

export interface Option { label: string; if?: () => boolean; effects?: Effects }

/** Ce que le joueur vise en appuyant sur action. */
export interface Target { kind: 'actor' | 'object' | 'zone' | 'exit'; id: string; map: string }

/** Le contenu d'un chapitre : ses cartes, ses personnages, et ses réactions. */
export interface Chapter {
  maps: () => Record<string, GameMap>;
  speakers: Record<string, Speaker>;
  /** Lance le chapitre (écran titre compris). */
  run(g: Game): Promise<void>;
  /** Le joueur appuie sur action devant ces cibles (la plus proche d'abord). Renvoie faux si rien ne se passe. */
  interact?(g: Game, targets: Target[]): Promise<boolean>;
  /** Le héros entre dans une zone nommée de la carte. */
  enter?(g: Game, zone: string): void;
  /** Le héros veut franchir une sortie : faux pour l'en empêcher. */
  canExit?(g: Game, exit: GameMap['exits'][number]): Promise<boolean>;
  /** Le héros vient d'arriver sur une carte. */
  arrived?(g: Game, map: string): void;
  /** Décor propre au chapitre, trié avec les personnages (œufs, ruban, traînée de cheveux…). */
  decor?(g: Game, map: string, t: number): Drawable[];
  /** Ce que le chapitre change au dessin d'une carte : état des objets (œuf montré…), bêtes dessinées ou non. */
  mapOptions?(g: Game, map: string): { state?: Record<string, unknown>; animals?: boolean };
  /** Un personnage des cartes (champ npcs) : son allure, d'après son id et le look demandé par la carte. */
  npcLook?(id: string, look?: string): Look | undefined;
  /** Dessin par-dessus la carte, en coordonnées de carte (nuit, lumières). */
  overlay?(g: Game, ctx: CanvasRenderingContext2D, t: number): void;
}

export class Game extends Phaser.Scene {
  maps: Record<string, GameMap> = {};
  map!: GameMap;
  hero!: Actor;
  cast = new Map<string, Actor>();
  night = false;
  /** Vrai pendant une scène : le héros ne bouge pas. */
  locked = true;
  stick = { x: 0, y: 0 };
  /** Noir par-dessus l'image, de 0 à 1. */
  fadeLevel = 0;
  cam = { x: 0, y: 0 };
  private plan: { draw: PlanFn; t0: number } | null = null;
  private canvas!: Phaser.Textures.CanvasTexture;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private zonesIn = new Set<string>();
  private waiters: { test: () => boolean; done: () => void }[] = [];
  private lastExitTry = 0;
  private cuts = 0;
  private lockedBeforeCut = false;
  /** Assombrit l'écran sauf autour d'un point (décompte, réveil). */
  vignette: { x: number; y: number; r: number; a: number } | null = null;

  constructor(readonly chapter: Chapter) {
    super('game');
  }

  create() {
    this.canvas = this.textures.createCanvas('view', VIEW_W, VIEW_H)!;
    this.add.image(0, 0, 'view').setOrigin(0);
    const kb = this.input.keyboard!;
    this.keys = kb.addKeys('LEFT,RIGHT,UP,DOWN,Z,Q,S,D,W,A,SPACE,ENTER,E') as Record<string, Phaser.Input.Keyboard.Key>;
    window.addEventListener('keydown', (e) => {
      if (e.repeat || e.defaultPrevented) return;
      if ([' ', 'Enter', 'e', 'E'].includes(e.key)) this.action();
    });
    this.maps = this.chapter.maps();
    this.hero = makeActor('hero', 'maison_chambre', 0, 0, { speed: SPEED });
    this.cast.set('hero', this.hero);
    void this.chapter.run(this);
  }

  // ---------- Boîte à outils pour les chapitres ----------

  /** Un personnage du chapitre (créé s'il n'existe pas encore). */
  actor(id: string, init: Partial<Actor> = {}): Actor {
    let a = this.cast.get(id);
    if (!a) {
      a = makeActor(id, '', 0, 0, { look: this.chapter.speakers[id]?.look, ...init });
      this.cast.set(id, a);
    } else Object.assign(a, init);
    return a;
  }

  /** Pose un personnage quelque part. at : un point d'arrivée de la carte, ou des coordonnées en pixels. */
  put(id: string, map: string, at: string | { x: number; y: number; dir?: Dir }, init: Partial<Actor> = {}) {
    const m = this.maps[map];
    const p = typeof at === 'string' ? m.spawns[at] ?? centerOf(m.zones[at]) : at;
    // une arrivée nommée vient des cartes : on la décale si elle tombe dans un mur ; des coordonnées, on les respecte (Margot dans l'arbre)
    const { x, y } = typeof at === 'string' ? nearestFree(m, p.x, p.y) : p;
    return this.actor(id, { map, x, y, dir: p.dir ?? 'S', visible: true, moving: false, ...init });
  }

  /** Retire un personnage de la scène. */
  remove(id: string) {
    const a = this.cast.get(id);
    if (a) a.map = '';
  }

  /** Change de carte. */
  goto(map: string, at: string | { x: number; y: number; dir?: Dir }) {
    this.map = this.maps[map];
    this.put('hero', map, at);
    for (const a of this.cast.values()) if (a.follows === this.hero) Object.assign(a, { map, x: this.hero.x, y: this.hero.y + 2 });
    this.zonesIn = new Set(this.zonesHere());
    this.chapter.arrived?.(this, map);
  }

  /** Une réplique. who peut porter une expression : « elio:triste ». */
  say = async (who: string, text: string) => {
    const [id] = who.split(':');
    this.setSpeaker(who);
    await ui.say(this.chapter.speakers[id]?.name ?? '', text);
  };

  /** Une question : renvoie l'indice de la réponse dans la liste complète, et applique ses effets. */
  choose = async (who: string, ask: string, options: (Option | string)[]) => {
    const opts = options.map((o) => (typeof o === 'string' ? { label: o } : o));
    const shown = opts.filter((o) => !o.if || o.if());
    this.setSpeaker(who);
    const k = await ui.choose(this.chapter.speakers[who.split(':')[0]]?.name ?? '', ask, shown.map((o) => o.label));
    applyEffects(shown[k].effects);
    return opts.indexOf(shown[k]);
  };

  effects = (e: Effects) => applyEffects(e);
  wait = wait;

  /** Joue une suite de répliques : [qui, texte]. */
  async lines(list: [string, string][]) {
    for (const [who, text] of list) await this.say(who, text);
  }

  private setSpeaker(who: string) {
    const [id, expr] = who.split(':');
    const sp = this.chapter.speakers[id];
    const draw = sp?.portrait === null ? null : sp?.portrait ?? (sp?.look ? lookPortrait(sp.look) : null);
    ui.setPortrait(draw ? (ctx, t) => draw(ctx, t, ui.typing && /[aeiouyéèàâêîôû]/i.test(ui.lastChar), expr) : null);
  }

  /** Bloque le héros pendant une scène. */
  async cut<T>(fn: () => Promise<T>): Promise<T> {
    // des séquences peuvent se chevaucher (une arrivée lance un dialogue pendant le fondu de la porte) :
    // on rend la main seulement quand la dernière se termine, dans l'état d'avant la première
    if (this.cuts++ === 0) this.lockedBeforeCut = this.locked;
    this.locked = true;
    this.hero.moving = false;
    try {
      return await fn();
    } finally {
      if (--this.cuts === 0) this.locked = this.lockedBeforeCut;
    }
  }

  /** Rend la main au joueur jusqu'à ce que test() soit vrai. */
  until(test: () => boolean): Promise<void> {
    this.locked = false;
    return new Promise((done) => this.waiters.push({ test, done }));
  }

  /** Fait marcher un personnage jusqu'à un point (en ligne droite). */
  walk(id: string, x: number, y: number, speed?: number): Promise<void> {
    const a = this.actor(id);
    return new Promise((done) => {
      const sp = speed ?? a.speed;
      const step = () => {
        const dx = x - a.x, dy = y - a.y, d = Math.hypot(dx, dy);
        if (d < 1 || a.map !== this.map.id && a.map === '') {
          a.moving = false;
          a.x = x;
          a.y = y;
          done();
          return;
        }
        const s = Math.min(d, (sp * 16) / 1000);
        a.x += (dx / d) * s;
        a.y += (dy / d) * s;
        a.dir = dirOf(dx / d, dy / d);
        a.moving = true;
        this.time.delayedCall(16, step);
      };
      step();
    });
  }

  face(id: string, dir: Dir | string) {
    const a = this.actor(id);
    if (dir.length <= 2) a.dir = dir as Dir;
    else {
      const b = this.actor(dir);
      a.dir = dirOf((b.x - a.x) / (Math.hypot(b.x - a.x, b.y - a.y) || 1), (b.y - a.y) / (Math.hypot(b.x - a.x, b.y - a.y) || 1));
    }
  }

  /** Montre un gros plan à la place de la carte, jusqu'à ce qu'on l'enlève (null). */
  showPlan(draw: PlanFn | null) {
    this.plan = draw ? { draw, t0: this.time.now } : null;
  }

  /** Fondu au noir (to = 1) ou retour à l'image (to = 0). */
  fade(to: number, ms = 500): Promise<void> {
    const from = this.fadeLevel, t0 = this.time.now;
    return new Promise((done) => {
      const step = () => {
        const u = Math.min(1, (this.time.now - t0) / ms);
        this.fadeLevel = from + (to - from) * u;
        if (u < 1) this.time.delayedCall(16, step);
        else done();
      };
      step();
    });
  }

  setTime(day: number, moment: string, night = false) {
    state.day = day;
    state.moment = moment;
    this.night = night;
  }

  /** Les zones de la carte où se trouve le héros. */
  zonesHere(): string[] {
    return Object.entries(this.map.zones).filter(([, r]) => inRect(this.hero.x, this.hero.y, r)).map(([k]) => k);
  }

  inZone(zone: string, a: Actor = this.hero) {
    const r = this.maps[a.map]?.zones[zone];
    return !!r && inRect(a.x, a.y, r);
  }

  /** Le moment présent, pour les conditions « when » des cartes. */
  now() {
    return { day: state.day, moment: state.moment, night: this.night };
  }

  /** Les objets d'une carte présents en ce moment (when, variantes, objets cachés non montrés). */
  objectsHere(map = this.map): PlacedObject[] {
    const shown = this.chapter.mapOptions?.(this, map.id).state ?? {};
    return map.objects.filter((o) => active(o.when, this.now(), has) && (!o.hidden || (shown[o.id] as { shown?: boolean })?.shown));
  }

  exitsHere(map = this.map) {
    return map.exits.filter((e) => active(e.when, this.now(), has));
  }

  /** Pose les personnages que la carte prévoit à ce moment (champ npcs), sauf ceux déjà ailleurs dans la scène. */
  populate(mapId: string, except: string[] = []) {
    const m = this.maps[mapId];
    for (const n of m.file.npcs ?? []) {
      if (except.includes(n.id) || !active(n.when, this.now(), has)) continue;
      const look = this.chapter.npcLook?.(n.id, n.look);
      if (!look) continue;
      this.put(n.id, mapId, { x: n.x * m.tile, y: n.y * m.tile, dir: 'S' }, { look });
    }
  }

  // ---------- Entrées ----------

  /** Bouton d'action (clavier ou tactile). */
  action() {
    if (ui.busy) ui.press(' ');
    else if (!this.locked) void this.interact();
  }

  private probe() {
    const [vx, vy] = vec(this.hero.dir);
    return { x: this.hero.x + vx * 12, y: this.hero.y - 4 + vy * 10 };
  }

  /** Ce que le bouton d'action atteint : le personnage le plus proche, les objets, les zones, les sorties. */
  private targetsHere(): Target[] {
    const p = this.probe();
    const here = this.map.id;
    const near = [...this.cast.values()].filter((a) => a !== this.hero && a.map === here && a.visible);
    const npc = near.sort((a, b) => Math.hypot(a.x - p.x, a.y - 4 - p.y) - Math.hypot(b.x - p.x, b.y - 4 - p.y))[0];
    const targets: Target[] = [];
    if (npc && Math.hypot(npc.x - p.x, npc.y - 4 - p.y) < 14) targets.push({ kind: 'actor', id: npc.id, map: here });
    for (const o of this.objectsHere()) if (inRect(p.x, p.y, reachOf(this.map, o))) targets.push({ kind: 'object', id: o.id, map: here });
    for (const [z, r] of Object.entries(this.map.zones)) if (inRect(p.x, p.y, r) || inRect(this.hero.x, this.hero.y, r)) targets.push({ kind: 'zone', id: z, map: here });
    const foot = footAt(this.hero.x, this.hero.y);
    for (const e of this.exitsHere()) if (inRect(p.x, p.y, grow(e.px, 4)) || overlap(foot, e.px)) targets.push({ kind: 'exit', id: e.id, map: here });
    return targets;
  }

  /** La sortie à prendre avec action (une fenêtre) parmi ces cibles. */
  private actionExitIn(targets: Target[]) {
    const ids = new Set(targets.filter((t) => t.kind === 'exit').map((t) => t.id));
    return this.exitsHere().find((e) => ids.has(e.id) && actionExit(this.map, e));
  }

  private async interact() {
    const targets = this.targetsHere();
    const win = this.actionExitIn(targets);
    if (win) return this.tryExit(win);
    await this.cut(async () => {
      await this.chapter.interact?.(this, targets.filter((t) => t.kind !== 'exit' || !actionExit(this.map, this.map.exits.find((e) => e.id === t.id)!)));
    });
  }

  private async tryExit(e: GameMap['exits'][number]) {
    if (this.time.now - this.lastExitTry < 700) return;
    this.lastExitTry = this.time.now;
    await this.cut(async () => {
      if (this.chapter.canExit && !(await this.chapter.canExit(this, e))) return;
      if (e.locked === true || (e.locked === 'nuit' && this.night)) return;
      if (!e.to || !this.maps[e.to]) return;
      await this.fade(1, 200);
      this.goto(e.to, e.at);
      await this.fade(0, 200);
    });
  }

  // ---------- Boucle ----------

  update(time: number, delta: number) {
    const free = !ui.busy && !this.locked && !this.plan;
    this.moveHero(free, delta);
    this.moveFollowers(delta);
    if (free) {
      for (const w of [...this.waiters]) if (w.test()) {
        this.waiters.splice(this.waiters.indexOf(w), 1);
        this.locked = true;
        w.done();
      }
    }
    this.render(time);
  }

  private moveHero(free: boolean, delta: number) {
    const h = this.hero;
    let dx = 0, dy = 0;
    if (free) {
      const k = this.keys;
      if (k.LEFT.isDown || k.Q.isDown || k.A.isDown) dx--;
      if (k.RIGHT.isDown || k.D.isDown) dx++;
      if (k.UP.isDown || k.Z.isDown || k.W.isDown) dy--;
      if (k.DOWN.isDown || k.S.isDown) dy++;
      if (!dx && !dy && Math.hypot(this.stick.x, this.stick.y) > 0.35) {
        const a = Math.round(Math.atan2(this.stick.y, this.stick.x) / (Math.PI / 4));
        dx = Math.round(Math.cos((a * Math.PI) / 4));
        dy = Math.round(Math.sin((a * Math.PI) / 4));
      }
    }
    if (!dx && !dy) {
      if (free || !this.locked) h.moving = false;
      return;
    }
    const step = (h.speed * (h.wading ? 0.6 : 1) * delta) / 1000 / Math.hypot(dx, dy);
    const nx = h.x + dx * step, ny = h.y + dy * step;
    const solids = this.objectsHere();
    // un personnage qui s'est posé sur le héros ne le retient pas : on peut toujours s'en dégager
    const stuck = new Set(this.actorsAt(h.x, h.y));
    const hit = (x: number, y: number) => blocked(this.map, x, y) || blockedBy(solids, x, y) || this.actorsAt(x, y).some((a) => !stuck.has(a));
    const ox = h.x, oy = h.y;
    if (!hit(nx, h.y)) h.x = nx;
    if (!hit(h.x, ny)) h.y = ny;
    // contre un coin : si quelques pixels à côté le passage est libre, on glisse vers lui au lieu de rester coincé
    if (h.x === ox && h.y === oy && (!dx || !dy)) slide: for (let k = 1; k <= CORNER_PX; k++)
      for (const side of [-1, 1]) {
        const sx = dx ? 0 : side, sy = dy ? 0 : side;
        if (hit(h.x + sx * k + dx * step, h.y + sy * k + dy * step)) continue;
        const m = Math.min(step, k);
        if (hit(h.x + sx * m, h.y + sy * m)) continue;
        h.x += sx * m;
        h.y += sy * m;
        break slide;
      }
    h.dir = dirOf(dx, dy);
    h.moving = true;
    const exit = this.exitsHere().find((e) => !actionExit(this.map, e) && takesExit(e, h.x, h.y, dx, dy, hit));
    if (exit) void this.tryExit(exit);
    // zones : on prévient le chapitre quand le héros y entre
    const now = new Set(this.zonesHere());
    for (const z of now) if (!this.zonesIn.has(z)) this.chapter.enter?.(this, z);
    this.zonesIn = now;
  }

  private actorsAt(x: number, y: number) {
    const foot = { x: x - 5, y: y - 4, w: 10, h: 4 };
    return [...this.cast.values()].filter((a) => a !== this.hero && a.map === this.map.id && a.visible && a.solid && !a.follows &&
      foot.x < a.x + 6 && a.x - 6 < foot.x + foot.w && foot.y < a.y && a.y - 5 < foot.y + foot.h);
  }

  /** Les amis trouvés suivent le héros à la file. */
  private moveFollowers(delta: number) {
    let lead = this.hero, gap = 16;
    for (const a of this.cast.values()) {
      if (a.follows !== this.hero || a.map !== this.map.id) continue;
      const dx = lead.x - a.x, dy = lead.y - a.y, d = Math.hypot(dx, dy);
      if (d > gap) {
        const s = Math.min(d - gap, ((lead.speed + 20) * delta) / 1000);
        a.x += (dx / d) * s;
        a.y += (dy / d) * s;
        a.dir = dirOf(dx / d, dy / d);
        a.moving = true;
      } else a.moving = false;
      lead = a;
      gap = 14;
    }
  }

  private render(time: number) {
    const ctx = this.canvas.getContext();
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    if (this.plan) this.plan.draw(ctx, time - this.plan.t0);
    else if (this.map) this.renderMap(ctx, time);
    if (this.vignette && !this.plan) {
      const v = this.vignette;
      ctx.fillStyle = '#000';
      for (let y = 0; y < VIEW_H; y += 2)
        for (let x = 0; x < VIEW_W; x += 2) {
          const d = Math.hypot(x - v.x, (y - v.y) * 1.2) / v.r;
          const a = Math.min(1, Math.max(0, d - 0.6)) * v.a;
          if (a > 0.02) {
            ctx.globalAlpha = a;
            ctx.fillRect(x, y, 2, 2);
          }
        }
      ctx.globalAlpha = 1;
    }
    if (this.fadeLevel > 0) {
      ctx.globalAlpha = this.fadeLevel;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      ctx.globalAlpha = 1;
    }
    this.canvas.refresh();
  }

  private renderMap(ctx: CanvasRenderingContext2D, t: number) {
    const m = this.map, h = this.hero;
    const cx = m.w <= VIEW_W ? -(VIEW_W - m.w) / 2 : Math.max(0, Math.min(m.w - VIEW_W, Math.round(h.x - VIEW_W / 2)));
    const cy = m.h <= VIEW_H ? -(VIEW_H - m.h) / 2 : Math.max(0, Math.min(m.h - VIEW_H, Math.round(h.y - 12 - VIEW_H / 2)));
    this.cam = { x: Math.round(cx), y: Math.round(cy) };
    ctx.save();
    ctx.translate(-this.cam.x, -this.cam.y);
    if (m.w < VIEW_W || m.h < VIEW_H) {
      ctx.beginPath();
      ctx.rect(0, 0, m.w, m.h);
      ctx.clip();
    }
    // un personnage est caché par un objet seulement s'il est derrière lui (voir sortLine)
    const things = sortThings(m, this.objectsHere());
    const actors: Drawable[] = [...this.cast.values()]
      .filter((a) => a.map === m.id && a.visible)
      .map((a) => ({ y: sortLine(a.x, a.y, things), draw: (c) => drawActor(c, a, t) }));
    actors.push(...(this.chapter.decor?.(this, m.id, t) ?? []));
    const o = this.chapter.mapOptions?.(this, m.id) ?? {};
    const flags = Object.fromEntries([...state.flags].map((f) => [f, true]));
    m.paint(ctx, m, t, { night: this.night, day: state.day, moment: state.moment, flags, actors, state: o.state ?? {}, animals: o.animals ?? true });
    this.chapter.overlay?.(this, ctx, t);
    ctx.restore();
  }
}

/** Jusqu'où on cherche un passage à côté quand on bute contre un coin. */
const CORNER_PX = 6;

const grow = (r: Rect, k: number): Rect => ({ x: r.x - k, y: r.y - k, w: r.w + 2 * k, h: r.h + 2 * k });
const centerOf = (r: Rect) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2, dir: 'S' as Dir });

/** Portrait de remplacement : la tête du sprite, agrandie, en attendant les vrais portraits. */
const portraits = new Map<Look, HTMLCanvasElement>();
export function lookPortrait(look: Look): PortraitFn {
  return (ctx, t, talking) => {
    let base = portraits.get(look);
    if (!base) {
      base = document.createElement('canvas');
      base.width = 24;
      base.height = 20;
      const front = A.makeHero({ child: look.child, hair: look.hair, outfit: look.outfit ?? 'tunique', pact: false, combat: false });
      A.drawSprite(base.getContext('2d'), front.rows.slice(0, 20), look.pal, 0, look.child ? 0 : 0);
      portraits.set(look, base);
    }
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#2c2838';
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#3a3448';
    ctx.fillRect(0, 44, 64, 20);
    ctx.drawImage(base, 0, 0, 24, 20, -4, 2, 72, 60);
    // la bouche bouge quand il parle
    if (talking && Math.floor(t / 90) % 2) {
      ctx.fillStyle = '#5a2a2a';
      ctx.fillRect(28, 45, 8, 3);
    }
  };
}
