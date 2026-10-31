// ---------- Cartes extérieures : dessin de n'importe quelle carte « exterieur » à partir de son JSON ----------
// drawMap(ctx, map, t, opts) dessine la carte entière dans un canvas de map.w*16 x map.h*16.
// opts : { night, day, moment, flags } (filtrent les when), actors: [{ y, draw(ctx) }] (le jeu place ses personnages,
// triés avec le décor par la ligne des pieds y en px ; les npcs du JSON ne sont alors pas dessinés),
// animals (false = pas de bêtes), state (état des objets), showHidden (montre les objets cachés, pour l'éditeur).
// drawAnyMap choisit drawMap ou drawRoom selon map.kind.

// ---- habitants : palettes et silhouettes ----
const NPC_PAL = {
  margot: { ...CHILD_PAL, c:"#c44a6a", C:"#8e2e4a", l:"#ea7a92", h:"#c8562c", H:"#8e3a1e", j:"#ec8a50" },
  basile: { ...CHILD_PAL, c:"#5a8a4a", C:"#3e6634", l:"#86b46a", h:"#2e2a36", H:"#1c1822", j:"#4a4458" },
  elio: FRIEND_PAL,
  elio_capuche: { ...FRIEND_PAL, h:"#5a5a6e", H:"#3e3e50", j:"#7a7a8e" },
  enfant_a: { ...CHILD_PAL, c:"#3a7cb6", C:"#2a5e94", l:"#6aa6d4", h:"#e8c070", H:"#b8903e", j:"#f8e0a0" },
  enfant_b: { ...CHILD_PAL, c:"#e8dcc0", C:"#b8aa88", l:"#ffffff", h:"#8a3a2a", H:"#5e2418", j:"#b4583a" },
  enfant_c: { ...CHILD_PAL, c:"#8a5aa0", C:"#5e3a74", l:"#b48ad0", h:"#3a2a20", H:"#241812", j:"#5a4434" },
  mere: { ...PAL, c:"#8a5aa0", C:"#5e3a74", l:"#b48ad0", h:"#7a4a2a", H:"#5a3420", j:"#a06a40", a:"#f4ead2", A:"#c9c0aa", r:"#ffffff" },
  fauvel: { ...PAL, c:"#f4ead2", C:"#c9c0aa", l:"#ffffff", h:"#9a9aa8", H:"#6a6a78", j:"#c4c4d0", a:"#2a5e94", A:"#1e4470" },
  aubin: { ...PAL, c:"#6a5a4a", C:"#4a3e34", l:"#8a7a66", h:"#3a3040", H:"#241e2a", j:"#5a5060", a:"#8a8494", A:"#5e5a68" },
  ysol: { ...PAL, c:"#4a6a8a", C:"#34506a", l:"#6a8aaa", h:"#d8d4dc", H:"#a8a4b0", j:"#f0eef4", a:"#8a3a4a", A:"#5e2434", s:"#eec4a4", S:"#c8907a" },
  mere_basile: { ...PAL, c:"#5a8a4a", C:"#3e6634", l:"#86b46a", h:"#2e2a36", H:"#1c1822", j:"#4a4458", a:"#e8dcc0", A:"#b8aa88" },
  client: { ...PAL, c:"#f4f4f4", C:"#d0d0d8", l:"#ffffff", h:"#f4f4f4", H:"#d0d0d8", j:"#ffffff" },
  villageois: { ...PAL, c:"#7a6a4a", C:"#5a4a34", l:"#9a8a66", h:"#4a3a2a", H:"#2e2418", j:"#6a5a44" },
};
const CHILD_IDS = new Set(["hero", "margot", "basile", "elio", "elio_capuche", "enfant_a", "enfant_b", "enfant_c"]);
const ANIMALS = new Set(["poule", "poule_rousse", "poule_blanche", "chat", "chat_dort"]);
let mapSprites = null;
function npcSprites() { return mapSprites || (mapSprites = { child: CHILD(), childBob: bobUpper(CHILD(), 23), adult: ADULT(), adultBob: bobUpper(ADULT(), 27) }); }
// une personne, les pieds en (fx, fy) px
function drawPerson(c, n, fx, fy, t) {
  // le personnage du registre (rpg/data/personnages.json) avec son gabarit de chars.js : le même dessin que dans le jeu
  const who = typeof PERSONNAGES !== "undefined" && PERSONNAGES[n.look || n.id], ch = who && who.sprite && typeof CHARS !== "undefined" && CHARS[who.sprite];
  if (ch) return drawChar(c, ch, Math.round(fx) - 12, Math.round(fy) - ch.H, { dir: n.dir || "S", t });
  const S = npcSprites(), key = n.look || n.id, child = CHILD_IDS.has(key) || n.child, bob = (Math.floor(t / 600) + Math.round(fx)) % 2;
  const pal = key === "hero" ? CHILD_PAL : NPC_PAL[key] || NPC_PAL.villageois, x = Math.round(fx) - 12, y = Math.round(fy) - (child ? 27 : 34);
  c.globalAlpha = .22; c.fillStyle = "#1a3a2a"; c.fillRect(x + 3 + (child ? 0 : 1), Math.round(fy) - 2, child ? 16 : 18, 3); c.globalAlpha = 1;
  drawSprite(c, child ? (bob ? S.childBob : S.child) : (bob ? S.adultBob : S.adult), pal, x, y);
}
function drawAnimal(c, n, fx, fy, t, i) {
  const x = Math.round(fx), y = Math.round(fy);
  if (n.id === "chat" || n.id === "chat_dort") return drawChat(c, x - 6, y - 6, n.id === "chat_dort" ? 0 : t);
  const col = { poule_rousse: ["#c8622c", "#9a4420"], poule_blanche: ["#ffffff", "#e0dcd0"] }[n.id];
  if (!col) return drawPoule(c, x - 5, y - 8, t, i);
  const sv = [IC_POULE.b, IC_POULE.d]; IC_POULE.b = col[0]; IC_POULE.d = col[1]; drawPoule(c, x - 5, y - 8, t, i); IC_POULE.b = sv[0]; IC_POULE.d = sv[1];
}

// ---- dessin du décor : une fonction par type, (c, t, X, Y, W, H, o, env) avec la boîte en px ----
function withRoof(cols, fn) { const old = { rf: T.rf, rfd: T.rfd, rfl: T.rfl }; Object.assign(T, cols); fn(); Object.assign(T, old); }
const ROOFS = { rouge: null, bleu: { rf: "#3a7cb6", rfd: "#2a5e94", rfl: "#6aa6d4" }, vert: { rf: "#5a8a4a", rfd: "#3e6634", rfl: "#86b46a" },
  orange: { rf: "#c88a3a", rfd: "#9a6428", rfl: "#e8b060" }, violet: { rf: "#7a5a9a", rfd: "#54406e", rfl: "#a488c4" }, gris: { rf: "#7a7484", rfd: "#54505e", rfl: "#a4a0ae" } };
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
function mill(ctx, x, y) {
  const W = 60;
  px(ctx, T.fo, x + 2, y + 20, W - 4, 42);
  for (let j = 0; j < 40; j++) for (let i = 0; i < W - 6; i++) { const brick = (Math.floor((i + (Math.floor(j / 4) % 2) * 4) / 8) + Math.floor(j / 4)) % 3;
    px(ctx, (j % 4 === 3 || (i + (Math.floor(j / 4) % 2) * 4) % 8 === 7) ? "#7a7484" : brick ? "#b4aca0" : "#c8c0b2", x + 3 + i, y + 21 + j); }
  px(ctx, T.fo, x + 22, y + 40, 14, 22); px(ctx, "#6a4428", x + 23, y + 41, 12, 21); px(ctx, "#8a5a36", x + 23, y + 41, 12, 2);
  px(ctx, T.fo, x + 8, y + 30, 10, 9); px(ctx, T.win, x + 9, y + 31, 8, 7); px(ctx, T.wdd, x + 12, y + 31, 2, 7);           // la cuisine
  px(ctx, T.fo, x + 40, y + 28, 10, 9); px(ctx, T.win, x + 41, y + 29, 8, 7); px(ctx, T.wdd, x + 44, y + 29, 2, 7);         // la fenêtre d'Élio
  for (let r = 0; r < 22; r++) { const inset = Math.max(0, 11 - Math.floor(r / 2)), w = W - inset * 2;
    px(ctx, T.fo, x + inset - 1, y + r, w + 2, 1); px(ctx, r % 4 === 3 ? "#5a3a24" : r < 4 ? "#a8784c" : "#8a5a38", x + inset, y + r, w, 1); }
  px(ctx, T.fo, x - 1, y + 21, W + 2, 1);
}
function millWheel(ctx, x, y, t, still) {     // la roue tourne avec le courant ; arrêtée, elle ne bouge plus et ne fait plus d'écume
  const R = 12, a0 = still ? .3 : t / 1100;
  ell(ctx, x, y, R + 1, R + 1, T.fo); ell(ctx, x, y, R, R, "#8a5a36"); ell(ctx, x, y, R - 2, R - 2, T.fo); ell(ctx, x, y, R - 3, R - 3, "#3a5e7a");
  for (let k = 0; k < 8; k++) { const a = a0 + k * Math.PI / 4, c = Math.cos(a), s = Math.sin(a);
    for (let r = 2; r < R - 2; r++) px(ctx, "#6a4428", Math.round(x + c * r), Math.round(y + s * r));
    px(ctx, T.fo, Math.round(x + c * (R + 1)) - 1, Math.round(y + s * (R + 1)) - 1, 3, 3); px(ctx, "#a8784c", Math.round(x + c * (R + 1)), Math.round(y + s * (R + 1))); }
  px(ctx, T.fo, x - 2, y - 2, 5, 5); px(ctx, "#8a8080", x - 1, y - 1, 3, 3);
  if (!still) for (let k = 0; k < 3; k++) { const tt = (t / 500 + k / 3) % 1; px(ctx, NV.foam, Math.round(x - 6 + k * 6 + tt * 3), Math.round(y + R - 1 - tt * 4)); }
}
function washhouse(ctx, x, y, t) {     // le lavoir : un bassin sous un auvent
  px(ctx, T.fo, x, y + 16, 52, 22); px(ctx, "#b4aca0", x + 1, y + 17, 50, 20); px(ctx, "#8a8494", x + 1, y + 34, 50, 3);
  px(ctx, NV.ro, x + 5, y + 21, 42, 12); px(ctx, NV.w, x + 6, y + 22, 40, 10);
  for (let k = 0; k < 5; k++) px(ctx, NV.wl, x + 8 + ((k * 9 + Math.floor(t / 300)) % 36), y + 24 + (k % 3) * 3, 3, 1);
  px(ctx, "#cfc8bc", x + 6, y + 22, 40, 1);
  [x + 2, x + 46].forEach(p0 => { px(ctx, T.fo, p0, y + 4, 5, 30); px(ctx, "#7a4a2c", p0 + 1, y + 5, 3, 28); });
  for (let r = 0; r < 10; r++) { px(ctx, T.fo, x - 3, y - 4 + r, 58, 1); px(ctx, r % 3 === 2 ? "#5a4a54" : r < 2 ? "#9a8a90" : "#7a6a74", x - 2, y - 4 + r, 56, 1); }
  px(ctx, "#f4ead2", x + 30, y + 18, 6, 3); px(ctx, "#c8d8f0", x + 37, y + 18, 5, 3);   // du linge posé sur la margelle
}
const DAY_WELL = { st:"#8a8e98", std:"#5e6270", stl:"#b4b8c2", so:"#2a2030", hole:"#14121a" };
function dayWell(ctx, x, y, t, night, spill) { const old = {}; Object.keys(DAY_WELL).forEach(k => { old[k] = N[k]; if (!night) N[k] = DAY_WELL[k]; });
  drawWell(ctx, x, y, t, { swing: .4, crank: Math.PI, spill }); Object.assign(N, old); }
function oakColors(fn) { const keys = { l1: "#4c7e36", l2: "#34602c", l3: "#6c9c40", l4: "#a4c45c" }, old = {}; Object.keys(keys).forEach(k => { old[k] = NV[k]; NV[k] = keys[k]; }); fn(); Object.assign(NV, old); }

const XDRAW = {
  arbre: (c, t, X, Y, W, H, o) => drawTree(c, t, Math.round(X + W / 2), Math.round(Y + H), o.seed || 1, Math.round(W / 2)),
  petit_arbre: (c, t, X, Y, W, H, o) => drawTree(c, t, Math.round(X + W / 2), Math.round(Y + H), o.seed || 1, Math.round(W / 2)),
  chene: (c, t, X, Y, W, H, o) => { const fx = Math.round(X + W / 2), fy = Math.round(Y + H);
    oakColors(() => drawTree(c, t, fx, fy, 100000 + (o.seed || 7), Math.round(W / 2)));
    [[-14, -50], [10, -58], [-4, -40], [18, -44], [-20, -38]].forEach(([a, b], i) => { const k = W / 76; px(c, "#8a5a28", fx + Math.round(a * k), fy + Math.round(b * k)); if (i % 2) px(c, "#5a3a18", fx + Math.round(a * k), fy + Math.round(b * k) - 1); }); },
  buisson: (c, t, X, Y, W, H, o) => { const R = Math.round((W - 4) / 2), bx = Math.round(X + R + 2), by = Math.round(Y + 2 * R);
    // pieds : quelqu'un est caché dedans, les sabots dépassent (cache-cache)
    if (o.pieds) { const w = Math.floor(t / 600) % 4 === 0 ? 1 : 0; [[-7 + w, 0], [1, 0]].forEach(([a]) => { fill(c, "#7a4a2c", bx + a, by - 1, 5, 3); fill(c, "#7a6a50", bx + a, by - 3, 3, 2); }); }
    drawBush(c, t, bx, by, o.seed || 1, R); },
  rocher: (c, t, X, Y, W, H, o) => rock(c, X, Y, Math.round(W), Math.round(H), !!o.moss),
  caillou: (c, t, X, Y, W, H, o) => rock(c, X, Y, Math.round(W), Math.round(H), !!o.moss),
  fleurs: (c, t, X, Y, W, H, o) => { const cols = [T.fw, NV.pink, T.fy]; [[0, 0], [7, 3], [3, 6]].forEach(([a, b], i) => flower(c, X + a, Y + b, cols[((o.seed || 0) + i) % 3])); },
  champignons: (c, t, X, Y) => [[1, 1], [6, 3]].forEach(([a, b]) => { const x = X + a, y = Y + b; px(c, NV.ro, x - 1, y - 1, 5, 4); px(c, NV.mush, x, y - 1, 3, 2); px(c, NV.mush, x - 1, y, 5, 1); px(c, NV.mushl, x + 1, y - 1); px(c, NV.mushl, x - 1, y); px(c, "#f0e6d0", x + 1, y + 1, 1, 2); }),
  souche: (c, t, X, Y) => { const x = X + 2; box(c, x, Y + 3, 12, 8, IC.woodd); box(c, x, Y, 12, 5, "#c8945e"); fill(c, IC.woodd, x + 4, Y + 2, 4, 1); fill(c, IC.woodk, x - 2, Y + 9, 3, 2); fill(c, IC.woodk, x + 11, Y + 9, 3, 2); },
  tonneau: (c, t, X, Y) => FURNI.tonneau(c, X - 2, Y + 5, 16, 16, t),
  caisse: (c, t, X, Y) => { box(c, X, Y, 12, 11, IC.wood); fill(c, IC.woodd, X + 1, Y + 5, 10, 1); fill(c, IC.woodd, X + 1, Y + 1, 1, 9); fill(c, IC.woodd, X + 10, Y + 1, 1, 9); fill(c, IC.woodl, X + 2, Y + 1, 8, 1); },
  banc: (c, t, X, Y) => FURNI.banc(c, X, Y - 4, 28, 16, t),
  cloture: (c, t, X, Y, W) => { const n = Math.max(2, Math.round(W / 7)); for (let k = 0; k < n; k++) box(c, X + k * 7, Y, 3, 10, IC.wood); fill(c, IC.o, X, Y + 2, W, 3); fill(c, IC.woodl, X, Y + 3, W, 1); fill(c, IC.o, X, Y + 6, W, 3); fill(c, IC.wood, X, Y + 7, W, 1); },
  panneau: (c, t, X, Y) => { fill(c, IC.o, X + 6, Y + 6, 4, 12); fill(c, IC.woodd, X + 7, Y + 6, 2, 12); box(c, X, Y, 16, 9, IC.wood); fill(c, IC.woodd, X + 3, Y + 3, 10, 1); fill(c, IC.woodd, X + 3, Y + 5, 7, 1); },
  maison: (c, t, X, Y, W, H, o) => { withRoof(ROOFS[o.toit] || {}, () => cottage(c, X, Y + 10)); if (o.enseigne === "barbier") barberPole(c, X + 22, Y + 54, t);
    if (o.paille) { fill(c, IC.strawd, X + 32, Y + 47, 8, 1); for (let k = 0; k < 4; k++) fill(c, k % 2 ? IC.straw : IC.strawd, X + 33 + k * 2, Y + 48 + (k % 2), 1, 3); } },
  grange: (c, t, X, Y) => barn(c, X + 1, Y),
  moulin: (c, t, X, Y) => mill(c, X + 1, Y),
  roue: (c, t, X, Y, W, H, o) => millWheel(c, Math.round(X + W / 2), Math.round(Y + H / 2), t, !!o.still),
  lavoir: (c, t, X, Y) => washhouse(c, X + 3, Y + 4, t),
  puits: (c, t, X, Y, W, H, o, env) => dayWell(c, X + 4, Y + 10, t, env.night, o.cheveux || 0),
  pont: (c, t, X, Y) => { px(c, T.fo, X, Y, 30, 20); for (let k = 0; k < 28; k += 3) { px(c, "#8a5a36", X + 1 + k, Y + 1, 2, 18); px(c, "#a8784c", X + 1 + k, Y + 1, 2, 1); } px(c, "#5a3a24", X, Y, 30, 2); px(c, "#5a3a24", X, Y + 18, 30, 2); },
  fontaine: (c, t, X, Y) => {      // un bassin rond et une colonne qui verse
    ell(c, X + 17, Y + 21, 16, 8, NV.ro); ell(c, X + 17, Y + 20, 15, 7, "#b4aca0"); ell(c, X + 17, Y + 19, 12, 5, NV.ro); ell(c, X + 17, Y + 19, 11, 4, NV.w);
    for (let k = 0; k < 4; k++) px(c, NV.wl, X + 9 + ((k * 5 + Math.floor(t / 250)) % 16), Y + 17 + (k % 2) * 3, 2, 1);
    box(c, X + 14, Y + 2, 7, 17, "#b4aca0"); fill(c, "#cfc8bc", X + 15, Y + 3, 2, 15); box(c, X + 12, Y, 11, 4, "#cfc8bc");
    const d = Math.floor(t / 90) % 4; [[X + 10, Y + 5], [X + 24, Y + 5]].forEach(([a, b], i) => { for (let k = 0; k < 10; k++) if ((k + d) % 4) px(c, k % 3 ? NV.wl : NV.wh, a + (i ? 1 : -1) * Math.floor(k / 4), b + k); }); },
  table_nappe: (c, t, X, Y, W, H) => { box(c, X, Y + 2, W, H - 2, IC.cloth); fill(c, "#ffffff", X + 1, Y + 3, W - 2, 2); fill(c, IC.clothd, X + 1, Y + 9, W - 2, 1);
    for (let i = X + 3; i < X + W - 2; i += 5) fill(c, IC.clothd, i, Y + 10, 1, H - 11); fill(c, IC.redl, X + 2, Y + H - 3, W - 4, 1); },
  rouet: (c, t, X, Y) => { const a = t / 700; ell(c, X + 9, Y + 8, 7, 7, IC.o); ell(c, X + 9, Y + 8, 6, 6, IC.woodl); ell(c, X + 9, Y + 8, 4, 4, IC.o);
    for (let k = 0; k < 4; k++) { const ca = Math.cos(a + k * .8), sa = Math.sin(a + k * .8); for (let r = 0; r < 5; r++) px(c, IC.wood, Math.round(X + 9 + ca * r), Math.round(Y + 8 + sa * r)); }
    box(c, X + 1, Y + 14, 16, 4, IC.woodd); fill(c, IC.woodk, X + 2, Y + 18, 2, 2); fill(c, IC.woodk, X + 14, Y + 18, 2, 2); fill(c, IC.cloth, X + 15, Y + 5, 2, 9); },
  corde_linge: (c, t, X, Y, W) => { fill(c, IC.woodk, X + 1, Y + 2, 2, 20); fill(c, IC.woodk, X + W - 3, Y + 2, 2, 20); for (let i = 0; i < W - 4; i++) px(c, "#d8d0c0", X + 2 + i, Y + 3 + Math.round(Math.sin(i / (W - 4) * Math.PI) * 3));
    const sw = Math.round(Math.sin(t / 600)); [[6, IC.cloth, 9], [18, "#c8d8f0", 8], [30, "#f4c8c8", 7]].forEach(([a, col, h]) => { if (a + 8 < W) { const y0 = Y + 4 + Math.round(Math.sin((a + 4) / (W - 4) * Math.PI) * 3); box(c, X + a + sw, y0, 8, h, col); } }); },
  traces_mur: (c, t, X, Y) => [[1, 10], [4, 6], [1, 2]].forEach(([a, b]) => { fill(c, "#8a6a4a", X + a, Y + b, 3, 2); fill(c, "#6a4a30", X + a + 1, Y + b + 2, 1, 1); }),
  tresse_paille: (c, t, X, Y) => { fill(c, IC.strawd, X, Y, 10, 1); for (let k = 0; k < 5; k++) fill(c, k % 2 ? IC.straw : IC.strawd, X + 1 + k * 2, Y + 1 + (k % 2), 1, 4); },
  tombe: (c, t, X, Y) => { box(c, X + 1, Y, 10, 12, "#a4a8b0"); fill(c, "#cfd2d6", X + 2, Y + 1, 2, 10); fill(c, "#767c88", X + 4, Y + 4, 4, 1); fill(c, "#767c88", X + 5, Y + 3, 2, 3); fill(c, "#6a5a3a", X, Y + 12, 12, 4); fill(c, "#4f8f3e", X + 2, Y + 12, 2, 1); },
  croix: (c, t, X, Y) => { box(c, X + 4, Y, 4, 18, IC.woodd); box(c, X, Y + 4, 12, 4, IC.woodd); fill(c, IC.wood, X + 5, Y + 1, 1, 16); fill(c, "#6a5a3a", X + 2, Y + 17, 8, 3); },
  muret: (c, t, X, Y, W, H) => { box(c, X, Y + 2, W, H - 2, "#a4a8b0"); for (let i = X + 1; i < X + W - 1; i++) for (let j = Y + 3; j < Y + H - 1; j++) if ((j - Y) % 4 === 1 || (i + ((j - Y) >> 2) * 4) % 8 === 0) px(c, "#767c88", i, j);
    fill(c, "#cfd2d6", X + 1, Y + 1, W - 2, 2); fill(c, NV.moss, X + 3, Y + 1, 4, 1); },
  portail: (c, t, X, Y) => { box(c, X, Y + 2, 4, 20, "#767c88"); box(c, X + 24, Y + 2, 4, 20, "#767c88"); for (let k = 0; k < 5; k++) fill(c, "#3a3440", X + 6 + k * 4, Y + 8, 1, 14); fill(c, "#3a3440", X + 4, Y + 9, 20, 1); fill(c, "#3a3440", X + 4, Y + 18, 20, 1); },
  fosse: (c, t, X, Y, W, H) => { box(c, X, Y, W, H, "#4a3424"); fill(c, "#2a1c14", X + 2, Y + 2, W - 4, H - 4); fill(c, "#8a6a4a", X + W + 1, Y, 4, H); },
  trainee: (c, t, X, Y, W, H, o) => {      // de longs cheveux noirs mouillés qui rampent sur le sol, d'un bout à l'autre de la boîte
    const pts = o.pts || [[0, 0], [W / TILE, H / TILE]];
    for (let i = 0; i < pts.length - 1; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1], n = Math.ceil(Math.hypot(bx - ax, by - ay) * TILE);
      for (let k = 0; k <= n; k++) { const x = X + (ax + (bx - ax) * k / n) * TILE, y = Y + (ay + (by - ay) * k / n) * TILE;
        for (let s = -2; s <= 2; s++) if ((k + s * 3) % 4) px(c, s % 2 ? "#1a1418" : "#2e2a36", Math.round(x + s + Math.sin(k / 5 + s) * 1.5), Math.round(y + Math.cos(k / 6 + s) * 1.2)); } } },
  balle: (c, t, X, Y) => { const b = Math.abs(Math.sin(t / 260)) * 4; c.globalAlpha = .25; px(c, "#1a3a2a", X, Y + 5, 6, 1); c.globalAlpha = 1; box(c, X, Y - Math.round(b), 6, 5, IC.red); fill(c, IC.cloth, X + 1, Y + 1 - Math.round(b), 2, 1); },
  lanterne: (c, t, X, Y) => { px(c, NV.ro, X, Y, 6, 8); px(c, "#ffe8a0", X + 1, Y + 2, 4, 5); px(c, NV.ro, X + 2, Y - 2, 2, 2); },
};
// bâtiments dont la cheminée fume
const SMOKE = { maison: [52, 0] };

// ---- fond fixe d'une carte : herbe, champs, places, chemins, berges, fleurs (en cache, refait si le terrain change) ----
const bgCache = new WeakMap();
const seedOf = s => [...String(s)].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);
function nearPathPx(ter, x, y, m) { return (ter.paths || []).some(p => p.slice(1).some((b, i) => segDist(x, y, p[i][0] * TILE, p[i][1] * TILE, b[0] * TILE, b[1] * TILE)[0] < m)); }
function inPlazaPx(ter, x, y, m = 0) { return (ter.plazas || []).some(p => Math.hypot(x - p.x * TILE, (y - p.y * TILE) * 1.25) < p.r * TILE + m); }
function inFieldPx(ter, x, y, m = 0) { return (ter.fields || []).some(f => x > f.x * TILE - m && x < (f.x + f.w) * TILE + m && y > f.y * TILE - m && y < (f.y + f.h) * TILE + m); }
function mapStatic(map) {
  const ter = map.terrain || {}, hit = bgCache.get(ter); if (hit && hit.w === map.w && hit.h === map.h) return hit;
  const W = Math.ceil(map.w * TILE), H = Math.ceil(map.h * TILE), c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d"), r = rng(seedOf(map.id));
  for (let y = 0; y < H; y += 16) for (let x = 0; x < W; x += 16) grassTile(g, x, y);
  for (let k = 0; k < W * H / 7800; k++) { const cx = r() * W, cy = r() * H, rx = 16 + r() * 26, ry = 8 + r() * 12;
    for (let y = Math.floor(cy - ry); y < cy + ry; y++) for (let x = Math.floor(cx - rx); x < cx + rx; x++)
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1 && (x + 2 * y) % 4 === 0) px(g, T.gd, x, y); }
  (ter.fields || []).forEach(f => { const x0 = Math.round(f.x * TILE), y0 = Math.round(f.y * TILE), w = Math.round(f.w * TILE), h = Math.round(f.h * TILE);   // champ de blé, clôturé
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) { const row = (y - y0) % 5; px(g, row === 0 ? "#8a6a3e" : row === 4 ? "#a88a50" : ((x + y) % 3 ? "#d8b85a" : "#c8a24a"), x, y); }
    for (let x = x0 - 2; x < x0 + w + 2; x += 4) { px(g, NV.tkd, x, y0 - 3, 1, 4); px(g, NV.tkd, x, y0 + h, 1, 4); }
    px(g, NV.tk, x0 - 2, y0 - 2, w + 4, 1); px(g, NV.tk, x0 - 2, y0 + h + 1, w + 4, 1); });
  (ter.plazas || []).forEach(p => { const pcx = p.x * TILE, pcy = p.y * TILE, pr = p.r * TILE;
    for (let y = Math.floor(pcy - pr - 3); y <= pcy + pr + 3; y++) for (let x = Math.floor(pcx - pr - 3); x <= pcx + pr + 3; x++) { const d = Math.hypot(x - pcx, (y - pcy) * 1.25);
      if (d < pr) px(g, ((Math.floor(x / 4) + Math.floor(y / 3)) % 2) ? "#d9cdb0" : "#cfc2a2", x, y);
      if (d < pr && (x % 4 === 0 || y % 3 === 0)) px(g, "#b8aa88", x, y);
      if (d >= pr && d < pr + 2.5 && (x + y) % 2) px(g, T.sab, x, y); } });
  (ter.paths || []).forEach(p => p.slice(1).forEach((b, i) => { const a = p[i], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * TILE);
    for (let k = 0; k <= n; k++) { const x = (a[0] + (b[0] - a[0]) * k / n) * TILE, y = (a[1] + (b[1] - a[1]) * k / n) * TILE;
      for (let j = -5; j <= 5; j++) for (let i2 = -5; i2 <= 5; i2++) if (Math.hypot(i2, j) < 4.6) px(g, T.sa, Math.round(x + i2), Math.round(y + j)); } }));
  (ter.paths || []).forEach(p => p.slice(1).forEach((b, i) => { const a = p[i], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * TILE / 3);
    for (let k = 0; k <= n; k++) { const x = Math.round((a[0] + (b[0] - a[0]) * k / n) * TILE), y = Math.round((a[1] + (b[1] - a[1]) * k / n) * TILE); if (k % 2) px(g, T.sad, x + (k % 3) - 1, y + (k % 4) - 2); } }));
  const water = [];
  if (ter.river) { const xs = ter.river.points.map(p => p[0] * TILE), x0 = Math.max(0, Math.floor(Math.min(...xs) - 60)), x1 = Math.min(W, Math.ceil(Math.max(...xs) + 60));
    for (let y = 0; y < H; y++) for (let x = x0; x < x1; x++) { const [d, s] = riverAtPx(ter.river, x, y), hw = riverHalfPx(ter.river, s), e = d - hw;
      if (e < 0) { water.push([x, y, d / hw, s, (ter.shallows || []).some(q => inRect(q, x / TILE, y / TILE))]); continue; }
      if (e < 1) px(g, NV.wet, x, y); else if (e < 3) px(g, r() < .08 ? NV.sandd : NV.sand, x, y); else if (e < 4.5 && (x + y) % 2) px(g, NV.sand, x, y); } }
  const free = (x, y, m) => !(ter.river && riverAtPx(ter.river, x, y)[0] < ter.river.half * TILE + m) && !nearPathPx(ter, x, y, 7) && !inPlazaPx(ter, x, y, 4) && !inFieldPx(ter, x, y, 4);
  for (let k = 0; k < W * H / 2900; k++) {                       // fleurs semées
    const x = Math.floor(r() * W), y = Math.floor(r() * H); if (!free(x, y, 6)) continue;
    const col = [T.fw, NV.pink, T.fy, "#b8a8f0"][k % 4]; px(g, "#4f8f3e", x, y + 1); px(g, col, x, y); if (k % 3 === 0) { px(g, col, x - 1, y); px(g, col, x + 1, y); px(g, col, x, y - 1); px(g, T.fy, x, y); } }
  const tufts = [], reeds = [];
  while (tufts.length < W * H / 920) { const cx = r() * W, cy = 8 + r() * (H - 8); for (let n = 0; n < 4; n++) { const x = Math.round(cx + r() * 14 - 7), y = Math.round(cy + r() * 6 - 3); if (free(x, y, 4)) tufts.push([x, y, 4 + Math.floor(r() * 4)]); } }
  tufts.sort((a, b) => a[1] - b[1]);
  if (ter.river) for (let k = 0; k < H / 30; k++) { const y0 = 20 + r() * (H - 40); if (nearPathPx(ter, riverXAt(ter.river, y0), y0, 16)) continue;
    for (let x = 0; x < W; x++) { const [d, s] = riverAtPx(ter.river, x, y0); if (Math.abs(d - riverHalfPx(ter.river, s) - 1.5) < .6) { if ((ter.shallows || []).some(q => inRect(q, x / TILE, y0 / TILE))) break; for (let n = 0; n < 4; n++) reeds.push([x + n * (k % 2 ? 1 : -1), Math.round(y0) + n % 2 * 2, 8 + Math.floor(r() * 6), n % 2 === 0]); break; } } }
  const waterCv = document.createElement("canvas"); waterCv.width = W; waterCv.height = H;
  const out = { w: map.w, h: map.h, bg: c, water, tufts, reeds, waterCv, waterImg: null };
  bgCache.set(ter, out); return out;
}
function riverXAt(river, y) { const P = river.points; for (let i = 0; i < P.length - 1; i++) { const a = P[i], b = P[i + 1]; if ((y - a[1] * TILE) * (y - b[1] * TILE) <= 0) { const k = (y - a[1] * TILE) / ((b[1] - a[1]) * TILE || 1); return (a[0] + (b[0] - a[0]) * k) * TILE; } } return P[0][0] * TILE; }
const WCOL = Object.fromEntries(["wd", "w", "wm", "wl", "wh", "foam"].map(k => [k, hex(NV[k])]));
function renderWater(st, map, objs, t) {
  const W = st.waterCv.width, H = st.waterCv.height; if (!st.waterImg) st.waterImg = st.waterCv.getContext("2d").createImageData(W, H);
  const d = st.waterImg.data, flow = t * .018, wheels = objs.filter(o => o.type === "roue" && !o.still).map(o => [(o.x + o.w / 2) * TILE, (o.y + o.h / 2) * TILE]);
  st.water.forEach(([x, y, u, s, shallow]) => { let deep = 1 - u * u; if (shallow) deep *= .3; let k = deep > .82 ? "wd" : deep > .45 ? "w" : deep > .18 ? "wm" : "wl";
    const yy = Math.floor(s - flow * (.7 + deep * .5)), band = Math.floor(yy / 4), cell = Math.floor((x + band * 3) / 6);
    const hsh = Math.abs(Math.sin(band * 12.9898 + cell * 78.233) * 43758.5453) % 1, inCell = (x + band * 3) % 6;
    if (deep > .1 && yy % 4 === 0 && hsh < .3 && inCell < 2 + Math.floor(hsh * 8) % 3) k = hsh < .07 ? "wh" : "wl";
    else if (deep > .7 && yy % 4 === 2 && hsh > .82 && inCell < 3) k = "wd";
    if (u > .88 && (x + y + Math.floor(t / 260)) % 3 === 0) k = "foam";
    wheels.forEach(([wx, wy]) => { if (Math.abs(x - wx - 2) < 4 && y > wy + 4 && y < wy + 30 && (x + y + Math.floor(t / 120)) % 3) k = y < wy + 16 ? "foam" : "wl"; });   // remous sous la roue
    const i = (y * W + x) * 4, c = WCOL[k]; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; });
  st.waterCv.getContext("2d").putImageData(st.waterImg, 0, 0);
}

// ---- une carte extérieure entière ----
function drawMap(c, map, t, opts = {}) {
  const night = !!opts.night, ctx = { day: opts.day, moment: opts.moment, night, flags: opts.flags }, env = { night };
  const st = mapStatic(map), objs = visibleObjects(map, ctx, opts);
  c.drawImage(st.bg, 0, 0);
  if (st.water.length) { renderWater(st, map, objs, t); c.drawImage(st.waterCv, 0, 0); }
  objs.filter(o => o.type === "pont" || o.type === "trainee" || o.flat).forEach(o => drawXObj(c, t, o, env));      // ce qui est posé à plat passe sous tout le reste
  st.tufts.forEach(([x, y, h]) => drawTuft(c, t, x, y, h));
  const items = [];
  st.reeds.forEach(([x, y, h, cat]) => items.push({ y, fn: () => drawReed(c, t, x, y, h, cat) }));
  objs.filter(o => o.type !== "pont" && o.type !== "trainee" && !o.flat).forEach(o => { const fo = objFootPx(map, o), y = fo ? fo[1] + fo[3] : (o.y + o.h) * TILE; items.push({ y, fn: () => drawXObj(c, t, o, env) }); });
  if (opts.actors) opts.actors.forEach(a => items.push({ y: a.y, fn: () => a.draw(c) }));
  (map.npcs || []).filter(n => whenOk(n.when, ctx)).forEach((n, i) => { const fx = n.x * TILE, fy = n.y * TILE, animal = ANIMALS.has(n.id);
    if (animal ? opts.animals === false : opts.actors) return;
    items.push({ y: fy, fn: () => animal ? drawAnimal(c, n, fx, fy, t, i) : drawPerson(c, n, fx, fy, t) }); });
  items.sort((a, b) => a.y - b.y).forEach(i => i.fn());
  objs.forEach((o, i) => { const sm = SMOKE[o.type]; if (!sm || o.fumee === false) return; const X = o.x * TILE + sm[0], Y = o.y * TILE + sm[1];   // fumée des cheminées
    for (let k = 0; k < 4; k++) { const tt = (t / 1600 + k / 4 + i * .3) % 1; c.globalAlpha = (1 - tt) * .55; px(c, night ? "#8890a8" : "#f4f4f4", Math.round(X + Math.sin(tt * 6 + i) * 2 + tt * 6), Math.round(Y - 12 - tt * 22), tt < .5 ? 2 : 3, 2); } c.globalAlpha = 1; });
  if (!night) {
    const trees = objs.filter(o => o.type === "arbre" || o.type === "chene").slice(0, 8).map(o => [(o.x + o.w / 2) * TILE, (o.y + o.h) * TILE, o.seed || 1, o.w * TILE / 2]);
    if (trees.length) drawLeaves(c, t, trees);
    const perch = objs.find(o => o.type === "chene") || objs.find(o => o.type === "arbre"); if (perch) drawBirds(c, t, [(perch.x + perch.w / 2) * TILE - 6, perch.y * TILE + 14]);
    const W = map.w * TILE, H = map.h * TILE; drawButterfly(c, t, W * .21, H * .83, 0, "#fff6d8"); drawButterfly(c, t, W * .93, H * .69, 2, T.fy);
    c.globalAlpha = .07; c.fillStyle = "#0e2a3a";                                                  // ombre des nuages
    [[0, H * .22, 90, 30], [W * .46, H * .72, 110, 34]].forEach(([ox, oy, rx, ry]) => { const cx = ((ox + t * .007) % (W + rx * 2)) - rx;
      for (let j = -ry; j <= ry; j++) { const w = Math.round(rx * Math.sqrt(1 - (j / ry) ** 2)); c.fillRect(Math.round(cx - w), Math.round(oy + j), w * 2, 1); } }); c.globalAlpha = 1;
  } else drawNightOver(c, map, objs, t, ctx, opts);
}
function drawXObj(c, t, o, env) {
  const f = XDRAW[o.type]; if (!f) return; const X = Math.round(o.x * TILE), Y = Math.round(o.y * TILE), W = o.w * TILE, H = o.h * TILE, rot = o.rot || 0;
  if (!rot && !o.flip) return f(c, t, X, Y, W, H, o, env);
  c.save(); c.translate(Math.round(X + W / 2), Math.round(Y + H / 2)); c.rotate(rot * Math.PI / 180); if (o.flip) c.scale(-1, 1);
  c.translate(-Math.round(X + W / 2), -Math.round(Y + H / 2)); f(c, t, X, Y, W, H, o, env); c.restore();
}
function glowAt(c, x, y, r, col, a) { c.fillStyle = col; for (let k = r; k > 0; k -= 2) { c.globalAlpha = a * (1 - k / r) * .45;
  for (let j = -k; j <= k; j++) { const w = Math.round(Math.sqrt(k * k - j * j)); c.fillRect(Math.round(x - w), Math.round(y + j), w * 2, 1); } } c.globalAlpha = 1; }
function drawNightOver(c, map, objs, t, ctx, opts) {
  const W = map.w * TILE, H = map.h * TILE;
  c.globalCompositeOperation = "multiply"; c.fillStyle = "#3c4a8c"; c.fillRect(0, 0, W, H);
  c.globalCompositeOperation = "source-over"; c.globalAlpha = .25; c.fillStyle = "#0a0e24"; c.fillRect(0, 0, W, H); c.globalAlpha = 1;
  const flick = .8 + .2 * Math.sin(t / 90) * Math.sin(t / 37);
  // fenêtres allumées : lit = false les éteint toutes, ou une liste d'index des fenêtres allumées ; bougie = l'index de la fenêtre où vacille une bougie
  objs.forEach(o => { const ty = XTYPES[o.type]; if (!ty || !ty.windows || o.lit === false) return; const X = o.x * TILE, Y = o.y * TILE;
    ty.windows.forEach(([dx, dy], i) => { if (Array.isArray(o.lit) && !o.lit.includes(i)) return; const f = o.bougie === i ? flick : 1, ww = o.type === "moulin" ? 8 : 10, wh = o.type === "moulin" ? 7 : 9;
      glowAt(c, X + dx + ww / 2 + 1, Y + dy + wh / 2 + 1, 14, "#ffd86a", f); px(c, "#ffe08a", X + dx + 1, Y + dy + 1, ww, wh); if (o.type !== "moulin") { px(c, "#c89a3a", X + dx + 5, Y + dy + 1, 2, wh); px(c, "#c89a3a", X + dx + 1, Y + dy + 5, ww, 1); } }); });
  objs.filter(o => o.type === "puits" && o.chant).forEach(o => { const wx = o.x * TILE + 4, wy = o.y * TILE + 10;     // le puits chante : de petites notes violettes remontent
    glowAt(c, wx + 18, wy + 22, 18, "#9a6ad8", .6 + .2 * Math.sin(t / 400));
    for (let k = 0; k < 3; k++) { const tt = (t / 2200 + k / 3) % 1; c.globalAlpha = 1 - tt; px(c, "#c8a8ff", Math.round(wx + 14 + k * 4 + Math.sin(tt * 8 + k) * 3), Math.round(wy + 14 - tt * 26), 1, 2); px(c, "#c8a8ff", Math.round(wx + 15 + k * 4 + Math.sin(tt * 8 + k) * 3), Math.round(wy + 13 - tt * 26)); } c.globalAlpha = 1; });
  objs.filter(o => o.type === "lanterne").forEach(o => glowAt(c, o.x * TILE + 3, o.y * TILE + 4, 22, "#ffcf6a", .9));
  if (!opts.actors) (map.npcs || []).filter(n => n.lantern && whenOk(n.when, ctx)).forEach(n => {           // un habitant qui cherche à la lanterne
    const lx = Math.round(n.x * TILE + 8 + Math.sin(t / 2600) * 3), ly = Math.round(n.y * TILE - 14); glowAt(c, lx, ly, 22, "#ffcf6a", .9); px(c, NV.ro, lx - 2, ly - 3, 5, 6); px(c, "#ffe8a0", lx - 1, ly - 2, 3, 4); });
  if (map.terrain && map.terrain.river) for (let i = 0; i < 14; i++) {                                        // lucioles près de l'eau
    const P = map.terrain.river.points, p = P[i % P.length], x = Math.round(p[0] * TILE + (hash(i) - .5) * 120 + Math.sin(t / 900 + i) * 8), y = Math.round(hash(i + 9) * H + Math.cos(t / 700 + i * 2) * 6);
    const a = .5 + .5 * Math.sin(t / 300 + i * 3); if (a > .3) { c.globalAlpha = a; px(c, "#e8ff8a", x, y); c.globalAlpha = 1; } }
}
// n'importe quelle carte : extérieur ou pièce
function drawAnyMap(c, map, t, opts = {}) { return map.kind === "piece" ? drawRoom(c, map, t, opts) : drawMap(c, map, t, opts); }
