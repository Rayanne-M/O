// ---------- Plans spéciaux, suite : les scènes de l'enfance (jours 1 à 4) ----------
// Même format que closeups.js : drawXxx(ctx, t, opts) dessine tout l'écran 384 × 216 ; t en millisecondes depuis le début du plan.
// Charger après closeups.js, chars.js, portraits.js et props.js. Chaque plan a une durée XXX_LEN ; après, il reste figé sur sa dernière image.
// Les petites fonctions ci* servent à tous les plans de ce fichier (et aux chapitres suivants).

// un calque fixe, dessiné une seule fois puis gardé : key = nom unique, fn(g) dessine dedans
const ciCache = {};
function ciLayer(key, fn, w = CU_W, h = CU_H) { if (!ciCache[key]) { const [c, g] = cuLayer(w, h); fn(g); ciCache[key] = c; } return ciCache[key]; }
// remplit tout l'écran pixel par pixel : col(x, y) rend une couleur
function ciFill(g, col, x0 = 0, y0 = 0, w = CU_W, h = CU_H) { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) { const c = col(x, y); if (c) cuP(g, x, y, c); } }
// progression 0..1 entre deux instants
const ciK = (t, a, b) => cuClamp((t - a) / (b - a));
// fondu tramé vers une couleur au début (entrée) et à la fin (sortie) d'un plan
function ciFades(g, t, len, inMs = 400, outMs = 400, col = "#000") { cuFade(g, Math.max(1 - t / inMs, (t - (len - outMs)) / outMs), col); }
// une mèche de cheveux de couleur quelconque, d'un point à un autre (épaisseur w), tons pal[0] sombre → pal[3] clair
function ciStrand(g, pts, w, pal, t = 0, i = 0, wob = 0) {
  for (let k = 0; k < pts.length - 1; k++) { const [x0, y0] = pts[k], [x1, y1] = pts[k + 1], n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
    for (let s = 0; s < n; s++) { const u = s / n, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u + Math.sin(t / 200 + (k * n + s) * .2 + i) * wob;
      cuR(g, x - w / 2, y - w / 2, w, w, pal[0]); if (w > 1) cuP(g, x - w / 2 + 1, y - w / 2, (s + i) % 6 === 0 ? pal[3] : pal[2]); else cuP(g, x, y, pal[(s + i) % 5 === 0 ? 2 : 1]); } } }
// une main vue de près, paume vers nous, le poignet vers le bas de l'écran. (x, y) = centre de la paume ; o.s = taille (1 ≈ 60 px de large)
// o.k = 0 poing fermé (les doigts repliés couvrent le haut de la paume) → 1 main grande ouverte ; o.sd = 1 main droite (pouce à gauche), -1 main gauche
// o.skin, o.sleeve = 4 tons ; o.inPalm() dessine ce que la main tient, entre la paume et les doigts ; o.tilt = inclinaison (radians)
function ciHand(g, x, y, o = {}) {
  const k = o.k ?? 1, sd = o.sd || 1, sk = o.skin || CUC.skin, s = o.s || 1, tl = o.tilt || 0, tone = (v, X, Y) => cuTone(v, X, Y, sk);
  const R = (dx, dy) => [x + (dx * Math.cos(tl) - dy * Math.sin(tl)) * s, y + (dx * Math.sin(tl) + dy * Math.cos(tl)) * s];
  const back = [];
  if (o.sleeve) back.push((ink, e) => { const [a, b] = R(0, 60), [c, d] = R(0, 160); cuCaps(g, a, b, c, d, 30 * s + e, ink || ((q, u, X, Y) => cuTone(.55 - q * .3, X, Y, o.sleeve))); });
  back.push((ink, e) => { const [a, b] = R(0, 20), [c, d] = R(0, 70); cuCaps(g, a, b, c, d, 19 * s + e, ink || ((q, u, X, Y) => tone(.62 - q * .3, X, Y))); });                     // le poignet
  back.push((ink, e) => { const [a, b] = R(0, 0); cuEll(g, a, b, 29 * s + e, 27 * s + e, ink || ((nx, ny, X, Y) => tone(.74 - ny * .15 - Math.max(0, .55 - Math.hypot(nx, ny + .1)) * .3, X, Y))); });   // la paume, creusée au centre
  cuInked(g, back);
  if (o.inPalm) o.inPalm();
  const front = [];
  // quatre doigts : base sur le haut de la paume ; ouverts ils montent, repliés ils se rabattent vers le bas, raccourcis par la perspective
  [[-19, 26], [-6, 31], [7, 29], [19, 23]].forEach(([fx, L], f) => { const bx = fx * sd, by = -20 + Math.abs(fx) * .25, ext = k * 2 - 1;
    const [a, b] = R(bx, by), tipDy = ext >= 0 ? -L * ext : -ext * L * .7, [c, d] = R(bx * (1 + .25 * Math.max(0, ext)), by + tipDy), r = (6.5 + (1 - Math.abs(ext)) * 1.5) * s;
    front.push((ink, e) => cuCaps(g, a, b, c, d, r + e, ink || ((q, u, X, Y) => tone(.78 - q * .25 - (ext < 0 ? .12 + u * .1 : u * .08), X, Y))));
    if (ext < -.3) front.push((ink, e) => !ink && cuLine(g, c - 4 * s, d - 2 * s, c + 4 * s, d - 2 * s, 1, sk[0])); });     // le pli des phalanges repliées
  // le pouce : ouvert il part sur le côté, fermé il se couche en travers des doigts
  { const [a, b] = R(-24 * sd, 6), [c, d] = R((-40 + (1 - k) * 38) * sd, -10 - (1 - k) * 12); front.push((ink, e) => cuCaps(g, a, b, c, d, 8 * s + e, ink || ((q, u, X, Y) => tone(.74 - q * .3, X, Y)))); }
  cuInked(g, front);
}
const HERO_HAIR = ["#2e1a14", "#4a2e22", "#6a4632", "#9a6a48"];
const CI_SKY_DAWN = ["#2a2a4a", "#5a4a6a", "#a86a74", "#e8a080", "#f6d0a0"];

// ---------- UI-02 : le décompte du cache-cache (jour 1, midi) ----------
// Yeux fermés contre le mur : la lumière passe rouge à travers les paupières, les nombres s'écrivent un par un avec la voix du héros.
// opts.peek_t : temps (ms) depuis que le joueur a appuyé sur action pour ouvrir un œil ; l'image s'éclaircit 1 s et on voit Margot grimper au chêne.
// Le jeu n'accorde le coup d'œil qu'une fois (Voleur +1). COUNTDOWN_LEN = 11 500 ms ; COUNTDOWN_WORDS donne le texte et l'instant de chaque mot.
const COUNTDOWN_WORDS = [[0, "10…"], [850, "9…"], [1700, "8…"], [2550, "7…"], [3400, "6…"], [4250, "5…"], [5100, "4…"], [5950, "3…"], [6800, "2…"], [7650, "1…"], [8700, "Cachés ou pas cachés,"], [9700, "j'arrive !"]];
const COUNTDOWN_LEN = 11500;
function ciLidGlow(g, t) {   // l'intérieur des paupières : rouge sombre, des taches qui flottent lentement
  ciFill(g, (x, y) => { const a = Math.sin(x / 61 + t / 2100) + Math.sin(y / 37 - t / 2900) + Math.sin((x + y) / 83 + t / 1700), r = Math.hypot((x - 192) / 220, (y - 108) / 140);
    return cuTone(.42 + a * .06 - r * .35, x, y, ["#070203", "#140507", "#26090c", "#3a1214", "#4e1c1a"]); }); }
function ciPeekLayer(t) {     // ce qu'on voit d'un œil : la place au soleil, Margot qui grimpe au chêne (dessiné au pixel du jeu, puis grossi 2 fois)
  const [c, g] = ciCache.peekCv || (ciCache.peekCv = cuLayer(192, 108)); g.clearRect(0, 0, 192, 108);
  ciFill(g, (x, y) => cuTone(.6 + (y > 70 ? .1 : 0) + cuH(Math.floor(x / 7) * 3 + Math.floor(y / 5)) * .08, x, y, ["#3e7a3e", "#5a9a4a", "#7eb85a", "#a4d070"]), 0, 0, 192, 108);
  for (let x = 0; x < 192; x++) for (let y = 0; y < 18; y++) cuP(g, x, y, cuTone(.7 - y / 40, x, y, ["#8a6a50", "#b08a68", "#d8b890"]));                 // un bout de mur de maison
  cuR(g, 0, 18, 192, 2, "#5a4030");
  drawHideBush(g, 160, 100, t, {});
  drawOak(g, 80, 112, t, {});
  const ch = CHARS.margot, climb = ciK(t, 0, 1000), my = 80 - climb * 16;                           // Margot de dos, accrochée au tronc, qui monte
  drawSprite(g, charFrame(ch, "N", "walk", t * 1.5), { ...PAL, ...CH_PAL, ...ch.spec.pal }, 70 + Math.round(Math.sin(t / 90)), Math.round(my));
  return c;
}
function drawCountdown(ctx, t, opts = {}) {
  ctx.imageSmoothingEnabled = false;
  ciLidGlow(ctx, t);
  const pk = opts.peek_t;
  if (pk != null && pk >= 0 && pk < 1000) {          // un œil s'ouvre à moitié, puis se referme
    const open = Math.sin(Math.PI * cuClamp(pk / 1000)) ** .6;
    ctx.save(); ctx.globalAlpha = Math.min(1, open * 1.4); ctx.drawImage(ciPeekLayer(pk), 0, 0, 192, 108, 0, 0, CU_W, CU_H); ctx.restore();
    cuVignette(ctx, .9, "#140507", .3); cuEyelids(ctx, 1 - open * .55);
  }
  ctx.font = "16px 'Pixelify Sans', monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  COUNTDOWN_WORDS.forEach(([at, w], i) => { const age = t - at; if (age < 0) return; const final = i >= 10, next = COUNTDOWN_WORDS[i + 1];
    const out = final ? 0 : ciK(t, next[0] - 120, next[0] + 180), y = final ? 108 + (i - 10.5) * 22 : 108 - out * 18; if (out >= 1) return;   // le nombre s'efface vers le haut quand vient le suivant
    ctx.globalAlpha = ciK(age, 0, 150) * (1 - out); ctx.fillStyle = "#000"; ctx.fillText(w, 193, y + 1); ctx.fillStyle = final ? "#f4e4c8" : "#e8c8b8"; ctx.fillText(w, 192, y); });
  ctx.globalAlpha = 1; ctx.textAlign = "start";
  if (t > COUNTDOWN_LEN - 600) cuFade(ctx, 1 - ciK(t, COUNTDOWN_LEN - 600, COUNTDOWN_LEN), "#fff4dc");   // on rouvre les yeux sur la place
}

// ---------- PLAN-03 : la coupe chez Fauvel (jour 2, matin) ----------
// Deux plans : les mèches tombent sur le carrelage sous le grand fauteuil (les sabots du héros se balancent), puis le héros se regarde dans le miroir piqué.
// opts.coupe : "pointes" (les cheveux longs restent) | "court". HAIRCUT_LEN = 9500 ms.
const HAIRCUT_LEN = 9500, HAIRCUT_CUT = 4600;
function ciTiles(g) {    // carrelage noir et blanc du salon, vu d'en haut, éclairé par la vitrine (en haut à gauche)
  ciFill(g, (x, y) => { const tx = Math.floor((x + y * .18) / 24), ty = Math.floor(y / 20), w = (tx + ty) % 2 === 0, j = (x + y * .18) % 24 < 1 || y % 20 < 1, l = .75 - Math.hypot(x / CU_W, y / CU_H) * .4 + cuH(tx * 3 + ty * 7) * .08;
    return j ? "#5a5048" : cuTone(l, x, y, w ? ["#a89c88", "#cfc4ae", "#ece2cc", "#fff8e8"] : ["#1e1a20", "#2c2830", "#3e3842", "#524a54"]); }); }
function ciChairBase(g) {   // pied en fonte du grand fauteuil et son ombre
  g.globalAlpha = .35; cuEll(g, 210, 46, 70, 26, "#1a1416"); g.globalAlpha = 1;
  cuInked(g, [(ink, e) => cuEll(g, 210, 40, 46 + e, 16 + e, ink || ((nx, ny, X, Y) => cuTone(.5 - ny * .3 - nx * .2, X, Y, ["#1a1a20", "#2e2e38", "#4a4a56", "#6e6e7c"]))),
    (ink, e) => cuR(g, 196 - e, -2, 28 + e * 2, 40, ink || "#3a3a46")]); cuR(g, 200, -2, 4, 38, "#6e6e7c"); cuR(g, 216, -2, 3, 38, "#24242c"); }
function ciLock(g, x, y, rot, len, curl, pal, i) {     // une mèche coupée : un arc épais, effilé au bout
  const pts = []; for (let s = 0; s <= 8; s++) { const u = s / 8, a = rot + curl * u; pts.push([x + Math.cos(a) * len * u, y + Math.sin(a) * len * u + Math.sin(u * 3) * curl * 4]); }
  for (let k = 0; k < 3; k++) ciStrand(g, pts.map(([a, b], s) => [a + (k - 1) * Math.cos(rot + 1.57) * (1 - s / 10) * 1.6, b + (k - 1) * Math.sin(rot + 1.57) * (1 - s / 10) * 1.6]), 1.6, pal, 0, i + k);
}
function drawHaircut(ctx, t, opts = {}) {
  ctx.imageSmoothingEnabled = false;
  const court = opts.coupe === "court";
  if (t < HAIRCUT_CUT) {
    ctx.drawImage(ciLayer("tiles", g => { ciTiles(g); ciChairBase(g); }), 0, 0);
    // les sabots qui se balancent au bord du fauteuil, en haut de l'image
    [-1, 1].forEach(sd => { const sw = Math.sin(t / 380 + (sd > 0 ? 1.4 : 0)) * 6, fx = 192 + sd * 26 + sw, fy = 14 + Math.abs(sw) * .3;
      cuInked(ctx, [(ink, e) => cuCaps(ctx, fx, -10, fx, fy - 6, 8 + e, ink || ((q, u, X, Y) => cuTone(.5 - q * .3, X, Y, ["#3a2a1c", "#5a4430", "#7a5e44"]))),
        (ink, e) => cuEll(ctx, fx, fy, 11 + e, 9 + e, ink || ((nx, ny, X, Y) => cuTone(.6 - ny * .3 - nx * .2, X, Y, CUC.wood)))]); });
    // les mèches tombent par vagues (plus nombreuses et plus longues pour « court »)
    const n = court ? 16 : 7;
    for (let i = 0; i < n; i++) { const at = 300 + i * (court ? 230 : 480) + cuH(i) * 200, u = ciK(t, at, at + 1100); if (u <= 0) continue;
      const lx = 70 + cuH(i * 3.3) * 250, ly = 70 + cuH(i * 5.7) * 120, fall = 1 - u, sx = lx + Math.sin(u * 7 + i) * 18 * fall, sy = ly - fall * 160;
      const rot = cuH(i * 9.1) * 6.28 + fall * 3, len = (court ? 18 : 11) + cuH(i * 2.2) * (court ? 16 : 8), curl = (cuH(i * 4.4) - .5) * 2.4;
      if (u >= 1) { ctx.globalAlpha = .3; ciLock(ctx, lx + 2, ly + 3, rot, len, curl, ["#1a1416", "#1a1416", "#1a1416", "#1a1416"], i); ctx.globalAlpha = 1; }
      ciLock(ctx, sx, sy, rot, len, curl, HERO_HAIR, i); }
    cuVignette(ctx, .45, "#000", .7);
    ciFades(ctx, t, HAIRCUT_CUT, 400, 350);
    return;
  }
  // le miroir piqué ; dedans le héros, avec la cape blanche, se regarde (image inversée, comme dans un miroir)
  const u = t - HAIRCUT_CUT;
  ctx.drawImage(ciLayer("mirrorRoom", g => {
    ciFill(g, (x, y) => y > 176 ? cuTone(.55 - (y - 176) / 120, x, y, CUC.wood) : cuTone(.62 - Math.abs(x - 192) / 600 + (Math.floor(x / 28) % 2 ? .04 : 0), x, y, ["#5a7468", "#7a9488", "#9ab0a2", "#b8c8b8"]));
    cuR(g, 0, 174, CU_W, 3, "#3a2418");
    // étagère de flacons et le portrait du prince de chaque côté
    FURNI.flacons(g, 18, 30, 66, 40); FURNI.flacons(g, 300, 34, 66, 40); FURNI.portrait_prince(g, 318, 90, 24, 30, 0, false, {});
    cuEll(g, 192, 98, 92, 86, IC.o); cuEll(g, 192, 98, 90, 84, (nx, ny, X, Y) => cuTone(.62 - ny * .3 - nx * .2, X, Y, ["#4a2c1a", "#7a4e30", "#a8784c", "#d8a868"]));   // le cadre doré-bois
  }), 0, 0);
  ctx.save(); ctx.beginPath(); ctx.ellipse(192, 98, 80, 75, 0, 0, Math.PI * 2); ctx.clip();
  ctx.drawImage(ciLayer("mirrorIn", g => ciFill(g, (x, y) => cuTone(.5 - (y - 20) / 400 + (x < 192 ? .06 : 0), x, y, ["#6a6458", "#8a8272", "#a8a08c", "#c8bea6"]), 100, 18, 186, 164)), 0, 0);
  const expr = u > 2400 ? (court ? "malin" : "joie") : "neutre", hero = { ...PORTRAITS.heros, hair: { ...PORTRAITS.heros.hair, cut: court ? "court" : "pointes" } };
  const [pc, pg] = ciCache.mirP || (ciCache.mirP = cuLayer(64, 64)); pg.clearRect(0, 0, 64, 64); drawPortrait(pg, hero, u, { expr, bg: false });
  const turn = Math.round(Math.sin(cuClamp((u - 600) / 1400) * Math.PI) * 6);                                      // il tourne la tête pour se voir de côté
  ctx.save(); ctx.translate(192 + 64 + turn, 34); ctx.scale(-2, 2); ctx.drawImage(pc, 0, 0); ctx.restore();
  cuEll(ctx, 192 + turn * .5, 176, 70, 26, (nx, ny, X, Y) => cuTone(.85 - ny * .2 - nx * .1, X, Y, ["#b8b4ac", "#d8d4cc", "#f2efe8", "#ffffff"]));   // la cape
  cuR(ctx, 168 + turn * .5, 153, 48, 3, "#c8c0b0");
  // les points piqués du vieux miroir et un reflet de vitrine
  for (let i = 0; i < 90; i++) { const a = cuH(i * 1.3) * 6.28, r = Math.sqrt(cuH(i * 2.9)) , x = 192 + Math.cos(a) * r * 80, y = 98 + Math.sin(a) * r * 75;
    if (r > .55 || i % 4 === 0) { cuP(ctx, x, y, "#3a3428"); if (i % 3 === 0) cuP(ctx, x + 1, y, "#5a5040"); } }
  ctx.globalAlpha = .18; for (let k = 0; k < 3; k++) cuLine(ctx, 130 + k * 14, 40, 110 + k * 14, 90, 3, "#ffffff"); ctx.globalAlpha = 1;
  ctx.restore();
  cuVignette(ctx, .4, "#000", .75);
  ciFades(ctx, u, HAIRCUT_LEN - HAIRCUT_CUT, 350, 500);
}

// ---------- PLAN-03b : la main d'Élio s'ouvre sur le ruban (jour 3, matin) ----------
// Un ruban bleu à moitié brûlé dans la paume ; la main tremble un peu. RIBBON_HAND_LEN = 6000 ms.
const RIBBON_HAND_LEN = 6000, ELIO_SKIN = ["#b06a54", "#dc9e84", "#f8d4b6", "#fff0dc"], ELIO_SLEEVE = ["#2e4a28", "#3e6634", "#5a8a4a", "#86b46a"];
function ciRibbon(g, pts, w, burnFrom) {     // un ruban le long d'un chemin ; à partir de burnFrom (0..1) il est brûlé : bord rongé, charbon, puis plus rien
  const seg = []; for (let k = 0; k < pts.length - 1; k++) { const [x0, y0] = pts[k], [x1, y1] = pts[k + 1], n = Math.ceil(Math.hypot(x1 - x0, y1 - y0)); for (let s = 0; s < n; s++) seg.push([x0 + (x1 - x0) * s / n, y0 + (y1 - y0) * s / n, Math.atan2(y1 - y0, x1 - x0)]); }
  seg.forEach(([x, y, a], s) => { const u = s / seg.length, burnt = u > burnFrom, bu = (u - burnFrom) / (1 - burnFrom), nx = -Math.sin(a), ny = Math.cos(a);
    const half = burnt ? w / 2 * (1 - bu * .7) - cuH(s * .37) * 2.5 * bu : w / 2; if (burnt && bu > .92) return;
    for (let q = -half - 1; q <= half + 1; q++) { const edge = Math.abs(q) > half - .5, col = Math.abs(q) > half ? CUC.o
        : burnt ? (edge || bu > .55 ? (cuH(s * 1.7 + q) > .7 ? "#5a3a24" : "#1a1210") : cuTone(.5 - bu * .9, Math.round(x + nx * q), Math.round(y + ny * q), ["#1a1210", "#3a2a24", "#2a5884", "#3a7cb6"]))
        : cuTone(.62 + q / w * .5 + Math.sin(s / 9) * .12, Math.round(x + nx * q), Math.round(y + ny * q), ["#1e3e60", "#2a5884", "#3a7cb6", "#6aa8e0"]);
      cuP(g, x + nx * q, y + ny * q, col); } }); }
function drawRibbonHand(ctx, t, opts = {}) {
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(ciLayer("ribbonBg", g => ciFill(g, (x, y) => cuTone(.5 + Math.sin(x / 40) * .04 - y / 900 + cuH(Math.floor(x / 9) + Math.floor(y / 9) * 50) * .06, x, y, ["#3a4a2a", "#4e5e34", "#66763e", "#7e8a4a"]))), 0, 0);
  const k = cuEase(ciK(t, 900, 2600)), tr = Math.sin(t / 47) * .8 + Math.sin(t / 113) * .5;
  ciHand(ctx, 192 + tr, 120, { k, s: 1.55, sd: 1, tilt: -.18, skin: ELIO_SKIN, sleeve: ELIO_SLEEVE,
    inPalm: () => { ciRibbon(ctx, [[150 + tr, 146], [176 + tr, 130], [206 + tr, 140], [232 + tr, 124], [266 + tr, 134]], 14, .5);
      for (let i = 0; i < 8; i++) cuP(ctx, 240 + cuH(i) * 34 + tr, 136 + cuH(i * 3) * 18, i % 2 ? "#1a1210" : "#3a2a24"); } });   // des miettes de charbon
  cuVignette(ctx, .55, "#000", .55);
  ciFades(ctx, t, RIBBON_HAND_LEN, 400, 500);
}

// ---------- PLAN-05 : le réveil (nuit 3) ----------
// La chambre dans le noir ; le héros se redresse d'un coup dans son lit, essoufflé, en sueur. La bougie vient de s'éteindre (un filet de fumée).
// La fenêtre est entrouverte et la lune pose une tache claire sur le rebord. Il ne faut pas la signaler davantage : c'est au joueur d'y penser.
// opts.coupe : "pointes" | "court" (coupe choisie au jour 2). Le plan boucle sur sa respiration après WAKE_LEN = 2500 ms.
const WAKE_LEN = 2500, NROOM = ["#06070c", "#0c0f18", "#141a26", "#1e2636", "#2c3648"], MOON = ["#3a4a66", "#6a80a4", "#a8bcd8", "#dfe8f4"];
function ciNightRoom(g) {
  ciFill(g, (x, y) => cuTone(.45 - Math.hypot((x - 80) / 300, (y - 70) / 200) * .5 + (Math.floor(x / 18) % 2 ? .03 : 0), x, y, NROOM));
  // la fenêtre, à gauche : ciel, étoiles, lune ; le battant droit est entrouvert
  const W0 = 26, W1 = 126, H0 = 26, H1 = 122;
  ciFill(g, (x, y) => cuTone(.5 - (y - H0) / 300, x, y, ["#0a1020", "#121c34", "#1c2a4a"]), W0, H0, W1 - W0, H1 - H0);
  for (let i = 0; i < 18; i++) cuP(g, W0 + 4 + cuH(i * 1.9) * (W1 - W0 - 8), H0 + 4 + cuH(i * 3.7) * 60, i % 4 ? "#6a7aa0" : "#dfe8f4");
  cuEll(g, 52, 52, 11, 11, (nx, ny, X, Y) => cuTone(.9 - nx * .2 - ny * .2 - (Math.hypot(nx + .3, ny - .2) < .3 ? .2 : 0), X, Y, MOON));
  cuR(g, W0 - 4, H0 - 4, W1 - W0 + 8, 4, "#3a2a20"); cuR(g, W0 - 4, H0, 4, H1 - H0, "#3a2a20"); cuR(g, (W0 + W1) / 2 - 2, H0, 4, H1 - H0, "#3a2a20"); cuR(g, W0, (H0 + H1) / 2 - 1, (W1 - W0) / 2, 3, "#3a2a20");
  for (let y = H0; y < H1; y++) { const d = (y - H0) / (H1 - H0), x0 = (W0 + W1) / 2 + 2, w = 34 - d * 2; cuR(g, x0, y, w, 1, (y - H0) % 47 < 3 ? "#3a2a20" : cuTone(.4 + d * .2, x0, y, ["#141a2a", "#1e2a40", "#2a3a58"])); cuR(g, x0 + w, y, 3, 1, "#2a1e16"); }  // le battant entrouvert : un vitrage qui reflète la nuit
  cuR(g, W1 - 12, H0, 12, H1 - H0, "#05060c");
  // le rebord : la lune y pose une tache claire, et un rai de lumière traverse la chambre
  cuR(g, W0 - 10, H1, W1 - W0 + 20, 8, "#3a2a20"); cuR(g, W0 - 10, H1, W1 - W0 + 20, 2, "#5a4030");
  ciFill(g, (x, y) => { const s = x - W0 - 10 - (y - H1) * .1; return s > 0 && s < 50 ? cuTone(.75 - s / 120, x, y, MOON) : null; }, W0, H1, 80, 3);
  ciFill(g, (x, y) => { const s = (x - 40) - (y - H1) * .9; if (s < 0 || s > 70) return null; return CU_BAYER[y & 3][x & 3] < 3 ? MOON[1] : null; }, 40, H1 + 8, 260, CU_H - H1 - 8);
  // le lit : la tête de lit à droite, le drap, la couverture
  ciFill(g, (x, y) => cuTone(.4 - (x - 140) / 900 + (y - 150) / 300, x, y, ["#0e1424", "#1a2238", "#283252", "#3a4668"]), 140, 150, 244, 66);
  cuR(g, 140, 148, 244, 3, IC.o);
  for (let x = 140; x < 384; x += 30) cuR(g, x, 160, 1, 56, "#0e1424");
  // la table de chevet et la bougie éteinte
  cuR(g, 330, 112, 50, 38, IC.o); ciFill(g, (x, y) => cuTone(.35 - (y - 114) / 200, x, y, ["#140c0a", "#22160e", "#2e2016"]), 331, 113, 48, 36); cuR(g, 331, 113, 48, 2, "#3a2a1c");
  cuR(g, 346, 104, 12, 3, "#3a3a46"); cuR(g, 349, 84, 6, 20, "#8a8a9a"); cuR(g, 349, 84, 2, 20, "#b4b4c4"); cuR(g, 351, 81, 1, 3, "#1a1416");
}
function ciHeroHead(g, cx, cy, rim, coupe, pal = ["#1a1014", "#2a1c1c", "#3e2a26", "#56403a"]) {   // tête du héros de profil, à contre-jour : la lune (rim) éclaire le bord gauche
  const S = ["#0a0a12", "#1a1a26", "#3a3448", "#6a5e70"];
  cuInked(g, [(ink, e) => cuEll(g, cx, cy, 17 + e, 19 + e, ink || ((nx, ny, X, Y) => cuTone(.3 - nx * .25 + (nx < -.75 ? rim : 0), X, Y, S))),
    (ink, e) => cuEll(g, cx - 15, cy + 4, 4 + e, 4 + e, ink || ((nx, ny, X, Y) => cuTone(.45 + rim * .6, X, Y, S)))]);                                   // le nez
  const len = coupe === "court" ? 6 : coupe === "long" ? 26 : 16;
  cuEll(g, cx + 3, cy - 7, 18, 14, (nx, ny, X, Y) => ny < .3 || nx > .1 ? cuTone(.3 - nx * .2 + (nx < -.8 ? rim * .8 : 0), X, Y, ["#050308", ...pal.slice(0, 3)]) : null);
  if (len > 6) for (let i = 0; i < 8; i++) ciStrand(g, [[cx + 2 + i * 2, cy - 6], [cx + 6 + i * 2.2, cy + 4], [cx + 4 + i * 2, cy - 2 + len]], 2, ["#050308", pal[0], pal[1], pal[2]], 0, i);
  cuP(g, cx - 9, cy - 1, MOON[3]); cuP(g, cx - 8, cy - 1, "#0a0a12");                                                                                 // l'œil, grand ouvert, un reflet
  cuP(g, cx - 13, cy - 8, MOON[2]); cuP(g, cx - 13, cy - 7, MOON[1]);                                                                                // une goutte de sueur à la tempe
}
function drawWakeUp(ctx, t, opts = {}) {
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(ciLayer("nightRoom", ciNightRoom), 0, 0);
  const rise = cuEase(ciK(t, 0, 650)), breath = t > 650 ? Math.sin((t - 650) / 260) * (1.6 - cuClamp((t - 650) / 6000)) : 0;
  // le héros dessiné droit dans un calque, puis basculé autour des hanches : allongé (rise = 0) → assis (rise = 1)
  const [lc, lg] = ciCache.wakeCv || (ciCache.wakeCv = cuLayer(140, 140)); lg.clearRect(0, 0, 140, 140);
  const S = ["#0a0a12", "#1a1a26", "#2e2a3c", "#4a4258"];
  cuInked(lg, [(ink, e) => cuCaps(lg, 70, 118, 70, 62 - breath, 22 + e, ink || ((q, u, X, Y) => cuTone(.32 - q * .25 + (q < -.8 ? .35 : 0), X, Y, S)))]);              // le torse en chemise de nuit
  cuInked(lg, [(ink, e) => cuCaps(lg, 52, 70 - breath, 44, 104, 7 + e, ink || ((q, u, X, Y) => cuTone(.3 + (q < -.6 ? .4 : 0), X, Y, S)))]);                         // le bras gauche, appuyé
  ciHeroHead(lg, 66, 36 - breath, .5, opts.coupe);
  ctx.save(); ctx.translate(250, 172); ctx.rotate(-(1 - rise) * 1.35); ctx.drawImage(lc, -70, -126); ctx.restore();
  // la couverture par-dessus les jambes, repoussée
  cuInked(ctx, [(ink, e) => cuEll(ctx, 290, 178, 70 + e, 20 + e, ink || ((nx, ny, X, Y) => cuTone(.5 - ny * .3 - nx * .1 + (Math.floor((X + Y) / 11) % 3 ? 0 : .08), X, Y, ["#141a2e", "#222c48", "#34406a", "#4a5888"])))]);
  // la fumée de la bougie qui vient de s'éteindre
  for (let i = 0; i < 26; i++) { const age = ((t / 60) + i * 3) % 78, y = 80 - age, x = 351 + Math.sin(age / 7 + t / 600) * (age / 10); ctx.globalAlpha = cuClamp(.7 - age / 90) * (1 - ciK(t, 4000, 9000) * .6); cuP(ctx, x, y, "#8a8aa0"); }
  ctx.globalAlpha = 1;
  cuVignette(ctx, .6, "#000", .55);
  cuFade(ctx, 1 - ciK(t, 0, 250));
}

// ---------- PLAN-10 : fin pacte, le matin du jour 4 ----------
// La mère coiffe le héros, de dos, dans la lumière de la cuisine. Les cheveux s'allongent sous le peigne ; quelques mèches sont noires.
// Elle s'arrête et mesure du doigt : plus longs d'un doigt. opts.coupe : "pointes" | "court". PACT_MORNING_LEN = 8000 ms.
const PACT_MORNING_LEN = 8000, MERE_SKIN = ["#a8624e", "#d9967e", "#f4c8aa", "#ffe0c8"], MERE_SLEEVE = ["#3a4a6a", "#4e6290", "#6a80b0", "#9ab0d0"];
function drawPactMorning(ctx, t, opts = {}) {
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(ciLayer("kitchenMorning", g => {
    ciFill(g, (x, y) => cuTone(.55 + x / 900 - y / 1200 + (Math.floor(y / 14) % 2 ? .02 : 0), x, y, ["#7a5a3e", "#a07c56", "#c8a478", "#e8c89c"]));
    ciFill(g, (x, y) => { const s = (x - 250) + (y - 0) * .5; return s > 0 && s < 110 && CU_BAYER[y & 3][x & 3] < 6 ? "#f6dcae" : null; });          // le soleil par la fenêtre, à droite
    FURNI.tresses_ail(g, 30, 10, 16, 40);
  }), 0, 0);
  const court = opts.coupe === "court", L0 = court ? 18 : 40, grow = cuEase(ciK(t, 1200, 4200)) * 14, L = L0 + grow, cx = 192, cy = 96;
  // les épaules et le dos de la chemise
  cuInked(ctx, [(ink, e) => cuEll(ctx, cx, 230, 120 + e, 76 + e, ink || ((nx, ny, X, Y) => cuTone(.55 + nx * .25 - ny * .1, X, Y, CUC.sleeve)))]);
  cuInked(ctx, [(ink, e) => cuCaps(ctx, cx, 140, cx, 170, 20 + e, ink || ((q, u, X, Y) => cuTone(.55 + q * .2, X, Y, CUC.skin)))]);              // la nuque
  // la tête de dos, couverte de cheveux ; les mèches tombent sur la nuque, et s'allongent
  cuInked(ctx, [(ink, e) => cuEll(ctx, cx, cy, 52 + e, 56 + e, ink || ((nx, ny, X, Y) => cuTone(.45 + nx * .3 - ny * .15 + Math.sin(X / 3 + ny * 4) * .08, X, Y, HERO_HAIR)))]);
  for (let i = 0; i < 60; i++) { const a = -Math.PI * .92 + i / 59 * Math.PI * .84, x0 = cx + Math.cos(a) * 46, y0 = cy - Math.sin(a) * 18 + 30, black = i % 13 === 6;
    const len = L * (.75 + cuH(i * 3.1) * .35) * (1 - Math.abs(i - 16.5) / 60), sway = Math.sin(t / 900 + i) * 1.5;
    ciStrand(ctx, [[x0, y0 - 10], [x0 + (x0 - cx) * .08, y0 + len * .5], [x0 + (x0 - cx) * .12 + sway, y0 + len]], 2, black ? ["#050308", "#100c16", "#221c30", "#3e3858"] : HERO_HAIR, t, i, black ? .6 : 0); }
  // la main gauche de la mère tient le peigne et descend le long des cheveux, puis s'arrête
  const comb = t < 4200 ? (t % 1400) / 1400 : 1, hy = cy - 30 + cuEase(comb) * (60 + L * .6), hx = cx - 26;
  cuInked(ctx, [(ink, e) => cuR(ctx, hx - 8 - e, hy - 4 - e, 42 + e * 2, 6 + e * 2, ink || "#c8a070")]);                                   // le peigne de bois
  for (let k = 0; k < 10; k++) cuR(ctx, hx - 6 + k * 4, hy + 2, 2, 6, k % 2 ? "#a8804e" : "#c8a070");
  ciHand(ctx, hx - 14, hy - 8, { k: .1, s: .55, sd: -1, tilt: 2.3, skin: MERE_SKIN, sleeve: MERE_SLEEVE });
  // la main droite pince le bout d'une mèche et pose l'index à côté pour mesurer
  if (t > 4400) { const u = cuEase(ciK(t, 4400, 5400)), mx = cx + 36, my = cy + 30 + L * .9;
    ciHand(ctx, mx + 60 - u * 30, my + 10, { k: .45, s: .55, sd: 1, tilt: -2.2, skin: MERE_SKIN, sleeve: MERE_SLEEVE });
    if (t > 5600) { ctx.globalAlpha = ciK(t, 5600, 6000); cuR(ctx, mx - 6, my - grow, 2, grow, "#fff4dc"); cuR(ctx, mx - 9, my - grow, 8, 1, "#fff4dc"); cuR(ctx, mx - 9, my - 1, 8, 1, "#fff4dc"); ctx.globalAlpha = 1; } }
  cuVignette(ctx, .4, "#2a1a10", .7);
  ciFades(ctx, t, PACT_MORNING_LEN, 500, 600);
}

// ---------- PLAN-11 : fin défaite, Aubin repêche le héros à l'aube ----------
// Vu du fond du puits : le héros s'accroche aux pierres, l'eau jusqu'au menton ; tout là-haut, le cercle du ciel rose.
// La tête d'Aubin apparaît, son bras descend, sa main attrape celle du héros, et on remonte vers la lumière. RESCUE_LEN = 9000 ms.
const RESCUE_LEN = 9000, AUBIN_SKIN = ["#8a5038", "#b87a5a", "#e0aa82", "#f0c49c"], AUBIN_SLEEVE = ["#3a3428", "#5a5040", "#7a6e58", "#9a8e74"];
function ciWellUpLayer() { return ciLayer("wellUp", g => {
  const S = ["#040507", "#0a0d11", "#141a20", "#1e262e", "#2c3640", "#3e4a56", "#566470", "#7a8894"], C = [192, 70];
  ciFill(g, (x, y) => { const dx = x - C[0], dy = (y - C[1]) * 1.3, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    if (r < 38) return cuTone(.85 - r / 80 - (y - C[1]) / 200, x, y, CI_SKY_DAWN);                                                           // le ciel de l'aube
    const lr = Math.log(r) * 6, ring = Math.floor(lr), n = 10 + ring * 2, sg = (a / 6.2832 + .5) * n + ring * .43, seg = Math.floor(sg), mortar = lr - ring < .12 || sg - seg < .06;
    const light = Math.max(0, 1 - (r - 38) / 210) ** 1.6 + Math.max(0, Math.cos(a - 1.4)) * .1;
    return cuTone(light * .95 + cuH(ring * 12.9 + seg * 7.8) * .1 - (mortar ? .35 : 0), x, y, S); });
}); }
function drawWellRescue(ctx, t, opts = {}) {
  ctx.imageSmoothingEnabled = false;
  const up = cuEase(ciK(t, 6600, 8800)), z = 1 + up * 2.2;
  ctx.save(); ctx.translate(192, 70); ctx.scale(z, z); ctx.translate(-192, -70 + up * 10); ctx.drawImage(ciWellUpLayer(), 0, 0);
  // la tête d'Aubin se penche au bord, à contre-jour, puis son bras descend
  const lean = cuEase(ciK(t, 1500, 2600));
  if (lean > 0) { const hx = 192 + 6, hy = 70 - 34 + lean * 14;
    cuEll(ctx, hx, hy, 15, 13, (nx, ny, X, Y) => cuTone(.2 + (ny > .6 ? .1 : 0) + (nx > .7 ? .25 : 0), X, Y, ["#0a080c", "#1a1418", "#3a2a26", "#8a5a48"]));
    for (let i = 0; i < 7; i++) cuLine(ctx, hx - 12 + i * 4, hy - 10, hx - 14 + i * 4 + Math.sin(i * 2) * 2, hy - 16, 1, "#0a080c"); }                              // les cheveux en bataille
  ctx.restore();
  const reach = cuEase(ciK(t, 2800, 5200));
  if (reach > 0) { const ex = 214 - reach * 10, ey = 74 + reach * 78, s = .35 + reach * .75;                                                        // la main d'Aubin grossit en approchant
    cuInked(ctx, [(ink, e) => cuCaps(ctx, 204, 60, ex, ey - 28 * s, (6 + reach * 18) + e, ink || ((q, u, X, Y) => cuTone(.3 + u * .3 - q * .2, X, Y, AUBIN_SLEEVE)))]);
    ciHand(ctx, ex, ey, { k: t > 6000 ? .35 : .9, s, sd: -1, tilt: Math.PI, skin: AUBIN_SKIN }); }
  // l'eau noire, au menton : elle clapote et reflète le cercle du ciel
  for (let y = 186; y < CU_H; y++) for (let x = 0; x < CU_W; x++) { const w = Math.sin(x / 13 + t / 300) + Math.sin(x / 7 - t / 210 + y);
    cuP(ctx, x, y, Math.abs(x - 192 + Math.sin(y + t / 200) * 6) < 26 - (y - 186) && w > .6 ? "#a86a74" : cuTone(.3 + w * .08, x, y, ["#020306", "#060a10", "#0e1620"])); }
  // les mains du héros agrippées aux pierres ; la droite lâche et monte vers celle d'Aubin
  const grab = cuEase(ciK(t, 5200, 6400));
  ciHand(ctx, 54, 160, { k: .2, s: .7, sd: 1, tilt: -.5 });
  ciHand(ctx, 330 - grab * 130, 160 - grab * 40, { k: .2 + grab * .5, s: .7 + grab * .1, sd: -1, tilt: .5 - grab * .5 });
  cuVignette(ctx, .55, "#000", .6);
  cuFade(ctx, Math.max(1 - t / 600, 0)); cuFade(ctx, ciK(t, 7600, 8900), "#f6d0a0");
}

// ---------- PLAN-12 : l'enterrement (fin de l'acte) ----------
// Matin gris au cimetière. Le cercueil descend dans la fosse au bout de deux cordes ; Aubin, propre et sobre pour la première fois, tient sa casquette.
// opts.vide : cercueil vide (il ne restait que l'eau rouge : quelques gouttes rouges perlent sous le bois)
// opts.ruban : "donne" (le héros met le ruban dans la main d'Aubin) | "garde" (il le serre contre lui) | absent. FUNERAL_LEN = 11000 ms.
const FUNERAL_LEN = 11000;
function ciFuneralLayer() { return ciLayer("funeral", g => {
  ciFill(g, (x, y) => y < 70 ? cuTone(.7 - y / 300, x, y, ["#8a9098", "#a4aab0", "#bcc0c4", "#d0d2d4"]) : cuTone(.5 - (y - 70) / 500 + cuH(Math.floor(x / 5) + Math.floor(y / 3) * 99) * .1, x, y, ["#3a4a34", "#4e5e40", "#62724e", "#7a8a60"]));
  for (let x = 0; x < CU_W; x++) { const h = 8 + (Math.floor(x / 26) % 2) * 2; cuR(g, x, 70 - h, 1, h, cuTone(.5, x, 0, ["#6a6a70", "#7a7a80"])); if (x % 26 === 0) cuR(g, x, 70 - h, 1, h, "#4a4a52"); }   // le mur du cimetière
  [[30, 92, "croix"], [80, 96, "stele"], [300, 94, "croix"], [356, 98, "stele"]].forEach(([x, y, k]) => drawGrave(g, x, y, k));
  // la fosse et ses parois, la terre en tas à droite
  ciFill(g, (x, y) => { const d = Math.min(x - 120, 280 - x, (y - 120) * 2); return d < 0 ? null : cuTone(.35 - (y - 120) / 260 + (d < 6 ? .15 : 0), x, y, ["#140c08", "#2a1c12", "#4a3420", "#6a4a2c"]); }, 120, 120, 160, 96);
  cuEll(g, 330, 150, 52, 24, (nx, ny, X, Y) => cuTone(.55 - ny * .3 - nx * .1 + cuH(X * 3 + Y) * .1, X, Y, ["#3a2a1a", "#5a4026", "#7a5a36", "#9a7448"]));
  cuR(g, 316, 112, 3, 40, "#6a5a48"); cuR(g, 306, 112, 22, 6, "#8a8a92"); cuR(g, 306, 112, 22, 2, "#b0b0b8");                                   // la pelle plantée
}); }
function drawFuneral(ctx, t, opts = {}) {
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(ciFuneralLayer(), 0, 0);
  // le cercueil qui descend
  const d = cuEase(ciK(t, 800, 6000)) * 64, cy = 96 + d;
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, CU_W, 120); ctx.rect(122, 120, 156, 96); ctx.clip();
  [[146, 1], [254, -1]].forEach(([rx]) => cuLine(ctx, rx, -4, rx, cy + 4, 2, "#8a7a5a"));
  cuInked(ctx, [(ink, e) => cuR(ctx, 132 - e, cy - e, 136 + e * 2, 30 + e * 2, ink || "#5a3a24")]);
  ciFill(ctx, (x, y) => cuTone(.55 - (y - cy) / 60 + (x % 34 < 1 ? -.2 : 0), x, y, ["#3a2418", "#5a3a26", "#7a5038", "#9a6a48"]), 132, cy, 136, 30);
  cuR(ctx, 196, cy + 6, 4, 18, "#d8c8a0"); cuR(ctx, 190, cy + 11, 16, 4, "#d8c8a0");
  if (opts.vide) for (let i = 0; i < 4; i++) { const at = (t + i * 700) % 2800, x = 150 + i * 32, yy = cy + 31 + at / 2800 * 14; ctx.globalAlpha = 1 - at / 2800; cuR(ctx, x, yy, 2, 3, "#921616"); ctx.globalAlpha = 1; }
  ctx.restore();
  // Aubin, à gauche : chemise propre boutonnée, cheveux mouillés peignés, la casquette serrée contre lui, les yeux baissés
  const ax = 62, br = Math.sin(t / 1100) * .8;
  cuInked(ctx, [(ink, e) => cuCaps(ctx, ax, 120, ax, 230, 34 + e, ink || ((q, u, X, Y) => cuTone(.72 + q * .2, X, Y, ["#a8a49a", "#c8c4b8", "#e4e0d4", "#f8f6ee"]))),
    (ink, e) => cuCaps(ctx, ax, 96, ax, 116, 10 + e, ink || ((q, u, X, Y) => cuTone(.55 + q * .2, X, Y, AUBIN_SKIN))),
    (ink, e) => cuEll(ctx, ax, 74 + br, 20 + e, 23 + e, ink || ((nx, ny, X, Y) => cuTone(.62 + nx * .2 - ny * .1, X, Y, AUBIN_SKIN)))]);
  cuEll(ctx, ax, 60 + br, 21, 12, (nx, ny, X, Y) => ny < .35 ? cuTone(.4 + nx * .2 + (X % 3 ? 0 : .1), X, Y, ["#100c14", "#1c1822", "#2e2a36", "#4a4458"]) : null);
  for (let x = -14; x <= 14; x++) for (let y = 4; y < 18; y++) if ((x / 15) ** 2 + ((y - 4) / 16) ** 2 < 1 && CU_BAYER[(y + 3) & 3][(x + 16) & 3] < 5) cuP(ctx, ax + x, 74 + y + br, "#6a4a40");   // la barbe rasée de près
  [[-8, 1], [8, -1]].forEach(([ex]) => { cuR(ctx, ax + ex - 3, 72 + br, 6, 1, "#3a2a24"); cuR(ctx, ax + ex - 3, 68 + br, 6, 1, "#1c1822"); });                          // yeux baissés, sourcils
  cuR(ctx, ax - 4, 86 + br, 8, 1, "#7a4a3a");
  for (let y = 124; y < 216; y += 12) cuR(ctx, ax - 1, y, 2, 2, "#8a8678");
  const hold = opts.ruban === "donne" ? cuEase(ciK(t, 7400, 8400)) : 0, shirt = (q, u, X, Y) => cuTone(.66 + q * .2, X, Y, ["#a8a49a", "#c8c4b8", "#e4e0d4", "#f8f6ee"]);
  cuInked(ctx, [(ink, e) => cuEll(ctx, ax, 162, 22 + e, 13 + e, ink || ((nx, ny, X, Y) => cuTone(.4 - ny * .3, X, Y, ["#1e2228", "#2e343c", "#424a54"])))]);             // la casquette serrée contre le ventre
  cuInked(ctx, [(ink, e) => cuCaps(ctx, ax - 30, 128, ax - 22, 158, 8 + e, ink || shirt), (ink, e) => cuEll(ctx, ax - 16, 160, 8 + e, 6 + e, ink || ((nx, ny, X, Y) => cuTone(.6 - ny * .3, X, Y, AUBIN_SKIN)))]);   // bras et main gauches
  cuInked(ctx, [(ink, e) => cuCaps(ctx, ax + 30, 128, ax + 26 + hold * 14, 158 + hold * 26, 8 + e, ink || shirt),
    (ink, e) => cuEll(ctx, ax + 20 + hold * 16, 160 + hold * 28, 8 + e, 6 + e, ink || ((nx, ny, X, Y) => cuTone(.6 - ny * .3, X, Y, AUBIN_SKIN)))]);              // la main droite descend prendre le ruban
  // le héros : sa main entre par la droite, le ruban bleu
  if (opts.ruban === "donne" && t > 6000) { const u = cuEase(ciK(t, 6000, 7600)), hx = 420 - u * 300, hy = 192;
    ciHand(ctx, hx, hy, { k: .55, s: .5, sd: -1, tilt: -1.6, inPalm: () => {} });
    ciRibbon(ctx, [[hx - 18, hy - 4], [hx - 30, hy + 6], [hx - 40, hy + 18]], 6, .55); }
  else if (opts.ruban === "garde" && t > 6000) { const u = cuEase(ciK(t, 6000, 7000)), hx = 360, hy = 230 - u * 50;
    ciRibbon(ctx, [[hx - 10, hy - 2], [hx - 20, hy + 10], [hx - 16, hy + 24]], 6, .55); ciHand(ctx, hx, hy, { k: 0, s: .5, sd: -1, tilt: -.3 }); }
  cuVignette(ctx, .4, "#1a1e24", .7);
  ciFades(ctx, t, FUNERAL_LEN, 600, 900);
}

// ---------- PLAN-13 : les fins de la nuit 3, au bord du puits ----------
// Le trou du puits de très près, la nuit ; ses cheveux débordent de la margelle. L'Esprit ne se montre jamais : on ne voit que ses cheveux.
// opts.fin : "chante" (apaisement : ils ondulent au rythme d'un chant, des notes montent, puis ils s'élèvent et se dissolvent dans la nuit)
//            "fuit" (victoire : trois mèches coupées sur la pierre, les cheveux se tordent, saignent noir et filent par-dessus la margelle)
//            "relache" (incrédulité : ils retombent, mous, et glissent au fond sans bruit). NIGHT_END_LEN = 8000 ms.
const NIGHT_END_LEN = 8000;
function ciWellRimLayer() { return ciLayer("wellRim", g => {
  cuNightGrass(g, 0, 21, 0, .8, true);
  const rim = (x, y) => ((x - 192) / 170) ** 2 + ((y - 128) / 70) ** 2;
  ciFill(g, (x, y) => { const r = rim(x, y), ri = ((x - 192) / 130) ** 2 + ((y - 124) / 48) ** 2; if (r > 1) return null;
    if (ri < 1) { const top = 124 - 48 * Math.sqrt(Math.max(0, 1 - ((x - 192) / 130) ** 2)), d = y - top; return d < 34 ? cuTone(.55 - d / 40 - Math.abs(x - 150) / 400, x, y, NIGHT.stone.slice(0, 4)) : "#020204"; }   // la paroi du fond, éclairée par la lune
    const a = Math.atan2(y - 128, x - 192), seg = Math.floor((a + 3.1416) / 6.2832 * 22), joint = ((a + 3.1416) / 6.2832 * 22) % 1 < .05;
    return joint ? NIGHT.stone[0] : cuTone(.6 - (y - 80) / 260 + cuH(seg * 7.3) * .2 - (x / CU_W) * .2, x, y, NIGHT.stone); });
}); }
const WELL_HOLE = (x, y) => ((x - 192) / 130) ** 2 + ((y - 124) / 48) ** 2 < 1;
function drawNightEnding(ctx, t, opts = {}) {
  ctx.imageSmoothingEnabled = false;
  const fin = opts.fin || "chante";
  ctx.drawImage(ciWellRimLayer(), 0, 0);
  if (fin === "fuit") [[96, 150, .4], [250, 168, 2.6], [300, 140, -.2]].forEach(([x, y, r], i) => ciLock(ctx, x, y, r, 22, 1.4, ["#050308", "#100c16", "#221c30", "#3e3858"], i));   // les trois mèches coupées
  // des cheveux sortent du trou et débordent par-dessus la margelle vers le bas de l'écran
  const N = 22;
  for (let i = 0; i < N; i++) { const bx = 92 + i * 9.5, by = 112 + Math.sin(i) * 6;
    let reach = 1, lift = 0, wob = .5, dx = 0, alpha = 1;
    if (fin === "chante") { wob = .8 + Math.sin(t / 500) * .3; lift = cuEase(ciK(t, 3500, 7000)); alpha = 1 - ciK(t, 5000, 7600); }
    if (fin === "relache") { wob = Math.max(0, .5 - t / 1500); reach = 1 - cuEase(ciK(t, 1800 + i * 40, 5200 + i * 60)); }
    if (fin === "fuit") { wob = t < 2600 ? 2.5 : 1; dx = -cuEase(ciK(t, 2600 + (N - i) * 25, 5800)) * 520; }
    if (reach <= .02 || alpha <= 0) continue;
    const len = (70 + cuH(i * 3.3) * 50) * reach, pts = [];
    for (let s = 0; s <= 6; s++) { const u = s / 6, y = by + u * len - lift * (u * 200 + 40), x = bx + dx * (u * .6 + .4) + Math.sin(u * 3 + i) * 12 * (1 - lift) + lift * Math.sin(u * 6 + t / 400 + i) * 20;
      pts.push([x, y]); }
    ctx.globalAlpha = alpha; ciStrand(ctx, pts, 4 + (i % 3 === 0 ? 1 : 0), ["#050308", "#1a1626", "#3e3858", "#6a6490"], t, i, wob * 2); ctx.globalAlpha = 1; }
  // le chant : de petites notes pâles montent du trou ; la fuite : des gouttes noires ; à la fin de la fuite, une traînée mouillée sur la pierre
  if (fin === "chante") for (let i = 0; i < 7; i++) { const u = ((t / 2600) + i / 7) % 1, x = 140 + cuH(i * 5) * 110 + Math.sin(u * 8 + i) * 10, y = 120 - u * 120; if (t > 6500) break;
    ctx.globalAlpha = Math.sin(u * Math.PI) * .9; cuR(ctx, x, y, 3, 3, "#c8d8f0"); cuR(ctx, x + 2, y - 7, 1, 7, "#c8d8f0"); cuR(ctx, x + 3, y - 7, 3, 1, "#c8d8f0"); ctx.globalAlpha = 1; }
  if (fin === "fuit") { for (let i = 0; i < 14; i++) { const u = ((t / 900) + i / 14) % 1; if (t > 3200) break; const x = 120 + cuH(i * 7) * 160, y = 120 + u * 70 + cuH(i) * 20; cuR(ctx, x, y, 2, 2 + u * 2, "#050308"); }
    if (t > 3000) for (let k = 0; k < 40; k++) { const x = 190 - k * 6, y = 196 + Math.sin(k * .7) * 4; if (x < -10) break; ctx.globalAlpha = ciK(t, 3000, 4000) * .8; cuR(ctx, x, y, 6, 3, "#0a0810"); if (k % 4 === 0) cuP(ctx, x + 2, y, "#6a8ab0"); ctx.globalAlpha = 1; } }
  cuVignette(ctx, .6, "#000", .5);
  ciFades(ctx, t, NIGHT_END_LEN, 400, 900);
}

// ---------- PLAN-14 : les fouilles à l'aube (jour 4) ----------
// Plan large : le ciel rose, la lisière de la forêt, la brume au ras des herbes. Une file d'hommes avec des lanternes traverse le champ ;
// Aubin marche devant, sans lanterne. Les personnages sont ceux du jeu (chars.js), en ombres chinoises. DAWN_SEARCH_LEN = 12000 ms (boucle possible).
const DAWN_SEARCH_LEN = 12000;
function ciDawnLayer() { return ciLayer("dawn", g => {
  ciFill(g, (x, y) => y < 120 ? cuTone(.15 + y / 130, x, y, CI_SKY_DAWN) : null);
  for (let x = 0; x < CU_W; x++) { const h = 7 + Math.sin(x / 9) * 2 + Math.sin(x / 3.3) + cuH(Math.floor(x / 3)) * 4; cuR(g, x, 112 - h, 1, h, cuTone(.4, x, 0, ["#5a4a6a", "#6a5674"])); }   // la forêt, loin
  ciFill(g, (x, y) => { const ry = 118 + Math.sin(x / 70) * 4; return y >= ry ? cuTone(.18 + (y - ry) / 300, x, y, ["#0e1216", "#161e22", "#1e2a2a"]) : null; }, 0, 104, CU_W, 30);   // la butte où marchent les hommes
  ciFill(g, (x, y) => cuTone(.25 + (y - 120) / 400 + cuH(Math.floor(x / 3) + y * 37) * .1, x, y, ["#141a1e", "#1e2a2a", "#2a3a34", "#3a4a3e"]), 0, 120, CU_W, 96);
}); }
function drawDawnSearch(ctx, t, opts = {}) {
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(ciDawnLayer(), 0, 0);
  // la file d'hommes, de droite à gauche
  const men = [["aubin", 0, false], ["villageois1", 34, true], ["villageois2", 62, true], ["fauvel", 96, true], ["villageois1", 126, true]];
  const [lc, lg] = ciCache.dawnCv || (ciCache.dawnCv = cuLayer()); lg.clearRect(0, 0, CU_W, CU_H);
  men.forEach(([k, off, lamp], i) => { const ch = CHARS[k]; if (!ch) return; const x = 420 - ((t / 26 + off * 1.0) % 520) + (i % 2) * 4, y = 120 + Math.sin(x / 70) * 4 - ch.H;
    drawChar(lg, ch, x, y, { dir: "W", pose: "walk", t: t + i * 70, shadow: false }); });
  lg.globalCompositeOperation = "source-atop"; lg.fillStyle = "#0c0a12"; lg.fillRect(0, 0, CU_W, CU_H); lg.globalCompositeOperation = "source-over";
  ctx.drawImage(lc, 0, 0);
  men.forEach(([k, off, lamp], i) => { if (!lamp || !CHARS[k]) return; const x = 420 - ((t / 26 + off) % 520) + (i % 2) * 4, y = 120 + Math.sin(x / 70) * 4 - CHARS[k].H; drawLantern(ctx, x + 5, y + 22, t + i * 300); });
  // la brume qui passe en bandes
  for (let y = 120; y < 190; y++) for (let x = 0; x < CU_W; x++) { const f = Math.sin(x / 40 + t / 3000 + y / 7) * .5 + .5 - Math.abs(y - 150) / 34; if (CU_BAYER[y & 3][x & 3] / 16 < f * .45) cuP(ctx, x, y, "#c8b4b8"); }
  cuVignette(ctx, .45, "#0a0810", .7);
  ciFades(ctx, t, 1e9, 600, 1);
}
