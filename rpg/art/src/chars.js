// ---------- Gabarit de personnages : tous les habitants du jeu, en 8 directions ----------
// Un personnage = une fiche (âge, coiffure, tenue, palette). Le corps, la tête et les cheveux sont faits de formes simples,
// puis contourés et ombrés automatiquement, comme le héros de dirs.js. Rien n'est propre à l'enfance : on réutilise
// ce gabarit pour tous les chapitres en écrivant de nouvelles fiches.
//
//   makeChar(spec)                       → personnage (garde ses images en cache)
//   charFrame(ch, dir, pose, t)          → rangées de lettres (comme drawSprite), dir : N NE E SE S SW W NW
//   drawChar(ctx, ch, x, y, o)           → dessine ; o = { dir, pose, t, pal } ; (x, y) = coin haut-gauche, 24 px de large
//   charSize(ch)                         → [24, hauteur] (enfant 27, adulte 34)
// Poses : "idle" (2 images), "walk" (4), "run" (4). Les poses spéciales (assis, baignade, à genoux…) sont dans poses.js.
//
// Fiche : { id, age: "child" | "adult" | "elder", hair: { style, ... }, outfit: { top, bottom, apron, shawl, scarf, hood },
//           face: { beard, mustache, stubble, cuts, wrinkles }, pal: { lettres → couleurs } }
// Lettres : h/H/j cheveux, s/S peau, e/E yeux, M bouche, R joues, c/C/l haut, p/P bas (pantalon ou jupe), B/K/k chaussures,
//           q/Q/w tablier ou châle, a/A/r col ou écharpe, u/U/v capuche, z barbe ou crâne rasé, X ruban ou entaille.

const CH_W = 24;
function chGrid(h) { return Array.from({ length: h }, () => Array(CH_W).fill(".")); }
function chRect(g, x0, y0, x1, y1, k) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (g[y] && x >= 0 && x < CH_W) g[y][x] = k; }
function chEll(g, cx, cy, rx, ry, k, cond = () => true) { for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++)
  if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 && g[y] && x >= 0 && x < CH_W && cond(x, y)) g[y][x] = k; }
function chDot(g, pts, k) { pts.forEach(([x, y]) => { if (g[y] && x >= 0 && x < CH_W) g[y][x] = k; }); }
function chPaste(g, rows, dx = 0, dy = 0) { rows.forEach((r, y) => [...r].forEach((k, x) => { if (k !== "." && g[y + dy] && x + dx >= 0 && x + dx < CH_W) g[y + dy][x + dx] = k; })); }
// contour d'une pièce posée sur une autre (une tresse sur la chemise) : ses voisins deviennent un trait sombre
function chInk(g, cells) { const on = new Set(cells.map(([x, y]) => x + "," + y));
  cells.forEach(([x, y]) => [[1,0],[-1,0],[0,1],[0,-1]].forEach(([a, b]) => { const X = x + a, Y = y + b;
    if (!on.has(X + "," + Y) && g[Y] && g[Y][X] && g[Y][X] !== ".") g[Y][X] = "o"; })); }
function chOutline(g) { const o = g.map(r => r.slice());
  for (let y = 0; y < g.length; y++) for (let x = 0; x < CH_W; x++) if (g[y][x] === "." && [[1,0],[-1,0],[0,1],[0,-1]].some(([a, b]) => g[y + b] && g[y + b][x + a] && g[y + b][x + a] !== "." && g[y + b][x + a] !== "o")) o[y][x] = "o";
  return o; }
const CH_SHADE = { h:"H", s:"S", c:"C", a:"A", p:"P", B:"K", u:"U", q:"Q", z:"Z" };
const CH_LIGHT = { h:"j", c:"l", a:"r", B:"k", u:"v", q:"w" };
// ombre à droite et en bas, lumière en haut à gauche (même règle que autoshade, sans supposer un dessin symétrique)
function chShade(g) { const at = (x, y) => (g[y] && g[y][x]) || ".", edge = k => k === "o" || k === ".", out = g.map(r => r.slice());
  for (let y = 0; y < g.length; y++) for (let x = 0; x < CH_W; x++) { const k = g[y][x]; if (edge(k)) continue;
    if (CH_SHADE[k] && (edge(at(x + 1, y)) || edge(at(x, y + 1)))) out[y][x] = CH_SHADE[k];
    else if (CH_LIGHT[k] && edge(at(x - 1, y)) && edge(at(x, y - 1))) out[y][x] = CH_LIGHT[k]; }
  return out; }
const chRows = g => chShade(chOutline(g)).map(r => r.join(""));
const chFlip = rows => rows.map(r => [...r].reverse().join(""));

// ---- proportions : enfant 27 px, adulte 34 px ; la tête fait toujours 16 rangées ----
const CH_BODY = {
  child: { H: 27, torso: [16, 22], arm: [17, 20], hand: 21, legs: [23, 23], shoe: [24, 25], tw: 7 },
  adult: { H: 34, torso: [16, 26], arm: [18, 23], hand: 24, legs: [27, 29], shoe: [30, 32], tw: 7 },
};
CH_BODY.elder = CH_BODY.adult;

// ---- corps, selon la vue ----
// face/dos (S, N) : torse, bras séparés par un trait, deux jambes ; pose = -1, 0, 1 (une jambe levée)
function chBodyFront(g, b, o, pose, back) {
  const [t0, t1] = b.torso, cx = 12, w = b.tw;
  chRect(g, cx - w + 2, 14, cx + w - 3, 15, "s");                                   // cou
  chRect(g, cx - w, t0, cx + w - 1, t1, "c");
  const arm = (ax, sep) => { chRect(g, ax, b.arm[0], ax, b.arm[1], "c"); chRect(g, sep, b.arm[0] + 1, sep, b.arm[1], "o"); chRect(g, ax, b.hand, ax, b.hand, o.gloves ? "c" : "s"); };
  arm(cx - w - 2, cx - w - 1); arm(cx + w + 1, cx + w);
  chRect(g, cx - w - 2, b.arm[0], cx - w - 1, b.arm[0], "c"); chRect(g, cx + w, b.arm[0], cx + w + 1, b.arm[0], "c");
  if (o.collar !== false && !back) chRect(g, cx - 3, t0, cx + 2, t0, "a");
  if (o.belt) chRect(g, cx - w, t1 - 2, cx + w - 1, t1 - 2, "b");
  const legs = [[cx - 6, pose > 0 ? -1 : 0], [cx + 3, pose < 0 ? -1 : 0]];
  if (o.bottom === "skirt") {
    const sk0 = b.H === 27 ? t1 - 1 : t1 - 4, sk1 = b.legs[1] + (b.H === 27 ? 0 : 1);
    for (let y = sk0; y <= sk1; y++) { const ex = Math.floor((y - sk0) / 3); chRect(g, cx - w - ex, y, cx + w - 1 + ex, y, "p"); }
    legs.forEach(([lx, lift]) => { chRect(g, lx, sk1 + 1 + lift, lx + 2, b.shoe[1] + lift, "B"); });
  } else legs.forEach(([lx, lift]) => { chRect(g, lx, b.legs[0], lx + 2, b.legs[1] + lift, o.bottom === "shorts" ? "s" : "p");
    if (o.bottom === "shorts") chRect(g, lx, b.legs[0], lx + 2, b.legs[0], "p");
    chRect(g, lx, b.shoe[0] + lift, lx + 2, b.shoe[1] + lift, "B"); chRect(g, lx + (lx < cx ? -1 : 3), b.shoe[1] - 1 + lift, lx + (lx < cx ? -1 : 3), b.shoe[1] + lift, "B"); });
  if (o.apron && !back) chRect(g, cx - w + 2, t0 + 2, cx + w - 3, b.H === 27 ? b.legs[1] : b.legs[1] - 1, "q");
  if (o.shawl) { chRect(g, cx - w - 2, t0, cx + w + 1, t0 + 2, "q"); chRect(g, cx - w + 1, t0 + 3, cx + w - 2, t0 + 3, "q"); chRect(g, cx - 2, t0 + 4, cx + 1, t0 + 4, "q"); }
}
// profil (E) : torse étroit, bras avant qui balance, jambes qui se croisent ; sw = -1, 0, 1
function chBodySide(g, b, o, sw) {
  const [t0, t1] = b.torso;
  chRect(g, 10, 14, 13, 15, "s");
  chRect(g, 8, t0, 15, t1, "c");
  if (o.collar !== false) chRect(g, 10, t0, 15, t0, "a");
  if (o.belt) chRect(g, 8, t1 - 2, 15, t1 - 2, "b");
  if (o.bottom === "skirt") {
    const sk0 = b.H === 27 ? t1 - 1 : t1 - 4, sk1 = b.legs[1] + (b.H === 27 ? 0 : 1);
    for (let y = sk0; y <= sk1; y++) { const ex = Math.floor((y - sk0) / 3); chRect(g, 8 - ex, y, 15 + ex, y, "p"); }
    [[10 - sw, "K"], [12 + sw, "B"]].forEach(([lx, k]) => chRect(g, lx, sk1 + 1, lx + 2, b.shoe[1], k));
  } else [[10 - sw * 2, "P", "K"], [11 + sw * 2, "p", "B"]].forEach(([lx, kp, kb]) => { chRect(g, lx, b.legs[0], lx + 2, b.legs[1], o.bottom === "shorts" ? "s" : kp);
    if (o.bottom === "shorts") chRect(g, lx, b.legs[0], lx + 2, b.legs[0], kp);
    chRect(g, lx, b.shoe[0], lx + 3, b.shoe[1], kb); });
  if (o.apron) chRect(g, 15, t0 + 2, 16, b.legs[1] - 1, "q");
  if (o.shawl) chRect(g, 7, t0, 16, t0 + 2, "q");
  const ax = 11 - sw, a0 = b.arm[0] - 1;                                                // bras avant
  chRect(g, ax - 1, a0, ax + 3, a0, "o"); chRect(g, ax - 1, a0 + 1, ax - 1, b.hand, "o"); chRect(g, ax + 3, a0 + 1, ax + 3, b.hand, "o");
  chRect(g, ax, a0 + 1, ax + 2, b.hand - 1, "c"); chRect(g, ax, b.hand, ax + 2, b.hand, o.gloves ? "c" : "s"); chRect(g, ax - 1, b.hand + 1, ax + 3, b.hand + 1, "o");
}

// ---- têtes : le visage, puis la coiffure par-dessus ----
function chFace(g, view, f) {
  if (view === "S") {
    chEll(g, 11.5, 9, 7.6, 6.4, "s"); chDot(g, [[3, 10], [3, 11], [20, 10], [20, 11]], "s");
    chDot(g, [[6, 10], [7, 10], [16, 10], [17, 10]], "o"); chDot(g, [[6, 11], [17, 11]], "E"); chDot(g, [[7, 11], [16, 11], [6, 12], [7, 12], [16, 12], [17, 12]], "e");
    chDot(g, [[5, 13], [18, 13]], "R"); chDot(g, [[11, 13], [12, 13]], "M");
    if (f.wrinkles) chDot(g, [[5, 11], [18, 11], [9, 14], [14, 14]], "S");
    if (f.stubble || f.beard) chEll(g, 11.5, 13.5, 6, 2.2, "z", (x, y) => y >= 13 && !(y === 13 && x >= 10 && x <= 13));
    if (f.beard) chEll(g, 11.5, 14, 5, 2, "z");
    if (f.mustache) chDot(g, [[9, 12], [10, 12], [11, 12], [12, 12], [13, 12], [14, 12], [9, 13], [14, 13]], "h");
    if (f.goatee) chDot(g, [[11, 14], [12, 14], [11, 15], [12, 15]], "h");
    if (f.earring) chDot(g, [[3, 12]], "Y");                                               // un anneau à l'oreille droite
    if (f.bruise) chDot(g, [[f.bruise === "L" ? 5 : 17, 12], [f.bruise === "L" ? 6 : 18, 13]], "X");
  } else if (view === "E") {
    chEll(g, 13, 9, 6.6, 6.4, "s"); chDot(g, [[20, 11], [20, 12], [19, 13]], "s");          // nez
    chDot(g, [[16, 10], [17, 10]], "o"); chDot(g, [[17, 11], [17, 12]], "e"); chDot(g, [[16, 11]], "E"); chDot(g, [[18, 14]], "M"); chDot(g, [[15, 13]], "R");
    chDot(g, [[11, 11], [11, 12]], "S");                                                   // oreille
    if (f.stubble || f.beard) chEll(g, 15, 14, 5, 2, "z", (x, y) => y >= 13 && x >= 12 && !(x === 18 && y === 14));
    if (f.beard) chEll(g, 16, 14.5, 4, 1.8, "z");
    if (f.mustache) chDot(g, [[18, 13], [19, 13], [17, 13]], "h");
    if (f.goatee) chDot(g, [[18, 15], [17, 15]], "h");
  } else if (view === "N" || view === "NE") {
    chEll(g, 11.5, 9, 7.6, 6.4, "s");
    if (view === "NE") chDot(g, [[18, 10], [19, 10], [18, 11], [19, 11], [19, 12]], "s");
  }
}
// coiffure générique : calotte jusqu'à la frange, côtés jusqu'à « sides », longueur derrière jusqu'à « back »
const CH_HAIR = {
  hero: { fringe: 9, sides: 13, back: 14, spikes: true },
  messy: { fringe: 8, sides: 12, back: 14, spikes: true },
  braids: { fringe: 8, sides: 13, back: 14, parted: true, braids: 22 },
  bob: { fringe: 7, sides: 14, back: 15 },
  bowl: { fringe: 9, sides: 11, back: 13 },
  bun: { fringe: 6, sides: 11, back: 13, parted: true, bun: true },
  short: { fringe: 6, sides: 10, back: 12 },
  balding: { fringe: 0, sides: 11, back: 12, bald: true },
  golfes: { fringe: 4, sides: 11, back: 12, golfes: true },          // cheveux ras, golfes très dégarnis (Giorgio)
  shaved: { fringe: 0, sides: 0, back: 0, shaved: true },
  hood: { fringe: 8, sides: 15, back: 16, hood: true },
  long: { fringe: 7, sides: 18, back: 20 },
};
function chHairStyle(hair) { return { ...CH_HAIR[hair.style], ...hair }; }
function chHairBack(g, view, H, b) {                                                     // ce qui passe derrière le corps
  if (H.hood || H.shaved || H.bald) return;
  if ((view === "S") && H.back > 15) { chRect(g, 3, 12, 5, H.back, "H"); chRect(g, 18, 12, 20, H.back, "H"); }
  if (view === "E" && H.back > 14) chRect(g, 6, 10, 10, H.back, "h");
}
function chHairCap(g, view, H) {
  const k = H.hood ? "u" : "h";
  if (H.shaved) { const top = (x, y) => y <= (view === "E" ? 8 : 7) || view === "N" || view === "NE" ? true : (view === "E" && x < 12 && y < 12);
    chEll(g, view === "E" ? 12.5 : 11.5, 8, 7.8, 7.2, "z", (x, y) => y <= 15 && g[y][x] !== "." && top(x, y) && (view !== "E" || x < 15 || y < 7)); return; }
  if (view === "S") {
    if (!H.bald) chEll(g, 11.5, 7.2, 9.4, 7.3, k, (x, y) => y <= H.fringe && !(H.parted && y >= H.fringe - 2 && x >= 11 && x <= 12));
    chRect(g, 2, 7, 4, H.sides, k); chRect(g, 19, 7, 21, H.sides, k);
    if (H.bald) { chRect(g, 2, 6, 3, H.sides, k); chRect(g, 20, 6, 21, H.sides, k); }
    if (H.spikes) chDot(g, [[8, 0], [9, 0], [11, 0], [14, 0], [6, 1]], k);
    if (H.hood) { chRect(g, 2, 9, 3, 15, "u"); chRect(g, 20, 9, 21, 15, "u"); chRect(g, 4, 15, 19, 15, "u"); chRect(g, 6, H.fringe, 17, H.fringe, "U"); }
    if (H.bun) chEll(g, 11.5, 1.3, 3.4, 1.8, "h");
    if (H.golfes) { chEll(g, 11.5, 9, 7.6, 6.4, "s", (x, y) => y >= 2 && y <= H.fringe && Math.abs(x - 11.5) >= 2.5 && Math.abs(x - 11.5) <= 6.5);
      chRect(g, 2, 6, 2, H.sides, "."); chRect(g, 21, 6, 21, H.sides, "."); }                       // ras sur les côtés : pas de volume
  } else if (view === "E") {
    if (!H.bald) chEll(g, 11.8, 7.2, 8.6, 7.3, k, (x, y) => y <= H.fringe || (x < 13 && y <= H.sides));
    else chEll(g, 11.8, 9, 6, 4, k, (x, y) => x < 11 && y >= 6 && y <= H.sides);
    if (H.spikes) chDot(g, [[9, 0], [12, 0], [5, 2]], k);
    if (H.hood) { chRect(g, 3, 6, 6, 16, "u"); chRect(g, 13, 2, 15, 15, "u"); chRect(g, 15, H.fringe, 18, H.fringe, "U"); }
    if (H.bun) chEll(g, 5, 4, 2.4, 2.4, "h");
    if (H.golfes) chEll(g, 13, 9, 6.6, 6.4, "s", (x, y) => y >= 2 && y <= H.fringe + 1 && x >= 14 && x <= 18);
  } else {                                                                                // dos, trois quarts dos
    if (!H.bald) chEll(g, 11.5, 7.6, 9.4, 7.4, k, (x, y) => y <= Math.max(H.back, H.hood ? 16 : 0) || y <= 13);
    else chEll(g, 11.5, 9, 9.4, 4, k, (x, y) => y >= 7 && y <= 12);
    if (H.spikes) chDot(g, [[8, 0], [10, 0], [13, 0], [15, 1]], k);
    if (H.back > 15) chRect(g, 4, 13, 19, H.back, k);
    if (H.hood) chRect(g, 6, 15, 17, 18, "u");
    if (H.bun) chEll(g, 11.5, 3, 3.4, 2.6, "H");
    if (view === "NE" && !H.hood) chDot(g, [[19, 10], [19, 11], [18, 11]], "s");
  }
}
function chHairFront(g, view, H, b) {                                                   // ce qui passe devant (tresses, mèches)
  const strand = (x, y0, y1, w) => { const cells = []; for (let y = y0; y <= y1; y++) for (let i = 0; i < w; i++) cells.push([x + i, y]);
    chInk(g, cells); cells.forEach(([x, y]) => { g[y][x] = (y + x) % 3 === 0 ? "H" : "h"; });
    if (H.ribbon !== false) { chRect(g, x - 1, y1 + 1, x + w, y1 + 1, "X"); chInk(g, [[x - 1, y1 + 1], [x + w, y1 + 1]]); } };
  if (H.braids) {
    const end = b.H === 27 ? H.braids : H.braids + 6;
    if (view === "S") { strand(3, 13, end, 2); strand(19, 13, end, 2); }
    if (view === "N") { strand(7, 14, end, 2); strand(15, 14, end, 2); }
    if (view === "NE") { strand(9, 14, end, 2); strand(16, 14, end - 1, 2); }
    if (view === "E") strand(7, 13, end, 2);
  }
  if (H.locks && view === "S") { [[3, 13], [19, 13]].forEach(([x, y]) => chRect(g, x, y, x + 1, y + H.locks, "h")); }
}
function chHead(g, view, spec, b) {
  const H = chHairStyle(spec.hair), f = spec.face || {};
  if (H.style === "hero") { chHeroHead(g, view, H); return H; }
  chFace(g, view, f);
  chHairCap(g, view, H);
  if (f.cuts && H.shaved) chDot(g, view === "E" ? [[9, 4], [10, 5], [7, 8]] : [[8, 3], [9, 4], [15, 6], [14, 2]], "X");
  return H;
}
// le héros garde sa tête dessinée à la main (dirs.js) ; seule la longueur change : long, pointes, court
function chHeroHead(g, view, H) {
  const src = { S: ADULT().slice(0, 16), SE: ADULT().slice(0, 16), E: HEAD_E, NE: HEAD_NE, N: HEAD_N }[view];
  const tmp = chGrid(16); src.forEach((r, y) => [...r].forEach((k, x) => { tmp[y][x] = k; }));
  const hairK = k => "hHj".includes(k);
  if (H.cut === "court") {                                                               // coupe de soldat : plus d'épis, plus de volume
    for (let y = 0; y < 16; y++) for (let x = 0; x < CH_W; x++) {
      const k = tmp[y][x], cx = view === "E" ? 11.8 : 11.5, out = ((x - cx) / 8.2) ** 2 + ((y - 8.6) / 7.4) ** 2 > 1;
      if ((hairK(k) || k === "o") && out) tmp[y][x] = ".";
      if (view !== "N" && view !== "NE" && hairK(k) && y >= 8 && (view === "E" ? x >= 13 : x >= 5 && x <= 18)) tmp[y][x] = "s";
      if (hairK(k) && y >= 11 && (view === "S" || view === "SE") && (x <= 4 || x >= 19)) tmp[y][x] = "s";
    }
    for (let y = 0; y < 16; y++) for (let x = 0; x < CH_W; x++) if (tmp[y][x] === "o") tmp[y][x] = ".";
  }
  for (let y = 0; y < 16; y++) for (let x = 0; x < CH_W; x++) if (tmp[y][x] !== "." && tmp[y][x] !== "o") g[y][x] = tmp[y][x];
}
function chHeroLocks(g, view, H, b) {                                                   // cheveux longs : mèches sur les épaules
  if (H.cut === "court") return;
  const n = H.cut === "pointes" ? 2 : 4;
  if (view === "S" || view === "SE") { const c1 = [], c2 = []; for (let y = 12; y < 12 + n + 2; y++) { c1.push([3, y], [4, y]); c2.push([19, y], [20, y]); }
    [c1, c2].forEach(c => { chInk(g, c); c.forEach(([x, y]) => g[y][x] = y % 2 ? "h" : "H"); }); }
  if (view === "N" || view === "NE") chRect(g, 5, 14, 18, 14 + n, "h");
  if (view === "E") chRect(g, 6, 12, 10, 13 + n, "h");
}

// ---- assemblage d'une image ----
const CH_VIEW = { S: ["S", false], SE: ["S", false], E: ["E", false], NE: ["NE", false], N: ["N", false], NW: ["NE", true], W: ["E", true], SW: ["S", true] };
function chBuild(spec, view, pose) {
  const b = CH_BODY[spec.age || "child"], o = spec.outfit || {}, g = chGrid(b.H), H = chHairStyle(spec.hair);
  chHairBack(g, view, H, b);
  if (view === "E") chBodySide(g, b, o, pose); else chBodyFront(g, b, o, pose, view === "N" || view === "NE");
  if (spec.age === "elder") { for (let y = 15; y >= 0; y--) g[y + 1] = g[y].slice(); g[0] = Array(CH_W).fill("."); }   // dos voûté : la tête descend
  const head = chGrid(16); chHead(head, view, spec, b);
  for (let y = 0; y < 16; y++) for (let x = 0; x < CH_W; x++) if (head[y][x] !== ".") g[y + (spec.age === "elder" ? 1 : 0)][x] = head[y][x];
  if (H.style === "hero") chHeroLocks(g, view, H, b); else chHairFront(g, view, H, b);
  if (o.extra) o.extra(g, view, b);
  return chRows(g);
}
const CH_POSES = {
  idle: { frames: [0, "bob"], ms: 500 },
  walk: { frames: [1, "bob", -1, "bob"], ms: 130 },
  run: { frames: [1, "bob", -1, "bob"], ms: 90, stride: 2 },
};
function makeChar(spec) { return { spec, cache: {}, H: CH_BODY[spec.age || "child"].H }; }
function charSize(ch) { return [CH_W, ch.H]; }
function charFrame(ch, dir, pose = "idle", t = 0) {
  const P = CH_POSES[pose] || CH_POSES.idle, i = Math.floor(t / P.ms) % P.frames.length, key = dir + pose + i;
  if (ch.cache[key]) return ch.cache[key];
  const [view, flip] = CH_VIEW[dir] || CH_VIEW.S, b = CH_BODY[ch.spec.age || "child"], f = P.frames[i];
  let rows;
  if (f === "bob") { const base = chBuild(ch.spec, view, 0), cut = b.legs[0] - 1;
    rows = [".".repeat(CH_W), ...base.slice(0, cut), ...base.slice(cut + 1)]; }
  else rows = chBuild(ch.spec, view, f);
  if (flip) rows = chFlip(rows);
  return (ch.cache[key] = rows);
}
const CH_PAL = { q:"#f4f0e6", Q:"#c9c0aa", w:"#ffffff", u:"#7a6a58", U:"#54483c", v:"#9a8a74", z:"#7a5a48", Z:"#5a4034", X:"#b23a36" };
function drawChar(ctx, ch, x, y, o = {}) {
  const pal = { ...PAL, ...CH_PAL, ...(ch.spec.pal || {}), ...(o.pal || {}) };
  if (o.shadow !== false) { ctx.globalAlpha = .22; ctx.fillStyle = "#1a3a2a"; ctx.fillRect(Math.round(x) + 4, Math.round(y) + ch.H - 2, 16, 3); ctx.globalAlpha = 1; }
  drawSprite(ctx, charFrame(ch, o.dir || "S", o.pose || "idle", o.t || 0), pal, Math.round(x), Math.round(y));
}

// ---------- Les habitants du chapitre 1 ----------
const SKIN = { clair: { s:"#f6cfae", S:"#d9967e" }, rose: { s:"#f4c8b0", S:"#d4927e" }, hale: { s:"#e0aa82", S:"#b87a5a" }, vieux: { s:"#eac4a8", S:"#c0907a" } };
const HAIR = { brun: { h:"#6a4632", H:"#4a2e22", j:"#9a6a48" }, blond: { h:"#d8b060", H:"#a8803e", j:"#f4d890" }, roux: { h:"#c8562c", H:"#8e3a1e", j:"#ec8a50" },
  noir: { h:"#2e2a36", H:"#1c1822", j:"#4a4458" }, gris: { h:"#a8a4b0", H:"#78748a", j:"#d4d0dc" }, blanc: { h:"#e4e0e8", H:"#b4b0c0", j:"#ffffff" }, chatain: { h:"#7a4a2a", H:"#5a3420", j:"#a06a40" } };
const CHAR_SPECS = {
  heros_long: { id: "heros_long", age: "child", hair: { style: "hero", cut: "long" }, outfit: { collar: false }, pal: { ...HAIR.brun, c:"#e0a03a", C:"#b0702a", l:"#f6c868" } },
  heros_pointes: { id: "heros_pointes", age: "child", hair: { style: "hero", cut: "pointes" }, outfit: { collar: false }, pal: { ...HAIR.brun, c:"#e0a03a", C:"#b0702a", l:"#f6c868" } },
  heros_court: { id: "heros_court", age: "child", hair: { style: "hero", cut: "court" }, outfit: { collar: false }, pal: { ...HAIR.brun, c:"#e0a03a", C:"#b0702a", l:"#f6c868" } },
  elio: { id: "elio", age: "child", hair: { style: "braids" }, outfit: { collar: false }, pal: { ...HAIR.blond, c:"#5a8a4a", C:"#3e6634", l:"#86b46a", p:"#6a5a4a", P:"#4a3e34", X:"#3a7cb6" } },
  elio_rase: { id: "elio_rase", age: "child", hair: { style: "shaved" }, face: { cuts: true }, outfit: { collar: false }, pal: { c:"#5a8a4a", C:"#3e6634", l:"#86b46a", p:"#6a5a4a", P:"#4a3e34", z:"#e8c8a0", Z:"#c8a078", X:"#b23a36" } },
  elio_capuche: { id: "elio_capuche", age: "child", hair: { style: "hood" }, outfit: { collar: false }, pal: { c:"#5a8a4a", C:"#3e6634", l:"#86b46a", p:"#6a5a4a", P:"#4a3e34", u:"#7a6a58", U:"#54483c", v:"#9a8a74" } },
  margot: { id: "margot", age: "child", hair: { style: "bob", spikes: true }, outfit: { collar: false, bottom: "shorts" }, pal: { ...HAIR.roux, c:"#c44a6a", C:"#8e2e4a", l:"#ea7a92", p:"#6a4a3a", P:"#4a3428" } },
  basile: { id: "basile", age: "child", hair: { style: "bowl" }, outfit: { collar: false }, pal: { ...HAIR.noir, c:"#5a7ab0", C:"#3c5a88", l:"#86a6d4", p:"#7a6a50", P:"#5a4c38" } },
  mere: { id: "mere", age: "adult", hair: { style: "bun" }, outfit: { bottom: "skirt", apron: true, collar: false }, pal: { ...HAIR.chatain, c:"#8a5aa0", C:"#5e3a74", l:"#b48ad0", p:"#6a3e74", P:"#4a2a54", q:"#f4ead2", Q:"#c9c0aa", w:"#ffffff" } },
  ysol: { id: "ysol", age: "elder", hair: { style: "bun" }, face: { wrinkles: true }, outfit: { bottom: "skirt", shawl: true, collar: false }, pal: { ...HAIR.blanc, ...SKIN.vieux, c:"#5a4a6a", C:"#3c3048", l:"#7a6a8a", p:"#3e3448", P:"#2a2232", q:"#b85a4a", Q:"#86403a", w:"#d87a62" } },
  aubin: { id: "aubin", age: "adult", hair: { style: "short" }, face: { stubble: true }, outfit: { belt: true, apron: true, collar: false }, pal: { ...HAIR.noir, ...SKIN.hale, c:"#6a5a4a", C:"#4a3e34", l:"#8a7a66", q:"#e8e0d0", Q:"#bdb2a0", w:"#fffaf0", z:"#4a3a40", Z:"#33282e" } },
  fauvel: { id: "fauvel", age: "adult", hair: { style: "balding" }, face: { mustache: true }, outfit: { belt: false }, pal: { ...HAIR.gris, c:"#f4ead2", C:"#c9c0aa", l:"#ffffff", a:"#2a5e94", A:"#1e4470", r:"#4a86c0", p:"#3a3a48", P:"#26262f" } },
  enfant1: { id: "enfant1", age: "child", hair: { style: "messy" }, outfit: { collar: false }, pal: { ...HAIR.chatain, c:"#c8a040", C:"#987428", l:"#e8c868" } },
  enfant2: { id: "enfant2", age: "child", hair: { style: "braids", ribbon: false, braids: 19 }, outfit: { collar: false, bottom: "skirt" }, pal: { ...HAIR.noir, c:"#4a9a9a", C:"#2e7070", l:"#7ac4c4", p:"#2e6a6a", P:"#1e4a4a" } },
  enfant3: { id: "enfant3", age: "child", hair: { style: "bowl" }, outfit: { collar: false, bottom: "shorts" }, pal: { ...HAIR.roux, ...SKIN.rose, c:"#a86a4a", C:"#7a4a32", l:"#c88a6a" } },
  villageois1: { id: "villageois1", age: "adult", hair: { style: "short" }, face: { beard: true }, outfit: { belt: true }, pal: { ...HAIR.chatain, z:"#7a4a2a", Z:"#5a3420", c:"#5a7a4a", C:"#3e5a32", l:"#7a9a6a" } },
  villageois2: { id: "villageois2", age: "adult", hair: { style: "messy" }, outfit: { belt: true }, pal: { ...HAIR.blond, c:"#8a6a9a", C:"#5e4670", l:"#aa8aba" } },
  // section adolescent, easter egg : le gardien du pied de l’arc-en-ciel (bestiaire)
  giorgio: { id: "giorgio", chapter: "adolescence", age: "adult", hair: { style: "golfes" }, face: { mustache: true, goatee: true, stubble: true, earring: true }, outfit: { collar: false },
    pal: { h:"#2e2420", H:"#1c1512", j:"#4c3c34", s:"#e0ad88", S:"#b98060", z:"#6a5040", Z:"#4e3a2e", c:"#d4ba90", C:"#ad926c", l:"#ecd6b0", p:"#3e6a4a", P:"#2a4a34", Y:"#c8ccd4" } },
  mere_basile: { id: "mere_basile", age: "adult", hair: { style: "bun" }, outfit: { bottom: "skirt", collar: false }, pal: { ...HAIR.noir, c:"#6a8a5a", C:"#4a6a3e", l:"#8aaa7a", p:"#4a5a3a", P:"#33402a" } },
};
const CHARS = {}; for (const k in CHAR_SPECS) CHARS[k] = makeChar(CHAR_SPECS[k]);
