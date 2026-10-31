// ---------- Plans spéciaux : gros plans et cinématiques, plus détaillés que le jeu ----------
// Chaque plan est une fonction drawXxx(ctx, t, opts) qui dessine tout l'écran du jeu : 384 × 216 pixels.
// t est le temps en millisecondes depuis le début du plan ; opts choisit la variante (suite d'un choix, gore atténué…).
// Les petites fonctions cu* servent à tous les plans (et aux plans des chapitres suivants).
const CU_W = 384, CU_H = 216;
const CU_BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
function cuP(g, x, y, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), 1, 1); }
function cuR(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function cuH(n) { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); }
const cuClamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const cuEase = p => p < .5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
// ellipse remplie, avec un dégradé tramé : col(nx, ny) reçoit la position (-1..1) et rend une couleur ou null
function cuEll(g, cx, cy, rx, ry, col) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const nx = (x + .5 - cx) / rx, ny = (y + .5 - cy) / ry; if (nx * nx + ny * ny > 1) continue;
    const c = typeof col === "function" ? col(nx, ny, x, y) : col; if (c) cuP(g, x, y, c); } }
// trois tons tramés selon une valeur 0..1 (lumière)
function cuTone(v, x, y, tones) { const n = tones.length - 1, f = cuClamp(v) * n, i = Math.floor(f), r = f - i;
  return tones[Math.min(n, i + (CU_BAYER[y & 3][x & 3] / 16 < r ? 1 : 0))]; }
// trait épais d'un point à un autre
function cuLine(g, x0, y0, x1, y1, w, c) { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0)); for (let i = 0; i <= n; i++) { const u = i / (n || 1); cuR(g, x0 + (x1 - x0) * u - w / 2, y0 + (y1 - y0) * u - w / 2, w, w, c); } }
// assombrit les bords de l'écran (plans serrés, rêves)
const cuVigCache = {};
function cuVignette(g, strength = .6, col = "#000", inner = .55) { const key = strength + col + inner;
  if (!cuVigCache[key]) { const [c, v] = cuLayer(); v.fillStyle = col;
    for (let y = 0; y < CU_H; y++) for (let x = 0; x < CU_W; x++) { const nx = (x - CU_W / 2) / (CU_W / 2), ny = (y - CU_H / 2) / (CU_H / 2), d = Math.max(0, Math.hypot(nx * .8, ny) - inner) / .6 * strength;
      if (CU_BAYER[y & 3][x & 3] / 16 < d) v.fillRect(x, y, 1, 1); }
    cuVigCache[key] = c; }
  g.drawImage(cuVigCache[key], 0, 0); }
function cuLayer(w = CU_W, h = CU_H) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
// fondu au noir tramé (0 = rien, 1 = noir)
function cuFade(g, k, col = "#000") { if (k <= 0) return; g.fillStyle = col; if (k >= 1) { g.fillRect(0, 0, CU_W, CU_H); return; }
  for (let y = 0; y < CU_H; y++) for (let x = 0; x < CU_W; x++) if (CU_BAYER[y & 3][x & 3] / 16 < k) g.fillRect(x, y, 1, 1); }

// ---- matières communes ----
const CUC = { o:"#1e1620", straw:["#8a6a2c", "#b08a3a", "#d8b45a", "#f0d888"], wick:["#4e3020", "#7a4e30", "#a8784c", "#c8945e"], egg:["#b8a88a", "#dccfb4", "#f4ead2", "#fffaf0"],
  skin:["#a8624e", "#d9967e", "#f6cfae", "#ffe4cc"], sleeve:["#8a5420", "#b0702a", "#e0a03a", "#f6c868"], spider:["#140e10", "#2a1e1c", "#4a3428", "#7a5a40"], wood:["#3a2418", "#5a3a26", "#7a5038", "#9a6a48"] };

// paille en vrac sur un fond : des brins courts tramés
function cuStrawBed(g, x0, y0, w, h, seed, dark = 0, dens = 14) {
  for (let i = 0; i < w * h / dens; i++) { const x = x0 + cuH(i * 3 + seed) * w, y = y0 + cuH(i * 7 + seed + 1) * h, a = cuH(i + seed * 2) * Math.PI, l = 3 + cuH(i * 5 + seed) * 7;
    const col = CUC.straw[Math.min(3, Math.floor(cuH(i * 11 + seed) * 4 - dark))] || CUC.straw[0];
    for (let s = 0; s < l; s++) cuP(g, x + Math.cos(a) * s, y + Math.sin(a) * s * .5, col); } }

// capsule (un doigt, un bras) : segment épais aux bouts ronds ; col(nx, ny, x, y) comme cuEll, nx/ny relatifs à la largeur
function cuCaps(g, x0, y0, x1, y1, r, col) {
  const dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1, L = Math.sqrt(L2), px = -dy / L, py = dx / L;
  for (let y = Math.floor(Math.min(y0, y1) - r); y <= Math.ceil(Math.max(y0, y1) + r); y++) for (let x = Math.floor(Math.min(x0, x1) - r); x <= Math.ceil(Math.max(x0, x1) + r); x++) {
    const u = cuClamp(((x + .5 - x0) * dx + (y + .5 - y0) * dy) / L2), qx = x0 + dx * u, qy = y0 + dy * u, d = Math.hypot(x + .5 - qx, y + .5 - qy); if (d > r) continue;
    const side = ((x + .5 - qx) * px + (y + .5 - qy) * py) / r; const c = typeof col === "function" ? col(side, u, x, y) : col; if (c) cuP(g, x, y, c); } }
// une forme contourée : on dessine d'abord chaque morceau grossi d'un pixel en noir, puis les couleurs
function cuInked(g, parts, ink = CUC.o) { parts.forEach(p => p(ink, 1)); parts.forEach(p => p(null, 0)); }

// ---------- PLAN-01 : le gros plan du panier ----------
// Le héros tient l'anse ; cinq œufs dans la paille. L'araignée sort de sous un œuf, monte sur le bord, puis sur la main.
// opts.suite : absent pendant que le joueur choisit, puis "ecraser", "secouer" ou "reposer" ; opts.suite_t : temps depuis le choix.
// Pendant le choix, l'araignée met 8 s à atteindre la main (cuBasketSpider), puis elle attend sur les doigts.
const BASKET = { cx: 176, cy: 158, rx: 150, ry: 50, top: 40, grip: .68 };
let basketLayer = null;
function cuBasketStatic() {
  if (basketLayer) return basketLayer;
  const [c, g] = cuLayer(), B = BASKET;
  // sol de la grange : terre battue et paille, plus sombre sur les bords
  for (let y = 0; y < CU_H; y++) for (let x = 0; x < CU_W; x++) { const n = cuH(Math.floor(x / 9) * 7 + Math.floor(y / 6) * 131) * .12, d = Math.hypot((x - 200) / 300, (y - 110) / 170);
    cuP(g, x, y, cuTone(.55 - d * .5 + n, x, y, ["#3e2a16", "#5e4220", "#7e5c2c", "#9a7838"])); }
  cuStrawBed(g, 0, 0, CU_W, CU_H, 7, 1.8, 46);
  // ombre portée du panier
  cuEll(g, B.cx + 18, B.cy + 64, B.rx + 4, 30, (nx, ny, x, y) => CU_BAYER[y & 3][x & 3] / 16 < .7 ? "#2a1a0c" : null);
  // corps du panier : osier tressé en bandes, qui descend sous le bord de l'écran
  const ink = (x, y) => cuP(g, x, y, CUC.o);
  for (let x = B.cx - B.rx - 2; x <= B.cx + B.rx + 2; x++) { const u = (x - B.cx) / (B.rx + 2); if (Math.abs(u) > 1) continue; const y0 = B.cy + Math.sqrt(1 - u * u) * (B.ry + 2);
    for (let y = Math.round(y0); y < CU_H; y++) { const hw = (B.rx + 2) * (1 - (y - y0) / 600), uu = (x - B.cx) / hw; if (Math.abs(uu) > 1) continue; if (Math.abs(uu) > .985) { ink(x, y); continue; }
      const yy = y - y0, band = Math.floor(yy / 9), weave = Math.floor((x - B.cx + 600 + (band % 2) * 7) / 14) % 2, seam = yy % 9 === 0;
      const light = .7 - Math.abs(uu) * .4 - yy / 140 + (uu < -.3 ? .1 : 0) - (weave ? .16 : 0) + (yy % 9 > 6 ? -.1 : 0);
      cuP(g, x, y, seam ? CUC.wick[0] : cuTone(light, x, y, CUC.wick)); } }
  // le boudin du bord et le creux du panier
  cuEll(g, B.cx, B.cy, B.rx + 3, B.ry + 3, CUC.o);
  cuEll(g, B.cx, B.cy, B.rx + 2, B.ry + 2, (nx, ny, x, y) => { const a = Math.atan2(ny * 3, nx), tw = Math.floor((a + 3.2) * 22) % 2; return cuTone(.6 - ny * .3 + (tw ? .14 : -.1), x, y, CUC.wick); });
  cuEll(g, B.cx, B.cy + 2, B.rx - 8, B.ry - 9, CUC.o);
  cuEll(g, B.cx, B.cy + 2, B.rx - 9, B.ry - 10, (nx, ny, x, y) => cuTone(.15 + ny * .45 + (nx > .3 ? -.08 : 0), x, y, CUC.straw));
  const [pc, pg] = cuLayer(); cuStrawBed(pg, B.cx - B.rx, B.cy - B.ry, B.rx * 2, B.ry * 2, 3, .4, 24);
  g.save(); g.beginPath(); g.ellipse(B.cx, B.cy + 2, B.rx - 11, B.ry - 12, 0, 0, Math.PI * 2); g.clip(); g.drawImage(pc, 0, 0); g.restore();
  return (basketLayer = c);
}
// l'anse : un arc d'osier torsadé d'un bord à l'autre ; u = 0 à gauche, 1 à droite
function cuHandlePt(u) { const B = BASKET, a = Math.PI * (1 - u); return [B.cx + Math.cos(a) * (B.rx - 16), B.cy - 6 - Math.sin(a) * (B.cy - 6 - B.top)]; }
function cuHandle(g, from = 0, to = 1) {
  const pts = []; for (let i = 0; i <= 300; i++) { const u = from + (to - from) * i / 300; pts.push([...cuHandlePt(u), u]); }
  pts.forEach(([x, y]) => cuEll(g, x, y, 7, 7, CUC.o));
  pts.forEach(([x, y, u], i) => { const [x2, y2] = cuHandlePt(Math.min(1, u + .01)), a = Math.atan2(y2 - y, x2 - x), nx = -Math.sin(a), ny = Math.cos(a);
    for (let k = -5.5; k <= 5.5; k += .5) { const tw = (Math.floor(i / 3) + Math.floor((k + 6) / 4)) % 3, X = x + nx * k, Y = y + ny * k;
      cuP(g, X, Y, cuTone(.62 - k / 12 + (tw === 0 ? -.2 : tw === 1 ? .1 : 0), Math.round(X), Math.round(Y), CUC.wick)); } });
}
const EGGS = [[112, 152, -.3], [158, 140, .1], [212, 148, .4], [140, 178, .2], [196, 182, -.2]];
function cuEgg(g, x, y, rot, broken) {
  cuEll(g, x + 5, y + 8, 22, 12, (nx, ny, X, Y) => CU_BAYER[Y & 3][X & 3] / 16 < .55 ? "#6a4a1c" : null);
  if (broken) { cuEll(g, x, y + 3, 24, 10, CUC.o); cuEll(g, x, y + 3, 23, 9, (nx, ny, X, Y) => cuTone(.9 - ny * .2, X, Y, CUC.egg)); cuEll(g, x + 3, y + 2, 9, 6, "#c87a18"); cuEll(g, x + 2, y + 1, 8, 5, "#f2b030"); cuEll(g, x, y, 3, 2, "#ffe08a");
    [[-16, -6, .4], [12, -5, -.6]].forEach(([a, b, r]) => { cuEll(g, x + a, y + b, 8, 5, CUC.o); cuEll(g, x + a, y + b, 7, 4, (nx, ny, X, Y) => cuTone(.8 - ny * .3 - nx * r * .2, X, Y, CUC.egg)); }); return; }
  cuEll(g, x, y, 21, 16, CUC.o);
  cuEll(g, x, y, 20, 15, (nx, ny, X, Y) => { const r = nx * Math.cos(rot) - ny * Math.sin(rot); return cuTone(.86 - (nx * .45 + ny * .6) * .62 - Math.abs(r) * .08, X, Y, CUC.egg); });
  cuEll(g, x - 8, y - 7, 3, 2, "#ffffff");
}
// la main droite du héros vue d'en haut, qui serre l'anse : le dos de la main, les jointures, le pouce par-dessus
const HAND_AT = () => { const [x, y] = cuHandlePt(BASKET.grip); return [x, y]; };
const cuSkin = (v, x, y) => cuTone(v, x, y, CUC.skin);
function cuHand(g, dx = 0, dy = 0, o = {}) {
  const [hx, hy] = HAND_AT(), X = hx + dx, Y = hy + dy;
  cuInked(g, [
    (ink, e) => cuCaps(g, X + 30, Y - 22, X + 130, Y - 90, 25 + e, ink || ((s, u, x, y) => cuTone(.62 - s * .35 + (Math.floor(u * 9) % 2 ? .05 : -.05), x, y, CUC.sleeve))),   // manche
    (ink, e) => cuEll(g, X + 28, Y - 20, 25 + e, 21 + e, ink || ((nx, ny, x, y) => cuTone(.38 - ny * .2, x, y, CUC.sleeve))),                                      // poignet de la manche
    (ink, e) => cuEll(g, X + 6, Y - 10, 30 + e, 24 + e, ink || ((nx, ny, x, y) => cuSkin(.64 - ny * .3 - nx * .2, x, y))),                                              // dos de la main
  ]);
  // les quatre doigts repliés sur l'anse : des jointures rondes en bas
  cuInked(g, [-20, -6, 8, 21].map((fx, i) => (ink, e) => cuCaps(g, X + fx, Y + 2, X + fx - 2, Y + 14 - Math.abs(i - 1.5) * 1.5, 7 + e, ink || ((s, u, x, y) => cuSkin(.7 - s * .3 - u * .25, x, y)))));
  [-20, -6, 8, 21].forEach((fx, i) => { cuR(g, X + fx - 4, Y + 1, 2, 1, CUC.skin[1]); cuR(g, X + fx + 2, Y + 1, 2, 1, CUC.skin[1]); cuP(g, X + fx - 3, Y + 18 - Math.abs(i - 1.5) * 1.5, "#ffd8c8"); });
  // le pouce, à gauche, qui passe devant l'anse
  cuInked(g, [(ink, e) => cuCaps(g, X - 20, Y - 22, X - 34, Y + 2, 8 + e, ink || ((s, u, x, y) => cuSkin(.72 - s * .3 - u * .2, x, y)))]);
  cuEll(g, X - 34, Y + 3, 4, 3, "#f8e4dc");
  // les tendons et les petites jointures sur le dos de la main
  [[-12, -16], [0, -18], [12, -16]].forEach(([a, b]) => cuR(g, X + a, Y + b, 1, 6, CUC.skin[1]));
  if (o.stain) { cuEll(g, X + 4, Y - 14, 7, 5, "#3a2220"); cuEll(g, X + 4, Y - 14, 4, 3, "#5a3428"); [[-8, 1], [10, -3], [12, 3], [-5, -6], [3, 7]].forEach(([a, b]) => cuP(g, X + 4 + a, Y - 14 + b, "#3a2220")); }
}
// une main ouverte, paume vers le bas, qui arrive pour frapper (bras gauche, depuis le bas de l'écran)
function cuSlapHand(g, X, Y) {
  cuInked(g, [
    (ink, e) => cuCaps(g, X - 34, Y + 34, X - 150, Y + 120, 22 + e, ink || ((s, u, x, y) => cuTone(.42 - s * .3 + (Math.floor(u * 7) % 2 ? .06 : -.06), x, y, CUC.sleeve))),
    (ink, e) => cuEll(g, X - 6, Y + 8, 28 + e, 23 + e, ink || ((nx, ny, x, y) => cuSkin(.66 - ny * .3 - nx * .1, x, y))),
    ...[[-26, -16], [-10, -24], [6, -26], [22, -20]].map(([fx, fy]) => (ink, e) => cuCaps(g, X + fx * .5, Y + fy * .3, X + fx, Y + fy, 6 + e, ink || ((s, u, x, y) => cuSkin(.74 - s * .3 + u * .05, x, y)))),
    (ink, e) => cuCaps(g, X + 18, Y + 12, X + 36, Y + 2, 7 + e, ink || ((s, u, x, y) => cuSkin(.7 - s * .3, x, y))),
  ]);
}
// une araignée vue de dessus, à (x, y), tournée vers a, pattes qui bougent avec t ; s = échelle
function cuSpider(g, x, y, a, t, s = 2) {
  const ca = Math.cos(a), sa = Math.sin(a), at = (u, v) => [x + (u * ca - v * sa) * s, y + (u * sa + v * ca) * s];
  const legs = []; for (let side = -1; side <= 1; side += 2) for (let i = 0; i < 4; i++) {
    const ph = Math.sin(t / 70 + i * 1.7 + (side > 0 ? 3.14 : 0)) * 1.6, base = at(-1.5 + i * 1.3 - 1, side * 2), knee = at(-4 + i * 2.8 + ph, side * 8.5), foot = at(-8 + i * 4.6 + ph * 1.5, side * 12.5);
    legs.push([base, knee, foot]); }
  legs.forEach(([b, k, f]) => { cuLine(g, b[0], b[1], k[0], k[1], 2.4 * s / 2 + 1.4, CUC.o); cuLine(g, k[0], k[1], f[0], f[1], 1.8 * s / 2 + 1.2, CUC.o); });
  legs.forEach(([b, k, f]) => { cuLine(g, b[0], b[1], k[0], k[1], 1.4 * s / 2, CUC.spider[2]); cuLine(g, k[0], k[1], f[0], f[1], 1 * s / 2, CUC.spider[1]); cuP(g, k[0], k[1] - 1, CUC.spider[3]); });
  const [bx, by] = at(-5, 0), [hx, hy] = at(2.5, 0);
  cuEll(g, bx, by, 6.5 * s, 5.2 * s, CUC.o); cuEll(g, bx, by, 6.5 * s - 1, 5.2 * s - 1, (nx, ny, X, Y) => cuTone(.55 - (nx * .3 + ny * .55) * .8, X, Y, CUC.spider));
  [[-7, 0, 1.2], [-4.5, -1.6, .8], [-4.5, 1.6, .8], [-2.6, 0, .7]].forEach(([u, v, r]) => { const [px, py] = at(u, v); cuEll(g, px, py, r * s * .7, r * s * .7, "#c0986a"); });   // la croix sur le dos
  cuEll(g, hx, hy, 3.4 * s, 2.8 * s, CUC.o); cuEll(g, hx, hy, 3.4 * s - 1, 2.8 * s - 1, (nx, ny, X, Y) => cuTone(.45 - ny * .4, X, Y, CUC.spider));
  [[4.6, -1.1], [4.6, 1.1], [5.2, -.4], [5.2, .4]].forEach(([u, v]) => { const [px, py] = at(u, v); cuR(g, px, py, s > 1.5 ? 2 : 1, s > 1.5 ? 2 : 1, "#e8dcc8"); });
}
function cuSquashed(g, x, y, s = 2) { cuEll(g, x, y, 8 * s, 6 * s, "#2a1a18"); cuEll(g, x - 1, y - 1, 5 * s, 3.5 * s, "#4a2a22"); for (let i = 0; i < 8; i++) { const an = i / 8 * 6.28 + .3; cuLine(g, x, y, x + Math.cos(an) * 13 * s, y + Math.sin(an) * 10 * s, 1.5, "#2a1a18"); } }
// trajet de l'araignée pendant le choix : sous l'œuf du milieu, sur le bord, le long de l'anse, jusqu'aux doigts (8 s)
function cuBasketSpider(t) {
  const H = u => cuHandlePt(u), [hx, hy] = HAND_AT(), p = cuClamp(t / 8000);
  const keys = [[0, 160, 144], [.14, 176, 116], [.26, 226, 104], [.36, H(.9)[0] - 4, H(.9)[1] + 2], [.56, H(.8)[0], H(.8)[1]], [.74, H(.74)[0], H(.74)[1] + 2], [.88, hx + 6, hy + 6], [1, hx + 2, hy - 12]];
  let i = 0; while (i < keys.length - 2 && p > keys[i + 1][0]) i++;
  const [p0, x0, y0] = keys[i], [p1, x1, y1] = keys[i + 1], u = cuClamp((p - p0) / (p1 - p0 || 1));
  return { x: x0 + (x1 - x0) * u, y: y0 + (y1 - y0) * u, a: Math.atan2(y1 - y0, x1 - x0), moving: p < 1, under: p < .1 };
}
function drawBasketCloseup(ctx, t, opts = {}) {
  const suite = opts.suite || null, st = opts.suite_t || 0, [hx, hy] = HAND_AT();
  ctx.imageSmoothingEnabled = false; ctx.drawImage(cuBasketStatic(), 0, 0);
  const shake = suite === "secouer" ? Math.sin(st / 40) * 8 * Math.max(0, 1 - st / 1500) : 0, lost = suite === "secouer" && st > 450;
  ctx.save(); ctx.translate(Math.round(shake * .3), Math.round(Math.abs(shake) * .2));
  const sp = cuBasketSpider(suite ? 8000 : t);
  if (!suite && sp.under) cuSpider(ctx, sp.x, sp.y, sp.a, t);
  EGGS.forEach(([x, y, r], i) => { if (lost && i === 2) return; cuEgg(ctx, x, y, r); });
  cuHandle(ctx, 0, 1);
  ctx.restore();
  // l'œuf perdu saute hors du panier et se casse par terre
  if (lost) { const u = cuClamp((st - 450) / 650); if (u < 1) cuEgg(ctx, 212 + u * 130, 140 - Math.sin(u * 3.14) * 50 + u * u * 50, u * 6); else cuEgg(ctx, 346, 196, 0, true); }
  ctx.save(); ctx.translate(Math.round(shake), Math.round(shake * .4));
  cuHand(ctx, 0, 0, { stain: suite === "ecraser" && st > 650 });
  if (!suite && !sp.under) cuSpider(ctx, sp.x, sp.y, sp.a, sp.moving ? t : 0);
  if (!suite && sp.under && t > 300) cuSpider(ctx, sp.x, sp.y, sp.a, t, 2);
  if (suite === "secouer" && st < 250) cuSpider(ctx, sp.x, sp.y, st / 30, t);
  ctx.restore();
  if (suite === "secouer" && st >= 250) { const u = cuClamp((st - 250) / 700); if (u < 1) cuSpider(ctx, sp.x - u * 220, sp.y + u * 60 - Math.sin(u * 3.14) * 50, st / 50, t, 2 - u * .6); }
  if (suite === "ecraser") { if (st < 650) cuSpider(ctx, sp.x, sp.y, sp.a, 0);
    const u = st < 650 ? cuEase(cuClamp(st / 650)) : 1 - cuEase(cuClamp((st - 1000) / 700));
    if (u > .02) cuSlapHand(ctx, hx - 150 + u * 150, hy + 130 - u * 130);
    if (st > 640 && st < 900) [[-50, -24], [50, -30], [-40, 34], [54, 22], [0, -46]].forEach(([a, b]) => cuLine(ctx, hx + a * .7, hy + b * .7 - 10, hx + a, hy + b - 10, 3, "#fff6d8")); }
  if (suite === "reposer") { // elle grimpe sur un fil jusqu'à la poutre, au-dessus de l'écran
    const u = cuEase(cuClamp(st / 3000)), x = sp.x + Math.sin(st / 400) * 3 * (1 - u), y = sp.y - u * (sp.y + 40);
    cuLine(ctx, x, y - 8, x, -2, 1, "#ece8f4"); cuSpider(ctx, x, y, -Math.PI / 2, u < 1 ? t : 0); }
  cuVignette(ctx, .6, "#140c06");
}

// ---------- Nuit et cheveux : matières communes aux plans du puits ----------
const NIGHT = { ground: ["#0a1018", "#121c28", "#1c2a3a", "#2a3e52"], grass: ["#0c1a18", "#16302a", "#22463a", "#3a6a52", "#5a8a6a"], stone: ["#0c0e14", "#1e222c", "#353b48", "#565e70", "#7a8296"],
  hair: ["#050308", "#100c16", "#221c30", "#3e3858"], moon: "#dfe8f4", skin: ["#4a3438", "#7a5e60", "#ae8e88", "#dcc0b4"], cloth: ["#0e1a12", "#1e3424", "#2e4a34", "#46664a"] };
// herbe de nuit vue de très près : des brins verticaux qui ondulent, éclairés par la lune en haut à gauche
function cuNightGrass(g, t, seed = 1, wind = 1, scale = 1, ground = true) {
  if (ground) for (let y = 0; y < CU_H; y++) for (let x = 0; x < CU_W; x++) cuP(g, x, y, cuTone(.45 - y / CU_H * .25 + cuH(Math.floor(x / 6) + seed) * .1 - .05, x, y, NIGHT.ground));
  const n = Math.round(260 / scale);
  for (let i = 0; i < n; i++) { const bx = cuH(i * 3.1 + seed) * (CU_W + 20) - 10, by = CU_H + 10 - cuH(i * 1.7 + seed) * 60 * scale, len = (40 + cuH(i * 5.3 + seed) * 90) * scale, w = Math.max(1, Math.round((2 + cuH(i + seed) * 3) * scale));
    const lean = (cuH(i * 9 + seed) - .5) * .6, sway = Math.sin(t / 700 + i * .7) * .12 * wind, tone = .2 + cuH(i * 13 + seed) * .7;
    for (let s = 0; s < len; s++) { const k = s / len, x = bx + Math.sin(lean + sway * k) * s * k, y = by - s, ww = Math.max(1, Math.round(w * (1 - k * .8)));
      cuR(g, x, y, ww, 1, NIGHT.grass[Math.min(4, Math.floor(tone * 4 + k * 1.2))]); if (k > .3 && ww > 1) cuP(g, x, y, NIGHT.grass[4]); } } }
// une mèche de cheveux noirs, d'un point à un autre, qui ondule (épaisseur w)
function cuHairStrand(g, pts, w, t, i = 0, wob = 1) {
  const seg = []; for (let k = 0; k < pts.length - 1; k++) { const [x0, y0] = pts[k], [x1, y1] = pts[k + 1], n = Math.ceil(Math.hypot(x1 - x0, y1 - y0)); for (let s = 0; s < n; s++) seg.push([x0 + (x1 - x0) * s / n, y0 + (y1 - y0) * s / n]); }
  seg.forEach(([x, y], s) => { const k = s / seg.length, wv = Math.sin(t / 160 + s * .18 + i * 2) * 2.5 * wob * Math.sin(k * Math.PI);
    cuR(g, x, y + wv - w / 2, 1, w + 1, NIGHT.hair[0]); if (w > 1) cuP(g, x, y + wv - w / 2 + 1, s % 7 === i % 7 ? NIGHT.hair[3] : NIGHT.hair[2]); });
}
// les paupières d'un dormeur : deux bandes noires qui se ferment (k = 0 ouvert, 1 fermé), bord flou tramé
function cuEyelids(g, k) { if (k <= 0) return; const half = CU_H / 2 * k;
  for (let y = 0; y < CU_H; y++) { const d = Math.min(y, CU_H - 1 - y), curve = x => Math.sin(x / CU_W * Math.PI) * 14 * (1 - k);
    for (let x = 0; x < CU_W; x++) { const edge = half + curve(x) - d; if (edge > 3 || (edge > -3 && CU_BAYER[y & 3][x & 3] / 16 < (edge + 3) / 6)) cuP(g, x, y, "#000"); } } }

// ---------- PLAN-04 : le rêve ----------
// La mini cinématique du puits, en plans très serrés, comme à travers les yeux d'un dormeur ; on ne voit jamais la scène en entier.
// Cinq plans de 2 s : les cheveux dans l'herbe, la cheville prise, la main qui lâche l'herbe, le tissu qui passe par-dessus la margelle,
// le trou noir où le seau se balance. Les paupières se ferment entre chaque plan. DREAM_LEN = 10 500 ms, puis noir.
// Ensuite : drawWakeText(ctx, t) pour « Vous vous réveillez en sueur. » (UI-04).
const DREAM_LEN = 10500, DREAM_CUTS = [0, 2000, 4000, 6000, 8000, 10000];
let dreamGrass = {};
function cuGrassLayer(seed, scale, ground = true) { const k = seed + "/" + scale + ground; if (!dreamGrass[k]) { const [c, g] = cuLayer(); cuNightGrass(g, 0, seed, 0, scale, ground); dreamGrass[k] = c; } return dreamGrass[k]; }
function drawDream(ctx, t, opts = {}) {
  ctx.imageSmoothingEnabled = false;
  const shot = DREAM_CUTS.findIndex((c, i) => t >= c && t < (DREAM_CUTS[i + 1] ?? 1e9)), st = t - DREAM_CUTS[Math.max(0, shot)], u = cuClamp(st / 2000);
  const sway = Math.round(Math.sin(t / 900) * 2);
  ctx.save(); ctx.translate(sway, 0);
  if (shot === 0) { // des mèches glissent dans l'herbe, de gauche à droite
    ctx.drawImage(cuGrassLayer(3, 1), 0, 0);
    for (let i = 0; i < 7; i++) { const y = 150 + i * 8 + Math.sin(i * 2) * 6, head = -40 + u * 470 - i * 22, pts = []; for (let x = -20; x < head; x += 12) pts.push([x, y + Math.sin(x / 30 + i + t / 300) * 6]);
      if (pts.length > 1) cuHairStrand(ctx, pts, 3 + (i % 2) * 2, t, i); }
    ctx.drawImage(cuGrassLayer(5, .7, false), 0, 0, CU_W, CU_H, 0, 40, CU_W, CU_H);                            // quelques brins devant
  } else if (shot === 1) { // une cheville d'enfant dans l'herbe ; les cheveux s'enroulent et serrent
    ctx.drawImage(cuGrassLayer(8, 1.2), 0, 0);
    const jerk = u > .55 ? Math.sin(st / 30) * 3 * (1 - u) : 0, ax = 200 + jerk - cuEase(cuClamp((u - .7) / .3)) * 30, ay = 120;
    cuInked(ctx, [(ink, e) => cuCaps(ctx, 420, 175, ax, ay, 22 + e, ink || ((s, v, x, y) => cuTone(.55 - s * .4, x, y, NIGHT.skin))),               // la jambe
      (ink, e) => cuCaps(ctx, ax, ay, ax - 46, ay - 32, 17 + e, ink || ((s, v, x, y) => cuTone(.62 - s * .4 - v * .1, x, y, NIGHT.skin))),               // le pied
      ...[0, 1, 2, 3, 4].map(k => (ink, e) => cuEll(ctx, ax - 58 + k * 3, ay - 46 + k * 7, 5 + e, 4.5 + e, ink || ((nx, ny, x, y) => cuTone(.65 - ny * .4, x, y, NIGHT.skin))))]);
    const coils = Math.floor(u * 7);
    for (let k = 0; k < coils; k++) { const cx = ax + 18 + k * 7, r = 22 - k * .4; const pts = []; for (let a = -1.4; a <= 1.4; a += .2) pts.push([cx + Math.sin(a) * 4, ay + 22 + Math.sin(a) * r * -1 - k * 3]); cuHairStrand(ctx, pts, 3, t, k, .2); }
    for (let i = 0; i < 4; i++) cuHairStrand(ctx, [[ax + 20 + i * 6, ay + 20], [ax + 60 + i * 10, ay + 80], [CU_W + 20, ay + 100 + i * 8]], 3, t, i, .4);
    ctx.drawImage(cuGrassLayer(9, .6, false), 0, 0, CU_W, CU_H, 0, 70, CU_W, CU_H);
  } else if (shot === 2) { // une main agrippe une touffe d'herbe ; tirée vers la gauche, les doigts glissent et lâchent
    ctx.drawImage(cuGrassLayer(11, 1.3), 0, 0);
    const pull = cuEase(u) * 220, hx = 250 - pull, hy = 128, grip = u < .6;
    // la touffe, tendue vers la main tant qu'elle la tient, puis arrachée
    for (let i = 0; i < 9; i++) { const bx = 248 + i * 3 - 12, by = 216, tx = grip ? hx + 10 + i * 2 : bx + Math.sin(t / 200 + i) * 8, ty = grip ? hy + 4 : 90 + i * 4;
      cuLine(ctx, bx, by, tx, ty, 2, i % 3 ? NIGHT.grass[3] : NIGHT.grass[4]); }
    cuInked(ctx, [(ink, e) => cuCaps(ctx, hx - 200, hy + 30, hx - 10, hy + 6, 18 + e, ink || ((s, v, x, y) => cuTone(.4 - s * .35, x, y, NIGHT.cloth))),
      (ink, e) => cuEll(ctx, hx + 8, hy + 2, 20 + e, 15 + e, ink || ((nx, ny, x, y) => cuTone(.6 - ny * .4 - nx * .1, x, y, NIGHT.skin))),
      ...[-10, -2, 6, 14].map((fx, k) => (ink, e) => cuCaps(ctx, hx + 18 + k, hy + fx * .6 - 2, hx + (grip ? 30 : 44 + k * 2), hy + fx * .9 + (grip ? 8 : 0), 4.5 + e, ink || ((s, v, x, y) => cuTone(.68 - s * .4, x, y, NIGHT.skin)))),
      (ink, e) => cuCaps(ctx, hx + 6, hy - 12, hx + 24, hy - 16, 5 + e, ink || ((s, v, x, y) => cuTone(.7 - s * .4, x, y, NIGHT.skin)))]);
    if (!grip) for (let i = 0; i < 5; i++) { const k = (u - .6) / .4; cuR(ctx, hx + 40 + i * 9 + k * 30, 90 + i * 7 - k * 20, 3, 1, NIGHT.grass[3]); }        // brins arrachés qui volent
  } else if (shot === 3) { // la margelle de pierre, tout près ; un bout de chemise verte glisse par-dessus et tombe
    for (let y = 0; y < CU_H; y++) for (let x = 0; x < CU_W; x++) cuP(ctx, x, y, cuTone(.3 - y / CU_H * .2, x, y, NIGHT.ground));
    const rim = x => 120 + ((x - 192) / 260) ** 2 * 60;
    for (let x = 0; x < CU_W; x++) { const ry = rim(x); for (let y = Math.round(ry); y < CU_H; y++) { const sx = Math.floor((x + Math.floor((y - ry) / 22) * 30) / 60), sy = Math.floor((y - ry) / 22), joint = (x + Math.floor((y - ry) / 22) * 30) % 60 < 2 || (y - ry) % 22 < 2;
      cuP(ctx, x, y, joint ? NIGHT.stone[0] : cuTone(.75 - (y - ry) / 120 + cuH(sx * 7 + sy * 3) * .2 - (x / CU_W) * .2, x, y, NIGHT.stone)); } cuR(ctx, x, ry - 2, 1, 3, NIGHT.stone[0]); }
    for (let x = 0; x < CU_W; x++) for (let y = 0; y < rim(x) - 2; y++) if (y > rim(x) - 60) cuP(ctx, x, y, "#020204");   // le trou derrière la margelle
    const fall = cuEase(cuClamp((u - .35) / .65)), cy = 150 - fall * 120;
    for (let i = 0; i < 5; i++) cuHairStrand(ctx, [[200 + i * 9, 40], [196 + i * 9, cy - 10], [190 + i * 10, cy + 20]], 3, t, i, .3);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, CU_W, rim(200) + 30 - fall * 30); ctx.clip();
    cuInked(ctx, [(ink, e) => cuEll(ctx, 200, cy + 30, 46 + e, 30 + e, ink || ((nx, ny, x, y) => cuTone(.55 - ny * .4 - nx * .2 + (Math.floor(x / 5 + y / 9) % 3 ? 0 : -.15), x, y, NIGHT.cloth)))]);
    ctx.restore();
    cuR(ctx, 0, 0, CU_W, 6, "#000");
  } else { // le trou noir ; le seau se balance ; une ride à la surface, très loin
    for (let y = 0; y < CU_H; y++) for (let x = 0; x < CU_W; x++) { const r = Math.hypot((x - 192) / 170, (y - 108) / 95); cuP(ctx, x, y, r < 1 ? cuTone(.5 - (1 - r) * .9, x, y, NIGHT.stone.slice(0, 3)) : cuTone(.6 - (r - 1), x, y, NIGHT.stone)); }
    cuEll(ctx, 192, 120, 46, 26, "#000"); const rip = (st % 1600) / 1600; cuEll(ctx, 192, 120, 8 + rip * 30, 4 + rip * 16, (nx, ny) => Math.abs(Math.hypot(nx, ny) - 1) < .12 ? "#3a4a60" : null);
    const sw = Math.sin(st / 500) * 18 * (1 - u * .5), bx = 192 + sw, by = 70;
    cuLine(ctx, 192, -2, bx, by - 14, 2, "#6a5a40");
    cuInked(ctx, [(ink, e) => cuR(ctx, bx - 12 - e, by - 14 - e, 24 + e * 2, 22 + e * 2, ink || "#3a281e")]); cuR(ctx, bx - 11, by - 12, 4, 18, "#5a4030"); cuR(ctx, bx - 11, by - 8, 22, 2, "#6a6e78"); cuR(ctx, bx - 11, by + 2, 22, 2, "#6a6e78");
  }
  ctx.restore();
  cuVignette(ctx, .9, "#000", .35);
  // les paupières se ferment à la fin de chaque plan et se rouvrent au début du suivant
  const lid = shot >= 5 ? 1 : Math.max(1 - st / 350, (st - 1650) / 350);
  cuEyelids(ctx, cuClamp(lid));
  if (t > DREAM_LEN - 500) cuFade(ctx, 1);
}
function drawWakeText(ctx, t, opts = {}) { const text = opts.text || "Vous vous réveillez en sueur.";
  cuFade(ctx, 1); ctx.fillStyle = "#e8e4f0"; ctx.font = "16px 'Pixelify Sans', monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const shown = Math.min(text.length, Math.floor(t / 70)); ctx.globalAlpha = cuClamp(t / 400); ctx.fillText(text.slice(0, shown), CU_W / 2, CU_H / 2); ctx.globalAlpha = 1; ctx.textAlign = "start";
}

// ---------- Regarder au fond du puits, de jour (PLAN-02 au jour 1, PLAN-08 et PLAN-09 à l'aube du jour 4) ----------
// drawWellLook(ctx, t, { fond, doux, mains })
//   fond : "reflet" (jour 1 : eau noire, reflet du héros, une goutte tombe et le reflet tremble)
//          "corps" (aube 4 : le corps d'Élio flotte, face dans l'eau, tête rasée) | "eau_rouge" (aube 4 : il ne reste que l'eau rouge)
//   doux : true pour l'option « atténuer les images choquantes » (le corps n'est plus qu'une ombre, l'eau moins rouge)
//   mains : true (par défaut) pour voir les mains du héros posées sur la margelle, en bas de l'écran
const WL = { cx: 192, cy: 120, wx: 44, wy: 32 };
let wellShaft = null;
function cuWellShaftLayer() {
  if (wellShaft) return wellShaft;
  const [c, g] = cuLayer(), S = ["#07080b", "#10141a", "#1c2229", "#2a323b", "#3c4650", "#56626c", "#7a8690", "#a2acb2"];
  for (let y = 0; y < CU_H; y++) for (let x = 0; x < CU_W; x++) {
    const dx = x - WL.cx, dy = (y - WL.cy) * 1.36, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    const lr = Math.log(r + 6) * 5.2, ring = Math.floor(lr), n = 9 + ring * 3, sg = (a / 6.2832 + .5) * n + ring * .41, seg = Math.floor(sg);
    const mortar = lr - ring < .14 || sg - seg < .06 * (1 + ring * .05), moss = cuH(ring * 3.1 + seg * 7.7) > .82 && ring > 22 && ring < 26;
    const light = Math.pow(Math.min(1, r / 260), 1.5) * .95 + Math.max(0, Math.cos(a + 1.2)) * .22 * Math.min(1, r / 120);
    const v = light + cuH(ring * 12.98 + seg * 78.2) * .12 - (mortar ? .4 : 0) + ((lr - ring) - .5) * .25 * light;
    cuP(g, x, y, moss && !mortar ? cuTone(v * .8, x, y, ["#141e16", "#203222", "#2e4430"]) : cuTone(v, x, y, S)); }
  return (wellShaft = c);
}
function drawWellLook(ctx, t, opts = {}) {
  const fond = opts.fond || "reflet", soft = !!opts.doux; ctx.imageSmoothingEnabled = false;
  ctx.drawImage(cuWellShaftLayer(), 0, 0);
  // l'eau au fond
  const red = fond === "eau_rouge" || fond === "corps", W = red ? (soft ? ["#120608", "#24080c", "#3a1014", "#521c1e"] : ["#160204", "#380508", "#640a10", "#921616"]) : ["#020306", "#060a10", "#0e1620", "#1a2632"];
  const drop = fond === "reflet" ? (t % 5000) : -1, ripple = drop > 1800 ? (drop - 1800) / 1600 : -1;
  cuEll(ctx, WL.cx, WL.cy, WL.wx + 1, WL.wy + 1, "#000");
  cuEll(ctx, WL.cx, WL.cy, WL.wx, WL.wy, (nx, ny, x, y) => { const r = Math.hypot(nx, ny), sw = Math.sin(Math.atan2(ny, nx) * 3 + r * 6 - t / 900) * .06;
    return cuTone(.35 - r * .2 + (nx < -.2 && ny < -.2 ? .12 : 0) + (red ? sw : 0), x, y, W); });
  if (fond === "reflet") {
    // le reflet du héros : sa tête et ses épaules, contre le ciel clair du dessus
    const tremble = ripple >= 0 && ripple < 1 ? Math.sin(ripple * 40) * 3 * (1 - ripple) : 0;
    cuEll(ctx, WL.cx, WL.cy, 34, 24, (nx, ny, x, y) => cuTone(.9 - Math.hypot(nx, ny) * .9, x, y, ["#0e1620", "#2a4058", "#5a7a9a", "#9ab4c8"]));        // le ciel reflété
    for (let y = -12; y <= 12; y++) { const off = Math.round(Math.sin(y * .7 + t / 200) * tremble);
      for (let x = -14; x <= 14; x++) { const head = (x / 9) ** 2 + ((y + 4) / 9) ** 2 <= 1, sh = y > 4 && Math.abs(x) < 14 - (y - 4) * .1, spike = y < -10 && Math.abs(x) < 7 && (x + 20) % 4 < 2;
        if (head || sh || spike) cuP(ctx, WL.cx + x + off, WL.cy + y, CU_BAYER[(y + 12) & 3][(x + 14) & 3] < 9 ? "#020306" : "#0c121a"); } }
    // la goutte : elle tombe du haut, touche l'eau, des cercles s'élargissent
    if (drop > 400 && drop < 1800) { const k = (drop - 400) / 1400, yy = -10 + k * k * (WL.cy + 10), s = 1 + k * 2; cuEll(ctx, WL.cx + 6, yy, s, s * 1.4, "#c8d8e8"); }
    if (ripple >= 0 && ripple < 1) for (let i = 0; i < 3; i++) { const r = ripple * 30 - i * 7; if (r > 0) cuEll(ctx, WL.cx + 6, WL.cy, r, r * .72, (nx, ny) => Math.abs(Math.hypot(nx, ny) - 1) < .1 ? "#5a7a9a" : null); }
  }
  if (fond === "corps") { // vu d'en haut, face dans l'eau : le dos, les bras écartés, le crâne rasé
    const bob = Math.sin(t / 1400) * 1, x = WL.cx - 2, y = WL.cy + bob; ctx.save(); ctx.translate(x, y); ctx.scale(1.7, 1.7); ctx.translate(-x, -y);
    if (soft) cuEll(ctx, x, y, 22, 13, (nx, ny, X, Y) => CU_BAYER[Y & 3][X & 3] / 16 < .7 ? "#08030a" : null);
    else { cuInked(ctx, [
        (ink, e) => cuCaps(ctx, x - 20, y - 6, x + 20, y + 4, 2.6 + e, ink || ((s, u, X, Y) => cuTone(.5 - s * .3, X, Y, ["#3a2a28", "#6a4e48", "#9a786a"]))),             // les bras
        (ink, e) => cuEll(ctx, x, y + 2, 8 + e, 10 + e, ink || ((nx, ny, X, Y) => cuTone(.45 - ny * .2 - nx * .2, X, Y, ["#14200e", "#24381c", "#3e5a2e"]))),                // la chemise mouillée
        (ink, e) => cuEll(ctx, x, y - 9, 5 + e, 4.5 + e, ink || ((nx, ny, X, Y) => cuTone(.55 - nx * .3 - ny * .3, X, Y, ["#4a3a30", "#8a7058", "#b89878"])))]);            // le crâne rasé
      [[-2, -11], [2, -9]].forEach(([a, b]) => cuP(ctx, x + a, y + b, "#5a1214"));
      cuEll(ctx, x, y + 2, 16, 14, (nx, ny, X, Y) => Math.hypot(nx, ny) > .85 && CU_BAYER[Y & 3][X & 3] < 5 ? "#921616" : null); }        // l'eau rouge autour de lui
    ctx.restore();
  }
  // le rebord du puits tout autour, éclairé par l'aube
  for (let y = 0; y < CU_H; y++) for (let x = 0; x < CU_W; x++) { const r = Math.hypot((x - WL.cx) / 230, (y - WL.cy) / 150); if (r > 1) cuP(ctx, x, y, cuTone(.5 + (1 - y / CU_H) * .3 - (r - 1) * .5, x, y, ["#3c4650", "#56626c", "#7a8690", "#a2acb2"])); }
  // les mains du héros sur la margelle
  if (opts.mains !== false) [-1, 1].forEach(sd => { const hx = WL.cx + sd * 120, hy = 214;
    cuInked(ctx, [(ink, e) => cuCaps(ctx, hx + sd * 30, CU_H + 40, hx, hy - 10, 16 + e, ink || ((s, u, x, y) => cuTone(.55 - s * sd * .3, x, y, CUC.sleeve))),
      (ink, e) => cuEll(ctx, hx - sd * 4, hy - 16, 16 + e, 11 + e, ink || ((nx, ny, x, y) => cuSkin(.65 - ny * .3 - nx * sd * .1, x, y))),
      ...[0, 1, 2, 3].map(k => (ink, e) => cuCaps(ctx, hx - sd * (10 - k * 6), hy - 22, hx - sd * (12 - k * 7), hy - 34 + Math.abs(k - 1.5), 4 + e, ink || ((s, u, x, y) => cuSkin(.72 - s * .3 - u * .15, x, y))))]); });
  cuVignette(ctx, .5, "#000", .7);
}
