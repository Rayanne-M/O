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

/** Une carte prête à jouer : tout en pixels. */
export interface GameMap {
  id: string;
  name: string;
  kind: MapFile['kind'];
  file: MapFile;
  w: number;
  h: number;
  tile: number;
  /** Une case par tuile, vrai = bloqué. */
  grid: boolean[][];
  /** Obstacles plus fins que la tuile (pixels), en plus de la grille. */
  solids: Rect[];
  objects: (MapObject & { px: Rect })[];
  exits: (MapExit & { px: Rect })[];
  spawns: Record<string, Spawn>;
  zones: Record<string, Rect>;
  paint: MapPainter;
}

const scale = (r: Rect, k: number): Rect => ({ x: r.x * k, y: r.y * k, w: r.w * k, h: r.h * k });

export function loadMap(file: MapFile, paint: MapPainter, extraSolids: Rect[] = []): GameMap {
  const k = file.tile ?? 16;
  const grid = file.collision
    ? file.collision.map((row) => [...row].map((c) => c === '1'))
    : Array.from({ length: file.h }, () => Array.from({ length: file.w }, () => false));
  return {
    id: file.id,
    name: file.name,
    kind: file.kind,
    file,
    w: file.w * k,
    h: file.h * k,
    tile: k,
    grid,
    solids: extraSolids,
    objects: file.objects.map((o) => ({ ...o, px: scale(o, k) })),
    exits: file.exits.map((e) => ({ ...e, px: scale(e, k) })),
    spawns: Object.fromEntries(Object.entries(file.spawns).map(([id, s]) => [id, { x: s.x * k, y: s.y * k, dir: s.dir }])),
    zones: Object.fromEntries(Object.entries(file.zones).map(([id, z]) => [id, scale(z, k)])),
    paint,
  };
}

export const inRect = (x: number, y: number, r: Rect) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
export const overlap = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** Les pieds d'un personnage (10 × 4 px) touchent-ils un obstacle ou le bord de la carte ? */
export function blocked(map: GameMap, x: number, y: number) {
  const foot = { x: x - 5, y: y - 4, w: 10, h: 4 };
  if (foot.x < 0 || foot.y < 0 || foot.x + foot.w > map.w || foot.y + foot.h > map.h) return true;
  const k = map.tile;
  for (let ty = Math.floor(foot.y / k); ty <= Math.floor((foot.y + foot.h - 0.01) / k); ty++)
    for (let tx = Math.floor(foot.x / k); tx <= Math.floor((foot.x + foot.w - 0.01) / k); tx++) if (map.grid[ty]?.[tx]) return true;
  return map.solids.some((r) => overlap(foot, r));
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

/** Ajoute un objet à une carte (en tuiles), et bloque les tuiles qu'il couvre à plus de moitié s'il est solide. */
export function addObject(map: GameMap, o: MapObject) {
  map.file.objects = map.file.objects.filter((q) => q.id !== o.id).concat(o);
  map.objects = map.objects.filter((q) => q.id !== o.id).concat({ ...o, px: { x: o.x * map.tile, y: o.y * map.tile, w: o.w * map.tile, h: o.h * map.tile } });
  if (o.solid)
    for (let y = Math.round(o.y); y < Math.round(o.y + o.h); y++)
      for (let x = Math.round(o.x); x < Math.round(o.x + o.w); x++) if (map.grid[y] && x < map.grid[y].length) map.grid[y][x] = true;
}

export function removeObject(map: GameMap, id: string) {
  map.file.objects = map.file.objects.filter((q) => q.id !== id);
  map.objects = map.objects.filter((q) => q.id !== id);
}
