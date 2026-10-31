// ---------- Intérieurs : dessin des sols, murs et meubles ----------
// drawRoom(ctx, room, t, opts) dessine une carte « piece » (rpg/data/maps) dans un canvas de room.w*16 x room.h*16.
// Les meubles sont dans FURNI : une fonction par type, (ctx, x, y, w, h, t, night, état, objet) en pixels.
const IC = { o:"#2a2030", wood:"#a8784c", woodl:"#c8945e", woodd:"#7a4e30", woodk:"#4e3020", plaster:"#f0e4c8", plasterd:"#d8c8a4",
  stone:"#b4aca0", stoned:"#8e8678", stonel:"#cfc8bc", dirt:"#b0905e", dirtd:"#94764a", straw:"#e8cc6a", strawd:"#c8a440",
  red:"#c44a3a", redd:"#8e3030", redl:"#e87a5a", blue:"#3a7cb6", blued:"#2a5e94", cloth:"#f4ead2", clothd:"#d4c4a4", iron:"#6a6a78", ironl:"#a4a4b4",
  fire:"#ffb03a", firel:"#fff0a0", fired:"#e0602a", glass:"#7ab8e0", glassl:"#cfe8f8", night:"#1c2a5a", moon:"#e8eef8", green:"#5fae48", greend:"#3f8a3c", milk:"#fbf8f0" };
function box(g, x, y, w, h, fill, edge = IC.o) { g.fillStyle = edge; g.fillRect(x, y, w, h); g.fillStyle = fill; g.fillRect(x + 1, y + 1, w - 2, h - 2); }
function fill(g, col, x, y, w = 1, h = 1) { g.fillStyle = col; g.fillRect(x, y, w, h); }
function hash2(x, y) { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); }

// ---- sols ----
const FLOORS = {
  bois(g, W, H) { for (let y = 32; y < H; y++) { const row = Math.floor((y - 32) / 5);
    for (let x = 0; x < W; x++) { const seam = (y - 32) % 5 === 4, end = (x + row * 23) % 37 === 0;
      fill(g, seam || end ? IC.woodd : (hash2(row, Math.floor((x + row * 23) / 37)) > .5 ? IC.wood : "#b4844e"), x, y);
      if (!seam && !end && (x * 7 + y * 3) % 29 === 0) fill(g, IC.woodl, x, y); } } },
  pierre(g, W, H) { for (let y = 32; y < H; y++) for (let x = 0; x < W; x++) { const r = Math.floor((y - 32) / 8), off = r % 2 ? 6 : 0, c = Math.floor((x + off) / 12);
    const seam = (y - 32) % 8 === 7 || (x + off) % 12 === 11; fill(g, seam ? IC.stoned : hash2(r, c) > .6 ? IC.stonel : IC.stone, x, y); } },
  terre(g, W, H) { for (let y = 32; y < H; y++) for (let x = 0; x < W; x++) { const h = hash2(x, y); fill(g, h > .93 ? IC.dirtd : IC.dirt, x, y); }
    for (let k = 0; k < W * H / 60; k++) { const x = Math.floor(hash2(k, 1) * W), y = 32 + Math.floor(hash2(k, 2) * (H - 32)), d = hash2(k, 3) > .5 ? 1 : -1;
      fill(g, IC.straw, x, y, 3, 1); fill(g, IC.strawd, x + 1 + d, y + 1, 2, 1); } },
  damier(g, W, H) { for (let y = 32; y < H; y++) for (let x = 0; x < W; x++) fill(g, (Math.floor(x / 8) + Math.floor((y - 32) / 8)) % 2 ? "#e8dcc0" : "#7a5a40", x, y); },
};
// ---- murs du fond (2 tuiles) ----
const WALLS = {
  platre(g, W) { fill(g, IC.plaster, 0, 0, W, 32); fill(g, IC.plasterd, 0, 0, W, 3);
    for (let x = 0; x < W; x += 48) fill(g, IC.woodd, x + 22, 0, 4, 24);
    fill(g, IC.woodd, 0, 22, W, 10); fill(g, IC.wood, 0, 23, W, 1); for (let x = 4; x < W; x += 8) fill(g, IC.woodk, x, 24, 1, 8); },
  planches(g, W) { for (let x = 0; x < W; x++) fill(g, x % 6 === 5 ? IC.woodk : (hash2(Math.floor(x / 6), 9) > .5 ? IC.woodd : "#6a4428"), x, 0, 1, 32);
    for (let x = 0; x < W; x += 6) if (hash2(x, 3) > .6) fill(g, IC.woodk, x + 2, 6 + Math.floor(hash2(x, 4) * 18), 1, 1); },
  pierre(g, W) { for (let y = 0; y < 32; y++) for (let x = 0; x < W; x++) { const r = Math.floor(y / 6), off = r % 2 ? 5 : 0;
    fill(g, y % 6 === 5 || (x + off) % 10 === 9 ? "#6e6878" : hash2(r, Math.floor((x + off) / 10)) > .5 ? "#a49c94" : "#948c84", x, y); } },
};

// ---- meubles ----
const FURNI = {
  cheminee(g, x, y, w, h, t) {
    box(g, x, y, w, h - 4, IC.stone); for (let j = y + 2; j < y + h - 6; j += 5) for (let i = x + 2 + ((j - y) % 10 ? 0 : 4); i < x + w - 3; i += 8) fill(g, IC.stoned, i, j, 6, 1);
    box(g, x + 8, y + 18, w - 16, h - 20, "#1a1418"); box(g, x - 2, y + 14, w + 4, 5, IC.woodd);   // foyer et linteau
    fill(g, IC.woodk, x + 12, y + h - 7, w - 24, 3);
    for (let k = 0; k < 5; k++) { const fx = x + 13 + k * 5, fh = 6 + Math.round(3 * Math.sin(t / 90 + k * 1.7) + 2 * Math.sin(t / 47 + k));
      fill(g, IC.fired, fx, y + h - 7 - fh, 4, fh); fill(g, IC.fire, fx + 1, y + h - 6 - fh + 2, 2, fh - 2); fill(g, IC.firel, fx + 1, y + h - 8, 2, 2); }
    fill(g, IC.stonel, x + 1, y + 1, w - 2, 1); },
  etagere(g, x, y, w, h) { [10, 22].forEach(dy => { box(g, x, y + dy, w, 4, IC.wood); });
    [[2, 4, IC.red], [8, 5, IC.blue], [14, 3, IC.green], [20, 5, IC.cloth], [26, 4, IC.redd]].forEach(([dx, hh, c], i) => { if (dx + 5 > w) return;
      box(g, x + dx, y + 10 - hh - 2, 5, hh + 2, c); box(g, x + dx + (i % 2), y + 22 - hh - 3, 5, hh + 3, i % 2 ? IC.clothd : "#9a7a5a"); }); },
  fenetre(g, x, y, w, h, t, night, st, o) {
    box(g, x + 4, y + 4, w - 8, 18, IC.woodd); fill(g, night ? IC.night : IC.glass, x + 6, y + 6, w - 12, 14);
    if (o && o.ouverte) { fill(g, night ? "#101830" : "#cfe8f8", x + 6, y + 6, w - 12, 14); const sw = Math.round(Math.sin(t / 260) * 3);   // grande ouverte, le rideau bat
      fill(g, IC.red, x + 2, y + 3, 5 + Math.max(0, sw), 20); fill(g, IC.redd, x + 2, y + 3, 1, 20); fill(g, IC.red, x + w - 7 + Math.min(0, sw), y + 3, 5 - Math.min(0, sw), 20); box(g, x + 2, y + 22, w - 4, 4, IC.wood);
      if (night) fill(g, IC.moon, x + w - 12, y + 8, 3, 3); if (o.cheveux) for (let i = 0; i < w - 6; i += 2) fill(g, i % 4 ? "#1a1418" : "#2e2a36", x + 3 + i, y + 22, 1, 3 + (i * 7) % 5); return; }
    if (night) fill(g, IC.moon, x + w - 12, y + 8, 3, 3); else fill(g, IC.glassl, x + 6, y + 6, 6, 5);
    fill(g, IC.woodd, x + w / 2 - 1, y + 6, 2, 14); fill(g, IC.woodd, x + 6, y + 12, w - 12, 2);
    fill(g, IC.red, x + 2, y + 3, 4, 20); fill(g, IC.red, x + w - 6, y + 3, 4, 20); fill(g, IC.redd, x + 2, y + 3, 1, 20); fill(g, IC.redd, x + w - 3, y + 3, 1, 20);
    box(g, x + 2, y + 22, w - 4, 4, IC.wood); },
  porte(g, x, y, w, h) { box(g, x + 1, y + 6, w - 2, h - 6, "#6a4428"); fill(g, IC.wood, x + 3, y + 8, w - 6, 1); fill(g, IC.woodk, x + 8, y + 10, 1, h - 12); fill(g, "#f2c64a", x + w - 5, y + 20, 2, 2); },
  fauteuil(g, x, y, w, h, t) { const r = Math.round(Math.sin(t / 700));
    box(g, x + 4, y + 2 + r, w - 8, 14, IC.redd); box(g, x + 6, y + 4 + r, w - 12, 10, IC.red); box(g, x + 3, y + 14, w - 6, 12, IC.red); fill(g, IC.redl, x + 5, y + 15, w - 10, 2);
    fill(g, IC.woodk, x + 2, y + 26, 2, 4); fill(g, IC.woodk, x + w - 4, y + 26, 2, 4); fill(g, IC.woodd, x + 1, y + 29, w - 2, 2); },
  tapis(g, x, y, w, h) { box(g, x + 2, y + 2, w - 4, h - 4, IC.redd); fill(g, IC.red, x + 4, y + 4, w - 8, h - 8);
    for (let i = x + 6; i < x + w - 6; i += 6) fill(g, "#f2c64a", i, y + 6, 2, h - 12); fill(g, IC.redl, x + 4, y + 4, w - 8, 1); },
  table(g, x, y, w, h) { box(g, x, y + 2, w, h - 8, IC.wood); fill(g, IC.woodl, x + 1, y + 3, w - 2, 1); box(g, x, y + h - 7, w, 4, IC.woodd);
    fill(g, IC.woodk, x + 2, y + h - 3, 3, 3); fill(g, IC.woodk, x + w - 5, y + h - 3, 3, 3); },
  chaise(g, x, y) { box(g, x + 3, y, 10, 8, IC.woodd); box(g, x + 3, y + 7, 10, 6, IC.wood); fill(g, IC.woodk, x + 4, y + 13, 2, 3); fill(g, IC.woodk, x + 10, y + 13, 2, 3); },
  bol(g, x, y, w, h, t, night, st, o) { const e = o && o.etat;
    if (e === "retourne") { box(g, x + 4, y + 7, 8, 5, IC.cloth); fill(g, IC.clothd, x + 5, y + 8, 6, 1); return; }
    box(g, x + 4, y + 6, 8, 5, IC.cloth); fill(g, e === "bu" ? IC.clothd : IC.milk, x + 5, y + 6, 6, 2); fill(g, IC.clothd, x + 5, y + 9, 6, 1); if (!(o && o.sans_pain)) fill(g, "#e0b070", x + 10, y + 4, 4, 3); },
  tonneau(g, x, y) { box(g, x + 2, y - 4, 12, 18, IC.wood); fill(g, IC.iron, x + 2, y - 1, 12, 1); fill(g, IC.iron, x + 2, y + 9, 12, 1); fill(g, IC.woodl, x + 4, y - 3, 2, 16); box(g, x + 3, y - 5, 10, 4, IC.woodd); },
  plante(g, x, y) { box(g, x + 4, y + 6, 8, 9, "#b0603a"); fill(g, "#d07a4a", x + 5, y + 7, 2, 6);
    [[-2, -6], [3, -9], [7, -5], [0, -2], [6, 0]].forEach(([a, b]) => { box(g, x + 4 + a, y + 4 + b, 6, 5, IC.greend); fill(g, IC.green, x + 5 + a, y + 5 + b, 3, 2); }); },
  marmite(g, x, y, w, h, t) { box(g, x + 1, y + 4, 14, 10, "#3a3440"); fill(g, "#5a5464", x + 2, y + 5, 12, 2); fill(g, "#a8c86a", x + 3, y + 5, 10, 1);
    const k = Math.floor(t / 300) % 3; fill(g, "#f4f4f4", x + 4 + k * 3, y + 1 - k, 2, 2); },
  lit(g, x, y, w, h, t, night, st, o) { box(g, x, y, w, h, IC.woodd); box(g, x + 2, y + 2, w - 4, 10, IC.cloth); fill(g, IC.clothd, x + 3, y + 9, w - 6, 2);
    if (o && o.vide) { fill(g, IC.woodk, x + 2, y + 12, w - 4, h - 14); for (let j = 0; j < 14; j++) fill(g, j % 3 ? IC.blue : IC.blued, x + w - 6 + Math.round(Math.sin(j / 3) * 2), y + h - 6 + j, 8, 1); return; }   // lit vide, drap traîné jusqu'au sol
    box(g, x + 1, y + 12, w - 2, h - 14, IC.blue); for (let j = y + 15; j < y + h - 3; j += 6) for (let i = x + 3; i < x + w - 3; i += 6) fill(g, IC.blued, i, j, 3, 3);
    fill(g, "#6aa6d4", x + 2, y + 13, w - 4, 1); },
  chevet(g, x, y) { box(g, x + 1, y + 2, 14, 13, IC.wood); fill(g, IC.woodl, x + 2, y + 3, 12, 1); fill(g, IC.woodk, x + 7, y + 9, 2, 1); },
  bougie(g, x, y, w, h, t, night, st) { box(g, x + 5, y + 3, 6, 4, "#c8a040"); fill(g, IC.cloth, x + 7, y - 2, 2, 5);
    if (!(st && st.blown)) { const f = Math.round(Math.sin(t / 70)); fill(g, IC.fire, x + 7, y - 6 + f, 2, 4); fill(g, IC.firel, x + 7, y - 4 + f, 1, 2); } },
  coffre(g, x, y, w, h) { box(g, x, y + 2, w, h + 2, IC.woodd); box(g, x + 1, y + 2, w - 2, 6, IC.wood); fill(g, IC.iron, x + 4, y + 2, 2, h + 1); fill(g, IC.iron, x + w - 6, y + 2, 2, h + 1); fill(g, "#f2c64a", x + w / 2 - 1, y + 7, 3, 3); },
  poutre(g, x, y, w) { box(g, x, y - 6, w, 7, IC.woodd); fill(g, IC.wood, x + 1, y - 5, w - 2, 1); for (let i = x + 30; i < x + w; i += 64) box(g, i, y - 6, 4, 7, IC.woodk); },
  araignee(g, x, y, w, h, t) { const d = 10 + Math.round(10 * (.5 + .5 * Math.sin(t / 1300))), sx = x + 8, sy = y + d;
    fill(g, "#e8e8f0", sx, y, 1, d); fill(g, IC.o, sx - 2, sy, 5, 4); fill(g, "#4a3a4a", sx - 1, sy + 1, 3, 2); fill(g, "#e04040", sx, sy + 1);
    [[-4, 0], [-4, 2], [4, 0], [4, 2]].forEach(([a, b], i) => fill(g, IC.o, sx + a + (a < 0 ? (Math.floor(t / 200) + i) % 2 : -((Math.floor(t / 200) + i) % 2)), sy + b, 2, 1)); },
  outils(g, x, y) { fill(g, IC.woodk, x + 6, y + 2, 2, 26); for (let i = 0; i < 4; i++) fill(g, IC.ironl, x + 3 + i * 2, y + 2, 1, 6); fill(g, IC.iron, x + 3, y + 7, 8, 1);
    fill(g, IC.woodk, x + 20, y + 4, 2, 24); box(g, x + 16, y + 2, 10, 4, IC.iron); },
  nichoirs(g, x, y, w, h) { box(g, x, y + 8, w, h - 4, IC.wood); for (let i = 0; i < 4; i++) { const nx = x + 3 + i * 15;
      box(g, nx, y + 12, 12, 10, "#3a2a20"); fill(g, IC.straw, nx + 1, y + 18, 10, 3); if (i < 3) { fill(g, IC.cloth, nx + 3, y + 16, 3, 3); fill(g, IC.cloth, nx + 7, y + 17, 3, 3); } }
    fill(g, IC.woodl, x + 1, y + 9, w - 2, 1); },
  panier(g, x, y) { box(g, x + 2, y + 6, 12, 9, "#b0803a"); for (let i = x + 3; i < x + 13; i += 2) fill(g, "#8a5a28", i, y + 7, 1, 7); fill(g, "#8a5a28", x + 4, y + 1, 1, 6); fill(g, "#8a5a28", x + 11, y + 1, 1, 6); fill(g, "#8a5a28", x + 4, y + 1, 8, 1);
    fill(g, IC.cloth, x + 5, y + 6, 3, 2); fill(g, IC.cloth, x + 8, y + 5, 3, 3); },
  foin(g, x, y, w, h) { box(g, x, y + 4, w, h - 4, IC.straw); for (let j = y + 6; j < y + h - 2; j += 3) for (let i = x + 2 + (j % 2); i < x + w - 2; i += 4) fill(g, IC.strawd, i, j, 2, 1);
    fill(g, "#f8e090", x + 2, y + 5, w - 4, 2); fill(g, IC.redd, x + 2, y + 12, w - 4, 1); fill(g, IC.redd, x + 2, y + h - 8, w - 4, 1); },
  seau(g, x, y) { box(g, x + 3, y + 4, 10, 10, IC.wood); fill(g, IC.iron, x + 3, y + 6, 10, 1); fill(g, IC.blue, x + 4, y + 5, 8, 1); fill(g, IC.iron, x + 3, y, 10, 1); fill(g, IC.iron, x + 3, y, 1, 5); fill(g, IC.iron, x + 12, y, 1, 5); },
  miroir(g, x, y, w) { box(g, x + 6, y + 2, w - 12, 20, "#c8a040"); fill(g, IC.glassl, x + 8, y + 4, w - 16, 16); fill(g, "#ffffff", x + 9, y + 5, 3, 6); fill(g, IC.glass, x + 8, y + 14, w - 16, 6); },
  fauteuil_barbier(g, x, y, w, h) { box(g, x + 4, y, w - 8, 14, "#8e2030"); box(g, x + 2, y + 12, w - 4, 10, IC.red); fill(g, IC.redl, x + 4, y + 13, w - 8, 2);
    box(g, x, y + 10, 4, 10, IC.woodd); box(g, x + w - 4, y + 10, 4, 10, IC.woodd); box(g, x + w / 2 - 3, y + 22, 6, 6, IC.iron); box(g, x + 6, y + 27, w - 12, 4, IC.iron); },
  comptoir(g, x, y, w, h) { box(g, x, y + 2, w, 14, IC.wood); fill(g, IC.woodl, x + 1, y + 3, w - 2, 1); fill(g, IC.woodd, x + 1, y + 10, w - 2, 5); for (let i = x + 8; i < x + w - 4; i += 12) fill(g, IC.woodk, i, y + 11, 1, 4);
    box(g, x + 30, y - 2, 10, 6, IC.cloth); fill(g, "#ffffff", x + 31, y - 1, 8, 2); },
  ciseaux(g, x, y) { fill(g, IC.ironl, x + 5, y + 4, 6, 1); fill(g, IC.ironl, x + 5, y + 6, 6, 1); fill(g, IC.o, x + 2, y + 3, 3, 3); fill(g, IC.o, x + 2, y + 6, 3, 3); fill(g, IC.red, x + 3, y + 4); fill(g, IC.red, x + 3, y + 7); fill(g, "#ffffff", x + 10, y + 4); },
  banc(g, x, y, w) { box(g, x, y + 4, w, 6, IC.wood); fill(g, IC.woodl, x + 1, y + 5, w - 2, 1); fill(g, IC.woodk, x + 3, y + 10, 2, 5); fill(g, IC.woodk, x + w - 5, y + 10, 2, 5); },
  cheveux_sol(g, x, y, w) { [[4, 3], [9, 6], [15, 2], [20, 7], [26, 4]].forEach(([a, b], i) => { if (a + 4 < w) { fill(g, i % 2 ? "#5a3a2e" : "#3e2620", x + a, y + b, 3, 1); fill(g, "#5a3a2e", x + a + 1, y + b + 1, 2, 1); } }); },
  engrenage(g, x, y, w, h, t) { const cx = x + w / 2, cy = y + 14, a0 = t / 800;
    for (let k = 0; k < 10; k++) { const a = a0 + k * Math.PI / 5; fill(g, IC.woodk, Math.round(cx + Math.cos(a) * 11) - 1, Math.round(cy + Math.sin(a) * 11) - 1, 3, 3); }
    g.fillStyle = IC.o; for (let j = -10; j <= 10; j++) { const ww = Math.round(Math.sqrt(100 - j * j)); g.fillRect(cx - ww, cy + j, ww * 2, 1); }
    g.fillStyle = IC.wood; for (let j = -9; j <= 9; j++) { const ww = Math.round(Math.sqrt(81 - j * j)); g.fillRect(cx - ww, cy + j, ww * 2, 1); }
    for (let k = 0; k < 4; k++) { const a = a0 + k * Math.PI / 2; for (let r = 2; r < 9; r++) fill(g, IC.woodd, Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r)); }
    box(g, cx - 2, cy - 2, 5, 5, IC.iron); },
  meule(g, x, y, w, h, t) { box(g, x, y + 8, w, h - 8, IC.woodd); fill(g, IC.wood, x + 1, y + 9, w - 2, 2);
    const cx = x + w / 2, cy = y + 22, a0 = t / 1400;
    g.fillStyle = IC.o; for (let j = -13; j <= 13; j++) { const ww = Math.round(26 * Math.sqrt(1 - (j / 13) ** 2)); g.fillRect(cx - ww, cy + j, ww * 2, 1); }
    g.fillStyle = "#c8c0b2"; for (let j = -12; j <= 12; j++) { const ww = Math.round(25 * Math.sqrt(1 - (j / 12) ** 2)); g.fillRect(cx - ww, cy + j, ww * 2, 1); }
    for (let k = 0; k < 6; k++) { const a = a0 + k * Math.PI / 3; for (let r = 5; r < 23; r += 1) fill(g, "#9a9284", Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r * .5)); }
    box(g, cx - 4, cy - 3, 8, 6, IC.woodk); fill(g, "#fbf8f0", x + 6, y + h - 6, 10, 2); fill(g, "#fbf8f0", x + w - 14, y + h - 5, 8, 2); },
  sacs(g, x, y, w, h) { [[0, 8], [14, 6], [6, 0]].forEach(([a, b]) => { box(g, x + a, y + b + 6, 16, 18, "#e8dcc0"); fill(g, "#c9bc9c", x + a + 2, y + b + 18, 12, 5); fill(g, "#8a7a5a", x + a + 5, y + b + 5, 6, 3); fill(g, "#a89a7a", x + a + 4, y + b + 12, 8, 1); }); },
  echelle(g, x, y, w, h) { fill(g, IC.woodk, x + 2, y + 2, 2, h - 2); fill(g, IC.woodk, x + 12, y + 2, 2, h - 2); for (let j = y + 6; j < y + h; j += 6) fill(g, IC.wood, x + 2, j, 12, 2); box(g, x - 1, y - 2, 18, 6, "#1a1418"); },
  couteau(g, x, y) { fill(g, IC.ironl, x + 4, y + 4, 8, 2); fill(g, "#ffffff", x + 5, y + 4, 6, 1); fill(g, IC.woodk, x + 1, y + 4, 4, 3); },
  poele(g, x, y, w, h, t, night, st, o) { box(g, x + 4, y + 6, w - 8, h - 6, "#3a3440"); fill(g, "#5a5464", x + 5, y + 7, w - 10, 2); box(g, x + 10, y + 16, w - 20, 9, "#1a1418");
    if (o && o.tresses) { fill(g, "#5a5050", x + 11, y + 21, w - 22, 3); for (let i = 0; i < w - 24; i += 3) fill(g, "#c8a050", x + 12 + i, y + 20 + (i % 2), 2, 1); }   // restes des tresses dans la cendre
    else if (!(o && o.eteint)) { const f = Math.floor(t / 120) % 2; fill(g, IC.fired, x + 12, y + 20 + f, w - 24, 4 - f); fill(g, IC.fire, x + 13, y + 22, w - 26, 2); }
    fill(g, "#3a3440", x + w / 2 - 2, y - 6, 4, 12); },
  epee_bois(g, x, y) { fill(g, IC.woodl, x + 3, y + 3, 9, 2); fill(g, IC.wood, x + 3, y + 5, 9, 1); fill(g, IC.woodk, x + 11, y + 1, 2, 7); fill(g, IC.woodk, x + 13, y + 3, 3, 3); },
  ruban(g, x, y) { fill(g, IC.red, x + 6, y + 5, 2, 2); fill(g, IC.red, x + 3, y + 4, 3, 2); fill(g, IC.red, x + 8, y + 4, 3, 2); fill(g, IC.redd, x + 5, y + 7, 1, 3); fill(g, IC.redd, x + 8, y + 7, 1, 3); },
  seuil() {},                                      // la porte du bas : l'ouverture et le paillasson sont dessinés avec les murs
  // ---- chapitre 1, scénario réécrit ----
  charrette(g, x, y, w, h) { box(g, x + 2, y + 4, w - 10, h - 14, IC.wood); for (let i = x + 6; i < x + w - 10; i += 6) fill(g, IC.woodd, i, y + 5, 1, h - 16); fill(g, IC.woodl, x + 3, y + 5, w - 12, 1);
    fill(g, IC.straw, x + 4, y + 2, w - 14, 3); fill(g, IC.woodk, x + w - 10, y + h - 14, 10, 2);
    const cx = x + 12, cy = y + h - 9; for (let j = -8; j <= 8; j++) for (let i = -8; i <= 8; i++) { const d = Math.hypot(i, j); if (d < 8.5 && d > 6) fill(g, IC.o, cx + i, cy + j); else if (d <= 6 && (i === 0 || j === 0 || Math.abs(i) === Math.abs(j))) fill(g, IC.woodd, cx + i, cy + j); } },
  sabot_mur(g, x, y) { fill(g, IC.iron, x + 7, y + 4, 2, 3); box(g, x + 3, y + 7, 10, 7, IC.woodl); fill(g, IC.woodd, x + 5, y + 8, 6, 3); fill(g, IC.wood, x + 4, y + 12, 8, 1); },
  fourche(g, x, y, w, h) { fill(g, IC.woodk, x + 8, y + 6, 2, h - 8); fill(g, IC.wood, x + 8, y + 6, 1, h - 8); for (let i = 0; i < 4; i++) fill(g, IC.ironl, x + 4 + i * 3, y + 1, 1, 6); fill(g, IC.iron, x + 4, y + 6, 10, 1); },
  oeuf(g, x, y) { box(g, x + 5, y + 6, 6, 7, "#fbf4e6"); fill(g, "#ffffff", x + 6, y + 7, 2, 2); fill(g, "#e8dcc4", x + 9, y + 10, 1, 2); },
  rouet(g, x, y, w, h, t) { XDRAW.rouet(g, t, x - 1, y + h - 20); },
  herbes_sechees(g, x, y, w, h, t) { fill(g, IC.woodk, x, y + 2, w, 2); for (let i = 3; i < w - 3; i += 7) { const sw = Math.round(Math.sin(t / 900 + i) * .6); fill(g, IC.woodk, x + i + 1, y + 4, 1, 3);
    for (let j = 0; j < 8; j++) fill(g, (i + j) % 3 ? "#7a8a4a" : "#a4a85a", x + i - 1 + (j % 3) + sw, y + 7 + j, 1, 1); fill(g, i % 2 ? "#b878c8" : "#e8c050", x + i + sw, y + 15, 2, 2); } },
  pot_miel(g, x, y) { box(g, x + 4, y + 5, 8, 9, "#c88a3a"); fill(g, "#f2c64a", x + 5, y + 6, 6, 2); box(g, x + 3, y + 3, 10, 3, IC.cloth); fill(g, IC.red, x + 3, y + 5, 10, 1); },
  cahier(g, x, y) { box(g, x + 2, y + 6, 12, 8, "#5a3a7a"); fill(g, IC.cloth, x + 3, y + 7, 10, 1); fill(g, "#f2c64a", x + 7, y + 9, 2, 2); },
  rideau(g, x, y, w, h, t) { box(g, x + 1, y + 4, w - 2, h - 4, "#1a1418"); const sw = Math.round(Math.sin(t / 900)); for (let i = 2; i < w - 2; i += 3) fill(g, i % 2 ? "#8a3a5a" : "#a84a6a", x + i + (i > w / 2 ? sw : 0), y + 5, 2, h - 6); fill(g, IC.woodk, x, y + 3, w, 2); },
  cage_canari(g, x, y, w, h, t, night) { fill(g, IC.woodk, x + 7, y + 14, 2, h - 14); fill(g, IC.woodk, x + 3, y + h - 2, 10, 2);
    fill(g, "#c8a040", x + 2, y + 2, 12, 1); fill(g, "#c8a040", x + 2, y + 13, 12, 1); for (let i = x + 4; i < x + 13; i += 2) fill(g, "#c8a040", i, y + 3, 1, 10); fill(g, "#c8a040", x + 6, y, 4, 2);
    const hop = night ? 0 : (Math.floor(t / 400) % 3 === 0 ? 1 : 0); box(g, x + 5, y + 7 - hop, 5, 4, "#f2d23a"); fill(g, "#f2a23a", x + 10, y + 8 - hop); fill(g, IC.o, x + 8, y + 8 - hop);
    if (!night && Math.floor(t / 900) % 3 === 0) { fill(g, IC.blue, x + 13, y + 1, 1, 2); fill(g, IC.blue, x + 14, y, 1, 1); } },
  portrait(g, x, y, w, h) { box(g, x + 4, y + 2, w - 8, 22, "#c8a040"); fill(g, "#e8d8a8", x + 6, y + 4, w - 12, 18); fill(g, "#f4d890", x + w / 2 - 4, y + 6, 8, 3);
    box(g, x + w / 2 - 4, y + 8, 8, 7, "#f6cfae"); fill(g, IC.o, x + w / 2 - 2, y + 10); fill(g, IC.o, x + w / 2 + 1, y + 10); box(g, x + w / 2 - 6, y + 15, 12, 7, "#f4f0e6"); fill(g, "#ffd84a", x + w / 2 - 3, y + 5, 6, 1);
    [[2, 2], [w - 6, 3], [3, 20], [w - 5, 19]].forEach(([a, b], i) => { fill(g, i % 2 ? "#c87a8a" : "#b8a05a", x + a, y + b, 3, 2); fill(g, "#7a8a4a", x + a + 1, y + b + 2); }); },
  image_pieuse(g, x, y) { box(g, x + 4, y + 2, 8, 11, "#c8a040"); fill(g, "#e8d8a8", x + 5, y + 3, 6, 9); fill(g, "#f6cfae", x + 7, y + 5, 2, 2); fill(g, "#f4f0e6", x + 6, y + 7, 4, 4); fill(g, "#ffd84a", x + 6, y + 4, 4, 1); },
  flacons(g, x, y) { [[1, 7, "#7ab8e0"], [5, 5, "#c87a8a"], [9, 8, "#a8c86a"], [12, 6, "#f2c64a"]].forEach(([a, hh, col]) => { box(g, x + a, y + 14 - hh, 4, hh, col); fill(g, "#ffffff", x + a + 1, y + 15 - hh, 1, 2); fill(g, IC.o, x + a + 1, y + 12 - hh, 2, 2); }); },
  rasoirs(g, x, y) { [3, 8].forEach(a => { fill(g, IC.ironl, x + a, y + 5, 4, 1); fill(g, "#ffffff", x + a, y + 5); fill(g, IC.woodk, x + a + 1, y + 6, 2, 5); }); box(g, x + 2, y + 12, 12, 3, "#767c88"); },
  serviettes(g, x, y) { [0, 3, 6].forEach((b, i) => box(g, x + 2, y + 4 + b, 12, 4, i % 2 ? "#ffffff" : IC.cloth)); fill(g, "#f4f4f4", x + 5, y + 1, 1, 2); fill(g, "#f4f4f4", x + 9, y, 1, 3); },
  pierre_affuter(g, x, y) { box(g, x + 2, y + 8, 12, 5, "#8e8678"); fill(g, "#b4aca0", x + 3, y + 9, 10, 1); },
  balai(g, x, y, w, h) { fill(g, IC.woodk, x + 7, y + 4, 2, h - 12); box(g, x + 3, y + h - 10, 10, 9, IC.straw); for (let i = x + 4; i < x + 12; i += 2) fill(g, IC.strawd, i, y + h - 8, 1, 6); },
  tresse_ail(g, x, y, w, h) { fill(g, IC.strawd, x + 7, y + 3, 2, h - 8); for (let j = y + 6; j < y + h - 4; j += 5) { box(g, x + 3, j, 5, 5, "#f4f0e6"); box(g, x + 8, j + 2, 5, 5, "#e8e0d0"); } },
  bouteilles(g, x, y) { box(g, x + 2, y + 4, 4, 10, "#3a6a3a"); fill(g, "#6a9a5a", x + 3, y + 5, 1, 3); box(g, x + 7, y + 3, 4, 11, "#5a3a2a"); box(g, x + 5, y + 12, 10, 4, "#3a6a3a"); fill(g, "#6a9a5a", x + 7, y + 13, 3, 1); },
  tresse_paille(g, x, y) { XDRAW.tresse_paille(g, 0, x + 3, y + 4); },
  dessins(g, x, y, w, h, t, night, st) { const lv = st || {};                     // un dessin au charbon par jauge : chevalier, sorcier, brigand ; il s'enrichit à chaque point
    [[3, "guerrier"], [13, "mage"], [23, "voleur"]].forEach(([a, k]) => { if (a + 8 > w) return; const n = lv[k] === undefined ? 1 : lv[k]; if (!n) return; const X = x + a, Y = y + 6, k2 = "#3a3440";
      fill(g, k2, X + 3, Y, 2, 2); fill(g, k2, X + 3, Y + 2, 2, 5); fill(g, k2, X + 1, Y + 3, 6, 1); fill(g, k2, X + 2, Y + 7, 1, 3); fill(g, k2, X + 5, Y + 7, 1, 3);
      if (k === "guerrier") fill(g, k2, X + 7, Y - 1, 1, 6); if (k === "mage") { fill(g, k2, X + 2, Y - 2, 4, 1); fill(g, k2, X + 3, Y - 3, 2, 1); } if (k === "voleur") fill(g, k2, X + 1, Y + 1, 6, 1);
      if (n > 1) fill(g, k2, X + 8, Y + 9, 1, 1); if (n > 2) fill(g, "#ffd84a", X + 7, Y - 2, 1, 1); }); },
  sabots(g, x, y, w, h, t, night, st, o) { const e = o && o.etat; [2, 9].forEach((a, i) => { if (e === "un" && i) return; box(g, x + a, y + 7, 5, 7, e === "cires" ? "#d8a060" : IC.woodl); fill(g, IC.woodd, x + a + 1, y + 8, 3, 2); if (e === "cires") fill(g, "#ffffff", x + a + 1, y + 11); }); },
  seau_cendres(g, x, y, w, h, t, night, st, o) { box(g, x + 3, y + 4, 10, 10, "#767c88"); fill(g, "#5a5050", x + 4, y + 5, 8, 2); fill(g, "#a4a0a0", x + 5, y + 5, 3, 1); if (o && o.sabot) box(g, x + 8, y + 1, 5, 6, IC.woodl); },
  petit_miroir(g, x, y) { box(g, x + 4, y + 3, 8, 10, IC.woodd); fill(g, IC.glassl, x + 5, y + 4, 6, 8); fill(g, "#ffffff", x + 6, y + 5, 1, 3); },
  dessin_femme(g, x, y) { box(g, x + 3, y + 2, 10, 12, IC.cloth); fill(g, "#7a5a3a", x + 7, y + 4, 2, 2); fill(g, "#7a5a3a", x + 6, y + 6, 4, 4);
    fill(g, "#c8a050", x + 5, y + 4, 1, 8); fill(g, "#c8a050", x + 10, y + 4, 1, 8); fill(g, IC.red, x + 4, y + 2, 1, 1); },
  client(g, x, y, w, h, t) { FURNI.fauteuil_barbier(g, x, y, w, h, t); const b = Math.round(Math.sin(t / 900));   // un client endormi sous une serviette chaude
    box(g, x + 7, y - 4 - b, w - 14, 12 + b, "#ffffff"); fill(g, "#e8e8f0", x + 8, y + 2, w - 16, 3); box(g, x + 6, y + 8, w - 12, 10, "#5a6a8a");
    if (Math.floor(t / 1400) % 2) { fill(g, "#f4f4f4", x + w - 6, y - 10, 1, 2); fill(g, "#f4f4f4", x + w - 4, y - 14, 1, 2); } },
  table_nappe(g, x, y, w, h, t) { XDRAW.table_nappe(g, t, x, y + 2, w, h - 2); },
  trappe(g, x, y) { box(g, x + 1, y + 1, 14, 14, "#1a1418"); fill(g, IC.woodk, x + 3, y + 4, 10, 1); fill(g, IC.woodk, x + 3, y + 9, 10, 1); fill(g, IC.wood, x + 2, y + 2, 12, 1); },
};
const WALL_TYPES = new Set(["cheminee", "etagere", "fenetre", "porte", "outils", "miroir", "engrenage", "echelle", "nichoirs", "poele", "sabot_mur", "fourche",
  "herbes_sechees", "rideau", "portrait", "image_pieuse", "balai", "tresse_ail", "tresse_paille", "dessins", "petit_miroir", "dessin_femme"]);

// ---- personnages et bêtes dans les pièces ----
const IC_POULE = { b: "#f4f0e6", d: "#d4c8b0" };
function drawPoule(g, x, y, t, i) { const peck = (Math.floor(t / 350) + i * 3) % 7 === 0 ? 2 : 0;
  box(g, x, y, 10, 7, IC_POULE.b); fill(g, IC_POULE.d, x + 2, y + 4, 5, 2); box(g, x + 7, y - 4 + peck, 5, 5, IC_POULE.b); fill(g, IC.red, x + 8, y - 5 + peck, 2, 1); fill(g, "#f2a23a", x + 11, y - 2 + peck, 2, 1); fill(g, IC.o, x + 9, y - 3 + peck);
  fill(g, "#f2a23a", x + 3, y + 7, 1, 2); fill(g, "#f2a23a", x + 6, y + 7, 1, 2); }
function drawChat(g, x, y, t) { box(g, x, y, 12, 6, "#3a3440"); box(g, x + 9, y - 4, 6, 6, "#3a3440"); fill(g, "#3a3440", x + 9, y - 6, 1, 2); fill(g, "#3a3440", x + 13, y - 6, 1, 2); fill(g, "#e8ff8a", x + 11, y - 2); fill(g, "#e8ff8a", x + 13, y - 2);
  const tl = Math.round(Math.sin(t / 300) * 2); fill(g, "#3a3440", x - 2, y - 2 + tl, 2, 4); }

// ---- une pièce entière ----
// opts : { night, day, moment, flags, state, actors, animals, showHidden }, comme drawMap (voir exterior.js)
function drawRoom(g, room, t, opts = {}) {
  const W = room.w * TILE, H = room.h * TILE, night = !!opts.night, st = opts.state || {}, ctx = { day: opts.day, moment: opts.moment, night, flags: opts.flags };
  FLOORS[room.floor](g, W, H); WALLS[room.wall](g, W);
  fill(g, "rgba(0,0,0,.18)", 0, 32, W, 3);                                          // ombre au pied du mur
  const objs = visibleObjects(room, ctx, opts).map(o => ({ ...o, px: Math.round(o.x * TILE), py: Math.round(o.y * TILE), pw: o.w * TILE, ph: o.h * TILE }));
  const draw = o => drawFurni(g, o, t, night, st[o.id]);
  const byId = Object.fromEntries(objs.map(o => [o.id, o]));
  objs.filter(o => WALL_TYPES.has(o.type) && !o.above).forEach(draw);
  const items = [];
  objs.filter(o => !WALL_TYPES.has(o.type) && !o.above).forEach(o => { const host = o.on && byId[o.on];
    items.push({ y: host ? host.py + host.ph + .5 : (o.type === "tapis" || o.type === "cheveux_sol" || o.type === "trappe" ? -1 : o.py + o.ph), fn: () => draw(o) }); });
  if (opts.actors) opts.actors.forEach(a => items.push({ y: a.y, fn: () => a.draw(g) }));
  (room.npcs || []).filter(n => whenOk(n.when, ctx)).forEach((n, i) => { const fx = n.x * TILE, fy = n.y * TILE, animal = ANIMALS.has(n.id);
    if (animal ? opts.animals === false : opts.actors) return;
    items.push({ y: fy, fn: () => animal ? drawAnimal(g, n, fx, fy, t, i) : drawPerson(g, n, fx, fy, t) }); });
  items.sort((a, b) => a.y - b.y).forEach(i => i.fn());
  objs.filter(o => o.above).forEach(draw);
  // murs latéraux et bas, avec les ouvertures des sorties du bas
  fill(g, IC.o, 0, 0, 3, H); fill(g, IC.o, W - 3, 0, 3, H); fill(g, IC.o, 0, H - 3, W, 3); fill(g, IC.o, 0, 0, W, 2);
  (room.exits || []).filter(e => e.y + (e.h || 1) >= room.h - .01 && whenOk(e.when, ctx)).forEach(e => { fill(g, IC.dirt, e.x * TILE, H - 3, e.w * TILE, 3); box(g, e.x * TILE + 2, H - 8, e.w * TILE - 4, 6, "#8a3a30"); });
  if (night) {
    g.globalCompositeOperation = "multiply"; g.fillStyle = "#3a4280"; g.fillRect(0, 0, W, H); g.globalCompositeOperation = "source-over";
    objs.filter(o => o.light && !(o.type === "bougie" && st[o.id] && st[o.id].blown)).forEach(o => { const [lx, ly, r] = o.light, cx = lx * TILE, cy = ly * TILE, f = 1 + .06 * Math.sin(t / 80);
      g.fillStyle = "#ffb85a"; for (let k = r; k > 0; k -= 3) { g.globalAlpha = .06 + .1 * (1 - k / r); for (let j = -k; j <= k; j++) { const ww = Math.round(Math.sqrt(k * k - j * j) * f); g.fillRect(cx - ww, cy + j, ww * 2, 1); } } g.globalAlpha = 1; });
    objs.filter(o => o.type === "fenetre").forEach(o => { g.globalAlpha = .06; g.fillStyle = "#b8c8ff"; for (let j = 0; j < 26; j++) g.fillRect(o.px + 6 - Math.round(j * .3), o.py + 34 + j, o.pw - 12 + Math.round(j * .6), 1); g.globalAlpha = 1; });   // clair de lune au sol
  }
}
// un meuble peut être tourné (rot : 0, 90, 180, 270) et retourné (flip) ; w et h sont alors son emprise une fois tourné
const FLIP_PAD = 16, flipCv = document.createElement("canvas");
function drawFurni(g, o, t, night, st) {
  const rot = o.rot || 0;
  if (!FURNI[o.type]) return;
  if (!rot && !o.flip) return FURNI[o.type](g, o.px, o.py, o.pw, o.ph, t, night, st, o);
  const side = rot % 180 !== 0, nw = side ? o.ph : o.pw, nh = side ? o.pw : o.ph;
  flipCv.width = nw + FLIP_PAD * 2; flipCv.height = nh + FLIP_PAD * 2;
  const f = flipCv.getContext("2d"); FURNI[o.type](f, FLIP_PAD, FLIP_PAD, nw, nh, t, night, st, o);
  g.save(); g.imageSmoothingEnabled = false; g.translate(o.px + o.pw / 2, o.py + o.ph / 2); g.rotate(rot * Math.PI / 180); if (o.flip) g.scale(-1, 1);
  g.drawImage(flipCv, -nw / 2 - FLIP_PAD, -nh / 2 - FLIP_PAD); g.restore();
}
// collisions pour le jeu : voir mapCollision (world.js) ; ici en booléens, pour l'éditeur
function roomCollision(room) { return mapCollision(room).map(r => [...r].map(c => c === "1")); }
