// Les cartes du jeu, au format commun de rpg/data/maps/ (une carte = un fichier JSON, unités en tuiles).
// Le moteur ne connaît que ce format : n'importe quelle carte de n'importe quel chapitre se charge pareil.

export type Dir = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';
export const DIRS: Dir[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

export interface Rect { x: number; y: number; w: number; h: number }
export interface Spawn { x: number; y: number; dir: Dir }

/** Quand un élément existe : absent = toujours. */
export interface When { day?: number | number[]; moment?: string | string[]; night?: boolean; if?: string }

export interface MapObject extends Rect {
  id: string;
  type: string;
  solid?: boolean;
  interact?: unknown;
  rot?: number;
  flip?: boolean;
  when?: When;
  [extra: string]: unknown;
}
export interface MapExit extends Rect { id: string; to: string; at: string; label?: string; locked?: 'nuit' | true; when?: When }

/** Une carte telle qu'elle est écrite dans rpg/data/maps/<id>.json (en tuiles). */
export interface MapFile {
  id: string;
  name: string;
  kind: 'exterieur' | 'piece';
  tile?: number;
  w: number;
  h: number;
  collision?: string[];
  objects: MapObject[];
  exits: MapExit[];
  spawns: Record<string, Spawn>;
  zones: Record<string, Rect & { name?: string }>;
  /** Personnages et bêtes posés par défaut, selon le moment. */
  npcs?: { id: string; x: number; y: number; when?: When; look?: string }[];
  floor?: string;
  wall?: string;
  [extra: string]: unknown;
}

/** Ce que le jeu dessine par-dessus le décor, trié avec lui par la ligne des pieds. */
export interface Drawable { y: number; draw(ctx: CanvasRenderingContext2D): void }
export interface DrawOptions {
  night: boolean;
  day: number;
  moment: string;
  flags: Record<string, boolean>;
  actors: Drawable[];
  /** État de chaque objet, par id (bougie soufflée, œuf montré…). */
  state: Record<string, unknown>;
  /** Faux : la carte ne dessine pas ses bêtes (le chapitre dessine les siennes). */
  animals: boolean;
}
export type MapPainter = (ctx: CanvasRenderingContext2D, map: GameMap, t: number, o: DrawOptions) => void;

/**
 * La forme des choses au sol, fournie par la planche des cartes : l'emprise de chaque objet (ce qui bloque, et la ligne
 * qui décide qui passe devant), et l'eau. Par défaut : tout l'objet bloque, pas d'eau.
 */
export interface MapShape {
  /** Emprise au sol d'un objet, en pixels ; null s'il n'a rien au sol. */
  foot(file: MapFile, o: MapObject): Rect | null;
  /** Ce pixel est-il de l'eau où l'on ne peut pas marcher ? */
  water?(file: MapFile, x: number, y: number): boolean;
  /** Le dessin exact d'un objet (1 = bloque), plus fin que son emprise rectangulaire. */
  pixels?(file: MapFile, o: MapObject): { x: number; y: number; w: number; data: Uint8Array } | null;
  /** Les objets dessinés à plat (tapis, pont…) ou contre le mur : jamais devant un personnage. */
  flat?(file: MapFile, o: MapObject): boolean;
}
const boxShape: MapShape = { foot: (f, o) => scale(o, f.tile ?? 16) };

export type PlacedObject = MapObject & { px: Rect; foot: Rect | null; added?: boolean };

/** Une carte prête à jouer : tout en pixels. */
export interface GameMap {
  id: string;
  name: string;
  kind: MapFile['kind'];
  file: MapFile;
  w: number;
  h: number;
  tile: number;
  /** Un octet par pixel, 1 = on ne peut pas y poser le pied. Murs, eau et objets fixes. */
  mask: Uint8Array;
  /** Obstacles en plus du masque (pixels). */
  solids: Rect[];
  objects: PlacedObject[];
  exits: (MapExit & { px: Rect })[];
  spawns: Record<string, Spawn>;
  zones: Record<string, Rect>;
  shape: MapShape;
  paint: MapPainter;
}

const scale = (r: Rect, k: number): Rect => ({ x: r.x * k, y: r.y * k, w: r.w * k, h: r.h * k });

export function loadMap(file: MapFile, paint: MapPainter, shape: MapShape = boxShape): GameMap {
  const k = file.tile ?? 16;
  const map: GameMap = {
    id: file.id,
    name: file.name,
    kind: file.kind,
    file,
    w: file.w * k,
    h: file.h * k,
    tile: k,
    mask: new Uint8Array(file.w * k * file.h * k),
    solids: [],
    objects: file.objects.map((o) => ({ ...o, px: scale(o, k), foot: shape.foot(file, o) })),
    exits: file.exits.map((e) => ({ ...e, px: scale(e, k) })),
    spawns: Object.fromEntries(Object.entries(file.spawns).map(([id, s]) => [id, { x: s.x * k, y: s.y * k, dir: s.dir }])),
    zones: Object.fromEntries(Object.entries(file.zones).map(([id, z]) => [id, scale(z, k)])),
    shape,
    paint,
  };
  buildMask(map);
  return map;
}

/** Remplit un rectangle du masque (1 = bloqué, 0 = libre). */
function fillMask(map: GameMap, r: Rect, v: number) {
  const x0 = Math.max(0, Math.floor(r.x)), x1 = Math.min(map.w, Math.ceil(r.x + r.w));
  const y0 = Math.max(0, Math.floor(r.y)), y1 = Math.min(map.h, Math.ceil(r.y + r.h));
  for (let y = y0; y < y1; y++) map.mask.fill(v, y * map.w + x0, y * map.w + x1);
}

/**
 * Le masque au pixel près : dans une pièce, le mur du fond (2 tuiles) et les plinthes ; dehors, l'eau ; partout, l'emprise
 * au sol des objets solides. Les objets qui dépendent du moment (when) ou posés sur un autre (on) n'y sont pas :
 * le jeu les teste à part. Les sorties restent ouvertes.
 */
function buildMask(map: GameMap) {
  const { file, shape } = map;
  if (map.kind === 'piece') {
    fillMask(map, { x: 0, y: 0, w: map.w, h: 2 * map.tile }, 1);
    for (const r of [{ x: 0, y: 0, w: 3, h: map.h }, { x: map.w - 3, y: 0, w: 3, h: map.h }, { x: 0, y: map.h - 3, w: map.w, h: 3 }]) fillMask(map, r, 1);
  }
  if (shape.water)
    for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) if (shape.water(file, x + 0.5, y + 0.5)) map.mask[y * map.w + x] = 1;
  for (const o of map.objects) {
    if (!o.solid || o.when || o.on || !o.foot) continue;
    const p = shape.pixels?.(file, o);
    if (!p) {
      fillMask(map, o.foot, 1);
      continue;
    }
    const ox = Math.round(p.x), oy = Math.round(p.y);
    for (let i = 0; i < p.data.length; i++) {
      if (!p.data[i]) continue;
      const x = ox + (i % p.w), y = oy + Math.floor(i / p.w);
      if (x >= 0 && y >= 0 && x < map.w && y < map.h) map.mask[y * map.w + x] = 1;
    }
  }
  for (const e of map.exits) fillMask(map, e.px, 0);
}

/** Les pieds d'un personnage : 10 × 4 px, posés sur (x, y). */
export const footAt = (x: number, y: number): Rect => ({ x: x - 5, y: y - 4, w: 10, h: 4 });

export const inRect = (x: number, y: number, r: Rect) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
export const overlap = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** Les pieds d'un personnage touchent-ils un obstacle ou le bord de la carte ? Au pixel près. */
export function blocked(map: GameMap, x: number, y: number) {
  const f = footAt(x, y);
  if (f.x < 0 || f.y < 0 || f.x + f.w > map.w || f.y + f.h > map.h) return true;
  const x0 = Math.floor(f.x), x1 = Math.ceil(f.x + f.w), y0 = Math.floor(f.y), y1 = Math.ceil(f.y + f.h);
  for (let py = y0; py < y1; py++) for (let px = x0; px < x1; px++) if (map.mask[py * map.w + px]) return true;
  return map.solids.some((r) => overlap(f, r));
}

/** Les objets solides qui ne sont pas dans le masque (selon le moment, ou ajoutés par le chapitre) bloquent-ils ces pieds ? */
export function blockedBy(objects: PlacedObject[], x: number, y: number) {
  const f = footAt(x, y);
  return objects.some((o) => o.solid && (o.when || o.added) && !o.on && o.foot && overlap(f, o.foot));
}

/** Libère un rectangle du masque (se baigner dans la rivière…). Renvoie de quoi le refermer. */
export function openArea(map: GameMap, r: Rect): () => void {
  const saved = map.mask.slice();
  fillMask(map, r, 0);
  return () => map.mask.set(saved);
}

/**
 * La ligne de tri d'un personnage, pour qu'il soit caché seulement quand il est vraiment derrière un objet.
 * On trie par la ligne des pieds ; mais à côté d'un objet (sans le chevaucher en largeur), le personnage passe devant,
 * même si le bas de l'objet descend plus bas que ses pieds (le lit, la table…).
 */
export function sortLine(x: number, y: number, things: { x: number; w: number; top: number; bottom: number }[]) {
  const x0 = x - 5, x1 = x + 5;
  const side = (r: (typeof things)[number]) => x1 <= r.x || x0 >= r.x + r.w;
  let s = y;
  for (const r of things) if (side(r) && y >= r.top && y < r.bottom) s = Math.max(s, r.bottom + 0.5);
  // sans jamais passer devant un objet qu'on a vraiment devant soi
  for (const r of things) if (!side(r) && y < r.bottom && s >= r.bottom) s = Math.min(s, r.bottom - 0.5);
  return s;
}

/** Ce qui compte pour le tri : l'emprise de chaque objet debout visible. */
export function sortThings(map: GameMap, objects: PlacedObject[]) {
  return objects
    .filter((o) => !o.on && !map.shape.flat?.(map.file, o))
    .map((o) => {
      const r = o.foot ?? o.px;
      return { x: r.x, w: r.w, top: r.y, bottom: (map.kind === 'piece' ? o.px.y + o.px.h : r.y + r.h) };
    });
}

/**
 * Le héros passe une sortie seulement s'il est au bout et avance vers elle : le bord de ses pieds, dans le sens
 * de la marche, touche la sortie, et il est bien en face (pas en train de la longer).
 */
export function entersExit(x: number, y: number, dx: number, dy: number, r: Rect) {
  const fx = x + dx * 7, fy = dy < 0 ? y - 6 : dy > 0 ? y + 2 : y - 2;
  if (!inRect(fx, fy, r)) return false;
  // en face : le centre des pieds est dans la largeur de la porte (marche verticale) ou dans sa hauteur (horizontale)
  if (dy !== 0 && dx === 0) return x >= r.x && x < r.x + r.w;
  if (dx !== 0 && dy === 0) return y - 2 >= r.y && y - 2 < r.y + r.h;
  return inRect(x, y - 2, { x: r.x - 4, y: r.y - 4, w: r.w + 8, h: r.h + 8 });
}

/** Le point libre le plus proche (à 2 tuiles au plus), pour qu'une arrivée mal placée ne coince pas le héros dans un mur. */
export function nearestFree(map: GameMap, x: number, y: number) {
  if (!blocked(map, x, y)) return { x, y };
  for (let r = 2; r <= map.tile * 2; r += 2)
    for (let a = 0; a < 16; a++) {
      const nx = Math.round(x + r * Math.cos((a * Math.PI) / 8)), ny = Math.round(y + r * Math.sin((a * Math.PI) / 8));
      if (!blocked(map, nx, ny)) return { x: nx, y: ny };
    }
  return { x, y };
}

/** « drapeau && !autre || troisième » : le même langage que les cartes. */
export function flagsOk(expr: string, flag: (f: string) => boolean) {
  return expr.split('||').some((part) => part.split('&&').every((term) => {
    const t = term.trim(), neg = t.startsWith('!');
    return flag(neg ? t.slice(1).trim() : t) !== neg;
  }));
}

/** L'élément est-il là à ce moment ? */
export function active(when: When | undefined, now: { day: number; moment: string; night: boolean }, flag: (f: string) => boolean) {
  if (!when) return true;
  const list = <T,>(v: T | T[]) => (Array.isArray(v) ? v : [v]);
  if (when.day !== undefined && !list(when.day).includes(now.day)) return false;
  if (when.moment !== undefined && !list(when.moment).includes(now.moment)) return false;
  if (when.night !== undefined && when.night !== now.night) return false;
  if (when.if !== undefined && !flagsOk(when.if, flag)) return false;
  return true;
}

/** Ajoute un objet à une carte (en tuiles). S'il est solide, son emprise au sol bloque (voir blockedBy). */
export function addObject(map: GameMap, o: MapObject) {
  map.file.objects = map.file.objects.filter((q) => q.id !== o.id).concat(o);
  map.objects = map.objects.filter((q) => q.id !== o.id).concat({ ...o, px: scale(o, map.tile), foot: map.shape.foot(map.file, o), added: true });
}

export function removeObject(map: GameMap, id: string) {
  map.file.objects = map.file.objects.filter((q) => q.id !== id);
  map.objects = map.objects.filter((q) => q.id !== id);
}

/**
 * La zone où le bouton d'action atteint un objet : l'objet et 2 px autour. Dans une pièce, ce qui est accroché au mur
 * du fond (cadre, sabot, tresse…) s'atteint depuis le pied du mur.
 */
export function reachOf(map: GameMap, o: { px: Rect }): Rect {
  const r = { x: o.px.x - 2, y: o.px.y - 2, w: o.px.w + 4, h: o.px.h + 4 };
  const wall = 2 * map.tile;
  if (map.kind === 'piece' && o.px.y < wall && r.y + r.h < wall + 4) r.h = wall + 4 - r.y;
  return r;
}

/** Toutes les positions (au pixel) où un personnage peut marcher en partant de from. 1 = atteignable. */
export function walkable(map: GameMap, from: { x: number; y: number }[], hit = (x: number, y: number) => blocked(map, x, y)) {
  const seen = new Uint8Array(map.w * map.h), todo: number[] = [];
  for (const p of from) {
    const q = nearestFree(map, Math.round(p.x), Math.round(p.y));
    if (!hit(q.x, q.y) && !seen[q.y * map.w + q.x]) (seen[q.y * map.w + q.x] = 1), todo.push(q.y * map.w + q.x);
  }
  while (todo.length) {
    const i = todo.pop()!, x = i % map.w, y = (i - x) / map.w;
    for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h || seen[ny * map.w + nx] || hit(nx, ny)) continue;
      seen[ny * map.w + nx] = 1;
      todo.push(ny * map.w + nx);
    }
  }
  return seen;
}

/**
 * Vérifie une carte comme un joueur : depuis ses arrivées, peut-on passer chaque sortie et examiner chaque objet ?
 * Renvoie ce qui est hors d'atteinte (vide = tout va bien).
 */
export function auditMap(map: GameMap, hit?: (x: number, y: number) => boolean) {
  const seen = walkable(map, Object.values(map.spawns), hit);
  const DIR4 = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  const some = (test: (x: number, y: number) => boolean) => {
    for (let i = 0; i < seen.length; i++) if (seen[i] && test(i % map.w, Math.floor(i / map.w))) return true;
    return false;
  };
  const exits = map.exits.filter((e) => !some((x, y) => DIR4.some(([dx, dy]) => entersExit(x, y, dx, dy, e.px)))).map((e) => e.id);
  const near = (o: PlacedObject) => reachOf(map, o);
  const objects = map.objects
    .filter((o) => o.interact && !o.secret)
    .filter((o) => !some((x, y) => DIR4.some(([dx, dy]) => inRect(x + dx * 12, y - 4 + dy * 10, near(o)))))
    .map((o) => o.id);
  return { exits, objects };
}
