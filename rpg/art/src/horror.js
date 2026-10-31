// ---------- Au fond du puits : la vue plongeante (plus détaillée que le jeu) ----------
const HORROR_W = 160, HORROR_H = 120, BAYER4 = [[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
const horrorImgs = {};
function buildHorror(variant, rase = true) {   // rase : la tête d'Élio, rasée par son père le soir du jour 2 (false = les anciens cheveux blonds)
  const cv = document.createElement("canvas"); cv.width = HORROR_W; cv.height = HORROR_H; const ctx = cv.getContext("2d");
  const W = HORROR_W, H = HORROR_H, C = [80, 60];
  const P = (x, y, c) => { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= W || y >= H) return; ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1); };
  const rnd = (() => { let s = 4242; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  const ramp = (arr, v, x, y) => { const f = Math.max(0, Math.min(.999, v)) * (arr.length - 1) + BAYER4[y & 3][x & 3] / 16 - .5; return arr[Math.max(0, Math.min(arr.length - 1, Math.round(f)))]; };
  const STONE = ["#040507", "#0c1015", "#171d24", "#232b34", "#323c46", "#46525c", "#5e6a72"];
  const HAIR = ["#020103", "#08060c", "#110e18", "#1e1a2a", "#302b42"];
  const SKIN = ["#120c0e", "#33242a", "#5e4646", "#8c6c66", "#b8968a", "#d8bcaa"];
  const GOLD = ["#1e160a", "#4a3818", "#7a5e2a", "#a8843e", "#c8a456"];
  const BLOOD = ["#160204", "#380508", "#640a10", "#921616", "#b8302a"];
  const GREY = ["#16181a", "#34383a", "#5a5e5c", "#868a84", "#aeb0a6"];
  // 1. le conduit vu d'en haut : des anneaux de pierres qui se resserrent vers le fond
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = x - C[0], dy = (y - C[1]) * 1.18, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    const lr = Math.log(r + 3) * 7.5, ring = Math.floor(lr), n = 8 + ring * 3, sg = (a / 6.2832 + .5) * n + ring * .37, seg = Math.floor(sg);
    const mortar = lr - ring < .16 || sg - seg < .07 * (1 + ring * .05);
    const light = Math.pow(Math.min(1, r / 95), .8) * .8 + Math.max(0, Math.cos(a + .9)) * .28 * Math.min(1, r / 60);
    const stoneVar = (Math.sin(ring * 12.9898 + seg * 78.233) * 43758.5453) % 1;
    let v = light * .9 + Math.abs(stoneVar) * .12 - (mortar ? .45 : 0) + ((lr - ring) - .5) * .3 * light;
    P(x, y, ramp(STONE, v, x, y));
  }
  // 2. la masse de cheveux au fond, en tourbillon
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = x - C[0], dy = (y - C[1]) * 1.18, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    const edge = 34 + Math.sin(a * 7) * 4 + Math.sin(a * 13 + 1) * 2; if (r > edge) continue;
    const swirl = .5 + .5 * Math.sin(a * 22 + r * .55 + Math.sin(r * .3) * 2);
    P(x, y, ramp(HAIR, swirl * .7 + (r / edge) * .1 - .05 + (rnd() - .5) * .2, x, y));
  }
  // un mèche : (x, y, angle, longueur, épaisseur, courbure, enroulement)
  function strand(x, y, ang, len, thick, bend, curl, hl = 4) {
    for (let s = 0; s < len; s++) {
      const k = s / len; ang += bend * Math.sin(s * .12 + bend * 9) * .08 + (k > .7 ? curl * (k - .7) * .9 : 0);
      x += Math.cos(ang); y += Math.sin(ang);
      const w = Math.max(1, Math.round(thick * (1 - k * .8)));
      for (let q = 0; q < w; q++) P(x + q * Math.cos(ang + 1.57), y + q * Math.sin(ang + 1.57), q === 0 && s % 6 === 3 ? HAIR[hl] : HAIR[q ? 0 : 1]);
    }
    return [x, y];
  }
  // 3. les tentacules de cheveux qui remontent le long des parois
  for (let i = 0; i < 64; i++) {
    const a = rnd() * 6.2832, r0 = 22 + rnd() * 10;
    strand(C[0] + Math.cos(a) * r0, C[1] + Math.sin(a) * r0 / 1.18, a + (rnd() - .5) * .6, 14 + rnd() * 40, 1 + rnd() * 2.5, (rnd() - .5) * 3, (rnd() < .5 ? -1 : 1) * (2 + rnd() * 3));
  }
  [[-1.75, 70], [-1.25, 64], [2.6, 58], [.35, 55]].forEach(([a, len]) => strand(C[0] + Math.cos(a) * 20, C[1] + Math.sin(a) * 17, a, len, 5, .6, a > 0 ? 3 : -3));  // grandes cornes de cheveux
  // 4. la tête de l'ami, renversée vers nous
  const F = [80, 63], frx = 20, fry = 23;
  const inF = (x, y) => ((x - F[0]) / frx) ** 2 + ((y - F[1]) / fry) ** 2 <= 1;
  for (let y = -30; y <= 10; y++) for (let x = -25; x <= 25; x++) { const d = (x / 24) ** 2 + ((y + 3) / 28) ** 2; if (d > 1 || (x / frx) ** 2 + (y / fry) ** 2 < .95) continue;
    if (rase) { P(F[0] + x, F[1] + y, ramp(SKIN, .55 - d * .45 + x / 120, x, y)); if (((x * 7 + y * 13) & 7) === 0 || BAYER4[y & 3][x & 3] > 13) P(F[0] + x, F[1] + y, d > .8 ? HAIR[2] : GOLD[1]); }   // crâne rasé, un duvet de poils
    else P(F[0] + x, F[1] + y, ramp(GOLD, .6 + .4 * Math.sin(x * 1.4 + y * .2) - d * .4, x, y)); }   // cheveux blonds mouillés
  for (let y = -fry; y <= fry; y++) for (let x = -frx; x <= frx; x++) {
    const d = (x / frx) ** 2 + (y / fry) ** 2; if (d > 1) continue;
    const nx = x / frx, ny = y / fry, nz = Math.sqrt(Math.max(0, 1 - d));
    let v = Math.max(0, nx * .45 - ny * .5 + nz * .74) * .85 + .1;
    v -= Math.max(0, 1 - ((x + 8) / 7) ** 2 - ((y - 6) / 5) ** 2) * .08 + Math.max(0, 1 - ((x - 8) / 7) ** 2 - ((y - 6) / 5) ** 2) * .12;   // joues
    v += Math.max(0, 1 - (x / 2) ** 2 - ((y - 1) / 6) ** 2) * .15;                                                                 // arête du nez
    P(F[0] + x, F[1] + y, ramp(SKIN, v, x + 80, y + 64));
  }
  [[-9, 4], [-7, 6], [-11, 6], [9, 5], [7, 3], [11, 7], [-2, 2], [2, 3], [-5, 5]].forEach(([x, y]) => P(F[0] + x, F[1] + y, SKIN[2]));   // taches de rousseur
  if (!rase) for (let x = -frx + 2; x <= frx - 2; x += 2) strand(F[0] + x, F[1] - fry - 3, 1.57 + x * .015, 4 + Math.abs(Math.sin(x * 3)) * 7, 1, .2, 0, 3);   // mèches blondes collées au front
  if (!rase) for (let x = -frx + 3; x <= frx - 3; x += 3) { const l = 3 + Math.abs(Math.sin(x * 2)) * 6; for (let k = 0; k < l; k++) P(F[0] + x + Math.sin(k * .5) * .6, F[1] - fry + k, GOLD[k % 3 ? 3 : 2]); }
  // sourcils froncés de terreur
  [[-1, F[0] - 9], [1, F[0] + 9]].forEach(([sd, bx]) => { for (let k = -4; k <= 4; k++) { const y = F[1] - 10 - Math.round((k * sd + 4) / 4); P(bx + k, y, GOLD[1]); if (Math.abs(k) < 3) P(bx + k, y - 1, GOLD[2]); } });
  // l'oreille gauche : un faisceau de cheveux s'y enfonce
  const ear = [F[0] - frx - 1, F[1] + 1];
  for (let y = -6; y <= 6; y++) for (let x = -3; x <= 2; x++) if ((x / 3) ** 2 + (y / 6) ** 2 <= 1) P(ear[0] + x, ear[1] + y, (x / 3) ** 2 + (y / 6) ** 2 > .6 ? SKIN[2] : SKIN[3]);
  for (let i = 0; i < 11; i++) { let x = ear[0] - 22 - rnd() * 8, y = ear[1] - 12 + i * 2.4; const tx = ear[0], ty = ear[1] + (i - 5) * .3;
    for (let s = 0; s <= 26; s++) { const u = s / 26; P(x + (tx - x) * u, y + (ty - y) * u + Math.sin(u * 6 + i) * 1.5 * (1 - u), s % 5 === 2 ? HAIR[4] : HAIR[1]); } }
  for (let y = -2; y <= 2; y++) { P(ear[0], ear[1] + y, "#000"); P(ear[0] + 1, ear[1] + y, BLOOD[2]); }
  for (let k = 0; k < 9; k++) P(ear[0] + 1 + (k > 4 ? 1 : 0), ear[1] + 3 + k, BLOOD[k % 3 === 0 ? 4 : 2]);
  // les yeux
  const EYEW = ["#5a4a48", "#a89490", "#d8ccc4", "#f0e8e0"];
  function eyeball(ex, ey, r, look) {                    // un globe : blanc veiné, iris bleu, regard révulsé
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) { const d = (x * x + y * y) / (r * r); if (d > 1) continue;
      P(ex + x, ey + y, ramp(EYEW, .95 - d * .6 + (x + y < 0 ? .1 : -.1), x, y)); }
    for (let k = 0; k < 5; k++) { let x = ex + Math.cos(k * 1.3) * r, y = ey + Math.sin(k * 1.3) * r; for (let s = 0; s < r; s++) { x -= Math.cos(k * 1.3) * .8 + (rnd() - .5) * .5; y -= Math.sin(k * 1.3) * .8; P(x, y, BLOOD[s % 2 ? 2 : 3]); } }
    const ix = ex + look[0], iy = ey + look[1];
    for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) if (x * x + y * y <= 4 && ((ix + x - ex) ** 2 + (iy + y - ey) ** 2) <= r * r) P(ix + x, iy + y, x * x + y * y <= 1 ? "#060404" : "#3a5a7a");
    P(ex - 1, ey - 1, "#ffffff");
  }
  function socket(ex, ey, full) {                        // paupières gonflées, et soit l'œil, soit un trou
    for (let y = -4; y <= 4; y++) for (let x = -6; x <= 6; x++) { const d = (x / 6) ** 2 + (y / 4) ** 2; if (d > 1) continue;
      P(ex + x, ey + y, d > .6 ? "#7a3a42" : (full ? "#5a2a2a" : (d > .3 ? BLOOD[1] : "#010001"))); }
    for (let x = -5; x <= 5; x++) { P(ex + x, ey - 4 + Math.abs(x) / 3, SKIN[1]); if (x % 2) P(ex + x, ey - 5 + Math.abs(x) / 3, "#2a1a14"); }   // cils
  }
  function bloodTears(ex, ey, n, lenBase) {
    for (let s = 0; s < n; s++) { let x = ex - 3 + s * 3, y = ey + 3; const len = lenBase + s * 4;
      for (let k = 0; k < len; k++) { y += 1; x += (rnd() - .5) * .6; if (!inF(x | 0, y | 0)) break; P(x, y, ramp(BLOOD, .85 - k / len * .5, x | 0, y | 0)); }
      P(x, y + 1, BLOOD[3]); }
  }
  function hairFrom(ex, ey, side, n, len) {
    for (let i = 0; i < n; i++) strand(ex + (rnd() - .5) * 2, ey + (rnd() - .5) * 2, (side > 0 ? -.3 : 3.45) + (i - (n - 1) / 2) * .45, len + rnd() * len, i < 2 ? 2 : 1, (rnd() - .5) * 3, side * (2 + rnd() * 3), 3);
  }
  const eyes = [[F[0] - 8, F[1] - 4, -1], [F[0] + 8, F[1] - 4, 1]];
  if (variant === 1) {          // les yeux sont encore là, révulsés ; les cheveux sortent par le coin des yeux
    eyes.forEach(([ex, ey, sd]) => { socket(ex, ey, true); eyeball(ex, ey, 4, [0, -3]); bloodTears(ex, ey, 2, 12);
      for (let i = 0; i < 4; i++) strand(ex - sd * 5, ey + 2, 1.57 + sd * (.2 + i * .25), 12 + rnd() * 14, i < 2 ? 2 : 1, (rnd() - .5) * 2, sd * 2, 3); });
  } else if (variant === 2) {   // un œil tombé, qui pend sur la joue au bout de son nerf
    const [lx, ly, ls] = eyes[0], [rx, ry, rs] = eyes[1];
    socket(lx, ly, true); eyeball(lx, ly, 4, [1, -3]); bloodTears(lx, ly, 2, 10);
    for (let i = 0; i < 3; i++) strand(lx - ls * 5, ly + 2, 1.57 + ls * (.2 + i * .25), 12 + rnd() * 12, i < 1 ? 2 : 1, (rnd() - .5) * 2, ls * 2, 3);
    socket(rx, ry, false); bloodTears(rx, ry, 3, 14); hairFrom(rx, ry, rs, 5, 18);
    const fall = [F[0] + 15, F[1] + 11];
    for (let k = 0; k <= 14; k++) { const u = k / 14; P(rx + (fall[0] - rx) * u + Math.sin(u * 3.14) * 3, ry + (fall[1] - ry) * u, k % 3 ? BLOOD[2] : BLOOD[4]); P(rx + (fall[0] - rx) * u + Math.sin(u * 3.14) * 3 + 1, ry + (fall[1] - ry) * u, BLOOD[1]); }
    eyeball(fall[0], fall[1], 4, [-2, 1]);
  } else {                      // les deux orbites vides ; les globes sont pris dans les cheveux, plus loin
    eyes.forEach(([ex, ey, sd]) => { socket(ex, ey, false); bloodTears(ex, ey, 3, 14); hairFrom(ex, ey, sd, 6, 20); });
    [[F[0] - 31, F[1] + 18, [2, -1]], [F[0] + 33, F[1] - 12, [-2, 2]]].forEach(([x, y, look]) => {
      strand(x - 8, y - 2, .15, 16, 1, .5, 1, 3); strand(x - 8, y + 2, -.1, 16, 1, .5, -1, 3); eyeball(x, y, 4, look); strand(x - 7, y + 4, -.5, 14, 1, .4, 1, 3); });
  }
  // le nez : des mèches sortent des narines
  const nose = [F[0], F[1] + 6];
  P(nose[0] - 2, nose[1], "#000"); P(nose[0] - 1, nose[1], "#000"); P(nose[0] + 1, nose[1], "#000"); P(nose[0] + 2, nose[1], "#000");
  P(nose[0] - 3, nose[1] - 1, SKIN[2]); P(nose[0] + 3, nose[1] - 1, SKIN[2]); P(nose[0], nose[1] - 3, SKIN[5]); P(nose[0], nose[1] - 2, SKIN[4]);
  [[-1.5, 1.9], [1.5, 1.2]].forEach(([o, ang]) => { for (let i = 0; i < 3; i++) strand(nose[0] + o, nose[1], ang + (i - 1) * .35, 7 + i * 4, 1, 1.5, o > 0 ? 2 : -2, 3); });
  for (let k = 0; k < 6; k++) { P(nose[0] - 2, nose[1] + 1 + k, BLOOD[3 - (k % 2)]); P(nose[0] + 2, nose[1] + 1 + k * .8, BLOOD[2]); }
  // la bouche, ouverte sur un cri muet : lèvres bleuies, dents de lait, langue
  const M = [F[0], F[1] + 15];
  for (let y = -4; y <= 4; y++) for (let x = -5; x <= 5; x++) { const d = (x / 5) ** 2 + (y / 4) ** 2; if (d > 1) continue;
    P(M[0] + x, M[1] + y, d > .65 ? (y < 0 ? "#6a5260" : "#8a6a74") : (y > 1 ? "#4a1a22" : "#050203")); }
  [-2, -1, 1, 2].forEach(x => { P(M[0] + x, M[1] - 2, "#e8dcc8"); P(M[0] + x, M[1] - 1, x % 2 ? "#c8bca8" : "#e8dcc8"); });
  P(M[0] - 1, M[1] + 2, "#7a3040"); P(M[0], M[1] + 2, "#8a3a48"); P(M[0] + 1, M[1] + 2, "#7a3040");

  // 6. quelques mèches repassent devant tout
  for (let i = 0; i < 8; i++) { const a = rnd() * 6.28; strand(C[0] + Math.cos(a) * 34, C[1] + Math.sin(a) * 30, a + (rnd() - .5) * .8, 14 + rnd() * 18, 1, (rnd() - .5) * 3, 2); }
  // 7. vignette
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot((x - 80) / 80, (y - 60) / 60);
    if (d > .9 && BAYER4[y & 3][x & 3] / 16 < (d - .9) * 2) P(x, y, "#000"); }
  // seuils d'apparition : les parois proches d'abord, le fond en dernier
  const data = ctx.getImageData(0, 0, W, H), th = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const r = Math.hypot(x - C[0], (y - C[1]) * 1.18);
    th[y * W + x] = .08 + .62 * (1 - Math.min(1, r / 95)) + BAYER4[y & 3][x & 3] / 16 * .14; }
  return { data, th };
}
// p : de 0 (noir complet) à 1 (les yeux se sont habitués)
// o.rase (true par défaut) : tête rasée, comme dans le scénario réécrit ; o.doux : version atténuée (PLAN-06b), assombrie et le rouge éteint
function renderHorror(ctx, p, variant = 1, o = {}) {
  const rase = o.rase !== false, key = variant + (rase ? "" : "b");
  if (!horrorImgs[key]) horrorImgs[key] = buildHorror(variant, rase);
  const { data, th } = horrorImgs[key], out = ctx.createImageData(HORROR_W, HORROR_H), dim = o.doux ? .45 : 1;
  for (let i = 0; i < th.length; i++) {
    const f = Math.max(0, Math.min(1, (p - th[i]) / .22)), x = i % HORROR_W, y = (i / HORROR_W) | 0;
    const k = f >= 1 ? 1 : (BAYER4[y & 3][x & 3] / 16 < f ? (f > .5 ? .7 : .35) : 0);
    let r = data.data[i * 4], g = data.data[i * 4 + 1], b = data.data[i * 4 + 2];
    if (o.doux) { const m = (r + g + b) / 3; r = m + (r - m) * .25; g = m + (g - m) * .25; b = m + (b - m) * .25 + 4; }
    out.data[i * 4] = r * k * dim; out.data[i * 4 + 1] = g * k * dim; out.data[i * 4 + 2] = b * k * dim; out.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(out, 0, 0);
}

// ---------- L'esprit parle à travers l'enfant : portrait de dialogue animé ----------
const TALK_LINES = ["Tu es venu le chercher ?", "Il avait si peur… C'était délicieux.", "Approche. Laisse-moi goûter la tienne.", "Ou bien… prête-moi tes cheveux."];
let talkBase = null;
function talkPortrait(ctx, t, open) {
  if (!talkBase) { if (!horrorImgs[3]) horrorImgs[3] = buildHorror(3); talkBase = document.createElement("canvas"); talkBase.width = HORROR_W; talkBase.height = HORROR_H; talkBase.getContext("2d").putImageData(horrorImgs[3].data, 0, 0); }
  const OX = 48, OY = 31, P = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); };
  ctx.imageSmoothingEnabled = false; ctx.drawImage(talkBase, -OX, -OY);
  const SK = ["#5e4646", "#8c6c66", "#b8968a"], HL = "#302b42", HB = "#050308";
  // la mâchoire : on recouvre l'ancienne bouche de peau, puis on redessine une bouche qui s'ouvre
  const M = [80 - OX, 78 - OY], drop = open * 2, ry = 1 + open * 4.5;
  for (let y = -5; y <= 7; y++) for (let x = -6; x <= 6; x++) if ((x / 6) ** 2 + (y / 6.5) ** 2 <= 1) P(M[0] + x, M[1] + y, SK[(x + y + 40) % 3 === 0 ? 0 : (x > 2 ? 0 : 1)]);
  [[-5, "#640a10"], [-4, "#921616"], [4, "#640a10"], [5, "#380508"]].forEach(([x, col]) => { for (let y = -5; y <= 7; y++) if ((x / 6) ** 2 + (y / 6.5) ** 2 <= 1) P(M[0] + x + (y > 3 ? Math.sign(x) * -1 : 0), M[1] + y, col); });
  for (let y = -Math.ceil(ry) - 1; y <= Math.ceil(ry) + 1; y++) for (let x = -6; x <= 6; x++) { const d = (x / 6) ** 2 + (y / (ry + 1)) ** 2; if (d > 1) continue;
    P(M[0] + x, M[1] + drop / 2 + y, d > .62 ? (y < 0 ? "#6a5260" : "#8a6a74") : "#050203"); }
  [-2, -1, 1, 2].forEach(x => P(M[0] + x, M[1] + drop / 2 - ry + .5, "#e8dcc8"));
  if (open > .35) [-2, 1, 2].forEach(x => P(M[0] + x, M[1] + drop / 2 + ry - .5, "#c8bca8"));
  // les cheveux qui tirent la bouche : des orbites jusqu'aux coins et au centre
  const eyes = [[72 - OX, 59 - OY], [88 - OX, 59 - OY]];
  [[eyes[0], [M[0] - 4, M[1] + drop / 2]], [eyes[1], [M[0] + 4, M[1] + drop / 2]], [eyes[0], [M[0] - 1, M[1] + drop / 2 + ry * .6]], [eyes[1], [M[0] + 1, M[1] + drop / 2 + ry * .6]]].forEach(([[ax, ay], [bx, by]], i) => {
    const n = 22, sag = (1 - open) * 3;
    for (let s = 0; s <= n; s++) { const u = s / n, x = ax + (bx - ax) * u + Math.sin(u * 3.14) * (i % 2 ? sag : -sag) + Math.sin(t / 140 + u * 8 + i) * .6 * (1 - open * .7), y = ay + (by - ay) * u;
      P(x, y, s % 5 === 2 ? HL : HB); }
  });
  // des mèches qui ondulent hors des orbites
  eyes.forEach(([ex, ey], sd) => { const side = sd ? 1 : -1;
    for (let i = 0; i < 6; i++) { let x = ex, y = ey, a = (side > 0 ? -.4 : 3.54) + (i - 2.5) * .42; const len = 7 + (i * 5) % 7;
      for (let s = 0; s < len; s++) { a += Math.sin(t / 260 + s * .45 + i * 1.3) * .22; x += Math.cos(a); y += Math.sin(a); P(x, y, s % 4 === 1 ? HL : HB); } } });
}
// boîte de dialogue : le texte s'écrit, la bouche suit les voyelles
function renderTalk(t) {
  const c = ctxOf("talk"), per = 4200, idx = Math.floor(t / per) % TALK_LINES.length, local = t % per, line = TALK_LINES[idx];
  const shown = Math.min(line.length, Math.floor(local / 65)), typing = shown < line.length;
  const ch = line[Math.max(0, shown - 1)] || " ", vowel = /[aeiouyéèàâêîôû]/i.test(ch);
  const open = typing ? (vowel ? .55 + .45 * Math.abs(Math.sin(local / 70)) : .15 + .2 * Math.abs(Math.sin(local / 50))) : .05;
  talkPortrait(c, t, open);
  const el = document.getElementById("talk-text"), txt = line.slice(0, shown);
  if (el.textContent !== txt) el.textContent = txt;
}
