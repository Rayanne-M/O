// Les deux lieux de la tranche : le village et la chambre du héros.
// Les positions sont en pixels du jeu (tuiles de 16 px). Un personnage est placé par ses pieds.
import { T, px, grassTile, tallGrass, flower, sandPath, hash, type Dir } from './art/planche.js';
import { river, ash } from './art/decor';
import type { PlaceId } from './script';

export interface Rect { x: number; y: number; w: number; h: number }
export interface Spawn { x: number; y: number; dir: Dir }
/** Un objet du décor posé sur la carte. depth : la ligne au sol qui décide de qui passe devant. */
export interface Prop { tex: string; x: number; y: number; depth: number }

export interface MapDef {
  w: number;
  h: number;
  drawGround(ctx: CanvasRenderingContext2D, night: boolean): void;
  props: Prop[];
  /** Zones où l'on ne peut pas marcher. */
  solids: Rect[];
  /** Zones avec lesquelles on interagit (touche d'action en les regardant), par nom. */
  spots: Record<string, Rect>;
  spawns: Record<string, Spawn>;
}

// ---------- Le village ----------

const HOUSES = [
  { id: 'hero', roof: 'red', x: 80, y: 120 },
  { id: 'grange', roof: 'brown', x: 200, y: 96 },
  { id: 'barbier', roof: 'blue', x: 450, y: 110 },
  { id: 'moulin', roof: 'green', x: 560, y: 300 },
];
const house = (id: string) => HOUSES.find((h) => h.id === id)!;
/** Le puits : coin haut-gauche de son corps de 36 × 46 (toit et manivelle dépassent). */
export const WELL_POS = { x: 600, y: 46 };
/** Le coin de la cinématique, qui place le puits en (14, 16). */
export const CINE_ORIGIN = { x: WELL_POS.x - 14, y: WELL_POS.y - 16 };
/** La nuit 3 : Élio debout sur la margelle, et la place du héros face à lui. */
export const ELIO_ON_RIM = { x: WELL_POS.x + 18, y: WELL_POS.y + 30 };
export const HERO_AT_WELL = { x: WELL_POS.x + 18, y: WELL_POS.y + 92 };
const LAVOIR = { x: 512, y: 44 };
const FOUNTAIN = { x: 343, y: 226 };
const ASH = { x: 562, y: 368 };
export const RIVER = { y: 400, h: 32 };

/** Les lieux où se jouent les scènes : la zone qui déclenche la scène, et où se tiennent les personnages. */
export const PLACES: Record<Exclude<PlaceId, 'maison'>, { zone: Rect; slots: { x: number; y: number }[] }> = {
  grange: { zone: { x: 206, y: 150, w: 60, h: 40 }, slots: [{ x: 262, y: 180 }] },
  place: { zone: { x: 296, y: 218, w: 128, h: 92 }, slots: [{ x: 318, y: 254 }, { x: 402, y: 254 }, { x: 360, y: 302 }] },
  puits: { zone: { x: 500, y: 40, w: 210, h: 110 }, slots: [{ x: 580, y: 126 }, { x: 556, y: 110 }, { x: 656, y: 104 }] },
  barbier: { zone: { x: 450, y: 160, w: 80, h: 44 }, slots: [{ x: 454, y: 190 }, { x: 518, y: 188 }] },
  riviere: { zone: { x: 170, y: 368, w: 180, h: 32 }, slots: [{ x: 214, y: 392 }, { x: 300, y: 392 }] },
  moulin: { zone: { x: 556, y: 360, w: 96, h: 32 }, slots: [{ x: 640, y: 384 }] },
};

const PATHS: [number, number, number, number][] = [
  [30, 262, 690, 24],
  [108, 184, 16, 78],
  [228, 160, 16, 102],
  [478, 174, 16, 88],
  [612, 140, 24, 122],
  [500, 64, 210, 78],
  [296, 222, 128, 84],
  [250, 286, 16, 94],
  [150, 372, 520, 18],
];
const TALL_GRASS: Rect[] = [{ x: 120, y: 300, w: 96, h: 64 }, { x: 680, y: 300, w: 48, h: 64 }];

const TREES: [number, number][] = [];
for (let x = -14; x < 760; x += 34) TREES.push([x, -38], [x, 438]);
for (let y = 6; y < 400; y += 40) TREES.push([-24, y], [736, y]);
TREES.push([150, 24], [300, 30], [384, 52], [454, 18], [690, 150], [700, 222], [372, 318], [444, 330], [24, 300], [20, 60], [330, 130]);

function drawVillage(ctx: CanvasRenderingContext2D) {
  for (let y = 0; y < 480; y += 16) for (let x = 0; x < 768; x += 16) grassTile(ctx, x, y);
  for (const [x, y, w, h] of PATHS) sandPath(ctx, x, y, w, h);
  for (const r of TALL_GRASS) for (let y = r.y; y < r.y + r.h; y += 16) for (let x = r.x; x < r.x + r.w; x += 16) tallGrass(ctx, x, y);
  river(ctx, 0, RIVER.y, 768, RIVER.h);
  for (let i = 0; i < 70; i++) {
    const x = Math.floor(hash(i * 3 + 1) * 740) + 10, y = Math.floor(hash(i * 3 + 2) * 340) + 40;
    if (PATHS.some(([px0, py0, w, h]) => x > px0 - 8 && x < px0 + w + 4 && y > py0 - 10 && y < py0 + h + 4)) continue;
    flower(ctx, x, y, hash(i * 3 + 3) > 0.5 ? T.fw : T.fp);
  }
  ash(ctx, ASH.x, ASH.y);
}

export const VILLAGE: MapDef = {
  w: 768,
  h: 480,
  drawGround: drawVillage,
  props: [
    ...HOUSES.map((h) => ({ tex: `house-${h.roof}`, x: h.x - 2, y: h.y - 11, depth: h.y + 64 })),
    ...TREES.map(([x, y]) => ({ tex: 'tree', x, y, depth: y + 62 })),
    { tex: 'lavoir', x: LAVOIR.x, y: LAVOIR.y, depth: LAVOIR.y + 42 },
    { tex: 'fountain', x: FOUNTAIN.x, y: FOUNTAIN.y, depth: FOUNTAIN.y + 28 },
    { tex: 'barber-pole', x: house('barbier').x + 22, y: house('barbier').y + 44, depth: house('barbier').y + 65 },
  ],
  solids: [
    ...HOUSES.map((h) => ({ x: h.x + 2, y: h.y + 22, w: 68, h: 42 })),
    ...TREES.map(([x, y]) => ({ x: x + 18, y: y + 52, w: 12, h: 10 })),
    { x: WELL_POS.x + 1, y: WELL_POS.y + 24, w: 34, h: 20 },
    { x: LAVOIR.x + 2, y: LAVOIR.y + 24, w: 52, h: 18 },
    { x: FOUNTAIN.x + 2, y: FOUNTAIN.y + 14, w: 30, h: 14 },
    { x: 0, y: RIVER.y + 4, w: 768, h: 80 },
    { x: -10, y: -10, w: 10, h: 500 }, { x: 768, y: -10, w: 10, h: 500 }, { x: -10, y: -10, w: 790, h: 10 },
  ],
  spots: {
    ...Object.fromEntries(HOUSES.map((h) => [`door-${h.id}`, { x: h.x + 26, y: h.y + 50, w: 20, h: 20 }])),
    'window-hero': { x: house('hero').x + 6, y: house('hero').y + 50, w: 18, h: 20 },
    'window-elio': { x: house('moulin').x + 48, y: house('moulin').y + 50, w: 18, h: 20 },
    cendre: { x: ASH.x - 2, y: ASH.y - 4, w: 20, h: 14 },
    well: { x: WELL_POS.x - 4, y: WELL_POS.y + 18, w: 44, h: 32 },
  },
  spawns: {
    door: { x: house('hero').x + 36, y: house('hero').y + 76, dir: 'S' },
    window: { x: house('hero').x + 16, y: house('hero').y + 76, dir: 'S' },
  },
};

// ---------- La chambre ----------

const ROOM = { x: 96, y: 40, w: 192, h: 136 };
const FLOOR_Y = 80;
const R = {
  wall: '#e6d6b4', wallD: '#c9b48c', trim: '#a0703e', trimD: '#6e4a28', floor: '#b07e50', floorD: '#946640', floorL: '#c49262',
  line: '#6a4428', bed: '#7a5232', blanket: '#4a74b4', blanketD: '#2e4e84', blanketL: '#6e98d4', pillow: '#f4ead2', rug: '#b4504a', rugD: '#8e3434', rugL: '#e0b04a',
};
export const BEDROOM_WINDOW = { x: 128, y: 48, w: 32, h: 24 };

function drawBedroom(ctx: CanvasRenderingContext2D, night: boolean) {
  const o = T.fo;
  px(ctx, '#0b0a10', 0, 0, 384, 216);
  const { x, y, w, h } = ROOM;
  // mur du fond, plinthe, parquet
  px(ctx, o, x - 2, y - 2, w + 4, h + 4);
  px(ctx, R.wall, x, y, w, FLOOR_Y - y);
  for (let k = x + 6; k < x + w; k += 12) px(ctx, R.wallD, k, y, 1, FLOOR_Y - y - 6);
  px(ctx, R.trim, x, FLOOR_Y - 6, w, 5);
  px(ctx, R.trimD, x, FLOOR_Y - 2, w, 2);
  px(ctx, R.floor, x, FLOOR_Y, w, y + h - FLOOR_Y);
  for (let j = FLOOR_Y; j < y + h; j += 8) {
    px(ctx, R.line, x, j + 7, w, 1);
    for (let k = x + ((j / 8) % 2 ? 0 : 20); k < x + w; k += 40) px(ctx, R.line, k, j, 1, 7);
    px(ctx, R.floorL, x, j, w, 1);
  }
  // fenêtre
  const W = BEDROOM_WINDOW;
  px(ctx, o, W.x - 2, W.y - 2, W.w + 4, W.h + 4);
  px(ctx, R.trim, W.x - 1, W.y - 1, W.w + 2, W.h + 2);
  px(ctx, night ? '#1c2a48' : '#9ad0f0', W.x + 1, W.y + 1, W.w - 2, W.h - 2);
  if (night) {
    px(ctx, '#e8ecd8', W.x + 21, W.y + 4, 5, 5);
    px(ctx, '#1c2a48', W.x + 23, W.y + 4, 3, 3);
    [[5, 5], [12, 14], [26, 15], [8, 18]].forEach(([a, b]) => px(ctx, '#8aa0c8', W.x + a, W.y + b));
  } else px(ctx, '#d8f0ff', W.x + 2, W.y + 2, 8, 5);
  px(ctx, R.trimD, W.x + W.w / 2 - 1, W.y, 2, W.h);
  px(ctx, R.trimD, W.x, W.y + W.h / 2 - 1, W.w, 2);
  px(ctx, R.trimD, W.x - 3, W.y + W.h + 1, W.w + 6, 3);
  // tapis
  px(ctx, o, 160, 120, 64, 32);
  px(ctx, R.rugD, 161, 121, 62, 30);
  px(ctx, R.rug, 163, 123, 58, 26);
  for (let k = 166; k < 220; k += 6) px(ctx, R.rugL, k, 135, 3, 2);
  // porte (ouverture dans le mur du bas, avec le palier et un paillasson pour qu'on la voie)
  px(ctx, o, 172, y + h - 2, 40, 16);
  px(ctx, R.floorL, 176, y + h, 32, 12);
  px(ctx, R.line, 176, y + h + 5, 32, 1);
  px(ctx, R.trim, 174, y + h - 2, 2, 14);
  px(ctx, R.trim, 208, y + h - 2, 2, 14);
  px(ctx, R.rugD, 180, y + h - 10, 24, 9);
  px(ctx, R.rugL, 181, y + h - 9, 22, 7);
  for (let k = 183; k < 202; k += 3) px(ctx, R.rugD, k, y + h - 7, 1, 3);
}

/** Le lit et le coffre sont des objets à part, pour passer devant ou derrière le héros. */
export function drawBed(ctx: CanvasRenderingContext2D) {
  const o = T.fo;
  px(ctx, o, 0, 0, 34, 46);
  px(ctx, R.bed, 1, 1, 32, 44);
  px(ctx, '#9a6a42', 1, 1, 32, 3);
  px(ctx, R.pillow, 4, 6, 26, 9);
  px(ctx, '#d8ccb0', 4, 13, 26, 2);
  px(ctx, R.blanketD, 3, 16, 28, 27);
  px(ctx, R.blanket, 3, 16, 26, 25);
  px(ctx, R.blanketL, 3, 16, 26, 3);
  for (let k = 22; k < 40; k += 6) px(ctx, R.blanketD, 6, k, 20, 1);
}
export function drawChest(ctx: CanvasRenderingContext2D) {
  const o = T.fo;
  px(ctx, o, 0, 0, 22, 18);
  px(ctx, '#8a5a38', 1, 1, 20, 16);
  px(ctx, '#a8784c', 1, 1, 20, 6);
  px(ctx, '#5a3a24', 1, 7, 20, 1);
  px(ctx, '#f2c64a', 10, 6, 2, 4);
}

export const BEDROOM: MapDef = {
  w: 384,
  h: 216,
  drawGround: drawBedroom,
  props: [
    { tex: 'bed', x: 238, y: 72, depth: 118 },
    { tex: 'chest', x: 104, y: 76, depth: 94 },
    { tex: 'candle', x: 220, y: 82, depth: 104 },
  ],
  solids: [
    { x: ROOM.x, y: ROOM.y, w: ROOM.w, h: FLOOR_Y - ROOM.y + 4 },
    { x: ROOM.x - 8, y: ROOM.y, w: 8, h: ROOM.h + 8 },
    { x: ROOM.x + ROOM.w, y: ROOM.y, w: 8, h: ROOM.h + 8 },
    { x: ROOM.x, y: ROOM.y + ROOM.h, w: ROOM.w, h: 8 },
    { x: 238, y: 72, w: 34, h: 46 },
    { x: 104, y: 76, w: 22, h: 18 },
    { x: 221, y: 96, w: 12, h: 8 },
  ],
  spots: {
    window: { x: BEDROOM_WINDOW.x, y: BEDROOM_WINDOW.y, w: BEDROOM_WINDOW.w, h: 40 },
    bed: { x: 234, y: 70, w: 42, h: 52 },
    chest: { x: 100, y: 74, w: 30, h: 26 },
    candle: { x: 216, y: 80, w: 22, h: 30 },
    door: { x: 176, y: ROOM.y + ROOM.h - 6, w: 32, h: 12 },
  },
  spawns: {
    bed: { x: 254, y: 136, dir: 'S' },
    window: { x: 144, y: 100, dir: 'S' },
    door: { x: 192, y: 166, dir: 'N' },
  },
};
