// ---------- Effets en jeu, à l'échelle de la carte (nuit 3 au puits, indicateurs) ----------
// Charger après spirit.js (drawWellFront, N) et props.js. (wx, wy) = coin haut-gauche du puits, comme pour drawWell (36 × 46).
// t en ms depuis le début de l'effet ; chaque fonction rend true quand l'effet est fini, pour que le jeu passe à la suite.

// UI-07 : indicateur d'objet interactif, une petite flèche qui flotte au-dessus de (x, y). À ne jamais poser sur la fenêtre de la chambre.
function drawInteractHint(ctx, x, y, t) {
  const b = Math.round(Math.sin(t / 220)), X = Math.round(x), Y = Math.round(y) - 6 + b;
  [[-2, 0, 5], [-1, 1, 3], [0, 2, 1]].forEach(([a, r, w]) => { ctx.fillStyle = "#1e1620"; ctx.fillRect(X + a - 1, Y + r - 1, w + 2, 3); });
  [[-2, 0, 5], [-1, 1, 3], [0, 2, 1]].forEach(([a, r, w]) => { ctx.fillStyle = r ? "#f4ead2" : "#ffffff"; ctx.fillRect(X + a, Y + r, w, 1); });
  if (Math.floor(t / 900) % 3 === 0) { ctx.fillStyle = "#fff4c0"; ctx.fillRect(X + 4, Y - 3, 1, 1); }
}

// ANI-22 : le ruban tombe de la main du héros (from = {x, y}) dans le trou du puits, en voletant ; 900 ms.
// s = état du puits pour drawWellFront (spill…). Le jeu fait ensuite reculer les cheveux (s.spill diminue) : « Un ruban… ma sœur en avait un. »
function drawFallingRibbon(ctx, wx, wy, t, from, s = {}) {
  const u = Math.min(1, t / 900), cx = wx + 18, rimY = wy + 22, x = from.x + (cx - from.x) * u + Math.sin(u * 12) * 3 * (1 - u), y = from.y + (rimY + 2 - from.y) * u * u - Math.sin(u * Math.PI) * 6;
  if (u < 1) { const fl = Math.sin(t / 60) > 0; ctx.fillStyle = "#1e1620"; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 6, 4);
    ctx.fillStyle = "#3a7cb6"; ctx.fillRect(Math.round(x), Math.round(y), 4, 2); ctx.fillStyle = fl ? "#6aa8e0" : "#2a5884"; ctx.fillRect(Math.round(x) + (fl ? 3 : 0), Math.round(y) + 2, 1, 2);
    ctx.fillStyle = "#2a1a14"; ctx.fillRect(Math.round(x) + 3, Math.round(y), 1, 2); }
  drawWellFront(ctx, wx, wy, t, s);                     // l'avant du puits cache le ruban quand il passe le rebord
  return u >= 1;
}

// ANI-23 : le combat. Trois grosses mèches sortent du puits et se dressent ; il faut les couper.
// o.hp = [n, n, n] coups restants pour chaque mèche (0 = coupée) ; o.hit = { i, t } la mèche touchée et depuis quand (ms), elle tremble et pâlit 250 ms
const LOCK_X = [-9, 0, 9];
function drawWellLocks(ctx, wx, wy, t, o = {}) {
  const hp = o.hp || [1, 1, 1], cx = wx + 18, rimY = wy + 22;
  hp.forEach((h, i) => { const bx = cx + LOCK_X[i], hit = o.hit && o.hit.i === i && o.hit.t < 250, shake = hit ? Math.round(Math.sin(o.hit.t / 20) * 2) : 0;
    const len = h > 0 ? 22 + i % 2 * 5 : 4, light = hit ? "#8a86b0" : N.hairl;
    for (let k = 0; k < len; k++) { const u = k / len, X = bx + shake + Math.round(Math.sin(t / 300 + i * 2 + u * 4) * u * 5), Y = rimY - k;
      const w = h > 0 ? Math.max(1, Math.round(3 - u * 2)) : 3; ctx.fillStyle = "#050308"; ctx.fillRect(X - 1, Y, w + 2, 1); ctx.fillStyle = k % 4 === i ? light : N.hair; ctx.fillRect(X, Y, w, 1); }
    if (h > 0) { const tx = bx + shake + Math.round(Math.sin(t / 300 + i * 2 + 4) * 5), ty = rimY - len; ctx.fillStyle = N.hair; ctx.fillRect(tx + 1, ty - 1, 2, 1); ctx.fillRect(tx + 3, ty, 1, 2); }   // le bout recourbé
    else { ctx.fillStyle = "#3e3858"; ctx.fillRect(bx - 1, rimY - 5, 1, 1); ctx.fillRect(bx + 3, rimY - 5, 1, 1); } });              // la coupure effilochée
}
// l'impact d'un coup sur une mèche en (x, y) : "ciseaux" (les lames se ferment, une étincelle) ou "baton" (une étoile qui s'ouvre). 250 ms.
function drawHitFx(ctx, x, y, t, kind = "ciseaux") {
  const u = Math.min(1, t / 250), X = Math.round(x), Y = Math.round(y);
  if (kind === "ciseaux") { const a = 5 * (1 - u); ctx.fillStyle = "#eef0f6";
    for (let k = -6; k <= 6; k++) { ctx.fillRect(X + k, Y + Math.round(k * a / 6) - 1, 1, 1); ctx.fillRect(X + k, Y - Math.round(k * a / 6) + 1, 1, 1); }
    if (u > .6) { ctx.fillStyle = "#fff4c0"; ctx.fillRect(X, Y - 2, 1, 5); ctx.fillRect(X - 2, Y, 5, 1); } }
  else { const r = 2 + u * 6; ctx.globalAlpha = 1 - u * .7; ctx.fillStyle = "#fff4c0";
    for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28; ctx.fillRect(Math.round(X + Math.cos(a) * r), Math.round(Y + Math.sin(a) * r), 2, 2); } ctx.globalAlpha = 1; }
  return u >= 1;
}
// une mèche coupée qui tombe de (x, y) et s'enroule par terre ; après 600 ms elle reste au sol
function drawFallingLock(ctx, x, y, t, seed = 0) {
  const u = Math.min(1, t / 600), fy = y + u * u * 14, curl = u * 2.2;
  for (let k = 0; k < 10; k++) { const a = seed + curl * k / 10 + (1 - u) * 1.5, X = Math.round(x + Math.cos(a) * k * .9), Y = Math.round(fy + Math.sin(a) * k * .5 * (1 - u * .6));
    ctx.fillStyle = "#050308"; ctx.fillRect(X - 1, Y - 1, 3, 3); ctx.fillStyle = k % 3 ? N.hair : N.hairl; ctx.fillRect(X, Y, 1, 1); }
  return u >= 1;
}
// la saisie : une mèche jaillit du puits (x0, y0) jusqu'à la cheville du héros (x1, y1), s'enroule et tire. k = 0..1 avance de la mèche ; t pour l'ondulation
function drawHairGrab(ctx, x0, y0, x1, y1, t, k = 1) {
  const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) * k));
  for (let s = 0; s <= n; s++) { const u = s / Math.max(1, Math.hypot(x1 - x0, y1 - y0)), X = Math.round(x0 + (x1 - x0) * u), Y = Math.round(y0 + (y1 - y0) * u + Math.sin(u * 9 + t / 90) * 2 * (1 - k * .7));
    ctx.fillStyle = "#050308"; ctx.fillRect(X - 1, Y - 1, 3, 3); ctx.fillStyle = s % 4 === 0 ? N.hairl : N.hair; ctx.fillRect(X, Y, 1, 1); }
  if (k >= 1) for (let r = 0; r < 3; r++) { const yy = Math.round(y1 - 1 + r * 2), tug = Math.round(Math.sin(t / 80) * 1); ctx.fillStyle = "#050308"; ctx.fillRect(x1 - 3 + tug, yy, 8, 2); ctx.fillStyle = N.hairl; ctx.fillRect(x1 - 2 + tug + r, yy, 2, 1); }
}

// ANI-24 : le pacte. Les cheveux quittent le puits en longues mèches et entrent dans ceux du héros (tête en hx, hy). 2,5 s.
// Le jeu remplace ensuite le sprite du héros (cheveux plus longs et plus sombres : CHARS.heros_long avec pal HAIR noir, au choix).
function drawHairTransfer(ctx, wx, wy, hx, hy, t) {
  const u = Math.min(1, t / 2500), cx = wx + 18, rimY = wy + 20;
  for (let i = 0; i < 9; i++) { const st = i * .06, k = Math.max(0, Math.min(1, (u - st) / .6)); if (k <= 0) continue;
    const head = k, tail = Math.max(0, k - .45 + (u > .9 ? (u - .9) * 5 : 0)), sx = cx - 10 + i * 2.5;
    for (let s = 0; s <= 30; s++) { const v = tail + (head - tail) * s / 30, mx = (sx + hx) / 2 + (i - 4) * 4, my = Math.min(rimY, hy) - 24 - i % 3 * 6;   // une courbe en arc du puits à la tête
      const X = Math.round((1 - v) ** 2 * sx + 2 * (1 - v) * v * mx + v * v * hx + Math.sin(v * 8 + t / 120 + i) * 1.5), Y = Math.round((1 - v) ** 2 * rimY + 2 * (1 - v) * v * my + v * v * hy);
      ctx.fillStyle = "#050308"; ctx.fillRect(X, Y, 1, 2); if (s % 5 === i % 5) { ctx.fillStyle = N.hairl; ctx.fillRect(X, Y - 1, 1, 1); } } }
  if (u > .7) { ctx.globalAlpha = (u - .7) / .3 * .3 * (1 - Math.max(0, u - .95) * 20); ctx.fillStyle = "#3e3858"; ctx.fillRect(hx - 8, hy - 6, 17, 12); ctx.globalAlpha = 1; }   // une ombre passe sur la tête
  return u >= 1;
}
