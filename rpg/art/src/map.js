// ---------- Carte du village ----------
const MW = 560, MH = 360;
function segDist(px_, py_, ax, ay, bx, by) { const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1;
  const k = Math.max(0, Math.min(1, ((px_ - ax) * dx + (py_ - ay) * dy) / L)); return [Math.hypot(px_ - ax - k * dx, py_ - ay - k * dy), k, Math.sqrt(L)]; }
function riverAt(x, y) {          // [distance, abscisse le long du courant]
  let best = 1e9, s = 0, acc = 0;
  for (let i = 0; i < RIVER.length - 1; i++) { const [a, b] = [RIVER[i], RIVER[i + 1]], [d, k, L] = segDist(x, y, a[0], a[1], b[0], b[1]);
    if (d < best) { best = d; s = acc + k * L; } acc += L; }
  return [best, s];
}
const riverHalf = s => 10 + 2.5 * Math.sin(s / 37);
const nearPath = (x, y, m) => PATHS.some(p => p.slice(1).some((b, i) => segDist(x, y, p[i][0], p[i][1], b[0], b[1])[0] < m));
const inBuilding = (x, y, m = 0) => Object.entries(BUILD).some(([k, [bx, by]]) => { const [w, h] = k === "puits" ? [40, 40] : k === "lavoir" ? [52, 40] : k === "grange" ? [64, 62] : k === "moulin" ? [64, 62] : [72, 66];
  return x > bx - m && x < bx + w + m && y > by - 12 - m && y < by + h + m; });

// ---- fond fixe ----
let mapBg = null, WATER = null;
function mapBackground() {
  if (mapBg) return mapBg;
  const c = document.createElement("canvas"); c.width = MW; c.height = MH; const g = c.getContext("2d"), r = rng(21);
  for (let y = 0; y < MH; y += 16) for (let x = 0; x < MW; x += 16) grassTile(g, x, y);
  for (let k = 0; k < 26; k++) { const cx = r() * MW, cy = r() * MH, rx = 16 + r() * 26, ry = 8 + r() * 12;
    for (let y = Math.floor(cy - ry); y < cy + ry; y++) for (let x = Math.floor(cx - rx); x < cx + rx; x++)
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1 && (x + 2 * y) % 4 === 0) px(g, T.gd, x, y); }
  // champ près de la grange
  for (let y = 196; y < 238; y++) for (let x = 28; x < 104; x++) { const row = (y - 196) % 5;
    px(g, row === 0 ? "#8a6a3e" : row === 4 ? "#a88a50" : ((x + y) % 3 ? "#d8b85a" : "#c8a24a"), x, y); }
  for (let x = 26; x < 106; x += 4) { px(g, NV.tkd, x, 193, 1, 4); px(g, NV.tkd, x, 238, 1, 4); }
  px(g, NV.tk, 26, 194, 80, 1); px(g, NV.tk, 26, 239, 80, 1);
  // place pavée
  const [pcx, pcy, pr] = PLACE;
  for (let y = pcy - pr - 3; y <= pcy + pr + 3; y++) for (let x = pcx - pr - 3; x <= pcx + pr + 3; x++) { const d = Math.hypot(x - pcx, (y - pcy) * 1.25);
    if (d < pr) px(g, ((Math.floor(x / 4) + Math.floor(y / 3)) % 2) ? "#d9cdb0" : "#cfc2a2", x, y);
    if (d < pr && (x % 4 === 0 || y % 3 === 0)) px(g, "#b8aa88", x, y);
    if (d >= pr && d < pr + 2.5 && (x + y) % 2) px(g, T.sab, x, y); }
  // chemins
  PATHS.forEach(p => p.slice(1).forEach((b, i) => { const a = p[i], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]));
    for (let k = 0; k <= n; k++) { const x = a[0] + (b[0] - a[0]) * k / n, y = a[1] + (b[1] - a[1]) * k / n;
      for (let j = -6; j <= 6; j++) for (let i2 = -6; i2 <= 6; i2++) { const d = Math.hypot(i2, j), X = Math.round(x + i2), Y = Math.round(y + j);
        if (d < 4.6) px(g, T.sa, X, Y); } } }));
  PATHS.forEach(p => p.slice(1).forEach((b, i) => { const a = p[i], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 3);
    for (let k = 0; k <= n; k++) { const x = Math.round(a[0] + (b[0] - a[0]) * k / n), y = Math.round(a[1] + (b[1] - a[1]) * k / n); if (k % 2) px(g, T.sad, x + (k % 3) - 1, y + (k % 4) - 2); } }));
  // berges et eau (les pixels d'eau sont recalculés à chaque image)
  WATER = [];
  for (let y = 0; y < MH; y++) for (let x = 330; x < MW; x++) { const [d, s] = riverAt(x, y), hw = riverHalf(s), e = d - hw;
    if (e < 0) { WATER.push([x, y, d / hw, s]); continue; }
    if (e < 1) px(g, NV.wet, x, y); else if (e < 3) px(g, r() < .08 ? NV.sandd : NV.sand, x, y); else if (e < 4.5 && (x + y) % 2) px(g, NV.sand, x, y); }
  for (let k = 0; k < 70; k++) {                       // fleurs semées
    const x = Math.floor(r() * MW), y = Math.floor(r() * MH); if (riverAt(x, y)[0] < 16 || nearPath(x, y, 7) || inBuilding(x, y)) continue;
    const col = [T.fw, NV.pink, T.fy, "#b8a8f0"][k % 4]; px(g, "#4f8f3e", x, y + 1); px(g, col, x, y); if (k % 3 === 0) { px(g, col, x - 1, y); px(g, col, x + 1, y); px(g, col, x, y - 1); px(g, T.fy, x, y); } }
  return (mapBg = c);
}
const WCOL = Object.fromEntries(["wd","w","wm","wl","wh","foam"].map(k => [k, hex(NV[k])]));
const mapWaterCv = document.createElement("canvas"); mapWaterCv.width = MW; mapWaterCv.height = MH;
let mapWaterImg = null;
function renderMapWater(t) {
  if (!mapWaterImg) mapWaterImg = mapWaterCv.getContext("2d").createImageData(MW, MH);
  const d = mapWaterImg.data, flow = t * .018;
  WATER.forEach(([x, y, u, s]) => { const deep = 1 - u * u; let k = deep > .82 ? "wd" : deep > .45 ? "w" : deep > .18 ? "wm" : "wl";
    const yy = Math.floor(s - flow * (.7 + deep * .5)), band = Math.floor(yy / 4), cell = Math.floor((x + band * 3) / 6);
    const hsh = Math.abs(Math.sin(band * 12.9898 + cell * 78.233) * 43758.5453) % 1, inCell = (x + band * 3) % 6;
    if (deep > .1 && yy % 4 === 0 && hsh < .3 && inCell < 2 + Math.floor(hsh * 8) % 3) k = hsh < .07 ? "wh" : "wl";
    else if (deep > .7 && yy % 4 === 2 && hsh > .82 && inCell < 3) k = "wd";
    if (u > .88 && (x + y + Math.floor(t / 260)) % 3 === 0) k = "foam";
    if (Math.abs(x - 438) < 4 && y > 104 && y < 130 && (x + y + Math.floor(t / 120)) % 3) k = y < 116 ? "foam" : "wl";   // remous sous la roue
    const i = (y * MW + x) * 4, c = WCOL[k]; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; });
  mapWaterCv.getContext("2d").putImageData(mapWaterImg, 0, 0);
}

// ---- bâtiments ----
function withRoof(cols, fn) { const old = { rf: T.rf, rfd: T.rfd, rfl: T.rfl }; Object.assign(T, cols); fn(); Object.assign(T, old); }
function barberPole(ctx, x, y, t) {
  px(ctx, NV.ro, x - 1, y - 1, 5, 16); for (let k = 0; k < 14; k++) px(ctx, ((k + Math.floor(t / 180)) % 4) < 2 ? "#d2463c" : "#f4ead2", x, y + k, 3, 1);
  px(ctx, "#2a5e94", x, y + 6, 3, 1); px(ctx, T.fy, x, y - 1, 3, 1);
}
function barn(ctx, x, y) {
  const W = 64;
  px(ctx, T.fo, x + 2, y + 22, W - 4, 40); px(ctx, "#a8483a", x + 3, y + 23, W - 6, 38);
  for (let k = x + 6; k < x + W - 4; k += 5) px(ctx, "#8a3a30", k, y + 23, 1, 38);
  px(ctx, T.fo, x + 18, y + 34, 28, 28); px(ctx, "#6a4428", x + 19, y + 35, 26, 27); px(ctx, "#8a5a36", x + 19, y + 35, 13, 27);
  px(ctx, "#e8dcc0", x + 19, y + 35, 26, 2); for (let k = 0; k < 13; k++) { px(ctx, "#e8dcc0", x + 19 + k * 2, y + 37 + k * 2, 2, 2); px(ctx, "#e8dcc0", x + 43 - k * 2, y + 37 + k * 2, 2, 2); }
  px(ctx, T.fo, x + 26, y + 26, 12, 7); px(ctx, "#3a2a20", x + 27, y + 27, 10, 5); px(ctx, "#d8b85a", x + 28, y + 30, 8, 2);   // foin au grenier
  for (let r = 0; r < 24; r++) { const inset = Math.max(0, 12 - Math.floor(r / 2)), w = W - inset * 2;
    px(ctx, T.fo, x + inset - 1, y + r, w + 2, 1); px(ctx, r % 4 === 3 ? "#4a3a34" : r < 4 ? "#7a6a60" : "#5e4e46", x + inset, y + r, w, 1); }
  px(ctx, T.fo, x - 1, y + 23, W + 2, 1);
}
function mill(ctx, x, y, t) {
  const W = 60;
  px(ctx, T.fo, x + 2, y + 20, W - 4, 42);
  for (let j = 0; j < 40; j++) for (let i = 0; i < W - 6; i++) { const brick = (Math.floor((i + (Math.floor(j / 4) % 2) * 4) / 8) + Math.floor(j / 4)) % 3;
    px(ctx, (j % 4 === 3 || (i + (Math.floor(j / 4) % 2) * 4) % 8 === 7) ? "#7a7484" : brick ? "#b4aca0" : "#c8c0b2", x + 3 + i, y + 21 + j); }
  px(ctx, T.fo, x + 22, y + 40, 14, 22); px(ctx, "#6a4428", x + 23, y + 41, 12, 21); px(ctx, "#8a5a36", x + 23, y + 41, 12, 2);
  px(ctx, T.fo, x + 8, y + 30, 10, 9); px(ctx, T.win, x + 9, y + 31, 8, 7); px(ctx, T.wdd, x + 12, y + 31, 2, 7);
  px(ctx, T.fo, x + 40, y + 28, 10, 9); px(ctx, T.win, x + 41, y + 29, 8, 7); px(ctx, T.wdd, x + 44, y + 29, 2, 7);   // la fenêtre d'Élio
  for (let r = 0; r < 22; r++) { const inset = Math.max(0, 11 - Math.floor(r / 2)), w = W - inset * 2;
    px(ctx, T.fo, x + inset - 1, y + r, w + 2, 1); px(ctx, r % 4 === 3 ? "#5a3a24" : r < 4 ? "#a8784c" : "#8a5a38", x + inset, y + r, w, 1); }
  px(ctx, T.fo, x - 1, y + 21, W + 2, 1);
  px(ctx, "#5a5050", x + 12, y + 61, 10, 2); px(ctx, "#8a8080", x + 13, y + 61, 4, 1);   // cendre devant le moulin
}
function millWheel(ctx, x, y, t) {     // la roue tourne avec le courant
  const R = 12, a0 = t / 1100;
  ell(ctx, x, y, R + 1, R + 1, T.fo); ell(ctx, x, y, R, R, "#8a5a36"); ell(ctx, x, y, R - 2, R - 2, T.fo); ell(ctx, x, y, R - 3, R - 3, "#3a5e7a");
  for (let k = 0; k < 8; k++) { const a = a0 + k * Math.PI / 4, c = Math.cos(a), s = Math.sin(a);
    for (let r = 2; r < R - 2; r++) px(ctx, "#6a4428", Math.round(x + c * r), Math.round(y + s * r));
    px(ctx, T.fo, Math.round(x + c * (R + 1)) - 1, Math.round(y + s * (R + 1)) - 1, 3, 3); px(ctx, "#a8784c", Math.round(x + c * (R + 1)), Math.round(y + s * (R + 1))); }
  px(ctx, T.fo, x - 2, y - 2, 5, 5); px(ctx, "#8a8080", x - 1, y - 1, 3, 3);
  for (let k = 0; k < 3; k++) { const tt = (t / 500 + k / 3) % 1; px(ctx, NV.foam, Math.round(x - 6 + k * 6 + tt * 3), Math.round(y + R - 1 - tt * 4)); }   // éclaboussures
}
function washhouse(ctx, x, y, t) {     // le lavoir : un bassin sous un auvent
  px(ctx, T.fo, x, y + 16, 52, 22); px(ctx, "#b4aca0", x + 1, y + 17, 50, 20); px(ctx, "#8a8494", x + 1, y + 34, 50, 3);
  px(ctx, NV.ro, x + 5, y + 21, 42, 12); px(ctx, NV.w, x + 6, y + 22, 40, 10);
  for (let k = 0; k < 5; k++) px(ctx, NV.wl, x + 8 + ((k * 9 + Math.floor(t / 300)) % 36), y + 24 + (k % 3) * 3, 3, 1);
  px(ctx, "#cfc8bc", x + 6, y + 22, 40, 1);
  [[x + 2], [x + 46]].forEach(([px0]) => { px(ctx, T.fo, px0, y + 4, 5, 30); px(ctx, "#7a4a2c", px0 + 1, y + 5, 3, 28); });
  for (let r = 0; r < 10; r++) { px(ctx, T.fo, x - 3, y - 4 + r, 58, 1); px(ctx, r % 3 === 2 ? "#5a4a54" : r < 2 ? "#9a8a90" : "#7a6a74", x - 2, y - 4 + r, 56, 1); }
  px(ctx, "#f4ead2", x + 30, y + 18, 6, 3); px(ctx, "#c8d8f0", x + 37, y + 18, 5, 3);   // du linge posé sur la margelle
}
const DAY_WELL = { st:"#8a8e98", std:"#5e6270", stl:"#b4b8c2", so:"#2a2030", hole:"#14121a" };
function dayWell(ctx, x, y, t, night) { const old = {}; Object.keys(DAY_WELL).forEach(k => { old[k] = N[k]; if (!night) N[k] = DAY_WELL[k]; });
  drawWell(ctx, x, y, t, { swing: .4, crank: Math.PI, spill: night ? .22 : 0 }); Object.assign(N, old); }

// ---- habitants ----
const NPC_PAL = {
  margot: { ...CHILD_PAL, c:"#c44a6a", C:"#8e2e4a", l:"#ea7a92", h:"#c8562c", H:"#8e3a1e", j:"#ec8a50" },
  basile: { ...CHILD_PAL, c:"#5a8a4a", C:"#3e6634", l:"#86b46a", h:"#2e2a36", H:"#1c1822", j:"#4a4458" },
  elio: FRIEND_PAL,
  mere: { ...PAL, c:"#8a5aa0", C:"#5e3a74", l:"#b48ad0", h:"#7a4a2a", H:"#5a3420", j:"#a06a40", a:"#f4ead2", A:"#c9c0aa", r:"#ffffff" },
  fauvel: { ...PAL, c:"#f4ead2", C:"#c9c0aa", l:"#ffffff", h:"#9a9aa8", H:"#6a6a78", j:"#c4c4d0", a:"#2a5e94", A:"#1e4470" },
  aubin: { ...PAL, c:"#6a5a4a", C:"#4a3e34", l:"#8a7a66", h:"#3a3040", H:"#241e2a", j:"#5a5060", a:"#8a8494", A:"#5e5a68" },
};
let mapSprites = null;
function npcSprites() { return mapSprites || (mapSprites = { child: CHILD(), childBob: bobUpper(CHILD(), 23), adult: ADULT(), adultBob: bobUpper(ADULT(), 27) }); }

// ---- arbres, buissons, herbes, roseaux ----
const MTREES = [], MBUSH = [], MTUFTS = [], MREEDS = [];
{ const r = rng(5), ok = (x, y, m) => riverAt(x, y)[0] > riverHalf(0) + m && !nearPath(x, y, 8) && !inBuilding(x, y, 6) && Math.hypot(x - PLACE[0], (y - PLACE[1]) * 1.25) > PLACE[2] + 8 && !(x > 22 && x < 108 && y > 186 && y < 246);
  for (let k = 0; k < 400 && MTREES.length < 60; k++) {        // forêt dense à l'ouest et au nord, quelques arbres ailleurs
    const zone = k % 3, x = zone === 0 ? r() * 60 - 10 : zone === 1 ? r() * MW : r() * MW, y = zone === 0 ? r() * MH + 10 : zone === 1 ? r() * 40 + 4 : r() * MH + 10;
    const R = 16 + Math.floor(r() * 10); if (zone === 2 && r() < .75) continue;
    if (ok(x, y, 14) && !MTREES.some(([a, b]) => Math.hypot(a - x, (b - y) * 1.4) < R * 1.1)) MTREES.push([Math.round(x), Math.round(y), 100 + k, R]); }
  MTREES.push([250, 196, 7, 28]);                              // le grand tilleul de la place
  for (let k = 0; k < 40 && MBUSH.length < 16; k++) { const x = r() * MW, y = r() * MH; if (ok(x, y, 8)) MBUSH.push([Math.round(x), Math.round(y), 300 + k, 8 + Math.floor(r() * 3)]); }
  for (let k = 0; k < 7; k++) MBUSH.push([352 + k * 9, 236 + (k % 2), 400 + k, 7]);    // la haie entre le lavoir et le puits
  while (MTUFTS.length < 220) { const cx = r() * MW, cy = 8 + r() * (MH - 8); for (let n = 0; n < 4; n++) { const x = Math.round(cx + r() * 14 - 7), y = Math.round(cy + r() * 6 - 3); if (ok(x, y, 4)) MTUFTS.push([x, y, 4 + Math.floor(r() * 4)]); } }
  MTUFTS.sort((a, b) => a[1] - b[1]);
  for (let k = 0; k < 12; k++) { const y0 = 20 + r() * 320; if (y0 > 180 && y0 < 214 || y0 > 90 && y0 < 132) continue;
    for (let x = 340; x < MW; x++) { const [d, s] = riverAt(x, y0); if (Math.abs(d - riverHalf(s) - 1.5) < .6) { for (let n = 0; n < 4; n++) MREEDS.push([x + n * (k % 2 ? 1 : -1), Math.round(y0) + n % 2 * 2, 8 + Math.floor(r() * 6), n % 2 === 0]); break; } } } }

// ---- rendu ----
const mapState = { night: false, day: 0, sel: null };
function renderMap(t) {
  const c = ctxOf("map"), S = npcSprites(), night = mapState.night;
  c.drawImage(mapBackground(), 0, 0);
  renderMapWater(t); c.drawImage(mapWaterCv, 0, 0);
  // pont
  px(c, T.fo, 410, 186, 30, 20); for (let k = 0; k < 28; k += 3) { px(c, "#8a5a36", 411 + k, 187, 2, 18); px(c, "#a8784c", 411 + k, 187, 2, 1); }
  px(c, "#5a3a24", 410, 186, 30, 2); px(c, "#5a3a24", 410, 204, 30, 2);
  MTUFTS.forEach(([x, y, h]) => drawTuft(c, t, x, y, h));
  const items = [];
  MREEDS.forEach(([x, y, h, cat]) => items.push({ y, fn: () => drawReed(c, t, x, y, h, cat) }));
  VITEMS.forEach(o => items.push({ y: o.R ? o.y : vBottom(o), fn: () => vDraw(c, t, o) }));
  const B = BUILD;
  items.push({ y: B.maison[1] + 63, fn: () => cottage(c, ...B.maison) });
  items.push({ y: B.barbier[1] + 63, fn: () => { withRoof({ rf: "#3a7cb6", rfd: "#2a5e94", rfl: "#6aa6d4" }, () => cottage(c, ...B.barbier)); barberPole(c, B.barbier[0] + 22, B.barbier[1] + 44, t); } });
  items.push({ y: B.maisonA[1] + 63, fn: () => withRoof({ rf: "#5a8a4a", rfd: "#3e6634", rfl: "#86b46a" }, () => cottage(c, ...B.maisonA)) });
  items.push({ y: B.maisonB[1] + 63, fn: () => withRoof({ rf: "#c88a3a", rfd: "#9a6428", rfl: "#e8b060" }, () => cottage(c, ...B.maisonB)) });
  items.push({ y: B.grange[1] + 61, fn: () => barn(c, ...B.grange) });
  items.push({ y: B.moulin[1] + 61, fn: () => mill(c, B.moulin[0], B.moulin[1], t) }, { y: B.moulin[1] + 62, fn: () => millWheel(c, 436, 100, t) });
  items.push({ y: B.lavoir[1] + 37, fn: () => washhouse(c, ...B.lavoir, t) });
  items.push({ y: B.puits[1] + 30, fn: () => dayWell(c, B.puits[0], B.puits[1], t, night) });
  // habitants (de jour)
  const bob = Math.floor(t / 600) % 2;
  if (!night) [["margot", 226, 196, 0], ["elio", 252, 214, 1], ["basile", 274, 200, 0], ["hero", 142, 116, 1]].forEach(([n, x, y, ph]) =>
    items.push({ y: y + 27, fn: () => { c.globalAlpha = .22; px(c, "#1a3a2a", x + 3, y + 25, 16, 3); c.globalAlpha = 1; drawSprite(c, (bob + ph) % 2 ? S.childBob : S.child, n === "hero" ? CHILD_PAL : NPC_PAL[n], x, y); } }));
  if (!night) [["mere", 66, 166, 0], ["fauvel", 300, 110, 1], ["aubin", 412, 120, 0]].forEach(([n, x, y, ph]) =>
    items.push({ y: y + 34, fn: () => { c.globalAlpha = .22; px(c, "#1a3a2a", x + 3, y + 32, 18, 3); c.globalAlpha = 1; drawSprite(c, (bob + ph) % 2 ? S.adultBob : S.adult, NPC_PAL[n], x, y); } }));
  items.sort((a, b) => a.y - b.y).forEach(i => i.fn());
  // fumée des cheminées
  [B.maison, B.barbier, B.maisonA, B.maisonB].forEach(([x, y], i) => { for (let k = 0; k < 4; k++) { const tt = (t / 1600 + k / 4 + i * .3) % 1;
    c.globalAlpha = (1 - tt) * .55; px(c, night ? "#8890a8" : "#f4f4f4", Math.round(x + 52 + Math.sin(tt * 6 + i) * 2 + tt * 6), Math.round(y - 12 - tt * 22), tt < .5 ? 2 : 3, 2); } c.globalAlpha = 1; });
  if (!night) { const trees = VITEMS.filter(o => o.type === "arbre"), perch = VITEMS.find(o => o.id === "tilleul");
    drawLeaves(c, t, trees.slice(0, 7).map(o => [o.x, o.y, o.seed, o.R])); drawBirds(c, t, perch ? [perch.x - 6, perch.y - 46] : [244, 150]); drawButterfly(c, t, 120, 300, 0, "#fff6d8"); drawButterfly(c, t, 520, 250, 2, T.fy); }
  // ombre des nuages / nuit
  if (!night) { c.globalAlpha = .07; c.fillStyle = "#0e2a3a";
    [[0, 80, 90, 30], [260, 260, 110, 34]].forEach(([ox, oy, rx, ry]) => { const cx = ((ox + t * .007) % (MW + rx * 2)) - rx;
      for (let j = -ry; j <= ry; j++) { const w = Math.round(rx * Math.sqrt(1 - (j / ry) ** 2)); c.fillRect(Math.round(cx - w), oy + j, w * 2, 1); } }); c.globalAlpha = 1; }
  else renderNight(c, t);
}
function renderNight(c, t) {
  c.globalCompositeOperation = "multiply"; c.fillStyle = "#3c4a8c"; c.fillRect(0, 0, MW, MH);
  c.globalCompositeOperation = "source-over"; c.globalAlpha = .25; c.fillStyle = "#0a0e24"; c.fillRect(0, 0, MW, MH); c.globalAlpha = 1;
  const glow = (x, y, r, col, a) => { c.fillStyle = col; for (let k = r; k > 0; k -= 2) { c.globalAlpha = a * (1 - k / r) * .45;
    for (let j = -k; j <= k; j++) { const w = Math.round(Math.sqrt(k * k - j * j)); c.fillRect(x - w, y + j, w * 2, 1); } } c.globalAlpha = 1; };
  // fenêtres allumées (la bougie du héros vacille)
  const B = BUILD, flick = .8 + .2 * Math.sin(t / 90) * Math.sin(t / 37);
  const wins = [[B.maison, 10, 38, 1], [B.maison, 50, 38, flick], [B.barbier, 50, 38, 1], [B.maisonA, 10, 38, 1], [B.maisonB, 50, 38, 1]];
  wins.forEach(([[x, y], dx, dy, f]) => { glow(x + dx + 6, y + dy + 5, 14, "#ffd86a", f); px(c, "#ffe08a", x + dx + 1, y + dy + 1, 10, 9); px(c, "#c89a3a", x + dx + 5, y + dy + 1, 2, 9); px(c, "#c89a3a", x + dx + 1, y + dy + 5, 10, 1); });
  glow(B.moulin[0] + 45, B.moulin[1] + 33, 12, "#ffd86a", .8); px(c, "#ffe08a", B.moulin[0] + 41, B.moulin[1] + 29, 8, 7);
  // le puits chante : de petites notes violettes remontent
  const [wx, wy] = B.puits; glow(wx + 18, wy + 22, 18, "#9a6ad8", .6 + .2 * Math.sin(t / 400));
  for (let k = 0; k < 3; k++) { const tt = (t / 2200 + k / 3) % 1; c.globalAlpha = 1 - tt; px(c, "#c8a8ff", Math.round(wx + 14 + k * 4 + Math.sin(tt * 8 + k) * 3), Math.round(wy + 14 - tt * 26), 1, 2); px(c, "#c8a8ff", Math.round(wx + 15 + k * 4 + Math.sin(tt * 8 + k) * 3), Math.round(wy + 13 - tt * 26)); } c.globalAlpha = 1;
  // Aubin et sa lanterne, à la lisière
  const lx = Math.round(40 + Math.sin(t / 2600) * 26), ly = Math.round(262 + Math.sin(t / 1700) * 8);
  glow(lx, ly, 22, "#ffcf6a", .9); px(c, NV.ro, lx - 2, ly - 3, 5, 6); px(c, "#ffe8a0", lx - 1, ly - 2, 3, 4);
  // lucioles près de l'eau
  for (let i = 0; i < 14; i++) { const x = Math.round(380 + hash(i) * 170 + Math.sin(t / 900 + i) * 8), y = Math.round(hash(i + 9) * MH + Math.cos(t / 700 + i * 2) * 6);
    const a = .5 + .5 * Math.sin(t / 300 + i * 3); if (a > .3) { c.globalAlpha = a; px(c, "#e8ff8a", x, y); c.globalAlpha = 1; } }
}

// ---- interface : zoom, déplacement, lieux ----
const view = { z: 1, x: 0, y: 0, base: 1 };
function layoutView() {
  const box = document.getElementById("map-view"), W = box.clientWidth, H = box.clientHeight;
  view.base = Math.max(W / MW, H / MH); clampView(); applyView();
}
function clampView() { const box = document.getElementById("map-view"), W = box.clientWidth, H = box.clientHeight, s = view.base * view.z;
  view.x = Math.min(0, Math.max(W - MW * s, view.x)); view.y = Math.min(0, Math.max(H - MH * s, view.y));
  if (MW * s < W) view.x = (W - MW * s) / 2; if (MH * s < H) view.y = (H - MH * s) / 2; }
function applyView() { const s = view.base * view.z;
  document.getElementById("map-layer").style.transform = `translate(${view.x}px, ${view.y}px) scale(${s})`;
  document.querySelectorAll(".pin").forEach(p => p.style.transform = `translate(-50%, -100%) scale(${1 / s})`);
  document.getElementById("zoom-level").textContent = "×" + view.z; }
function zoomTo(z, cx, cy) { const box = document.getElementById("map-view"); cx ??= box.clientWidth / 2; cy ??= box.clientHeight / 2;
  const s0 = view.base * view.z, wx = (cx - view.x) / s0, wy = (cy - view.y) / s0; view.z = Math.max(1, Math.min(4, z));
  const s1 = view.base * view.z; view.x = cx - wx * s1; view.y = cy - wy * s1; clampView(); applyView(); }
function focusPlace(p) { const box = document.getElementById("map-view"); if (view.z < 2) view.z = 2; const s = view.base * view.z;
  view.x = box.clientWidth / 2 - p.at[0] * s; view.y = box.clientHeight / 2 - (p.at[1] + 30) * s; clampView(); applyView(); }
const MOMENT_ORDER = ["matin", "fin de matinée", "midi", "après-midi", "soir", "veillée"];
function placeInfo(p) {
  const day = mapState.day, night = mapState.night;
  const sc = (p.scenes || []).filter(s => !day || s[0] === day), ni = (p.nights || []).filter(n => !day || n[0] === day);
  let html = `<h3>${p.name}</h3><p class="lieu-desc">${p.text}</p>`;
  const list = [...(night ? [] : sc.map(s => `<li><span class="when">Jour ${s[0]}, ${s[1]}</span><b>${s[2]}</b>${s[3] ? `<span class="who">${s[3]}</span>` : ""}<q>${s[4]}</q></li>`)),
    ...ni.map(n => `<li class="nuit"><span class="when">Nuit ${n[0]}</span><q>${n[1]}</q></li>`)];
  if (night) list.push(...sc.map(s => `<li class="dim"><span class="when">Jour ${s[0]}, ${s[1]}</span><b>${s[2]}</b></li>`));
  html += list.length ? `<ul class="events">${list.join("")}</ul>` : `<p class="lieu-desc">Rien de prévu ici ${day ? "ce jour-là" : ""}${night ? " la nuit" : ""}.</p>`;
  if (INTERIORS.entries[p.id]) html += `<button type="button" class="pal" data-enter="${p.id}">Entrer</button>`;
  return html;
}
function hasEvent(p) { const day = mapState.day; return mapState.night ? (p.nights || []).some(n => !day || n[0] === day) : (p.scenes || []).some(s => !day || s[0] === day); }
function refreshPins() {
  PLACES.forEach(p => { const el = document.getElementById("pin-" + p.id), li = document.getElementById("li-" + p.id), on = hasEvent(p);
    el.classList.toggle("off", !on); el.setAttribute("aria-pressed", mapState.sel === p.id); li.classList.toggle("off", !on); li.setAttribute("aria-pressed", mapState.sel === p.id); });
  if (roomUI.id) return;
  const p = PLACES.find(q => q.id === mapState.sel); document.getElementById("map-info").innerHTML = p ? placeInfo(p) : `<p class="lieu-desc">Touche un lieu sur la carte ou dans la liste pour voir ce qui s'y passe. La maison, la grange, le barbier et le moulin se visitent de l'intérieur.</p>`;
  document.querySelectorAll("[data-enter]").forEach(b => b.addEventListener("click", () => openRoom(INTERIORS.entries[b.dataset.enter])));
}
function select(id, focus) { mapState.sel = id; refreshPins(); if (focus) focusPlace(PLACES.find(p => p.id === id)); }
function bindMap() {
  const layer = document.getElementById("map-layer"), list = document.getElementById("map-list"), box = document.getElementById("map-view");
  PLACES.forEach((p, i) => {
    const b = document.createElement("button"); b.className = "pin"; b.id = "pin-" + p.id; b.type = "button"; b.style.left = p.at[0] + "px"; b.style.top = p.at[1] + "px";
    b.innerHTML = `<span class="num">${i + 1}</span><span class="lbl">${p.name}${INTERIORS.entries[p.id] ? " · entrer" : ""}</span>`; b.addEventListener("click", e => { e.stopPropagation(); select(p.id, false); if (INTERIORS.entries[p.id]) openRoom(INTERIORS.entries[p.id]); });
    layer.appendChild(b);
    const li = document.createElement("button"); li.type = "button"; li.className = "place-btn"; li.id = "li-" + p.id; li.innerHTML = `<span class="num">${i + 1}</span>${p.name}`;
    li.addEventListener("click", () => select(p.id, true)); list.appendChild(li);
  });
  // glisser pour se déplacer, molette ou pincement pour zoomer
  const pts = new Map(); let pinch0 = 0, z0 = 1;
  box.addEventListener("pointerdown", e => { if (e.target.closest(".pin, #room-view, .map-tools")) return; box.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]); z0 = view.z; } });
  box.addEventListener("pointermove", e => { if (!pts.has(e.pointerId)) return; const [ox, oy] = pts.get(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 1) { view.x += e.clientX - ox; view.y += e.clientY - oy; clampView(); applyView(); }
    else if (pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]), r = box.getBoundingClientRect();
      const z = Math.round(z0 * d / pinch0); if (z !== view.z) zoomTo(z, (a[0] + b[0]) / 2 - r.left, (a[1] + b[1]) / 2 - r.top); } });
  const up = e => pts.delete(e.pointerId); box.addEventListener("pointerup", up); box.addEventListener("pointercancel", up);
  box.addEventListener("wheel", e => { if (roomUI.id) return; e.preventDefault(); const r = box.getBoundingClientRect(); zoomTo(view.z + (e.deltaY < 0 ? 1 : -1), e.clientX - r.left, e.clientY - r.top); }, { passive: false });
  document.getElementById("zoom-in").addEventListener("click", () => zoomTo(view.z + 1));
  document.getElementById("zoom-out").addEventListener("click", () => zoomTo(view.z - 1));
  document.getElementById("zoom-fit").addEventListener("click", () => { view.z = 1; clampView(); applyView(); });
  document.querySelectorAll("[data-day]").forEach(b => b.addEventListener("click", () => { mapState.day = +b.dataset.day;
    document.querySelectorAll("[data-day]").forEach(o => o.setAttribute("aria-pressed", o === b)); refreshPins(); }));
  const nb = document.getElementById("night"); nb.addEventListener("click", () => { mapState.night = !mapState.night; nb.setAttribute("aria-pressed", mapState.night);
    nb.textContent = mapState.night ? "Passer au jour" : "Passer à la nuit"; document.getElementById("map-view").classList.toggle("is-night", mapState.night); refreshPins(); });
  window.addEventListener("resize", layoutView); new ResizeObserver(layoutView).observe(box);
  layoutView(); refreshPins();
}
