// Éléments de décor ajoutés pour la tranche jouable (absents de la planche),
// dessinés dans le même style : contour sombre T.fo, 3 tons par matière, palette du village.
import { T, px, ell } from './planche.js';

const O = T.fo;
const STONE = { d: '#646c80', m: '#8a92a4', l: '#b4bccb' };
const WATER = { d: '#3a78b0', m: '#5a9ad0', l: '#9ad0f0', f: '#d8f0ff' };
const WOOD = { d: '#553824', m: '#7a5038', l: '#a06e48' };

/** Le lavoir : un bassin de pierre sous un auvent de bois, 56 × 44. */
export function lavoir(g: CanvasRenderingContext2D) {
  // bassin
  px(g, O, 2, 22, 52, 20);
  px(g, STONE.m, 3, 23, 50, 18);
  px(g, STONE.l, 3, 23, 50, 2);
  px(g, STONE.d, 3, 38, 50, 3);
  px(g, WATER.d, 6, 26, 44, 9);
  px(g, WATER.m, 6, 26, 44, 7);
  [[10, 28], [26, 30], [38, 27]].forEach(([x, y]) => px(g, WATER.l, x, y, 5, 1));
  for (let k = 8; k < 52; k += 10) px(g, STONE.d, k, 36, 1, 4);
  // poteaux et auvent
  [4, 49].forEach((x) => {
    px(g, O, x - 1, 6, 4, 26);
    px(g, WOOD.m, x, 7, 2, 24);
  });
  for (let r = 0; r < 9; r++) {
    const inset = Math.max(0, 6 - r);
    px(g, O, inset - 1, r, 58 - inset * 2, 1);
    px(g, r % 3 === 2 ? WOOD.d : r < 2 ? WOOD.l : WOOD.m, inset, r, 56 - inset * 2, 1);
  }
  px(g, O, 0, 9, 56, 1);
}

/** La fontaine de la place, 34 × 30. */
export function fountain(g: CanvasRenderingContext2D) {
  ell(g, 17, 20, 16, 8, O);
  ell(g, 17, 20, 15, 7, STONE.m);
  ell(g, 17, 19, 12, 5, WATER.d);
  ell(g, 17, 19, 11, 4, WATER.m);
  px(g, STONE.l, 3, 19, 2, 3);
  px(g, O, 14, 2, 7, 18);
  px(g, STONE.m, 15, 3, 5, 16);
  px(g, STONE.l, 15, 3, 2, 16);
  px(g, WATER.f, 16, 0, 3, 3);
  px(g, WATER.l, 12, 12, 2, 6);
  px(g, WATER.l, 21, 12, 2, 6);
  px(g, WATER.f, 9, 18, 3, 1);
}

/** L'enseigne du barbier : un poteau rayé, 6 × 20. */
export function barberPole(g: CanvasRenderingContext2D) {
  px(g, O, 0, 0, 6, 20);
  px(g, '#f4ead2', 1, 1, 4, 18);
  for (let y = 1; y < 19; y += 4) px(g, '#c4504a', 1, y, 4, 2);
  px(g, '#f2c64a', 1, 1, 4, 1);
}

/** Le tabouret et la bougie de la chambre, 14 × 22. allumée : la flamme. */
export function candleStool(g: CanvasRenderingContext2D, lit: boolean) {
  px(g, O, 1, 10, 12, 12);
  px(g, WOOD.m, 2, 11, 10, 4);
  px(g, WOOD.l, 2, 11, 10, 1);
  px(g, WOOD.d, 3, 15, 2, 6);
  px(g, WOOD.d, 9, 15, 2, 6);
  px(g, O, 5, 3, 4, 8);
  px(g, '#f4ead2', 6, 4, 2, 6);
  if (lit) {
    px(g, '#ffd84a', 6, 0, 2, 3);
    px(g, '#fff6c8', 6, 1, 1, 1);
  }
}

/** La rivière, avec ses berges. */
export function river(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  px(g, '#5a8a52', x, y - 3, w, 3);
  px(g, WATER.d, x, y, w, h);
  px(g, WATER.m, x, y + 2, w, h - 5);
  for (let j = y + 4; j < y + h - 4; j += 5) for (let i = x + ((j / 5) % 2) * 9; i < x + w; i += 18) px(g, WATER.l, i, j, 6, 1);
  px(g, '#5a8a52', x, y + h, w, 3);
}

/** Un tas de cendres devant le moulin. */
export function ash(g: CanvasRenderingContext2D, x: number, y: number) {
  ell(g, x + 8, y + 4, 8, 4, '#6a6a70');
  ell(g, x + 8, y + 4, 6, 3, '#8e8e94');
  [[5, 3], [10, 4], [8, 2]].forEach(([a, b]) => px(g, '#3a3a40', x + a, y + b));
  px(g, '#c4504a', x + 11, y + 3, 2, 1);
}

