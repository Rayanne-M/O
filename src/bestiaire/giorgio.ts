// Giorgio, le gardien du pied de l'arc-en-ciel (section adolescent).
// Même méthode que la planche : des lettres pour les couleurs, contours et ombrage automatiques.
// Le corps et la marche viennent du héros adulte (planche.js) ; seuls la tête et les couleurs changent.
import { PAL, dirFrames, idleRows, drawSprite, mix, type Dir, type Palette, type Rows } from '../village/art/planche.js';

// ---------- Couleurs ----------
// Peau mate et chaude, barbe et cheveux presque noirs, pull beige, pantalon vert (clin d'œil au leprechaun).
export const GIORGIO_PAL: Palette = {
  ...PAL,
  s: '#e0ad88', S: '#b98060', L: '#f4d0b0', t: '#9a7a66',
  h: '#2a201c', H: '#18110f', j: '#4c3c34', q: '#3a2e28',
  E: '#f0e8de', e: '#24160f', M: '#b4685c', d: '#3a1418',
  c: '#d4ba90', C: '#ad926c', l: '#ecd6b0',
  a: '#c4a87c', A: '#9c825c', r: '#dcc296',
  p: '#3e6a4a', P: '#2a4a34',
};

// ---------- Petits outils de grille (24 colonnes, comme la planche) ----------
type Grid = string[][];
const W = 24;
const grid = (h: number, w = W): Grid => Array.from({ length: h }, () => Array(w).fill('.'));
const inside = (g: Grid, x: number, y: number) => y >= 0 && y < g.length && x >= 0 && x < g[0].length;
function fillE(g: Grid, cx: number, cy: number, rx: number, ry: number, k: string, cond = (_x: number, _y: number) => true) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++)
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 && inside(g, x, y) && cond(x, y)) g[y][x] = k;
}
function fillR(g: Grid, x0: number, y0: number, x1: number, y1: number, k: string) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (inside(g, x, y)) g[y][x] = k;
}
function dot(g: Grid, pts: [number, number][], k: string) {
  for (const [x, y] of pts) if (inside(g, x, y)) g[y][x] = k;
}
function outline(g: Grid): Grid {
  const o = g.map((r) => r.slice());
  for (let y = 0; y < g.length; y++)
    for (let x = 0; x < g[0].length; x++)
      if (g[y][x] === '.' && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => inside(g, x + a, y + b) && !'.o'.includes(g[y + b][x + a])))
        o[y][x] = 'o';
  return o;
}
/** Ombre à droite et en bas (la lumière vient d'en haut à gauche), comme l'autoshade de la planche. */
const SHADE: Record<string, string> = { s: 'S', h: 'H', c: 'C', a: 'A' };
function shade(g: Grid): Grid {
  const o = g.map((r) => r.slice());
  const edge = (x: number, y: number) => !inside(g, x, y) || '.o'.includes(g[y][x]);
  for (let y = 0; y < g.length; y++)
    for (let x = 0; x < g[0].length; x++) {
      const k = g[y][x];
      if (SHADE[k] && (edge(x + 1, y) || edge(x, y + 1))) o[y][x] = SHADE[k];
    }
  return o;
}
const toRows = (g: Grid): Rows => g.map((r) => r.join(''));
/** Les cheveux ras du crâne (« q ») : un grain de deux tons, plus clair que la barbe. */
const crop = (g: Grid): Grid => g.map((r, y) => r.map((k, x) => (k === 'q' && (x * 2 + y) % 3 === 0 ? 'j' : k)));
const toGrid = (rows: Rows): Grid => rows.map((r) => r.split(''));
const flipRows = (rows: Rows): Rows => rows.map((r) => r.split('').reverse().join(''));

// ---------- Les têtes (16 rangées, posées à la place de celle du héros) ----------
// De face : demi-tête gauche, miroir automatique. Crâne dégarni, cheveux ras sur les côtés,
// sourcils épais, yeux sombres, moustache qui tombe aux coins, bouc et barbe le long de la mâchoire.
const FACE_L = [
  '........oooo',
  '......oossss',
  '.....osssLLs',
  '....ossLLsss',
  '...osssLssss',
  '...ossssssss',
  '..oqssssssss',
  '..oqqsssssss',
  '..oqqshhhhss',
  '.osqsssEesss',
  '.oSqsssSssss',
  '..ohssssssss',
  '..ohhsshhhhh',
  '...ohssshMMM',
  '...ohhsssshh',
  '....ohhhhhhh',
];
function headFront(): Rows {
  let g = toGrid(FACE_L.map((r) => r + r.split('').reverse().join('')));
  // un seul reflet sur le crâne, à gauche ; le nez et les narines au milieu
  for (let y = 0; y < 16; y++) for (let x = 12; x < W; x++) if (g[y][x] === 'L') g[y][x] = 's';
  dot(g, [[12, 10], [12, 11]], 'S');
  dot(g, [[11, 11]], 't');
  dot(g, [[13, 15], [10, 15]], 'H');
  g = crop(shade(g));
  // le bouc reste bien noir, les oreilles gardent leur creux
  dot(g, [[1, 10], [22, 10]], 'o');
  return toRows(g);
}

/** De profil, vers la droite. */
function headEast(): Rows {
  const g = grid(16);
  fillE(g, 13, 8, 7.5, 7.5, 's');                         // le crâne
  fillR(g, 12, 11, 19, 15, 's');                           // la mâchoire, large
  dot(g, [[20, 10], [21, 11], [20, 11]], 's');             // le nez qui dépasse
  // cheveux ras : couronne à l'arrière et sur le côté, sous la ligne du crâne
  fillE(g, 13, 8, 7.5, 7.5, 'q', (x, y) => y >= 6 && x <= 12);
  fillR(g, 9, 13, 11, 14, 'q');
  fillE(g, 12, 10, 1.5, 2.2, 's');                         // l'oreille
  dot(g, [[12, 10]], 'S');
  dot(g, [[14, 3], [15, 3], [15, 2], [16, 4]], 'L');        // reflet du crâne
  dot(g, [[15, 7], [16, 7], [17, 7], [18, 7]], 'h');        // sourcil épais
  dot(g, [[17, 8]], 'e'); dot(g, [[16, 8]], 'E');           // œil sombre
  dot(g, [[17, 9]], 'S');
  dot(g, [[17, 11], [18, 11], [19, 11], [19, 12], [16, 12], [17, 12]], 'h');   // moustache
  dot(g, [[18, 12]], 'M');
  dot(g, [[18, 13], [19, 13], [18, 14], [19, 14]], 'h');    // bouc
  fillR(g, 13, 13, 17, 15, 'h');                            // barbe le long de la mâchoire
  dot(g, [[14, 13], [16, 13]], 't');
  return toRows(crop(shade(outline(g))));
}

/** De dos : le crâne nu, la couronne de cheveux ras, les oreilles. */
function headNorth(): Rows {
  const g = grid(16);
  fillE(g, 11.5, 8, 8, 7.5, 's');
  fillR(g, 7, 12, 16, 15, 'q');
  fillE(g, 11.5, 8, 8, 7.5, 'q', (_x, y) => y >= 7);
  fillE(g, 3.5, 9.5, 1, 2, 's'); fillE(g, 19.5, 9.5, 1, 2, 's');
  dot(g, [[8, 2], [9, 2], [9, 3], [8, 3]], 'L');
  return toRows(crop(shade(outline(g))));
}

/** Trois quarts dos, vers la droite. */
function headNorthEast(): Rows {
  const g = grid(16);
  fillE(g, 12, 8, 8, 7.5, 's');
  fillE(g, 12, 8, 8, 7.5, 'q', (x, y) => y >= 7 && x <= 16);
  fillR(g, 7, 12, 16, 15, 'q');
  fillE(g, 16.5, 10, 1.2, 2, 's');                          // l'oreille droite, visible
  dot(g, [[16, 10]], 'S');
  dot(g, [[18, 13], [19, 13], [19, 12], [18, 14]], 'h');    // le bout de la barbe dépasse
  dot(g, [[9, 2], [10, 2], [10, 3]], 'L');
  return toRows(crop(shade(outline(g))));
}

const HEADS: Record<'S' | 'E' | 'N' | 'NE', () => Rows> = { S: headFront, E: headEast, N: headNorth, NE: headNorthEast };
const VIEW_OF: Record<Dir, ['S' | 'E' | 'N' | 'NE', boolean]> = {
  S: ['S', false], SE: ['S', false], E: ['E', false], NE: ['NE', false], N: ['N', false],
  NW: ['NE', true], W: ['E', true], SW: ['S', false],
};

/** Pose la tête de Giorgio sur une image du héros, et change l'écharpe en col de pull. */
function dress(rows: Rows, head: Rows, side?: 'E' | 'W'): Rows {
  const off = /^\.+$/.test(rows[0]) ? 1 : 0;              // image « rebond » : tout le haut est descendu d'un pixel
  const g = toGrid(rows.map((r, y) => {
    if (y >= off && y < off + 16) return head[y - off];
    if (y < off + 18) return r;
    // ceinture, sangle, sacoche et pans d'écharpe disparaissent sous le pull
    return r.replace(/[aArbm]/g, 'c');
  }));
  // de profil, l'écharpe flottait derrière le héros : on l'enlève et on referme le contour
  if (side) for (let y = off + 16; y <= off + 21; y++) for (let x = 0; x < W; x++) if (side === 'E' ? x <= 7 : x >= W - 8) g[y][x] = '.';
  return toRows(outline(g));
}

const cache = new Map<string, Rows[]>();
/** Les images de Giorgio dans une direction : [repos, marche 1 à 4]. 24 × 34 comme le héros adulte. */
export function giorgioFrames(dir: Dir): Rows[] {
  if (cache.has(dir)) return cache.get(dir)!;
  const [view, flip] = VIEW_OF[dir];
  const head = flip ? flipRows(HEADS[view]()) : HEADS[view]();
  const side = view === 'E' ? (flip ? 'W' : 'E') : undefined;
  const frames = [idleRows(dir), ...dirFrames(dir)].map((r) => dress(r, head, side));
  cache.set(dir, frames);
  return frames;
}

// ---------- Le chaudron de pâtes ----------
// Il reflète ce que celui qui regarde désire le plus. Pour Giorgio, ce sont des pâtes,
// et c'est pour ça qu'il a toujours faim : on ne mange pas un reflet.
export type Desire = 'pates' | 'or' | 'reflet';
export const CAULDRON_W = 32;
export const CAULDRON_H = 30;
const POT = { o: '#1a1620', i: '#3a3644', I: '#262230', w: '#5c5868', g: '#c89a3a' };
const PASTA = ['#f4d27a', '#e0b456', '#fbe6a6'];
const GOLD = ['#f2c64a', '#c8962a', '#fff0a0'];
const SHEEN = ['#e8505a', '#f0a040', '#f2e060', '#5ec27a', '#4a8ad4', '#9a6ad4'];

function px(ctx: CanvasRenderingContext2D, c: string, x: number, y: number, w = 1, h = 1) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}
function ellRow(ry: number, rx: number, y: number) {
  return Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
}

/** Le chaudron, coin haut-gauche en (x0, y0). t en ms pour la vapeur et le reflet. */
export function drawCauldron(ctx: CanvasRenderingContext2D, x0: number, y0: number, t: number, desire: Desire = 'pates') {
  const cx = x0 + 16, top = y0 + 12;
  // vapeur
  for (let i = 0; i < 3; i++) {
    const ph = ((t / 900 + i / 3) % 1), sx = cx - 6 + i * 6 + Math.sin(t / 300 + i * 2) * 1.5;
    for (let k = 0; k < 4; k++) px(ctx, mix('#ffffff', '#c8c4d0', ph), sx + Math.sin(ph * 6 + k) * 1.2, top - 2 - ph * 9 - k, 1, 1);
  }
  // pieds et anses
  px(ctx, POT.o, x0 + 6, y0 + 27, 3, 3); px(ctx, POT.o, x0 + 23, y0 + 27, 3, 3);
  px(ctx, POT.o, x0 + 1, top + 3, 2, 4); px(ctx, POT.o, x0 + 29, top + 3, 2, 4);
  // la panse : ombre à droite, reflet de métal à gauche
  for (let y = 0; y <= 14; y++) {
    const w = ellRow(15, 14, y);
    for (let x = -w; x <= w; x++) {
      const edge = Math.abs(x) === w || y === 14;
      px(ctx, edge ? POT.o : x > w * 0.45 ? POT.I : POT.i, cx + x, top + 1 + y);
    }
  }
  for (let y = 2; y <= 8; y++) px(ctx, POT.w, cx - 10 + Math.floor(y / 3), top + 1 + y);
  px(ctx, POT.g, cx - 3, top + 8, 6, 1);                    // un cerclage doré, pour la légende
  // le bord, et ce qu'il y a dedans
  for (let y = -3; y <= 3; y++) {
    const w = ellRow(3, 14, y);
    for (let x = -w; x <= w; x++) {
      const rim = Math.abs(x) >= w - 1 || y === 3 || y === -3;
      let col = POT.o;
      if (!rim) {
        const n = (x * 7 + y * 13 + Math.floor(t / 180)) & 7;
        if (desire === 'pates') col = PASTA[(Math.abs(Math.round(Math.sin(x * 0.9 + y * 2.1) * 3)) + (y & 1)) % 3];
        else if (desire === 'or') col = GOLD[(Math.abs(x) + (y + 4) * 3) % 4 === 0 ? 2 : (x + y) & 1];
        else col = mix(SHEEN[Math.abs(x + y + Math.floor(t / 120)) % 6], '#2a2a40', 0.35 + 0.1 * (n & 1));
      } else if (y === -3 || (y < 0 && Math.abs(x) >= w - 1)) col = POT.w;
      px(ctx, col, cx + x, top + y);
    }
  }
  if (desire === 'pates') {
    // des spaghettis qui débordent, et une fourchette plantée
    [[-11, 1], [-10, 2], [-10, 3], [9, 1], [10, 2]].forEach(([x, y]) => px(ctx, PASTA[1], cx + x, top + y));
    for (let y = -9; y <= -1; y++) px(ctx, '#b8bcc8', cx + 4, top + y);
    px(ctx, '#b8bcc8', cx + 3, top - 10, 3, 1);
    [3, 5].forEach((x) => px(ctx, '#b8bcc8', cx + x, top - 12, 1, 2));
    px(ctx, '#b8bcc8', cx + 4, top - 12, 1, 2);
  } else if (desire === 'or') {
    [[-4, -4], [2, -4], [-1, -5]].forEach(([x, y]) => px(ctx, GOLD[2], cx + x, top + y, 2, 1));
  }
}

// ---------- L'arc-en-ciel ----------
const BANDS = ['#e0505a', '#ee9a40', '#f2d860', '#5eb87a', '#4a86d0', '#8a62c8'];

/** Un arc-en-ciel en demi-ellipse posé sur le sol, de x0 à x1 ; p : de 0 (rien) à 1 (l'arc entier), from : où il commence à s'effacer. */
export function drawRainbow(ctx: CanvasRenderingContext2D, x0: number, x1: number, ground: number, h: number, p: number, from = 0, alpha = 0.85) {
  const cx = (x0 + x1) / 2, rx = (x1 - x0) / 2;
  ctx.globalAlpha = alpha;
  BANDS.forEach((col, i) => {
    const r = rx - i * 2, ry = h - i * 2;
    for (let s = 0; s <= 1; s += 1 / (r * 3)) {
      if (s > p || s < from) continue;
      const a = Math.PI * (1 - s);
      const x = cx + Math.cos(a) * r, y = ground - Math.sin(a) * ry;
      px(ctx, col, x, y, 1, 2);
    }
  });
  ctx.globalAlpha = 1;
}
/** Le point de l'arc où se trouve Giorgio, s de 0 (départ) à 1 (arrivée). */
function onArc(x0: number, x1: number, ground: number, h: number, s: number) {
  const cx = (x0 + x1) / 2, rx = (x1 - x0) / 2 - 5, a = Math.PI * (1 - s);
  return [cx + Math.cos(a) * rx, ground - Math.sin(a) * (h - 5)];
}

export const TRAVEL_W = 160;
export const TRAVEL_H = 90;
export const TRAVEL_LEN = 4200;
/** Giorgio invoque un arc-en-ciel, glisse dessus et retombe de l'autre côté. e : ms depuis le début (boucle). */
export function drawRainbowTravel(ctx: CanvasRenderingContext2D, e: number) {
  const t = e % TRAVEL_LEN, G = 80, X0 = 18, X1 = 142, Hh = 44;
  ctx.clearRect(0, 0, TRAVEL_W, TRAVEL_H);
  const grow = Math.min(1, Math.max(0, (t - 500) / 800));
  const ride = Math.min(1, Math.max(0, (t - 1400) / 1300));
  const fade = Math.min(1, Math.max(0, (t - 2700) / 600));
  if (grow > 0) drawRainbow(ctx, X0, X1, G, Hh, grow, fade);
  const [fx, fy] = t < 1400 ? [X0 + 5, G] : t < 2700 ? onArc(X0, X1, G, Hh, ride) : [X1 - 5, G];
  const frames = giorgioFrames(t < 1400 || t >= 2700 ? 'S' : 'E');
  const f = t < 1400 || t >= 2700 ? frames[Math.floor(t / 400) % 2 ? 0 : 0] : frames[1 + (Math.floor(t / 120) % 4)];
  // étincelles qui suivent
  for (let i = 0; i < 8; i++) {
    const k = (t / 60 + i * 7) % 20;
    if (t > 400 && t < 3000) px(ctx, BANDS[i % 6], fx - 6 + ((i * 37) % 12) - (t >= 1400 ? k * 0.8 : 0), fy - 4 - ((i * 13 + k * 2) % 22), 1, 1);
  }
  const bob = t < 1400 ? (Math.floor(t / 300) % 2) : 0;
  drawSprite(ctx, f, GIORGIO_PAL, Math.round(fx - 12), Math.round(fy - 34 + bob));
}

// ---------- Portrait de dialogue, 64 × 64 ----------
export type Mood = 'neutre' | 'affame';
export const PORTRAIT = 64;

/** Le portrait : c'est ici que la ressemblance se joue. open : ouverture de la bouche, de 0 à 1. */
export function portraitRows(mood: Mood, open = 0): Rows {
  const g = grid(64, 64);
  const cx = 32;
  // le pull : épaules larges, maille en côtes verticales
  fillE(g, cx, 66, 31, 17, 'c');
  for (let y = 50; y < 64; y++) for (let x = 0; x < 64; x++) if (g[y][x] === 'c' && (x + (y >> 2)) % 4 === 0) g[y][x] = 'C';
  // le cou et le col rond en côtes
  fillR(g, 25, 43, 39, 53, 's');
  fillE(g, cx, 52, 11, 4, 'a', (_x, y) => y >= 50);
  fillE(g, cx, 51, 8, 2.5, 's', (_x, y) => y >= 49);
  for (let x = 20; x < 45; x++) for (let y = 50; y < 57; y++) if (g[y][x] === 'a' && x % 2) g[y][x] = 'A';
  fillR(g, 26, 47, 38, 49, 'S');
  // la tête : crâne rond, mâchoire large
  fillE(g, cx, 26, 14, 16, 's');
  fillE(g, cx, 33, 13.5, 11, 's');
  // les oreilles
  fillE(g, 17.5, 29, 2.2, 4.5, 's'); fillE(g, 46.5, 29, 2.2, 4.5, 's');
  dot(g, [[17, 28], [17, 29], [17, 30], [47, 28], [47, 29], [47, 30]], 'S');
  // cheveux ras sur les côtés et derrière les oreilles ; le dessus est dégarni
  fillE(g, cx, 26, 14, 16, 'h', (x, y) => y >= 15 && y <= 33 && Math.abs(x - cx) >= 11.5 && !(y >= 25 && y <= 33 && Math.abs(x - cx) >= 14));
  for (let y = 15; y <= 24; y++) for (let x = 0; x < 64; x++) if (g[y][x] === 'h') g[y][x] = (x + y) % 3 ? 'q' : 'j';
  for (let y = 25; y <= 33; y++) for (let x = 0; x < 64; x++) if (g[y][x] === 'h') g[y][x] = (x * 2 + y) % 3 ? 'q' : 'h';
  // reflet sur le crâne
  fillE(g, 26, 15, 4, 2.2, 'L');
  fillE(g, 24, 18, 1.5, 1, 'L');
  // ombre du côté droit du visage
  for (let y = 12; y < 46; y++) for (let x = 38; x < 47; x++) if (g[y][x] === 's' && ((x - cx) / 14) ** 2 + ((y - 27) / 18) ** 2 > 0.55) g[y][x] = 'S';
  // sourcils épais, presque droits ; relevés au milieu quand il a faim
  const lift = mood === 'affame' ? 1 : 0;
  for (const side of [-1, 1]) {
    for (let i = 0; i < 8; i++) {
      const x = cx + side * (3 + i), y = 25 - (i >= 6 ? 0 : 0) + (i <= 1 ? -lift : 0) + (i >= 7 ? 1 : 0);
      dot(g, [[x, y], [x, y + 1]], 'h');
      if (i >= 2 && i <= 5) dot(g, [[x, y - 1]], 'h');
    }
  }
  // les yeux, sombres et un peu enfoncés
  const look = mood === 'affame' ? -1 : 0;
  for (const side of [-1, 1]) {
    const ex = cx + side * 7;
    for (let x = -3; x <= 3; x++) dot(g, [[ex + x, 28]], 'o');
    for (let x = -3; x <= 2; x++) dot(g, [[ex + x * side * -1 * -1, 29]], 'E');
    for (let x = -2; x <= 2; x++) dot(g, [[ex + x, 30]], 'E');
    fillR(g, ex - 1, 29 + look, ex + 1, 30 + look, 'e');
    dot(g, [[ex - 1, 29 + look]], 'L');
    for (let x = -2; x <= 2; x++) dot(g, [[ex + x, 32]], 'S');
  }
  dot(g, [[cx - 11, 29], [cx + 11, 29]], 's');
  // le nez : arête à droite, narines, bout éclairé
  for (let y = 29; y <= 36; y++) dot(g, [[cx + 2, y]], 'S');
  dot(g, [[cx + 3, 35], [cx + 3, 36], [cx - 3, 36]], 'S');
  dot(g, [[cx - 3, 37], [cx + 3, 37], [cx - 2, 38], [cx + 2, 38]], 'S');
  dot(g, [[cx - 2, 37], [cx + 2, 37]], 'o');
  dot(g, [[cx, 35], [cx - 1, 35]], 'L');
  // la moustache, épaisse, qui retombe aux coins
  for (let x = -8; x <= 8; x++) {
    const ax = Math.abs(x), y0 = 39 + (ax >= 7 ? 1 : 0), y1 = 41 + (ax >= 6 ? 1 : 0) + (ax >= 8 ? 1 : 0);
    for (let y = y0; y <= y1; y++) dot(g, [[cx + x, y]], 'h');
  }
  dot(g, [[cx - 4, 39], [cx + 3, 39], [cx - 6, 40]], 'j');
  // la bouche : lèvre inférieure, et elle s'ouvre quand il parle ou bave de faim
  const o = Math.round(open * 3);
  fillR(g, cx - 3, 42, cx + 3, 42, o ? 'd' : 'M');
  for (let k = 1; k <= o; k++) fillR(g, cx - 3 + (k === o ? 1 : 0), 42 + k, cx + 3 - (k === o ? 1 : 0), 42 + k, 'd');
  fillR(g, cx - 2, 43 + o, cx + 2, 43 + o, 'M');
  // le bouc, puis la barbe qui suit la mâchoire
  fillR(g, cx - 2, 44 + o, cx + 2, 46, 'h');
  fillR(g, cx - 1, 47, cx + 1, 47, 'h');
  dot(g, [[cx - 1, 45 + o]], 'j');
  for (let y = 31; y < 48; y++)
    for (let x = 15; x < 50; x++) {
      if (!'sSL'.includes(g[y][x])) continue;
      const d = ((x - cx) / 13.5) ** 2 + ((y - 33) / 11) ** 2;
      // barbe courte et dense sur la mâchoire, qui s'éclaircit vers les joues
      if (d > 0.74 && y >= 33) g[y][x] = (x + y) % 5 === 0 ? 'j' : 'h';
      else if (d > 0.56 && y >= 36) g[y][x] = (x + y) % 2 ? 't' : 'q';
      else if (d > 0.4 && y >= 35 && (x + y * 2) % 3 === 0) g[y][x] = 't';
    }
  if (mood === 'affame') {
    dot(g, [[cx + 3, 44 + o], [cx + 3, 45 + o]], 'v');        // un filet de bave
    dot(g, [[cx + 12, 19], [cx + 12, 20], [cx + 13, 20]], 'v'); // une goutte de sueur
  }
  return toRows(outline(g));
}

/** Le fond du portrait : nuit douce et un morceau d'arc-en-ciel derrière lui. */
export function drawPortrait(ctx: CanvasRenderingContext2D, mood: Mood, open = 0) {
  ctx.fillStyle = '#1c2a3a';
  ctx.fillRect(0, 0, PORTRAIT, PORTRAIT);
  BANDS.forEach((col, i) => {
    const r = 40 - i * 2;
    for (let a = 0; a <= Math.PI; a += 1 / (r * 2)) px(ctx, mix(col, '#1c2a3a', 0.45), 32 + Math.cos(a) * r, 58 - Math.sin(a) * r * 0.95, 1, 2);
  });
  drawSprite(ctx, portraitRows(mood, open), { ...GIORGIO_PAL, v: '#a8d8f0' }, 0, 0);
}

// ---------- Bestiaire ----------
export const GIORGIO = {
  id: 'giorgio',
  name: 'Giorgio',
  title: "Le gardien du pied de l'arc-en-ciel",
  section: 'adolescent',
  origin: 'Le leprechaun et son chaudron (Irlande), mal raconté pendant une famine',
  pact: {
    trait: 'Ventre d’arc-en-ciel',
    gain: "Invoquer un arc-en-ciel pour aller d'un pied d'arc-en-ciel déjà visité à un autre ; en combat, une fois par combat, glisser hors d'une attaque.",
    cost: 'La faim de Giorgio : chaque arc-en-ciel creuse la faim, et un ventre vide fait baisser les stats jusqu’au prochain vrai repas.',
  },
} as const;
