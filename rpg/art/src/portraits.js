// ---------- Portraits de dialogue (64 × 64) ----------
// Un portrait = une fiche (âge, peau, coiffure, yeux, vêtement, détails) + une expression + l'ouverture de la bouche.
//   drawPortrait(ctx, who, t, o)  dessine PORTRAITS[who] (ou une fiche) en (o.x, o.y) ; o = { expr, open (0..1), x, y, bg: false }
//   talkMouth(line, shown, t)     ouverture de la bouche pendant que le texte s'écrit (voyelles = bouche ouverte)
// Les expressions sont communes à tous : neutre, joie, triste, colere, peur, malin, ivre, sueur, chante, endormi, serieux.
// Utilise les petites fonctions de closeups.js (cuEll, cuCaps, cuTone…).
const PT = 64;
const EXPR = {
  neutre:  { brow: [0, 0], lid: 1, mouth: 0 },
  serieux: { brow: [1, 0], lid: .85, mouth: -.2 },
  joie:    { brow: [-1, -1], lid: .7, mouth: 1, smileEyes: true },
  triste:  { brow: [-3, 1], lid: .75, mouth: -.8, look: [0, 1], tear: true },
  colere:  { brow: [3, -1], lid: .8, mouth: -1, look: [0, 0] },
  peur:    { brow: [-3, -2], lid: 1.2, mouth: 0, small: true, oMouth: true, sweat: 1 },
  malin:   { brow: [0, -2], browR: [1, 1], lid: .75, mouth: .6, smirk: true, look: [1, 0] },
  ivre:    { brow: [-1, 1], lid: .5, mouth: -.3, flush: true, look: [-1, 1] },
  sueur:   { brow: [-2, -1], lid: 1.1, mouth: 0, small: true, oMouth: true, sweat: 3 },
  chante:  { brow: [-1, -1], lid: 0, mouth: .3, oMouth: true },
  endormi: { brow: [0, 1], lid: 0, mouth: 0 },
};
const PTC = { o: "#1e1620", eyeW: "#f8f4ee", pupil: "#1a1418", mouth: "#5a1e24", tongue: "#c45a5a", teeth: "#f4ecdc", tear: "#8ac8f0", blush: "#e88a7a" };
// les habitants : couleurs en 4 tons (sombre → clair)
const PORTRAITS = {
  heros: { name: "Le héros", age: "child", skin: ["#a8624e", "#d9967e", "#f6cfae", "#ffe4cc"], hair: { style: "hero", c: ["#2e1a14", "#4a2e22", "#6a4632", "#9a6a48"] }, iris: "#5a3a2a",
    shirt: { c: ["#6a3e14", "#b0702a", "#e0a03a", "#f6c868"] }, bg: "#24304a" },
  elio: { name: "Élio", age: "child", skin: ["#b06a54", "#dc9e84", "#f8d4b6", "#fff0dc"], hair: { style: "braids", c: ["#6a4a20", "#a8803e", "#d8b060", "#f4d890"], ribbon: "#3a7cb6" }, iris: "#4a7ab0",
    shirt: { c: ["#24401e", "#3e6634", "#5a8a4a", "#86b46a"] }, bg: "#283a3a" },
  elio_rase: { name: "Élio", age: "child", skin: ["#b06a54", "#dc9e84", "#f8d4b6", "#fff0dc"], hair: { style: "shaved", c: ["#a08048", "#c8a870", "#e8d0a0", "#f4e4c0"] }, iris: "#4a7ab0", cuts: true,
    shirt: { c: ["#24401e", "#3e6634", "#5a8a4a", "#86b46a"] }, bg: "#283a3a" },
  elio_capuche: { name: "Élio", age: "child", skin: ["#b06a54", "#dc9e84", "#f8d4b6", "#fff0dc"], hair: { style: "hood", c: ["#2e261e", "#54483c", "#7a6a58", "#9a8a74"] }, iris: "#4a7ab0",
    shirt: { c: ["#24401e", "#3e6634", "#5a8a4a", "#86b46a"] }, bg: "#283a3a" },
  margot: { name: "Margot", age: "child", skin: ["#b06a54", "#dc9e84", "#f8d4b6", "#fff0dc"], hair: { style: "bob", c: ["#5a2010", "#8e3a1e", "#c8562c", "#ec8a50"] }, iris: "#4a8a4a", freckles: true,
    shirt: { c: ["#5a1a30", "#8e2e4a", "#c44a6a", "#ea7a92"] }, bg: "#3a2838" },
  basile: { name: "Basile", age: "child", skin: ["#b06a54", "#dc9e84", "#f8d4b6", "#fff0dc"], hair: { style: "bowl", c: ["#100c14", "#1c1822", "#2e2a36", "#4a4458"] }, iris: "#5a4030", round: true,
    shirt: { c: ["#24385e", "#3c5a88", "#5a7ab0", "#86a6d4"] }, bg: "#2a3048" },
  mere: { name: "La mère", age: "adult", skin: ["#a8624e", "#d9967e", "#f4c8aa", "#ffe0c8"], hair: { style: "bun", c: ["#3a2014", "#5a3420", "#7a4a2a", "#a06a40"] }, iris: "#5a3a2a",
    shirt: { c: ["#3a2048", "#5e3a74", "#8a5aa0", "#b48ad0"], apron: ["#a89c88", "#c9c0aa", "#f4ead2", "#ffffff"] }, bg: "#2e2a40" },
  ysol: { name: "Grand-mère Ysol", age: "elder", skin: ["#9a6a5a", "#c0907a", "#eac4a8", "#f8dcc4"], hair: { style: "bunWhite", c: ["#8a8698", "#b4b0c0", "#e4e0e8", "#ffffff"] }, iris: "#6a8a9a", wrinkles: true,
    shirt: { c: ["#2a2232", "#3c3048", "#5a4a6a", "#7a6a8a"], shawl: ["#5a2a26", "#86403a", "#b85a4a", "#d87a62"] }, bg: "#302838" },
  aubin: { name: "Aubin", age: "adult", skin: ["#8a5038", "#b87a5a", "#e0aa82", "#f0c49c"], hair: { style: "short", c: ["#100c14", "#1c1822", "#2e2a36", "#4a4458"] }, iris: "#3a3028", stubble: "#4a3a40", bags: true,
    shirt: { c: ["#2e2620", "#4a3e34", "#6a5a4a", "#8a7a66"] }, bg: "#2a2420" },
  fauvel: { name: "Maître Fauvel", age: "adult", skin: ["#a8624e", "#d9967e", "#f6cfae", "#ffe4cc"], hair: { style: "balding", c: ["#5a5668", "#78748a", "#a8a4b0", "#d4d0dc"] }, iris: "#4a6a8a", mustache: true, wrinkles: true,
    shirt: { c: ["#a89c88", "#c9c0aa", "#f4ead2", "#ffffff"], tie: "#2a5e94" }, bg: "#24304a" },
};
function ptHead(sp) { return sp.age === "child" ? { cx: 32, cy: 29, rx: 15.5, ry: 15.5, eyeY: 31, eyeDx: 7.5, eyeW: 3, eyeH: 3.6, mouthY: 41, browY: 25 }
  : { cx: 32, cy: 28, rx: 13.5, ry: 16.5, eyeY: 29, eyeDx: 6.5, eyeW: 2.6, eyeH: 2.4, mouthY: 39.5, browY: 25, jaw: true }; }
function ptSkin(sp, v, x, y) { return cuTone(v, x, y, sp.skin); }
// les cheveux derrière la tête (tresses, chignon, masse)
function ptHairBack(g, sp, h, t) {
  const H = sp.hair, c = H.c, tone = (v, x, y) => cuTone(v, x, y, c);
  if (H.style === "braids") [-1, 1].forEach(sd => { const bx = h.cx + sd * (h.rx - 1); for (let k = 0; k < 7; k++) { const y = h.cy + 4 + k * 4.4, x = bx + sd * (k * .6);
      cuEll(g, x, y, 4.2, 3.2, PTC.o); cuEll(g, x, y, 3.4, 2.4, (nx, ny, X, Y) => tone(.65 - ny * .4 + (k % 2 ? -.1 : .05) - sd * nx * .15, X, Y)); }
    const ex = bx + sd * 4.2, ey = h.cy + 36; cuEll(g, ex, ey, 4, 2.4, PTC.o); cuEll(g, ex, ey, 3.2, 1.6, H.ribbon); cuR(g, ex - 1, ey + 1, 2, 4, H.ribbon); });
  if (H.style === "bob") { cuEll(g, h.cx, h.cy + 2, h.rx + 4, h.ry + 2, PTC.o); cuEll(g, h.cx, h.cy + 2, h.rx + 3, h.ry + 1, (nx, ny, x, y) => tone(.45 - ny * .2 - nx * .1, x, y)); }
  if (H.style === "bun" || H.style === "bunWhite") { cuEll(g, h.cx + 2, h.cy - h.ry + 1, 7, 5.5, PTC.o); cuEll(g, h.cx + 2, h.cy - h.ry + 1, 6, 4.5, (nx, ny, x, y) => tone(.6 - ny * .4 - nx * .2 + (Math.floor((nx + ny) * 4) % 2 ? .08 : 0), x, y)); }
  if (H.style === "hood") { cuEll(g, h.cx, h.cy + 2, h.rx + 7, h.ry + 6, PTC.o); cuEll(g, h.cx, h.cy + 2, h.rx + 6, h.ry + 5, (nx, ny, x, y) => tone(.55 - ny * .2 - nx * .2, x, y)); }
}
// la calotte et la frange, par-dessus le front
function ptHairFront(g, sp, h, t) {
  const H = sp.hair, c = H.c, tone = (v, x, y) => cuTone(v, x, y, c), cx = h.cx, top = h.cy - h.ry;
  const cap = (fringe, extra = () => false, side = 0) => {                       // tout ce qui est au-dessus de la frange, plus les côtés
    const inside = (x, y) => ((x + .5 - cx) / (h.rx + 1.5)) ** 2 + ((y + .5 - h.cy + 1) / (h.ry + 1.5)) ** 2 <= 1;
    for (let y = top - 3; y <= h.cy + side; y++) for (let x = cx - h.rx - 3; x <= cx + h.rx + 3; x++) {
      if (!inside(x, y)) continue; const f = fringe(x - cx); if (y > f && !(Math.abs(x - cx) > h.rx - 2.5 && y < h.cy + side) && !extra(x, y)) continue;
      cuP(g, x, y, PTC.o); }
    for (let y = top - 3; y <= h.cy + side; y++) for (let x = cx - h.rx - 3; x <= cx + h.rx + 3; x++) {
      if (!inside(x - Math.sign(x - cx) * .9, y + .9)) continue; const f = fringe(x - cx) - 1; if (y > f && !(Math.abs(x - cx) > h.rx - 1.5 && y < h.cy + side - 1) && !extra(x, y)) continue;
      const nx = (x - cx) / h.rx, ny = (y - h.cy) / h.ry; cuP(g, x, y, tone(.62 - ny * .3 - nx * .25 + (H.style === "balding" ? 0 : Math.sin(x * 1.3 + y * .4) * .08), x, y)); } };
  if (H.style === "hero") { cap(dx => top + 10 + (Math.abs(dx) < 10 ? [0, 3, 1, 4, 0, 3, 1][Math.floor((dx + 10) / 3)] : 3), () => false, 4);
    [[-6, -1], [0, -2], [5, -1]].forEach(([a, b], i) => { cuCaps(g, cx + a, top + 2, cx + a + 2, top + b, 2, PTC.o); cuCaps(g, cx + a, top + 2, cx + a + 2, top + b, 1.1, c[2 + (i % 2)]); });
    if (H.cut !== "court") { const len = H.cut === "pointes" ? 5 : 9; [-1, 1].forEach(sd => { cuCaps(g, cx + sd * (h.rx - 2), h.cy - 2, cx + sd * (h.rx - .5), h.cy + len, 3.2, PTC.o); cuCaps(g, cx + sd * (h.rx - 2), h.cy - 2, cx + sd * (h.rx - .5), h.cy + len, 2.2, (s, u, x, y) => tone(.55 - u * .3 - sd * s * .1, x, y)); }); } }
  if (H.style === "braids") { cap(dx => top + 9 + Math.abs(dx) * .25 - (Math.abs(dx) < 1.5 ? 6 : 0), () => false, 2);
    for (let y = top; y < top + 8; y++) cuP(g, cx, y, c[0]); }                                                      // la raie au milieu
  if (H.style === "bob") cap(dx => top + 10 + ((Math.floor(dx / 3) % 2) ? 1 : 0) + (dx > 6 ? -2 : 0), () => false, 10);
  if (H.style === "bowl") cap(() => top + 12, () => false, 2);
  if (H.style === "bun" || H.style === "bunWhite") { cap(dx => top + 6 + Math.abs(dx) * .35, () => false, 0); for (let y = top; y < top + 5; y++) cuP(g, cx, y, c[0]); }
  if (H.style === "short") cap(dx => top + 7 + (Math.floor((dx + 20) / 4) % 2), () => false, -2);
  if (H.style === "balding") { for (let y = h.cy - 6; y < h.cy + 6; y++) [-1, 1].forEach(sd => { for (let k = 0; k < 4; k++) { const x = cx + sd * (h.rx - 1 + k - 1); cuP(g, x, y, k === 0 || k === 3 ? PTC.o : tone(.6 - (y - h.cy) * .05, x, y)); } });
    cuEll(g, cx - 5, top + 5, 3, 1.6, sp.skin[3]); }                                                                // le crâne qui brille
  if (H.style === "shaved") { cuEll(g, cx, h.cy - 3, h.rx + .5, h.ry - 2, (nx, ny, x, y) => ny < -.1 && CU_BAYER[y & 3][x & 3] / 16 < .45 ? c[1] : null);
    if (sp.cuts) [[-6, -10, -3, -8], [5, -12, 8, -9], [-1, -13, 1, -12]].forEach(([a, b, d, e]) => { cuLine(g, cx + a, h.cy + b, cx + d, h.cy + e, 1, "#b23a36"); cuP(g, cx + d, h.cy + e + 1, "#7a1e22"); }); }
  if (H.style === "hood") { const fr = (x, y) => ((x + .5 - cx) / (h.rx + .5)) ** 2 + ((y + .5 - h.cy - 2) / (h.ry + 1)) ** 2 > .8;
    cuEll(g, cx, h.cy + 1, h.rx + 7, h.ry + 6, (nx, ny, x, y) => fr(x, y) && ny < .62 ? cuTone(.55 - ny * .2 - nx * .2, x, y, c) : null);
    cuEll(g, cx, h.cy - h.ry + 4, h.rx - 1, 3, (nx, ny, x, y) => ny > 0 ? c[0] : null); }               // l'ombre de la capuche sur le front
}
function ptBody(g, sp, h) {
  const S = sp.shirt, child = sp.age === "child", w = child ? 22 : 25, top = child ? 50 : 51;
  cuR(g, h.cx - 6, h.cy + 8, 13, top - h.cy - 3, PTC.o);
  cuR(g, h.cx - 5, h.cy + 8, 11, top - h.cy - 4, sp.skin[1]); cuR(g, h.cx - 5, h.cy + 8, 4, top - h.cy - 4, sp.skin[2]);           // le cou
  cuR(g, h.cx - 5, h.cy + 8, 11, 3, sp.skin[0]);
  cuEll(g, h.cx, top + 18, w + 1, 20, PTC.o);
  cuEll(g, h.cx, top + 18, w, 19, (nx, ny, x, y) => cuTone(.6 - nx * .35 - ny * .2 + (child ? 0 : Math.sin(x * .8) * .04), x, y, S.c));
  cuEll(g, h.cx, top + 1, 6, 3, PTC.o); cuEll(g, h.cx, top + 1, 5, 2, sp.skin[1]);                                               // l'encolure
  if (S.apron) { cuR(g, h.cx - 9, top + 7, 18, 20, PTC.o); cuR(g, h.cx - 8, top + 8, 16, 20, S.apron[2]); cuR(g, h.cx + 4, top + 8, 4, 20, S.apron[1]); cuR(g, h.cx - 13, top + 6, 26, 2, S.apron[1]); }
  if (S.shawl) { cuEll(g, h.cx, top + 5, w + 2, 9, PTC.o); cuEll(g, h.cx, top + 5, w + 1, 8, (nx, ny, x, y) => cuTone(.6 - nx * .3 - ny * .3 + ((x + y) % 6 < 1 ? -.15 : 0), x, y, S.shawl));
    cuEll(g, h.cx, top + 1, 7, 3.5, PTC.o); cuEll(g, h.cx, top + 1, 6, 2.5, sp.skin[1]); }
  if (S.tie) { cuR(g, h.cx - 4, top + 2, 9, 4, PTC.o); cuR(g, h.cx - 3, top + 3, 7, 2, S.tie); cuR(g, h.cx - 1, top + 2, 3, 4, S.tie); }
}
function ptFace(g, sp, h, E, open, t) {
  const cx = h.cx, skin = (v, x, y) => ptSkin(sp, v, x, y);
  // oreilles, tête
  [-1, 1].forEach(sd => { cuEll(g, cx + sd * h.rx, h.cy + 3, 3.4, 4.4, PTC.o); cuEll(g, cx + sd * h.rx, h.cy + 3, 2.4, 3.4, (nx, ny, x, y) => skin(.5 - sd * .2 - ny * .2, x, y)); });
  const jaw = (x, y) => !h.jaw || y < h.cy + 6 || Math.abs(x + .5 - cx) < h.rx - (y - h.cy - 6) * .55;
  cuEll(g, cx, h.cy, h.rx + 1, h.ry + 1, (nx, ny, x, y) => jaw(x, y) || jaw(x + Math.sign(cx - x), y - 1) ? PTC.o : null);
  cuEll(g, cx, h.cy, h.rx, h.ry, (nx, ny, x, y) => jaw(x, y) ? skin(.72 - nx * .3 - ny * .22 - (nx > .55 ? .15 : 0) + (sp.round && ny > .3 ? .05 : 0), x, y) : null);
  if (sp.stubble) cuEll(g, cx, h.cy + 7, h.rx - 1, 8, (nx, ny, x, y) => ny > -.1 && jaw(x, y) && cuH(x * 31 + y * 7) < .4 && !(Math.abs(x - cx) < 4 && Math.abs(y - h.mouthY) < 2) ? sp.stubble : null);
  // joues
  const flush = E.flush ? 1 : 0;
  [-1, 1].forEach(sd => cuEll(g, cx + sd * (h.eyeDx + 1), h.eyeY + 5, 3.2 + flush, 1.6 + flush * .4, (nx, ny, x, y) => CU_BAYER[y & 3][x & 3] / 16 < .5 + flush * .3 ? PTC.blush : null));
  if (sp.freckles) [[-9, 35], [-7, 36], [-10, 37], [8, 35], [10, 36], [7, 37], [-1, 36], [1, 35]].forEach(([a, b]) => cuP(g, cx + a, b, sp.skin[0]));
  if (sp.wrinkles) { [-1, 1].forEach(sd => { cuP(g, cx + sd * (h.eyeDx + 4), h.eyeY, sp.skin[1]); cuP(g, cx + sd * (h.eyeDx + 4), h.eyeY + 1, sp.skin[1]); cuLine(g, cx + sd * 4, h.mouthY - 3, cx + sd * 5, h.mouthY + 1, 1, sp.skin[1]); });
    cuLine(g, cx - 4, h.browY - 4, cx + 4, h.browY - 4, 1, sp.skin[1]); }
  if (sp.bags) [-1, 1].forEach(sd => cuLine(g, cx + sd * h.eyeDx - 2, h.eyeY + h.eyeH + 1.5, cx + sd * h.eyeDx + 2, h.eyeY + h.eyeH + 1.5, 1, "#8a5a5a"));
  // nez
  cuP(g, cx + 1, h.mouthY - 4, sp.skin[1]); cuP(g, cx, h.mouthY - 3, sp.skin[1]); cuP(g, cx - 1, h.mouthY - 4, sp.skin[3]);
  if (E.flush) cuEll(g, cx, h.mouthY - 4, 1.6, 1.2, "#e07070");
  // yeux : blanc, iris, pupille, reflet, paupière
  const blink = (Math.floor(t / 3700) % 3 === 0 && t % 3700 < 140) ? 0 : 1, lid = E.lid * blink;
  [-1, 1].forEach(sd => { const ex = cx + sd * h.eyeDx, ey = h.eyeY, w = h.eyeW * (E.small ? .95 : 1), hh = h.eyeH * Math.min(1.2, Math.max(lid, 0));
    const look = E.look || [0, 0];
    if (lid <= .05 || E.smileEyes) { // yeux fermés (ou plissés de joie) : un arc
      const up = E.smileEyes ? -1 : 1; for (let k = -w; k <= w; k++) cuP(g, ex + k, ey + Math.round(up * (1 - (k / w) ** 2) * 1.5) * (E.smileEyes ? 1 : -1) + (E.smileEyes ? 1 : 0), PTC.o);
      cuP(g, ex - w - 1, ey + (E.smileEyes ? 1 : 0), PTC.o); return; }
    cuEll(g, ex, ey + (h.eyeH - hh) / 2, w + 1, hh + 1, PTC.o);
    cuEll(g, ex, ey + (h.eyeH - hh) / 2, w, hh, PTC.eyeW);
    const ir = E.small ? 1.4 : w * .78, ix = ex + look[0] * .8 + (sd > 0 ? -.3 : .3), iy = ey + look[1] * .8 + .4;
    cuEll(g, ix, iy, ir, Math.min(hh, ir * 1.25), (nx, ny, x, y) => ny < -.4 ? cuTone(.2, x, y, [sp.iris, PTC.o]) : sp.iris);
    cuEll(g, ix, iy + .3, Math.max(.8, ir * .5), Math.max(.8, Math.min(hh, ir * .6)), PTC.pupil);
    cuP(g, ix - ir * .4, iy - ir * .5, "#ffffff");
    for (let k = -w - 1; k <= w + 1; k++) cuP(g, ex + k, ey + (h.eyeH - hh) / 2 - hh - .5 + Math.abs(k) * .2, PTC.o);    // paupière haute
  });
  // sourcils
  [-1, 1].forEach(sd => { const b = sd > 0 && E.browR ? E.browR : E.brow, ex = cx + sd * h.eyeDx, inner = [ex - sd * 3.5, h.browY + b[0] * .8], outer = [ex + sd * 3.5, h.browY + b[1] * .8];
    cuLine(g, inner[0], inner[1], outer[0], outer[1], sp.age === "child" ? 1.6 : 1.8, sp.hair.style === "bunWhite" || sp.hair.style === "balding" ? sp.hair.c[1] : sp.hair.c[0]); });
  // moustache (derrière la bouche)
  // bouche
  const my = h.mouthY, mw = E.oMouth ? 2.5 : 4.5, sm = E.mouth;
  const o2 = Math.max(open, E.oMouth ? .45 : 0);
  if (o2 > .08) { const ry = .8 + o2 * 3.6, rx = E.oMouth ? 2.4 + o2 : mw - .5 + o2 * .6;
    cuEll(g, cx + (E.smirk ? 1 : 0), my + ry * .4 - sm * .3, rx + 1, ry + 1, PTC.o); cuEll(g, cx + (E.smirk ? 1 : 0), my + ry * .4 - sm * .3, rx, ry, (nx, ny, x, y) => ny > .35 ? PTC.tongue : PTC.mouth);
    if (o2 > .35 && !E.oMouth) cuR(g, cx - rx + 1.5, my - ry * .6 + .5, rx * 2 - 2, 1, PTC.teeth); }
  else for (let k = -mw; k <= mw; k++) { const curve = -sm * (1 - (k / mw) ** 2) * 1.6 + sm * 1.2 + (E.smirk ? k * .25 : 0); cuP(g, cx + k, my + Math.round(curve), PTC.mouth); }
  if (sp.mustache) [-1, 1].forEach(sd => { cuCaps(g, cx + sd * 1, my - 2.5, cx + sd * 7, my - 1 + Math.sin(t / 900) * .3, 2.6, PTC.o); cuCaps(g, cx + sd * 1, my - 2.5, cx + sd * 7, my - 1, 1.7, (s, u, x, y) => cuTone(.7 - u * .3, x, y, sp.hair.c));
    cuP(g, cx + sd * 8, my - 2, sp.hair.c[1]); });
  // larmes, sueur
  if (E.tear) { const k = (t % 2400) / 2400; cuR(g, cx - h.eyeDx - 2, h.eyeY + 4 + k * 8, 1, 2, PTC.tear); cuP(g, cx - h.eyeDx - 2, h.eyeY + 3, PTC.tear); }
  if (E.sweat) for (let i = 0; i < E.sweat; i++) { const k = ((t / 1800) + i * .37) % 1, x = cx + [11, -12, 9][i], y = h.cy - 8 + i * 5 + k * 6;
    cuEll(g, x, y, 1.6, 2.2, PTC.o); cuEll(g, x, y, 1, 1.6, PTC.tear); cuP(g, x - .5, y - 1, "#ffffff"); }
}
const ptCache = {};
function drawPortrait(ctx, who, t = 0, o = {}) {
  const sp = typeof who === "string" ? PORTRAITS[who] : who, E = EXPR[o.expr || "neutre"] || EXPR.neutre, open = o.open || 0, x0 = o.x || 0, y0 = o.y || 0;
  const [c, g] = ptCache.cv || (ptCache.cv = cuLayer(PT, PT)); g.clearRect(0, 0, PT, PT);
  if (o.bg !== false) { g.fillStyle = sp.bg; g.fillRect(0, 0, PT, PT); for (let y = 0; y < PT; y++) for (let x = 0; x < PT; x++) if ((x + y * 3) % 11 === 0 && CU_BAYER[y & 3][x & 3] < 4) cuP(g, x, y, "rgba(255,255,255,.05)"); }
  const h = ptHead(sp); const bob = Math.round(Math.sin(t / 900) * .4);
  g.save(); g.translate(0, bob);
  ptHairBack(g, sp, h, t); ptBody(g, sp, h); ptFace(g, sp, h, E, open, t); ptHairFront(g, sp, h, t);
  g.restore();
  ctx.imageSmoothingEnabled = false; ctx.drawImage(c, x0, y0);
}
// ouverture de la bouche quand le texte s'écrit : grande sur les voyelles, petite sinon, fermée à la fin
function talkMouth(line, shown, t) {
  if (shown >= line.length) return 0; const ch = line[Math.max(0, shown - 1)] || " ";
  return /[aeiouyéèàâêîôû]/i.test(ch) ? .55 + .45 * Math.abs(Math.sin(t / 70)) : /[ .,…!?]/.test(ch) ? 0 : .15 + .2 * Math.abs(Math.sin(t / 50));
}
