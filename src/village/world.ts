// La scène de jeu : charge un lieu, déplace le héros en 8 directions, et enchaîne les moments de l'enfance.
import Phaser from 'phaser';
import { drawCine, talkPortrait, firefly, N, type Dir } from './art/planche.js';
import { buildTextures, drawWellImage, DIRS, NPCS } from './art/sprites';
import {
  BEDROOM, VILLAGE, PLACES, WELL_POS, CINE_ORIGIN, ELIO_ON_RIM, HERO_AT_WELL, drawBed, drawChest, type MapDef, type Rect,
} from './maps';
import { CINEMATIC, DAYS, ENDINGS, HOME, NIGHTS, NIGHT_DEFAULT, WELL, NAMES, type NpcId, type Scene } from './script';
import { play } from './dialogue';
import {
  FEAR_NAMES, FEAR_SUBJECTS, GAUGE_NAMES, LAST_DAY, applyEffects, count, has, resetState, settleChildhood, spiritForce, state, type Gauge,
} from './state';
import { ui, wait } from './ui';

export const VIEW_W = 384;
export const VIEW_H = 216;
const SPEED = 56; // pixels par seconde
const CINE_W = 190;
const CINE_H = 110;
const CINE_END = 8200;

type Place = 'village' | 'bedroom';
const MAPS: Record<Place, MapDef> = { village: VILLAGE, bedroom: BEDROOM };
/** Teinte de l'image selon le moment (multipliée par-dessus le décor). */
const TINT = { night: 0x5a68b0, bedroomNight: 0x7884c0, dusk: 0xf6c49c };

const VEC: Record<Dir, [number, number]> = {
  N: [0, -1], NE: [1, -1], E: [1, 0], SE: [1, 1], S: [0, 1], SW: [-1, 1], W: [-1, 0], NW: [-1, -1],
};
const dirOf = (dx: number, dy: number) => ((dy < 0 ? 'N' : dy > 0 ? 'S' : '') + (dx > 0 ? 'E' : dx < 0 ? 'W' : '')) as Dir;
const inRect = (x: number, y: number, r: Rect) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
const overlap = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

export class World extends Phaser.Scene {
  private place: Place = 'bedroom';
  private night = false;
  /** Le moment en cours dans la journée (indice dans DAYS[jour]). */
  private stage = 0;
  private hero!: Phaser.GameObjects.Sprite;
  private shadow!: Phaser.GameObjects.Image;
  private dir: Dir = 'S';
  private level: Phaser.GameObjects.GameObject[] = [];
  private cast: Phaser.GameObjects.GameObject[] = [];
  private npcs = new Map<NpcId, Phaser.GameObjects.Sprite>();
  private tint!: Phaser.GameObjects.Rectangle;
  private fx!: Phaser.GameObjects.Graphics;
  private hair: Phaser.GameObjects.Graphics | null = null;
  private candle: Phaser.GameObjects.Image | null = null;
  private candleGlow: Phaser.GameObjects.Arc | null = null;
  private candleLit = true;
  private well: { tex: Phaser.Textures.CanvasTexture; img: Phaser.GameObjects.Image; spill: number } | null = null;
  private cutscene = false;
  /** Le héros vient de buter contre la porte de la chambre : on ne la retente qu'après s'en être éloigné. */
  private doorBumped = false;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  /** Direction donnée par le joystick tactile. */
  stick = { x: 0, y: 0 };

  constructor() {
    super('world');
  }

  private get scene_(): Scene | undefined {
    return this.night ? undefined : DAYS[state.day]?.[this.stage];
  }

  create() {
    buildTextures(this);
    const tex = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
      const t = this.textures.createCanvas(key, w, h)!;
      draw(t.getContext());
      t.refresh();
    };
    tex('bed', 34, 46, drawBed);
    tex('chest', 22, 18, drawChest);

    DIRS.forEach((d, j) =>
      this.anims.create({ key: `walk-${d}`, frames: [1, 2, 3, 4].map((i) => ({ key: 'hero', frame: `${j}-${i}` })), frameRate: 8, repeat: -1 }),
    );
    for (const key of Object.keys(NPCS))
      this.anims.create({ key: `${key}-idle`, frames: [0, 1].map((i) => ({ key, frame: `0-${i}` })), frameRate: 2, repeat: -1 });

    this.keys = this.input.keyboard!.addKeys('UP,DOWN,LEFT,RIGHT,Z,Q,S,D,W,A') as Record<string, Phaser.Input.Keyboard.Key>;
    window.addEventListener('keydown', (e) => {
      // la boîte de dialogue a déjà pris la touche : on ne relance pas une interaction derrière
      if (e.defaultPrevented || e.repeat) return;
      if ([' ', 'enter', 'e'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        void this.interact();
      }
    });

    this.tint = this.add.rectangle(0, 0, VIEW_W, VIEW_H, TINT.night).setOrigin(0).setScrollFactor(0).setDepth(9000);
    this.tint.setBlendMode(Phaser.BlendModes.MULTIPLY);
    this.fx = this.add.graphics().setDepth(9002);
    this.hero = this.add.sprite(0, 0, 'hero', '4-0').setOrigin(0.5, 1);
    this.shadow = this.add.image(0, 0, 'shadow').setAlpha(0.22);
    this.cameras.main.roundPixels = true;

    void this.title();
  }

  // ---------- Déroulé de la partie ----------

  private async title() {
    this.cutscene = false;
    this.night = false;
    this.load_('village', false, 'door');
    this.showHero(false);
    ui.setHud('', '');
    for (;;) {
      const gore = state.gore ? 'affichées' : 'masquées';
      const pick = await ui.screen(
        `<h1>L'enfance</h1>
         <p class="sub">Tranche jouable · trois jours au village natal, et une nuit au puits</p>
         <p class="help">Se déplacer : flèches, ZQSD ou WASD (deux touches pour les diagonales).<br>
         Parler, examiner : Espace, Entrée ou E. Sur mobile : le joystick et le bouton A.</p>
         <p class="warn">Le jeu contient une scène gore (un enfant traversé par des cheveux).<br>Images choquantes : <b>${gore}</b>.</p>`,
        ['Commencer', state.gore ? 'Masquer les images choquantes' : 'Afficher les images choquantes'],
      );
      if (pick === 0) break;
      state.gore = !state.gore;
    }
    this.showHero(true);
    resetState();
    // raccourcis pour tester : village.html?jour=2 commence au jour 2, ?nuit=3 à la nuit 3
    const q = new URLSearchParams(location.search);
    const night = Number(q.get('nuit')), day = Number(q.get('jour'));
    if (night >= 1 && night <= LAST_DAY) {
      state.day = night;
      return this.beginNight();
    }
    await this.beginDay(day >= 1 && day <= LAST_DAY ? day : 1);
  }

  private showHero(on: boolean) {
    this.hero.setVisible(on);
    this.shadow.setVisible(on);
  }

  private async beginDay(day: number) {
    state.day = day;
    this.stage = 0;
    this.night = false;
    await this.goTo('bedroom', false, 'bed');
    this.updateHud();
    await this.cut(async () => {
      await ui.banner(`Jour ${day}`);
      if (day > 1) await play(HOME.morning);
    });
  }

  private async beginNight() {
    this.night = true;
    this.candleLit = true;
    await this.goTo('bedroom', true, 'bed');
    this.updateHud();
    await this.cut(async () => {
      await ui.banner(`Nuit ${state.day}`);
      await play(HOME.night(state.day));
    });
  }

  private updateHud() {
    const s = this.scene_;
    ui.setHud(this.night ? `Nuit ${state.day}` : `Jour ${state.day} · ${s?.moment ?? ''}`, s?.objective ?? '');
  }

  /** Joue le moment en cours, puis passe au suivant. */
  private async runScene() {
    const s = this.scene_;
    if (!s) return;
    await this.cut(async () => {
      if (s.at === 'maison') {
        this.cameras.main.fadeOut(400);
        await wait(450);
      }
      await play(s.steps);
      if (s.cinematic) await this.cinematic();
    });
    this.stage++;
    if (!this.scene_) return this.beginNight();
    this.placeCast();
    this.updateHud();
  }

  private async onSpot(name: string) {
    const { place, night } = this;
    if (place === 'bedroom') {
      if (name === 'chest') return play(HOME.chest);
      if (name === 'candle' && night) {
        const pick = await play([this.candleLit ? HOME.candleOn : HOME.candleOff]);
        if (pick === 0) this.setCandle(!this.candleLit);
        return;
      }
      if (name === 'door') return night ? play(HOME.doorLocked) : this.goTo('village', false, 'door');
      if (name === 'bed') {
        if (!night) return play(HOME.bedDay);
        if ((await play([HOME.bed])) !== 0) return;
        this.endNight();
        if (state.day >= LAST_DAY) return this.ending('fin_lit');
        return this.beginDay(state.day + 1);
      }
      if (name === 'window') {
        if (!night) return play(HOME.windowDay);
        if ((await play([HOME.window])) !== 0) return;
        if (!has('sorti_fenetre_une_fois')) applyEffects({ voleur: 1, sorti_fenetre_une_fois: true });
        if (!this.candleLit && !has(`dehors-${state.day}`)) state.darkOutings++;
        state.flags.add(`dehors-${state.day}`);
        return this.goTo('village', true, 'window');
      }
      return;
    }
    const scene = this.scene_;
    if (name === 'door-hero') {
      if (night) return play(HOME.doorLocked);
      if (scene?.at === 'maison') return this.runScene();
      return play(HOME.doorDay);
    }
    if (name === 'window-hero' && night) {
      if ((await play([HOME.windowBack])) !== 0) return;
      await this.goTo('bedroom', true, 'window');
      if (state.day === 2 && state.traits.includes('Conteur') && !has('araignee_rebord')) {
        state.flags.add('araignee_rebord');
        await play(HOME.spiderOnSill);
      }
      return;
    }
    const clue = scene?.clues?.find((c) => c.spot === name);
    if (clue) return play(clue.steps);
    if (name.startsWith('door-')) return play(night ? HOME.othersAsleep : HOME.otherDoor);
    if (!night) return name === 'well' ? play(NIGHT_DEFAULT.wellDay) : undefined;
    const steps = NIGHTS[state.day]?.[name];
    if (steps && !has(`nuit-${state.day}-${name}`)) {
      state.flags.add(`nuit-${state.day}-${name}`);
      return play(steps);
    }
    if (name === 'well') return play(steps ?? NIGHT_DEFAULT.well);
    if (name === 'window-elio') return play(NIGHT_DEFAULT.windowElio);
  }

  private async talkTo(id: NpcId) {
    const scene = this.scene_;
    if (!scene) return;
    if (scene.npcs.includes(id)) return this.runScene();
    const extra = scene.extras?.find((x) => x.id === id);
    if (!extra) return;
    const flag = `parle-${scene.id}-${id}`;
    await play(has(flag) ? extra.again : extra.first);
    state.flags.add(flag);
  }

  private setCandle(lit: boolean) {
    this.candleLit = lit;
    this.candle?.setTexture(lit ? 'candle' : 'candle-off');
    this.candleGlow?.setVisible(lit && this.night);
  }

  /** Fin d'une nuit : on retient si la bougie est restée allumée (peur du noir). */
  private endNight() {
    if (this.candleLit) state.candleNights++;
  }

  /** Jour 3, le soir : les cheveux emportent Élio au puits. */
  private async cinematic() {
    const cam = this.cameras.main;
    cam.fadeOut(400);
    await wait(450);
    this.load_('village', false, 'door');
    this.tint.setVisible(true).setFillStyle(TINT.dusk);
    this.showHero(false);
    cam.stopFollow();
    cam.centerOn(CINE_ORIGIN.x + 92, CINE_ORIGIN.y + 60);
    const elio = this.add.sprite(CINE_ORIGIN.x + 140, CINE_ORIGIN.y + 64, 'elio-tondu', '0-0').setOrigin(0.5, 1).setDepth(CINE_ORIGIN.y + 64).play('elio-tondu-idle');
    const tex = this.canvasTex('cine', CINE_W, CINE_H);
    const img = this.add.image(CINE_ORIGIN.x, CINE_ORIGIN.y, 'cine').setOrigin(0).setDepth(WELL_POS.y + 44);
    this.well?.img.setVisible(false);
    cam.fadeIn(600);
    const friend = { rows: NPCS['elio-tondu'].rows, pal: NPCS['elio-tondu'].pal };
    await this.animate(CINE_END, (e) => {
      const g = tex.getContext();
      g.clearRect(0, 0, CINE_W, CINE_H);
      drawCine(g, e, { ground: false, width: CINE_W, height: CINE_H, friend });
      tex.refresh();
      elio.setVisible(e < 2700);
      let line = '';
      for (const [at, text] of CINEMATIC) if (e >= at) line = text;
      ui.caption(line);
    });
    cam.fadeOut(1200);
    await wait(1300);
    ui.caption('');
    img.destroy();
    elio.destroy();
    this.showHero(true);
  }

  /** Nuit 3, au puits : l'Esprit parle par la bouche d'Élio. */
  private async wellEncounter() {
    state.flags.add('puits_nuit3');
    await this.cut(async () => {
      const cam = this.cameras.main;
      cam.fadeOut(300);
      await wait(320);
      this.hero.setPosition(HERO_AT_WELL.x, HERO_AT_WELL.y);
      this.face('N');
      const elio = this.add.sprite(ELIO_ON_RIM.x, ELIO_ON_RIM.y, 'elio-tondu', '0-0').setOrigin(0.5, 1).setDepth(WELL_POS.y + 46);
      this.level.push(elio);
      this.hair = this.add.graphics().setDepth(WELL_POS.y + 47);
      this.level.push(this.hair);
      if (this.well) this.well.spill = 1;
      cam.fadeIn(400);
      await wait(600);

      // la peur du noir se décide ici : deux nuits bougie allumée, et l'Esprit en profite
      if (this.candleLit) state.candleNights++;
      if (state.candleNights >= 2) applyEffects({ 'peurs.noir': 'peur', peur: 1 });

      await play(WELL.arrival.slice(0, 2));
      if (state.gore) ui.setPortrait((ctx, t) => talkPortrait(ctx, t, mouth(t)));
      else await play([{ say: WELL.goreHidden, who: 'narrator' }]);
      await play(WELL.arrival.slice(2));
      await play([WELL.reaction]);
      await play(WELL.comments);
      const end = await this.wellMenu();
      ui.setPortrait(null);
      await this.ending(end);
    });
  }

  private async wellMenu(): Promise<string> {
    for (;;) {
      const pick = await ui.choose('', WELL.menu.ask, WELL.menu.options);
      if (pick === 2) {
        ui.setPortrait(null);
        await play(WELL.flee);
        return 'fin_lit';
      }
      if (pick === 1) {
        await play(WELL.fight.intro);
        const scissors = has('a_ciseaux');
        await play(scissors ? WELL.fight.withScissors : WELL.fight.withStick);
        if (spiritForce() <= (scissors ? 6 : 3)) return 'fin_victoire';
        await play(WELL.fight.grabbed);
        return 'fin_defaite';
      }
      // parler
      for (;;) {
        const opts = [
          ...(WELL.ribbon.if() ? [WELL.ribbon.label] : []),
          WELL.disbelief.label, WELL.story.label, WELL.pact.label, WELL.back,
        ];
        const label = opts[await ui.choose(NAMES.hero, WELL.talkMenu, opts)];
        if (label === WELL.ribbon.label) {
          applyEffects(WELL.ribbon.effects);
          await play(WELL.ribbon.then);
        } else if (label === WELL.disbelief.label) {
          if (WELL.disbelief.works()) return 'fin_incredulite';
          await play(WELL.disbelief.fail);
        } else if (label === WELL.story.label) {
          await ui.say(NAMES.hero, WELL.story.next);
          if (WELL.story.works()) {
            await play(WELL.story.success);
            return 'fin_apaisement';
          }
          await play(WELL.story.fail);
        } else if (label === WELL.pact.label) {
          await play(WELL.pact.lines);
          if ((await ui.choose(NAMES.hero, WELL.pact.ask, WELL.pact.options)) === 0) return 'fin_pacte';
          break;
        } else break;
      }
    }
  }

  private async ending(id: string) {
    this.cutscene = true;
    this.cameras.main.fadeOut(600);
    await wait(700);
    const e = ENDINGS[id];
    applyEffects(e.effects);
    settleChildhood();
    const gauges = (Object.keys(state.gauges) as Gauge[]).map((g) => `<li>${GAUGE_NAMES[g]} <b>${state.gauges[g]}</b></li>`).join('');
    const fears = Object.entries(state.fears).map(([k, v]) => `<li>${FEAR_SUBJECTS[k] ?? k} : <b>${FEAR_NAMES[v]}</b></li>`).join('');
    const traits = state.traits.map((t) => `<li>Trait : <b>${t}</b></li>`).join('');
    ui.setHud('', '');
    const marks = count('maudit') ? `<li>Maudit <b>${count('maudit')}</b></li>` : '';
    await ui.screen(
      `<h1>${e.title}</h1>
       <p class="sub">${e.elio}</p>
       <p class="sub">${e.esprit}</p>
       ${e.matin ? `<p class="sub">${e.matin}</p>` : ''}
       <h2>Ce que l'enfance a laissé</h2>
       <ul class="summary">${gauges}${traits}${fears}${marks}
         <li>Cheveux : <b>${state.hair}</b></li>
         <li>Légende <b>${count('legende')}</b> · Rancoeur <b>${count('rancoeur')}</b> · Force de l'Esprit <b>${spiritForce()}</b></li>
       </ul>
       <p class="help">Fin de la tranche jouable. Les noms et les textes sont provisoires.</p>`,
      ['Rejouer'],
    );
    this.cameras.main.fadeIn(10);
    // la nouvelle partie démarre hors de la séquence en cours, qui doit d'abord se refermer
    window.setTimeout(() => void this.title(), 0);
  }

  // ---------- Lieux ----------

  /** Bloque le héros le temps d'une séquence. */
  private async cut(fn: () => Promise<void>) {
    const was = this.cutscene;
    this.cutscene = true;
    try {
      await fn();
    } finally {
      this.cutscene = was;
    }
  }

  /** Appelle draw(e) à chaque image pendant ms millisecondes. */
  private animate(ms: number, draw: (e: number) => void) {
    const t0 = this.time.now;
    return new Promise<void>((done) => {
      const step = () => {
        const e = Math.min(ms, this.time.now - t0);
        draw(e);
        if (e >= ms) {
          this.events.off('update', step);
          done();
        }
      };
      this.events.on('update', step);
    });
  }

  private canvasTex(key: string, w: number, h: number) {
    return this.textures.exists(key) ? (this.textures.get(key) as Phaser.Textures.CanvasTexture) : this.textures.createCanvas(key, w, h)!;
  }

  private async goTo(place: Place, night: boolean, spawn: string) {
    await this.cut(async () => {
      const cam = this.cameras.main;
      cam.fadeOut(250);
      await wait(270);
      this.load_(place, night, spawn);
      cam.fadeIn(250);
      await wait(250);
    });
  }

  private load_(place: Place, night: boolean, spawn: string) {
    this.level.forEach((o) => o.destroy());
    this.level = [];
    this.hair = null;
    this.candle = null;
    this.candleGlow = null;
    this.well = null;
    this.place = place;
    this.night = night;
    const map = MAPS[place];

    const key = `ground-${place}-${night ? 'n' : 'd'}`;
    if (!this.textures.exists(key)) {
      const t = this.textures.createCanvas(key, map.w, map.h)!;
      map.drawGround(t.getContext(), night);
      t.refresh();
    }
    this.level.push(this.add.image(0, 0, key).setOrigin(0).setDepth(-1000));
    for (const p of map.props) {
      const img = this.add.image(p.x, p.y, p.tex).setOrigin(0).setDepth(p.depth);
      this.level.push(img);
      if (p.tex === 'candle') {
        this.candle = img;
        this.candleGlow = this.add.circle(p.x + 7, p.y + 4, 26, 0xffb050).setDepth(9001).setAlpha(0.22).setBlendMode(Phaser.BlendModes.ADD);
        this.level.push(this.candleGlow);
      }
    }

    if (place === 'village') {
      const tex = this.canvasTex('well', 46, 58);
      const img = this.add.image(WELL_POS.x - 5, WELL_POS.y - 10, 'well').setOrigin(0).setDepth(WELL_POS.y + 44);
      this.level.push(img);
      this.well = { tex, img, spill: night ? 0.3 + 0.2 * state.day : 0 };
      if (night) {
        // une fenêtre encore allumée chez le barbier
        const glow = this.add.rectangle(450 + 50, 110 + 38, 12, 11, 0xffc860).setOrigin(0).setDepth(9001).setAlpha(0.8);
        glow.setBlendMode(Phaser.BlendModes.ADD);
        this.level.push(glow);
      }
    }
    if (night && place === 'bedroom') {
      const moon = this.add.rectangle(130, 82, 30, 30, 0x8090c0).setOrigin(0).setDepth(9001).setAlpha(0.18);
      moon.setBlendMode(Phaser.BlendModes.ADD);
      this.level.push(moon);
    }
    this.placeCast();
    if (this.candle) this.setCandle(night && this.candleLit);

    const s = map.spawns[spawn];
    this.hero.setPosition(s.x, s.y);
    this.face(s.dir);
    const cam = this.cameras.main;
    cam.setBounds(0, 0, map.w, map.h);
    cam.startFollow(this.hero, true);
  }

  /** Place les personnages du moment en cours, et la teinte du ciel. */
  private placeCast() {
    this.cast.forEach((o) => o.destroy());
    this.cast = [];
    this.npcs.clear();
    const s = this.scene_;
    const village = this.place === 'village';
    const dusk = !this.night && village && (s?.moment === 'Soir' || s?.moment === 'Veillée');
    this.tint.setVisible(this.night || dusk).setFillStyle(this.night ? (village ? TINT.night : TINT.bedroomNight) : TINT.dusk);
    if (!village || !s) return;
    const put = (id: NpcId, at: { x: number; y: number }) => {
      const key = id === 'elio' && state.day === LAST_DAY ? 'elio-tondu' : id;
      const sprite = this.add.sprite(at.x, at.y, key, '0-0').setOrigin(0.5, 1).setDepth(at.y).play(`${key}-idle`);
      this.cast.push(sprite, this.add.image(at.x, at.y - 1, 'shadow').setAlpha(0.22).setDepth(at.y - 0.5));
      this.npcs.set(id, sprite);
    };
    if (s.at !== 'maison') s.npcs.forEach((id, i) => put(id, PLACES[s.at as keyof typeof PLACES].slots[i]));
    for (const x of s.extras ?? []) put(x.id, PLACES[x.at as keyof typeof PLACES].slots[0]);
  }

  // ---------- Héros ----------

  private face(dir: Dir) {
    this.dir = dir;
    this.hero.anims.stop();
    this.hero.setFrame(`${DIRS.indexOf(dir)}-0`);
  }

  private blocked(x: number, y: number) {
    const foot = { x: x - 5, y: y - 4, w: 10, h: 4 };
    return MAPS[this.place].solids.some((r) => overlap(foot, r)) || [...this.npcs.values()].some((n) => overlap(foot, { x: n.x - 6, y: n.y - 5, w: 12, h: 5 }));
  }

  private async interact() {
    if (ui.busy || this.cutscene || !this.hero.visible) return;
    const [vx, vy] = VEC[this.dir];
    const px = this.hero.x + vx * 10, py = this.hero.y - 3 + vy * 10;
    const npc = [...this.npcs.entries()].find(([, s]) => Math.hypot(s.x - px, s.y - 3 - py) < 14);
    await this.cut(async () => {
      if (npc) await this.talkTo(npc[0]);
      else {
        const spot = Object.entries(MAPS[this.place].spots).find(([, r]) => inRect(px, py, r));
        if (spot) await this.onSpot(spot[0]);
      }
    });
  }

  /** Bouton A tactile : avance le dialogue, ou interagit. */
  action() {
    if (ui.busy) ui.press(' ');
    else void this.interact();
  }

  update(time: number, delta: number) {
    this.drawWorldFx(time);

    const free = !ui.busy && !this.cutscene;
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
    if (dx || dy) {
      const step = (SPEED * delta) / 1000 / Math.hypot(dx, dy);
      const nx = this.hero.x + dx * step, ny = this.hero.y + dy * step;
      if (!this.blocked(nx, this.hero.y)) this.hero.x = nx;
      if (!this.blocked(this.hero.x, ny)) this.hero.y = ny;
      const dir = dirOf(dx, dy);
      if (dir !== this.dir || !this.hero.anims.isPlaying) {
        this.dir = dir;
        this.hero.play(`walk-${dir}`, true);
      }
    } else if (this.hero.anims.isPlaying) this.face(this.dir);

    this.hero.setDepth(this.hero.y);
    this.shadow.setPosition(Math.round(this.hero.x), Math.round(this.hero.y) - 1).setDepth(this.hero.y - 0.5);

    // Comme dans Pokémon : marcher vers le bas sur le paillasson fait sortir de la chambre.
    if (this.place === 'bedroom') {
      const door = BEDROOM.spots.door, onMat = this.hero.x >= door.x && this.hero.x < door.x + door.w && this.hero.y >= door.y + 4;
      if (!onMat) this.doorBumped = false;
      else if (free && dy > 0 && !this.doorBumped) {
        this.doorBumped = true;
        void this.cut(async () => { await this.onSpot('door'); });
      }
    }
    if (!free || this.place !== 'village') return;
    const s = this.scene_;
    if (s && s.at !== 'maison' && !s.talkOnly && inRect(this.hero.x, this.hero.y, PLACES[s.at as keyof typeof PLACES].zone)) void this.runScene();
    if (this.night && state.day === LAST_DAY && !has('puits_nuit3') && inRect(this.hero.x, this.hero.y, PLACES.puits.zone)) void this.wellEncounter();
  }

  /** Le puits qui respire, les cheveux qui tiennent Élio, les lucioles. */
  private drawWorldFx(time: number) {
    if (this.well) {
      const g = this.well.tex.getContext();
      g.clearRect(0, 0, 46, 58);
      drawWellImage(g, time, !this.night, { spill: this.well.spill, swing: this.night ? 0.6 : 0.3, crank: Math.PI });
      this.well.tex.refresh();
    }
    if (this.hair) {
      // des mèches sortent du trou et entrent dans la tête d'Élio
      this.hair.clear();
      const hx = WELL_POS.x + 18, hy = WELL_POS.y + 22;
      for (let i = 0; i < 6; i++) {
        const tx = ELIO_ON_RIM.x + [-6, 6, -4, 4, -1, 1][i], ty = ELIO_ON_RIM.y - [16, 16, 19, 19, 13, 13][i];
        for (let k = 0; k <= 20; k++) {
          const u = k / 20;
          const x = Math.round(hx + (tx - hx) * u + Math.sin(time / 260 + k * 0.5 + i) * 2 * Math.sin(u * Math.PI));
          const y = Math.round(hy + (ty - hy) * u - Math.sin(u * Math.PI) * (6 + i));
          this.hair.fillStyle(Phaser.Display.Color.HexStringToColor(k % 5 === 2 ? N.hairl : N.hair).color);
          this.hair.fillRect(x, y, 1, 1);
        }
      }
    }
    this.fx.clear();
    if (this.night && this.place === 'village') {
      const cam = this.cameras.main;
      let alpha = 1;
      const ctx = {
        set globalAlpha(a: number) { alpha = a; },
        set fillStyle(col: string) { fx.fillStyle(Phaser.Display.Color.HexStringToColor(col).color, alpha); },
        fillRect: (x: number, y: number, w: number, h: number) => fx.fillRect(cam.scrollX + x, cam.scrollY + y, w, h),
      };
      const fx = this.fx;
      firefly(ctx as unknown as CanvasRenderingContext2D, time, VIEW_W, VIEW_H);
      firefly(ctx as unknown as CanvasRenderingContext2D, time + 5000, VIEW_W, VIEW_H);
    }
  }
}

/** Ouverture de la bouche du portrait : elle suit le texte qui s'écrit, plus grande sur les voyelles. */
function mouth(t: number) {
  if (!ui.typing) return 0.05;
  return /[aeiouyéèàâêîôû]/i.test(ui.lastChar) ? 0.55 + 0.45 * Math.abs(Math.sin(t / 70)) : 0.15 + 0.2 * Math.abs(Math.sin(t / 50));
}
