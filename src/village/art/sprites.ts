// Fabrique les images du jeu à partir du code de la planche, et les donne à Phaser.
import Phaser from 'phaser';
import { lavoir, fountain, barberPole, candleStool } from './decor';
import {
  CHILD_PAL, FRIEND_PAL, PAL, T, N, dirFrames, idleRows, drawSprite, makeHero, bobUpper,
  treeSprite, cottage, drawWell, type Dir, type Palette, type Rows, type WellState,
} from './planche.js';

export const DIRS: Dir[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
export const FRAME_W = 24;
export const FRAME_H = 34;

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}

/**
 * Le héros enfant dans les 8 directions.
 * La planche ne dessine les 8 vues que pour l'adulte : en attendant les vraies vues enfant,
 * on garde la tête (rangées 0 à 15) et on raccourcit le corps en sautant des rangées.
 * L'écharpe reste, la sacoche et la ceinture disparaissent.
 */
const CHILD_BODY = [16, 17, 19, 21, 23, 24, 26];
const CHILD_LEGS = [29, 30, 31, 32, 33];
export function childFrom(rows: Rows): Rows {
  const keep = [...rows.slice(0, 16), ...CHILD_BODY.map((y) => rows[y]), ...CHILD_LEGS.map((y) => rows[y])];
  return keep.map((r, y) => (y >= 16 ? r.replace(/[bm]/g, 'c') : r));
}

/** Enregistre une planche de sprites : une rangée par animation, une colonne par image. */
function addSheet(scene: Phaser.Scene, key: string, rowsList: Rows[][], pal: Palette, back?: Rows | null) {
  const cols = Math.max(...rowsList.map((r) => r.length));
  const [c, g] = canvas(cols * FRAME_W, rowsList.length * FRAME_H);
  rowsList.forEach((frames, j) =>
    frames.forEach((rows, i) => {
      const y0 = j * FRAME_H + FRAME_H - rows.length;
      if (back) drawSprite(g, back.length > rows.length ? back.slice(back.length - rows.length) : back, pal, i * FRAME_W, y0);
      drawSprite(g, rows, pal, i * FRAME_W, y0);
    }),
  );
  const tex = scene.textures.addCanvas(key, c)!;
  rowsList.forEach((frames, j) => frames.forEach((_, i) => tex.add(`${j}-${i}`, 0, i * FRAME_W, j * FRAME_H, FRAME_W, FRAME_H)));
}

/** Les personnages qui ne font que se tenir debout, de face : 2 images de repos. */
export interface Npc { rows: Rows; back: Rows | null; cut: number; pal: Palette }
const ELIO_PAL: Palette = { ...FRIEND_PAL };
export const NPCS: Record<string, Npc> = {
  // Élio : blond, longues tresses ; tondu par son père au jour 3
  elio: { ...makeHero({ child: true, hair: 0.9, outfit: 'tunique' }), pal: ELIO_PAL },
  'elio-tondu': { ...makeHero({ child: true, hair: 0, outfit: 'tunique' }), pal: { ...ELIO_PAL, h: '#e2c690', H: '#c4a46c', j: '#f0dcae' } },
  margot: {
    ...makeHero({ child: true, hair: 0.85, outfit: 'tunique' }),
    pal: { ...CHILD_PAL, h: '#2e2638', H: '#1c1624', j: '#54486a', c: '#c0485a', C: '#8a3040', l: '#e47a84' },
  },
  basile: {
    ...makeHero({ child: true, hair: 0.1, outfit: 'tunique' }),
    pal: { ...CHILD_PAL, h: '#c4703a', H: '#94502a', j: '#e4985a', c: '#6a7a94', C: '#4a586e', l: '#94a4bc' },
  },
  mere: {
    ...makeHero({ hair: 0.44, outfit: 'mage' }),
    pal: { ...PAL, h: '#7a3e2a', H: '#55281c', j: '#a8603e', c: '#5e8a6a', C: '#3e664c', l: '#8ab894', a: '#e8d8b0', A: '#b8a47c', r: '#fff2cc' },
  },
  fauvel: {
    ...makeHero({ hair: 0.2, outfit: 'tunique' }),
    pal: { ...PAL, h: '#3a3440', H: '#26222c', j: '#5a5464', c: '#f0ece0', C: '#c8c2b0', l: '#ffffff', a: '#4a74b4', A: '#2e4e84', r: '#6e98d4' },
  },
  aubin: {
    ...makeHero({ hair: 1, outfit: 'tunique' }),
    pal: { ...PAL, h: '#6a5440', H: '#4a3a2c', j: '#8e7458', c: '#a89880', C: '#7e705c', l: '#c8baa2', a: '#5a4a3a', A: '#3a2e24', r: '#7a6a58' },
  },
};

/** Garde les couleurs d'une palette du décor le temps d'un dessin. */
function withColors<K extends string>(target: Record<K, string>, colors: Partial<Record<K, string>>, draw: () => void) {
  const saved = { ...target };
  Object.assign(target, colors);
  draw();
  Object.assign(target, saved);
}

export const ROOFS: Record<string, Partial<Record<string, string>>> = {
  red: {},
  blue: { rf: '#4a74b4', rfd: '#2e4e84', rfl: '#6e98d4' },
  green: { rf: '#5a9a54', rfd: '#3a6e3c', rfl: '#82be6e' },
  brown: { rf: '#8a6a48', rfd: '#5e4630', rfl: '#b08c62', wa: '#c8a878', wad: '#a8885c' },
};

export const WELL_DAY = { st: '#8a92a4', std: '#646c80', stl: '#b4bccb', so: '#1f2430', wood: '#7a5038', woodd: '#553824', woodl: '#a06e48', hole: '#0a0c12', rope: '#b8a47a' };

export function drawWellImage(g: CanvasRenderingContext2D, t: number, day: boolean, s: WellState) {
  if (day) withColors(N, WELL_DAY, () => drawWell(g, 5, 10, t, s));
  else drawWell(g, 5, 10, t, s);
}

export function buildTextures(scene: Phaser.Scene) {
  // héros : une rangée par direction, l'image 0 au repos puis 4 images de marche
  addSheet(scene, 'hero', DIRS.map((d) => [childFrom(idleRows(d)), ...dirFrames(d).map(childFrom)]), CHILD_PAL);
  for (const [key, n] of Object.entries(NPCS)) addSheet(scene, key, [[n.rows, bobUpper(n.rows, n.cut)]], n.pal, n.back);

  scene.textures.addCanvas('tree', treeSprite());
  for (const [name, roof] of Object.entries(ROOFS)) {
    const [c, g] = canvas(76, 76);
    withColors(T, roof, () => cottage(g, 2, 11));
    scene.textures.addCanvas(`house-${name}`, c);
  }
  const decor: [string, number, number, (g: CanvasRenderingContext2D) => void][] = [
    ['lavoir', 56, 44, lavoir],
    ['fountain', 34, 30, fountain],
    ['barber-pole', 6, 20, barberPole],
    ['candle', 14, 22, (g) => candleStool(g, true)],
    ['candle-off', 14, 22, (g) => candleStool(g, false)],
  ];
  for (const [key, w, h, draw] of decor) {
    const [c, g] = canvas(w, h);
    draw(g);
    scene.textures.addCanvas(key, c);
  }
  const [s, sg] = canvas(18, 4);
  sg.fillStyle = '#1a3a2a';
  sg.fillRect(1, 0, 16, 4);
  sg.fillRect(0, 1, 18, 2);
  scene.textures.addCanvas('shadow', s);
}
