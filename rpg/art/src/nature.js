// ---------- Un décor vivant : ruisseau, arbres, rochers, herbes, oiseaux, particules ----------
const NV = { wd:"#2a5e94", w:"#3a7cb6", wm:"#4f9acb", wl:"#7cc4e4", wh:"#d4f0fa", foam:"#f4fbff",
  sand:"#d8bf86", sandd:"#b89a5e", wet:"#8e7a50",
  r1:"#a4a8b0", r2:"#767c88", r3:"#cfd2d6", ro:"#2e2a36", moss:"#5f9a48", mossl:"#8cc45e",
  l1:"#3f8a3c", l2:"#2b6532", l3:"#5fae48", l4:"#93d062", lo:"#1a3a24", tk:"#6e4630", tkd:"#47301f", tkl:"#916244",
  gb:"#3f9e56", gt:"#9be08a", reed:"#4c8a3a", reedl:"#86bc4e", cat:"#6e4228", lily:"#3c9a52", lilyl:"#74c672", pink:"#f4a6c6",
  bird:"#3a3040", beak:"#f2a23a", leafo:"#e0a03a", mush:"#d2463c", mushl:"#ffffff" };
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const NW = 384, NH = 216;
const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
// le ruisseau descend du haut à droite vers le bas à gauche
const riverX = y => 266 - y * .55 + 12 * Math.sin(y / 26);
const riverHW = y => 13 + 3 * Math.sin(y / 41 + 1);
const inRiver = (x, y, m = 0) => Math.abs(x - riverX(y)) < riverHW(y) + m;
const STONES = [[0, 0, 0]].slice(1);           // pierres de gué : [x, y, rayon]
{ const y0 = 150; [-.6, 0, .6].forEach((k, i) => STONES.push([Math.round(riverX(y0 + i * 3) + k * riverHW(y0)), y0 + i * 3, 4.2])); }
STONES.push([Math.round(riverX(60) + 4), 60, 2.6]);

// ---- fond fixe : herbe, berges, galets, fleurs ----
let natureBg = null;
function natureBackground() {
  if (natureBg) return natureBg;
  const c = document.createElement("canvas"); c.width = NW; c.height = NH; const g = c.getContext("2d"), r = rng(7);
  for (let y = 0; y < NH; y += 16) for (let x = 0; x < NW; x += 16) grassTile(g, x, y);
  for (let k = 0; k < 14; k++) {                         // zones d'herbe plus sombre, tramées
    const cx = r() * NW, cy = r() * NH, rx = 14 + r() * 22, ry = 8 + r() * 10;
    for (let y = Math.floor(cy - ry); y < cy + ry; y++) for (let x = Math.floor(cx - rx); x < cx + rx; x++)
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1 && (x + 2 * y) % 4 === 0) px(g, T.gd, x, y);
  }
  for (let y = 0; y < NH; y++) {                         // berges de sable
    const cx = riverX(y), hw = riverHW(y);
    for (let x = Math.floor(cx - hw - 4); x <= Math.ceil(cx + hw + 4); x++) {
      const d = Math.abs(x - cx) - hw; if (d > 4 || d < -1) continue;
      px(g, d < .6 ? NV.wet : d < 2.4 ? NV.sand : (x + y) % 2 ? NV.sand : T.g, x, y);
      if (d > 1 && d < 2.4 && r() < .08) px(g, NV.sandd, x, y);
      if (d > 2.4 && d < 4 && r() < .35) px(g, T.gd, x, y);
    }
  }
  for (let k = 0; k < 40; k++) {                         // galets sur les berges
    const y = Math.floor(r() * NH), side = r() < .5 ? -1 : 1, x = Math.round(riverX(y) + side * (riverHW(y) + 1.5 + r() * 2));
    px(g, NV.r2, x, y + 1, 2, 1); px(g, NV.r1, x, y, 2, 1); if (r() < .4) px(g, NV.r3, x, y);
  }
  for (let k = 0; k < 70; k++) {                         // petites fleurs semées
    const x = Math.floor(r() * NW), y = Math.floor(r() * NH); if (inRiver(x, y, 6)) continue;
    const col = [T.fw, NV.pink, T.fy, "#b8a8f0"][k % 4]; px(g, "#4f8f3e", x, y + 1); px(g, col, x, y); if (k % 3 === 0) { px(g, col, x - 1, y); px(g, col, x + 1, y); px(g, col, x, y - 1); px(g, T.fy, x, y); }
  }
  // touffes de fleurs et champignons
  [[40,60,T.fw],[52,66,NV.pink],[64,58,T.fw],[300,170,T.fp],[316,178,T.fw],[330,166,NV.pink],[120,186,T.fw],[134,192,T.fp],[350,40,T.fw],[364,52,NV.pink],[90,120,T.fw]].forEach(([x, y, col]) => flower(g, x, y, col));
  [[66,104],[71,106]].forEach(([x, y]) => { px(g, NV.ro, x - 1, y - 1, 5, 4); px(g, NV.mush, x, y - 1, 3, 2); px(g, NV.mush, x - 1, y, 5, 1); px(g, NV.mushl, x + 1, y - 1); px(g, NV.mushl, x - 1, y); px(g, "#f0e6d0", x + 1, y + 1, 1, 2); });
  return (natureBg = c);
}

// ---- eau animée ----
const waterCv = document.createElement("canvas"); waterCv.width = NW; waterCv.height = NH;
const waterImg = waterCv.getContext("2d").createImageData(NW, NH);
const WC = Object.fromEntries(["wd","w","wm","wl","wh","foam"].map(k => [k, hex(NV[k])]));
let fishT0 = -1e9, fishAt = [0, 0];
function renderWater(t) {
  const d = waterImg.data; d.fill(0);
  const set = (x, y, k) => { const i = (y * NW + x) * 4, c = WC[k]; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; };
  const flow = t * .018;                                  // le courant descend
  for (let y = 0; y < NH; y++) {
    const cx = riverX(y), hw = riverHW(y);
    for (let x = Math.max(0, Math.ceil(cx - hw)); x <= Math.min(NW - 1, Math.floor(cx + hw)); x++) {
      const u = (x - cx) / hw, deep = 1 - u * u;
      let k = deep > .82 ? "wd" : deep > .45 ? "w" : deep > .18 ? "wm" : "wl";
      const yy = Math.floor(y - flow * (.7 + deep * .5)), band = Math.floor(yy / 4), cell = Math.floor((x + band * 3) / 6);
      const hsh = Math.abs(Math.sin(band * 12.9898 + cell * 78.233) * 43758.5453) % 1, inCell = (x + band * 3) % 6;
      if (deep > .1 && yy % 4 === 0 && hsh < .3 && inCell < 2 + Math.floor(hsh * 8) % 3) k = hsh < .07 ? "wh" : "wl";   // petits reflets qui filent avec le courant
      else if (deep > .7 && yy % 4 === 2 && hsh > .82 && inCell < 3) k = "wd";
      if (Math.abs(u) > .88 && (x + y + Math.floor(t / 260)) % 3 === 0) k = "foam";  // écume au bord
      STONES.forEach(([sx, sy, sr]) => { const dd = Math.hypot(x - sx, (y - sy) * 1.3);
        if (dd > sr && dd < sr + 1.6 && (x * 7 + y * 3 + Math.floor(t / 160)) % 4) k = "foam";
        if (y > sy + 2 && y < sy + 12 && Math.abs(x - sx + (y - sy) * .5) < (y - sy) * .25 && Math.sin((y - flow) * .9) > .3) k = "wl"; });
      set(x, y, k);
    }
  }
  // un poisson saute de temps en temps
  const ft = t - fishT0;
  if (ft > 7000) { fishT0 = t; const yy = 40 + ((t / 7000 | 0) * 53) % 120; fishAt = [Math.round(riverX(yy) - 4), yy]; }
  if (ft < 1500) { const [fx, fy] = fishAt;
    if (ft > 650) { const rr = (ft - 650) / 140; for (let a = 0; a < 40; a++) { const x = Math.round(fx + 6 + Math.cos(a / 40 * 6.28) * rr), y = Math.round(fy + Math.sin(a / 40 * 6.28) * rr * .5);
      if (x >= 0 && x < NW && y >= 0 && y < NH && inRiver(x, y) && rr < 6) set(x, y, rr < 3 ? "foam" : "wh"); } } }
  waterCv.getContext("2d").putImageData(waterImg, 0, 0);
}
function drawFish(ctx, t) {
  const ft = t - fishT0; if (ft < 0 || ft > 650) return;
  const k = ft / 650, [fx, fy] = fishAt, x = Math.round(fx + k * 7), y = Math.round(fy - Math.sin(Math.PI * k) * 9);
  px(ctx, "#c8d8e0", x, y, 3, 1); px(ctx, "#8aa0b0", x + 1, y + 1, 2, 1); px(ctx, "#8aa0b0", x - 1, y - (k < .5 ? 1 : -1)); px(ctx, NV.ro, x + 2, y);
  if (ft < 120) [[-1, 0], [1, -1], [2, 1]].forEach(([a, b]) => px(ctx, NV.foam, fx + a, fy + b));
}

// ---- rochers ----
function rock(ctx, x, y, w, h, moss) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const u = (i + .5 - w / 2) / (w / 2), v = (j + .5 - h / 2) / (h / 2); if (u * u + v * v * (v < 0 ? 1 : .7) > 1) continue;
    const edge = [[1,0],[-1,0],[0,1],[0,-1]].some(([a, b]) => { const uu = (i + a + .5 - w / 2) / (w / 2), vv = (j + b + .5 - h / 2) / (h / 2); return uu * uu + vv * vv * (vv < 0 ? 1 : .7) > 1; });
    let c = -u * .5 - v * .9 > .45 ? NV.r3 : -u * .5 - v * .9 > -.3 ? NV.r1 : NV.r2;
    if ((i * 5 + j * 3) % 11 === 0 && c !== NV.r3) c = NV.r2;
    if (moss && v < -.25 && u > -.5 && (i + j) % 3) c = (i + j) % 2 ? NV.moss : NV.mossl;
    px(ctx, edge ? NV.ro : c, x + i, y + j);
  }
}

// ---- arbres en touffes de feuillage ----
const treeCache2 = {};
function leafyTree(seed, R) {
  const k = seed + ":" + R; if (treeCache2[k]) return treeCache2[k];
  const r = rng(seed), W = R * 2 + 8, Hc = Math.round(R * 1.7) + 6;
  const blobs = [];
  for (let i = 0; i < 11; i++) { const a = r() * 6.28, d = r() * R * .55;
    blobs.push([W / 2 + Math.cos(a) * d, Hc / 2 + 1 + Math.sin(a) * d * .7, R * (.42 + r() * .2)]); }
  blobs.push([W / 2, Hc / 2 - R * .35, R * .5]);
  blobs.sort((a, b) => a[1] - b[1]);                     // les touffes du bas passent devant
  const top = (x, y) => { for (let i = blobs.length - 1; i >= 0; i--) { const [bx, by, br] = blobs[i]; if (Math.hypot(x - bx, (y - by) * 1.15) < br) return i; } return -1; };
  const can = document.createElement("canvas"); can.width = W; can.height = Hc; const g = can.getContext("2d");
  for (let y = 0; y < Hc; y++) for (let x = 0; x < W; x++) {
    const i = top(x + .5, y + .5); if (i < 0) continue;
    const [bx, by, br] = blobs[i], nx = (x + .5 - bx) / br, ny = (y + .5 - by) / br;
    const out = [[1,0],[-1,0],[0,1],[0,-1]].some(([a, b]) => top(x + a + .5, y + b + .5) < 0);
    const under = top(x + .5, y - .5) !== i && top(x + .5, y - .5) >= 0 && top(x + .5, y - .5) < i;   // bord d'une touffe posée sur une autre
    const n = r(), lit = -nx * .55 - ny * .85 + (n - .5) * .3;
    let c = lit > .4 ? NV.l3 : lit > -.3 ? NV.l1 : NV.l2;
    if (lit > .62 && n < .45) c = NV.l4;                                   // quelques feuilles au soleil
    if (c === NV.l1 && n > .93) c = NV.l2;                                 // petits creux entre les feuilles
    if (under) c = NV.l2;
    if (out) c = NV.lo;
    px(g, c, x, y);
  }
  // tronc
  const trW = Math.max(4, Math.round(R / 3)), trH = Math.round(R * .9), tr = document.createElement("canvas"); tr.width = trW + 6; tr.height = trH; const h = tr.getContext("2d");
  for (let y = 0; y < trH; y++) { const flare = y > trH - 4 ? (y - (trH - 4)) : 0;
    for (let x = 3 - flare; x < 3 + trW + flare; x++) { const edge = x === 3 - flare || x === 2 + trW + flare || y === trH - 1;
      px(h, edge ? NV.lo : x < 3 + trW / 2 - 1 ? NV.tkl : (x + y) % 4 === 0 ? NV.tkd : NV.tk, x, y); } }
  return (treeCache2[k] = { can, tr, W, Hc, trW, trH });
}
function drawTree(ctx, t, x, y, seed, R) {          // (x, y) = pied du tronc
  const T2 = leafyTree(seed, R), sway = Math.round(Math.sin(t * .0011 + seed) * .8 + Math.sin(t * .0031 + seed * 2) * .35);
  ctx.globalAlpha = .2; ctx.fillStyle = "#1a3a2a";
  for (let j = -3; j <= 3; j++) { const w = Math.round(R * 1.1 * Math.sqrt(1 - (j / 4) ** 2)); ctx.fillRect(x - w + 4, y + j, w * 2, 1); }
  ctx.globalAlpha = 1;
  ctx.drawImage(T2.tr, x - (T2.trW + 6) / 2, y - T2.trH);
  ctx.drawImage(T2.can, x - T2.W / 2 + sway, y - T2.trH - T2.Hc + Math.round(R * .45));
}

function drawBush(ctx, t, x, y, seed, R) {          // un buisson : une touffe de feuillage posée au sol
  const B = leafyTree(seed, R), sway = Math.round(Math.sin(t * .0013 + seed) * .5);
  ctx.globalAlpha = .2; ctx.fillStyle = "#1a3a2a"; ctx.fillRect(x - R, y - 1, R * 2, 2); ctx.globalAlpha = 1;
  ctx.drawImage(B.can, x - B.W / 2 + sway, y - B.Hc + 2);
  if (seed % 3 === 0) [[-3, -8], [2, -11], [5, -6]].forEach(([a, b]) => { px(ctx, "#c2304a", x + a, y + b); px(ctx, "#f07a8a", x + a, y + b - 1); });   // baies
}
// ---- herbes et roseaux qui ondulent ----
const TUFTS = [], REEDS = [], LILIES = [];
{ const r = rng(11);
  while (TUFTS.length < 150) { const cx = Math.floor(r() * NW), cy = 8 + Math.floor(r() * (NH - 8)); for (let n = 0; n < 4; n++) { const x = cx + Math.floor(r() * 14 - 7), y = cy + Math.floor(r() * 6 - 3); if (!inRiver(x, y, 6)) TUFTS.push([x, y, 4 + Math.floor(r() * 4)]); } }
  TUFTS.sort((a, b) => a[1] - b[1]);
  for (let k = 0; k < 9; k++) { const y0 = 10 + Math.floor(r() * (NH - 16)), side = k % 2 ? 1 : -1; if (y0 > 130 && y0 < 170) continue;
    for (let n = 0; n < 4; n++) { const y = y0 + n % 2 * 2; REEDS.push([Math.round(riverX(y) + side * (riverHW(y) + 1 + n * 1.3)), y, 8 + Math.floor(r() * 7), n % 2 === 0]); } }
  [[30, -1], [95, 1], [190, -1]].forEach(([y, s]) => LILIES.push([Math.round(riverX(y) + s * (riverHW(y) - 5)), y, y === 95])); }
const wind = (x, t) => Math.sin(x * .045 - t * .0021) + .6 * Math.sin(x * .013 - t * .0009);   // une rafale qui traverse l'écran
function drawTuft(ctx, t, x, y, h) {
  const w = wind(x, t);
  [-2, -1, 0, 1, 2].forEach((dx, i) => { const hh = h - Math.abs(dx) - (i % 2), off = w * (1 + Math.abs(dx) * .2) + dx * .4;
    for (let k = 0; k < hh; k++) px(ctx, k < 1 ? "#2c7a40" : k < hh - 2 ? NV.gb : NV.gt, x + dx + Math.round(off * k / hh), y - k); });
}
function drawReed(ctx, t, x, y, h, cat) {
  const w = wind(x, t) * 1.6;
  for (let k = 0; k < h; k++) px(ctx, k > h * .6 ? NV.reedl : NV.reed, x + Math.round(w * (k / h) ** 1.5), y - k);
  if (cat) { const cx = x + Math.round(w); px(ctx, NV.cat, cx, y - h - 3, 1, 4); px(ctx, "#9a6440", cx, y - h - 3); px(ctx, NV.reedl, cx, y - h - 4); }
  else px(ctx, NV.reedl, x + Math.round(w) + (w > 0 ? 1 : -1), y - h);
}
function drawLily(ctx, t, x, y, flowerOn) {
  const b = Math.round(Math.sin(t * .002 + x) * .6);
  px(ctx, NV.lo, x - 3, y + b - 1, 7, 4); px(ctx, NV.lily, x - 2, y + b - 1, 5, 3); px(ctx, NV.lily, x - 3, y + b, 7, 2);
  px(ctx, NV.lilyl, x - 2, y + b - 1, 2, 1); px(ctx, NV.wd, x, y + b - 1, 1, 2);
  if (flowerOn) { px(ctx, NV.pink, x - 1, y + b - 2, 3, 2); px(ctx, "#fff0f6", x, y + b - 3); px(ctx, T.fy, x, y + b - 2); }
}

// ---- oiseaux : ils arrivent, picorent sur la branche, puis s'envolent ----
const BIRD_UP = [[0,0],[1,1],[2,2],[3,1],[4,0]], BIRD_DN = [[0,2],[1,1],[2,2],[3,1],[4,2]];
function drawBirds(ctx, t, perch) {
  const P = 12000, tt = t % P;
  [[0, 0], [5, -2], [10, 1]].forEach(([dx, dy], i) => {
    const px0 = perch[0] + dx, py0 = perch[1] + dy, d = i * 180;
    let x, y, fly = true;
    if (tt < 2600 + d) { const k = Math.min(1, (tt) / (2600 + d)), e = 1 - (1 - k) ** 3; x = px0 - 140 * (1 - e); y = py0 - 70 * (1 - e) + Math.sin(k * 9) * 2; fly = k < 1; }
    else if (tt < 8000 + d) { x = px0; y = py0 - ((Math.floor(tt / 400) + i) % 7 === 0 ? 1 : 0); fly = false; }
    else { const k = (tt - 8000 - d) / 2800; x = px0 + 70 * k * k + 30 * k; y = py0 - 80 * k * k - 12 * k; }
    x = Math.round(x); y = Math.round(y);
    if (!fly) { px(ctx, NV.bird, x, y, 3, 2); px(ctx, NV.bird, x + 3, y - 1); px(ctx, NV.beak, x + 4, y - 1); px(ctx, "#6a5a70", x, y); }
    else (Math.floor(t / 90 + i) % 2 ? BIRD_UP : BIRD_DN).forEach(([a, b]) => px(ctx, NV.bird, x + a, y + b));
  });
}

// ---- petites vies : papillons, libellule, feuilles, pollen ----
function drawButterfly(ctx, t, bx, by, ph, col) {
  const x = Math.round(bx + 34 * Math.sin(t * .0006 + ph) + 9 * Math.sin(t * .0021 + ph)), y = Math.round(by + 12 * Math.sin(t * .0009 + ph * 2) + 4 * Math.sin(t * .0037));
  const open = Math.floor(t / 110 + ph) % 2;
  if (open) { px(ctx, col, x - 2, y, 2, 2); px(ctx, col, x + 1, y, 2, 2); px(ctx, NV.ro, x, y, 1, 2); }
  else { px(ctx, col, x - 1, y, 1, 2); px(ctx, col, x + 1, y, 1, 2); px(ctx, NV.ro, x, y, 1, 2); }
  ctx.globalAlpha = .18; px(ctx, "#1a3a2a", x - 1, y + 9, 3, 1); ctx.globalAlpha = 1;
}
function drawDragonfly(ctx, t) {
  const seg = 1600, i = Math.floor(t / seg), k = (t % seg) / seg, e = k < .7 ? 0 : (k - .7) / .3, ee = e * e * (3 - 2 * e);
  const at = n => { const y = 30 + ((n * 37) % 140); return [riverX(y) + ((n * 13) % 15) - 7, y]; };
  const [x0, y0] = at(i), [x1, y1] = at(i + 1), x = Math.round(x0 + (x1 - x0) * ee), y = Math.round(y0 + (y1 - y0) * ee + Math.sin(t * .02) * .6);
  px(ctx, "#1f8a8a", x, y, 5, 1); px(ctx, "#2fb8b0", x, y); px(ctx, NV.ro, x + 4, y);
  if (Math.floor(t / 40) % 2) { px(ctx, "#e8f8ff", x + 1, y - 1, 2, 1); px(ctx, "#e8f8ff", x + 1, y + 1, 2, 1); }
}
const LEAVES = Array.from({ length: 7 }, (_, i) => ({ i, per: 6000 + i * 1300, off: i * 2300 }));
function drawLeaves(ctx, t, trees) {
  LEAVES.forEach(L => { const tt = (t + L.off) % L.per, [tx, ty, , R] = trees[L.i % trees.length];
    const sx = tx - R * .6 + (L.i * 17) % (R * 1.2), sy = ty - R * 1.6, fall = Math.min(tt / 3800, 1);
    const x = Math.round(sx + Math.sin(tt * .003 + L.i) * 5 + fall * 12), y = Math.round(sy + fall * (R * 1.6 + 4));
    if (tt > 5200) return; ctx.globalAlpha = tt > 4400 ? 1 - (tt - 4400) / 800 : 1;
    const c = L.i % 3 === 0 ? NV.leafo : NV.l3; px(ctx, c, x, y, Math.floor(tt / 250) % 2 ? 2 : 1, 1); if (Math.floor(tt / 250) % 2 === 0) px(ctx, c, x, y + 1);
    ctx.globalAlpha = 1; });
}
const MOTES = Array.from({ length: 22 }, (_, i) => { const r = rng(100 + i); return [r() * NW, r() * NH, r() * 6.28]; });
function drawMotes(ctx, t) {
  MOTES.forEach(([x, y, p]) => { const yy = ((y - t * .006) % NH + NH) % NH, xx = x + Math.sin(t * .0012 + p) * 6;
    const a = .5 + .5 * Math.sin(t * .004 + p); if (a < .25) return; ctx.globalAlpha = a * .9; px(ctx, "#fffbe0", Math.round(xx), Math.round(yy)); ctx.globalAlpha = 1; });
}
function drawCloudShadows(ctx, t) {
  ctx.globalAlpha = .07; ctx.fillStyle = "#0e2a3a";
  [[0, 50, 80, 26], [190, 150, 96, 30]].forEach(([ox, oy, rx, ry]) => { const cx = ((ox + t * .007) % (NW + rx * 2)) - rx;
    for (let j = -ry; j <= ry; j++) { const w = Math.round(rx * Math.sqrt(1 - (j / ry) ** 2) * (1 + .12 * Math.sin(j * .5))); ctx.fillRect(Math.round(cx - w), oy + j, w * 2, 1); } });
  ctx.globalAlpha = 1;
}

// ---- la scène ----
const NTREES = [[44, 96, 3, 26], [118, 60, 9, 20], [345, 128, 5, 28], [322, 216, 13, 22], [20, 218, 21, 20], [376, 40, 17, 18],
  [-6, 40, 31, 24], [34, 30, 33, 22], [84, 26, 37, 20], [158, 34, 41, 22], [210, 30, 43, 18], [326, 30, 47, 22], [380, 96, 51, 20], [150, 214, 53, 18]];
const BUSHES = [[96, 104, 61, 9], [150, 120, 63, 8], [300, 104, 67, 10], [276, 190, 69, 9], [64, 190, 71, 8], [366, 160, 73, 9]];
function renderNature(t) {
  const c = ctxOf("nature");
  c.drawImage(natureBackground(), 0, 0);
  renderWater(t); c.drawImage(waterCv, 0, 0);
  LILIES.forEach(([x, y, f]) => drawLily(c, t, x, y, f));
  drawFish(c, t);
  TUFTS.forEach(([x, y, h]) => drawTuft(c, t, x, y, h));
  const items = [];
  STONES.slice(0, 3).forEach(([x, y]) => items.push({ y: y + 2, fn: () => rock(c, x - 4, y - 2, 9, 5, false) }));
  items.push({ y: 62, fn: () => rock(c, STONES[3][0] - 2, 58, 6, 4, true) });
  items.push({ y: 176, fn: () => rock(c, 96, 158, 22, 17, true) }, { y: 177, fn: () => rock(c, 115, 168, 9, 8, false) }, { y: 80, fn: () => rock(c, 296, 68, 14, 11, true) }, { y: 123, fn: () => rock(c, 214, 116, 6, 4, false) });
  REEDS.forEach(([x, y, h, cat]) => items.push({ y, fn: () => drawReed(c, t, x, y, h, cat) }));
  NTREES.forEach(([x, y, seed, R]) => items.push({ y, fn: () => drawTree(c, t, x, y, seed, R) }));
  BUSHES.forEach(([x, y, seed, R]) => items.push({ y, fn: () => drawBush(c, t, x, y, seed, R) }));
  const hx = Math.round(riverX(146) - riverHW(146) - 26), hy = 120, fr = Math.floor(t / 700) % 2 ? dirFrames("E")[1] : idleRows("E");   // le héros respire au bord de l'eau
  items.push({ y: hy + 34, fn: () => { c.globalAlpha = .22; px(c, "#1a3a2a", hx + 3, hy + 32, 18, 3); c.globalAlpha = 1; drawSprite(c, fr, PAL, hx, hy); } });
  items.sort((a, b) => a.y - b.y).forEach(i => i.fn());
  drawLeaves(c, t, NTREES);
  drawBirds(c, t, [334, 74]);
  drawButterfly(c, t, 70, 70, 0, "#fff6d8"); drawButterfly(c, t, 310, 176, 2.1, T.fy);
  drawDragonfly(c, t);
  drawMotes(c, t);
  drawCloudShadows(c, t);
}
