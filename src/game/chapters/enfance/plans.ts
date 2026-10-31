// Les gros plans et cinématiques de l'enfance, dessinés en plein écran (384 × 216).
// Ce sont des versions provisoires : chacune sera remplacée par celle de la planche quand elle existera
// (catalogue des assets : PLAN-01 à PLAN-12).
import * as A from 'virtual:rpg-art';
import type { PlanFn } from '../../engine/game';
import { LOOKS, heroLook } from './cast';
import { state } from '../../engine/state';

const W = 384, H = 216;
const px = (c: CanvasRenderingContext2D, col: string, x: number, y: number, w = 1, h = 1) => {
  c.fillStyle = col;
  c.fillRect(Math.round(x), Math.round(y), w, h);
};
const ell = (c: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, col: string) => {
  c.fillStyle = col;
  for (let y = -ry; y <= ry; y++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
    c.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2, 1);
  }
};
const smooth = (u: number) => u * u * (3 - 2 * u);
const clamp01 = (u: number) => Math.max(0, Math.min(1, u));

/** Le sprite d'un personnage, agrandi. */
function bigSprite(c: CanvasRenderingContext2D, look: { child: boolean; hair: number; pal: Record<string, string> }, x: number, y: number, k: number, rowsTo = 99) {
  const hero = A.makeHero({ child: look.child, hair: look.hair, outfit: 'tunique', pact: false, combat: false });
  const tmp = document.createElement('canvas');
  tmp.width = 24;
  tmp.height = Math.min(rowsTo, hero.rows.length);
  A.drawSprite(tmp.getContext('2d'), hero.rows.slice(0, tmp.height), look.pal, 0, 0);
  c.imageSmoothingEnabled = false;
  c.drawImage(tmp, x, y, 24 * k, tmp.height * k);
}

// ---------- PLAN-01 : le panier et l'araignée ----------

export type SpiderEnd = 'avance' | 'ecrase' | 'secoue' | 'pose';
const SKIN = '#f0c8a0', SKIND = '#c8946c', SKINL = '#ffe0c0', O = '#2a2030';

function hand(c: CanvasRenderingContext2D, x: number, y: number, stain: boolean) {
  // une main d'enfant qui tient l'anse, vue de dessus
  ell(c, x, y, 26, 18, O);
  ell(c, x, y, 25, 17, SKIN);
  ell(c, x - 4, y - 4, 16, 9, SKINL);
  for (let k = 0; k < 4; k++) {
    px(c, O, x - 22 + k * 12, y - 26, 10, 18);
    px(c, SKIN, x - 21 + k * 12, y - 25, 8, 17);
    px(c, SKINL, x - 20 + k * 12, y - 24, 3, 12);
    px(c, SKIND, x - 21 + k * 12, y - 12, 8, 1);
  }
  px(c, O, x + 22, y - 6, 18, 10);
  px(c, SKIN, x + 23, y - 5, 16, 8);
  if (stain) {
    px(c, '#3a2a30', x - 2, y + 2, 6, 4);
    px(c, '#5a2a3a', x + 4, y + 4, 3, 2);
  }
}
function egg(c: CanvasRenderingContext2D, x: number, y: number, broken = false) {
  if (broken) {
    ell(c, x, y + 6, 14, 5, '#f4d84a');
    ell(c, x, y + 6, 6, 3, '#e8a02a');
    px(c, '#f4ead2', x - 10, y + 2, 5, 3);
    px(c, '#f4ead2', x + 6, y + 3, 4, 3);
    return;
  }
  ell(c, x, y, 11, 14, O);
  ell(c, x, y, 10, 13, '#f4e4c4');
  ell(c, x - 3, y - 5, 4, 5, '#fff8ea');
  px(c, '#d8c4a0', x + 4, y + 6, 4, 4);
}
function spider(c: CanvasRenderingContext2D, x: number, y: number, t: number, dead = false) {
  const step = Math.floor(t / 110) % 2;
  if (dead) {
    ell(c, x, y, 7, 3, '#3a2a30');
    for (let k = 0; k < 4; k++) px(c, '#3a2a30', x - 12 + k * 7, y + (k % 2 ? 2 : -2), 5, 1);
    return;
  }
  for (let k = 0; k < 4; k++) {
    const dy = -6 + k * 4, s = (k + step) % 2 ? 1 : -1;
    px(c, O, x - 12, y + dy + s, 7, 1);
    px(c, O, x - 14, y + dy + s + 1, 2, 2);
    px(c, O, x + 6, y + dy - s, 7, 1);
    px(c, O, x + 12, y + dy - s + 1, 2, 2);
  }
  ell(c, x, y + 3, 6, 7, O);
  ell(c, x, y + 3, 5, 6, '#4a3a4a');
  ell(c, x, y - 5, 4, 3, O);
  ell(c, x, y - 5, 3, 2, '#5a4a5a');
  px(c, '#e04040', x - 1, y + 2, 2, 3);
  px(c, '#e8e8f0', x - 2, y - 6);
  px(c, '#e8e8f0', x + 1, y - 6);
}

/** Le panier en gros plan. `fin` : l'araignée avance, puis ce que le héros en a fait. */
export function panierPlan(eggs: number, fin: () => SpiderEnd): PlanFn {
  let endAt = -1;
  return (c, t) => {
    const end = fin();
    if (end !== 'avance' && endAt < 0) endAt = t;
    const e = endAt < 0 ? 0 : t - endAt;
    // la paille du fond, et le bord du panier
    px(c, '#c89a4a', 0, 0, W, H);
    for (let i = 0; i < 260; i++) {
      const x = (i * 97) % W, y = (i * 53) % H;
      px(c, i % 3 ? '#e8c86a' : '#a87a3a', x, y, 14, 1);
    }
    px(c, '#8a5a28', 0, 150, W, 66);
    for (let x = 0; x < W; x += 8) px(c, '#6a4220', x, 150, 3, 66);
    px(c, '#b0803a', 0, 150, W, 6);
    // les œufs dans la paille
    const spots = [[120, 110], [160, 98], [200, 112], [240, 100], [280, 114]];
    spots.slice(0, eggs).forEach(([x, y], i) => {
      if (end === 'secoue' && i === eggs - 1) {
        const fall = clamp01(e / 600);
        if (fall < 1) egg(c, x + fall * 30, y + fall * 120);
        return;
      }
      egg(c, x, y);
    });
    // l'anse et la main
    px(c, '#6a4220', 40, 40, W - 80, 10);
    px(c, '#8a5a28', 40, 42, W - 80, 4);
    const shake = end === 'secoue' && e < 900 ? Math.round(Math.sin(e / 30) * 6) : 0;
    hand(c, 300 + shake, 52, end === 'ecrase');
    // l'araignée : sort de sous un œuf, monte sur le bord, puis sur la main
    const path = [[280, 114], [292, 120], [312, 112], [322, 86], [304, 60], [292, 48]];
    const u = endAt < 0 ? clamp01(t / 7000) : clamp01(endAt / 7000);
    const seg = u * (path.length - 1), i0 = Math.min(path.length - 2, Math.floor(seg)), f = seg - i0;
    let sx = path[i0][0] + (path[i0 + 1][0] - path[i0][0]) * f, sy = path[i0][1] + (path[i0 + 1][1] - path[i0][1]) * f;
    if (end === 'ecrase') {
      // l'autre main s'abat
      const hit = clamp01(e / 250);
      if (hit < 1) ell(c, sx, sy - 120 + hit * 110, 30, 22, SKIND);
      else spider(c, sx, sy, t, true);
      return;
    }
    if (end === 'secoue') {
      sx += e * 0.4;
      sy -= e * 0.25;
    }
    if (end === 'pose') {
      // les doigts la posent sur une poutre, en haut de l'image
      const lift = smooth(clamp01(e / 1400));
      sx += (200 - sx) * lift;
      sy += (12 - sy) * lift;
      if (lift > 0.9) px(c, '#7a4e30', 120, 0, 160, 10);
    }
    spider(c, sx, sy, end === 'avance' || end === 'secoue' ? t : 0);
  };
}

// ---------- PLAN-02 et PLAN-06 : au fond du puits ----------

/** De jour : de l'eau noire, très loin, et le reflet du héros (PLAN-02 de la planche). */
export const puitsJourPlan: PlanFn = (c, t) => A.drawWellLook(c, t, { fond: 'reflet' });

export function horreurPlan(soften: boolean): PlanFn {
  const tmp = document.createElement('canvas');
  tmp.width = A.HORROR_W;
  tmp.height = A.HORROR_H;
  const g = tmp.getContext('2d')!;
  return (c, t) => {
    const p = clamp01((t - 800) / 6000);
    // la tête est rasée (le scénario réécrit) ; doux = la version atténuée (PLAN-06b)
    A.renderHorror(g, p, 3, { rase: true, doux: soften });
    c.imageSmoothingEnabled = false;
    const k = H / A.HORROR_H;
    c.drawImage(tmp, Math.round((W - A.HORROR_W * k) / 2), 0, A.HORROR_W * k, H);
  };
}

// ---------- PLAN-03 : la coupe ----------

export function coupePlan(before: number, after: number): PlanFn {
  return (c, t) => {
    // le salon en fond, le miroir piqué au centre
    px(c, '#f0e4c8', 0, 0, W, H);
    for (let x = 0; x < W; x += 24) px(c, '#d8c8a4', x, 0, 1, H);
    px(c, '#2a2030', 118, 14, 148, 160);
    px(c, '#c8a040', 120, 16, 144, 156);
    px(c, '#a8c8d8', 128, 24, 128, 140);
    for (let k = 0; k < 30; k++) px(c, '#8a9aa8', 130 + ((k * 37) % 124), 26 + ((k * 61) % 136), 2, 2);
    // le reflet : avant, puis après la coupe
    const u = clamp01((t - 1500) / 2500);
    const look = { ...heroLook(), hair: before + (after - before) * smooth(u) };
    c.save();
    c.beginPath();
    c.rect(128, 24, 128, 140);
    c.clip();
    bigSprite(c, look, 152, 34, 4, 26);
    c.restore();
    // les mèches qui tombent sur le carrelage
    px(c, '#e8e4dc', 0, 180, W, 36);
    for (let x = 0; x < W; x += 16) for (let y = 180; y < H; y += 16) if (((x + y) / 16) % 2) px(c, '#3a3440', x, y, 16, 16);
    for (let k = 0; k < 14; k++) {
      const start = 300 + k * 260, fall = clamp01((t - start) / 900);
      if (fall <= 0) continue;
      const x = 60 + ((k * 71) % 270), y = 40 + fall * (150 + (k % 3) * 8);
      px(c, k % 2 ? '#6a4632' : '#4a2e22', x + Math.sin(fall * 6 + k) * 6, y, 5, 2);
    }
  };
}

// ---------- PLAN-03b : le ruban dans la main d'Élio ----------

export const rubanPlan: PlanFn = (c, t) => {
  px(c, '#86d69a', 0, 0, W, H);
  for (let i = 0; i < 120; i++) px(c, '#6cbf84', (i * 89) % W, (i * 41) % H, 6, 2);
  const open = smooth(clamp01(t / 1200));
  ell(c, 192, 120, 70, 46, O);
  ell(c, 192, 120, 68, 44, SKIN);
  ell(c, 186, 112, 40, 24, SKINL);
  // le ruban bleu, à moitié brûlé
  if (open > 0.3) {
    for (let k = 0; k < 60; k++) {
      const x = 150 + k, y = 116 + Math.round(Math.sin(k / 6) * 6);
      px(c, k > 42 ? '#2a2030' : k > 36 ? '#5a4a3a' : '#3a6ad0', x, y, 1, 6);
      if (k < 36) px(c, '#6a9aee', x, y, 1, 1);
    }
  }
  // les doigts qui s'ouvrent
  for (let k = 0; k < 4; k++) {
    const fx = 140 + k * 26, fy = 84 - open * 40;
    px(c, O, fx, fy, 22, 40);
    px(c, SKIN, fx + 1, fy + 1, 20, 38);
    px(c, SKIND, fx + 1, fy + 30, 20, 1);
  }
};

// ---------- PLAN-04 : le rêve, en plans très serrés ----------

/** Le rêve (PLAN-04 de la planche) : cinq plans serrés, les paupières qui se ferment entre chacun. */
export const REVE_LEN = A.DREAM_LEN as number;
export const revePlan: PlanFn = (c, t) => A.drawDream(c, Math.min(t, REVE_LEN));
/** « Vous vous réveillez en sueur. » */
export const reveilPlan = (text: string): PlanFn => (c, t) => A.drawWakeText(c, t, { text });

// ---------- PLAN-08 et 09 : le puits au matin ----------

export const puitsMatinPlan = (body: boolean, soften: boolean): PlanFn => (c, t) => A.drawWellLook(c, t, { fond: body ? 'corps' : 'eau_rouge', doux: soften, mains: true });

// ---------- PLAN-12 : l'enterrement ----------

export function enterrementPlan(coffinEmpty: boolean, ribbon: () => 'garde' | 'donne' | 'aucun'): PlanFn {
  return (c, t) => {
    // ciel gris, colline, croix de bois
    for (let y = 0; y < 120; y++) px(c, y % 7 ? '#a8b0bc' : '#9aa2ae', 0, y, W, 1);
    px(c, '#6a8a5a', 0, 110, W, 106);
    for (let x = 0; x < W; x += 3) px(c, '#5a7a4a', x, 110 + ((x * 7) % 5), 2, 3);
    [[40, 96], [80, 104], [300, 100], [344, 92]].forEach(([x, y]) => {
      px(c, '#5a3a24', x, y, 4, 22);
      px(c, '#5a3a24', x - 6, y + 5, 16, 4);
    });
    // le cercueil, la fosse
    px(c, '#2a1a14', 140, 150, 104, 26);
    px(c, '#2a2030', 150, 130, 84, 22);
    px(c, '#7a4e30', 152, 132, 80, 18);
    px(c, '#a8784c', 152, 132, 80, 3);
    if (coffinEmpty) px(c, '#5a3a24', 188, 136, 8, 12);
    // Aubin, sobre, la mère, la bande
    const people: [string, number, number][] = [['aubin', 250, 112], ['mere', 96, 116], ['basile', 120, 130], ['margot', 274, 128]];
    for (const [id, x, y] of people) {
      const look = LOOKS[id];
      const hero = A.makeHero({ child: look.child, hair: look.hair, outfit: look.outfit ?? 'tunique', pact: false, combat: false });
      const tmp = document.createElement('canvas');
      tmp.width = 24;
      tmp.height = hero.rows.length;
      A.drawSprite(tmp.getContext('2d'), hero.rows, look.pal, 0, 0);
      c.drawImage(tmp, x, y - hero.rows.length * 2 + 60, 48, hero.rows.length * 2);
    }
    bigSprite(c, heroLook(), 196, 150, 2);
    // le ruban, posé sur le cercueil ou dans la main d'Aubin
    const r = ribbon();
    if (r === 'donne') px(c, '#3a6ad0', 262, 160, 8, 3);
    if (r === 'garde') px(c, '#3a6ad0', 214, 196, 8, 3);
    // la pluie fine
    c.globalAlpha = 0.35;
    for (let k = 0; k < 70; k++) px(c, '#e8ecf4', (k * 53 + t / 8) % W, (k * 31 + t / 3) % H, 1, 4);
    c.globalAlpha = 1;
  };
}

// ---------- Fond noir et texte (le réveil en sueur, les cartons) ----------

export const noirPlan: PlanFn = (c) => px(c, '#000', 0, 0, W, H);

/** Pour le décompte : le héros voit le chêne en fermant les yeux… */
export const yeuxFermesPlan: PlanFn = (c, t) => {
  px(c, '#05040a', 0, 0, W, H);
  // des taches de lumière derrière les paupières
  c.globalAlpha = 0.12 + 0.05 * Math.sin(t / 500);
  ell(c, 150 + Math.sin(t / 900) * 20, 100, 60, 40, '#5a2a3a');
  ell(c, 250, 120 + Math.cos(t / 800) * 10, 40, 30, '#2a3a5a');
  c.globalAlpha = 1;
};

/** Pour les étapes du soir : la date sur fond noir, avec la bougie qui vacille. */
export function veilleePlan(): PlanFn {
  return (c, t) => {
    px(c, '#0b0a10', 0, 0, W, H);
    const f = 1 + 0.08 * Math.sin(t / 80);
    for (let r = 50; r > 0; r -= 3) {
      c.globalAlpha = 0.05 + 0.08 * (1 - r / 50);
      ell(c, W / 2, 120, r * f, r * f * 0.8, '#ffb85a');
    }
    c.globalAlpha = 1;
    px(c, '#c8a040', W / 2 - 5, 128, 10, 6);
    px(c, '#f4ead2', W / 2 - 2, 116, 4, 12);
    px(c, '#ffd84a', W / 2 - 1, 108 + Math.round(Math.sin(t / 70)), 2, 6);
  };
}

export const hairNow = () => state.hair;

// ---------- Les cinématiques de la planche (cinematics.js) : [dessin, durée] ----------

export type Cine = [PlanFn, number];
/** UI-02 : le décompte, yeux fermés. peek() : ms depuis le coup d'œil, ou rien. */
export const countdownCine = (peek: (t: number) => number | undefined): Cine => [(c, t) => A.drawCountdown(c, t, { peek_t: peek(t) }), A.COUNTDOWN_LEN];
/** PLAN-03 : la coupe chez Fauvel. */
export const haircutCine = (coupe: 'pointes' | 'court'): Cine => [(c, t) => A.drawHaircut(c, t, { coupe }), A.HAIRCUT_LEN];
/** PLAN-03b : le ruban brûlé dans la main d'Élio. */
export const ribbonCine: Cine = [(c, t) => A.drawRibbonHand(c, t), A.RIBBON_HAND_LEN];
/** PLAN-05 : le réveil en sueur, la nuit 3 (boucle sur la respiration). */
export const wakeCine = (coupe: 'pointes' | 'court'): Cine => [(c, t) => A.drawWakeUp(c, t, { coupe }), A.WAKE_LEN + 1500];
/** PLAN-10 : la mère mesure les cheveux, au matin du pacte. */
export const pactMorningCine = (coupe: 'pointes' | 'court'): Cine => [(c, t) => A.drawPactMorning(c, t, { coupe }), A.PACT_MORNING_LEN];
/** PLAN-11 : Aubin repêche le héros. */
export const rescueCine: Cine = [(c, t) => A.drawWellRescue(c, t), A.RESCUE_LEN];
/** PLAN-12 : l'enterrement. */
export const funeralCine = (vide: boolean, ruban?: 'donne' | 'garde'): Cine => [(c, t) => A.drawFuneral(c, t, { vide, ruban }), A.FUNERAL_LEN];
/** PLAN-13 : la fin de la nuit au bord du puits. */
export const nightEndCine = (fin: 'chante' | 'fuit' | 'relache'): Cine => [(c, t) => A.drawNightEnding(c, t, { fin }), A.NIGHT_END_LEN];
/** PLAN-14 : les recherches à l'aube. */
export const dawnSearchCine: Cine = [(c, t) => A.drawDawnSearch(c, t), A.DAWN_SEARCH_LEN];
