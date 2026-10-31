// ---------- L'Esprit capillaire de la rancoeur : le puits et la mini cinématique ----------
const N = { g:"#24384a", gd:"#1a2a3a", gl:"#33506a", st:"#5c6478", std:"#3c4256", stl:"#868ea4", so:"#0e1018",
  wood:"#5a4030", woodd:"#3a281e", woodl:"#7a5a40", iron:"#6a6e78", hole:"#05060a", hair:"#100c16", hairl:"#4a4868", moss:"#3e6a4a", rope:"#8a7a5a", fly:"#e8f6a0" };
function nightGround(ctx, W, H) {
  ctx.fillStyle = N.g; ctx.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 16) for (let x = 0; x < W; x += 16) [[2,3],[10,1],[6,9],[13,11],[4,14]].forEach(([a, b], i) => { ctx.fillStyle = i % 2 ? N.gd : N.gl; ctx.fillRect(x + a, y + b, 1, 1); });
}
function ell(ctx, cx, cy, rx, ry, col) { ctx.fillStyle = col; for (let y = -ry; y <= ry; y++) { const w = Math.round(rx * Math.sqrt(1 - (y * y) / (ry * ry || 1))); ctx.fillRect(cx - w, cy + y, w * 2 + 1, 1); } }
// le puits : (x, y) coin haut-gauche, 36 × 46. s.spill : quantité de cheveux qui débordent ; s.crank : angle de la manivelle ; s.swing : balancement du seau
function drawWell(ctx, x, y, t, s) {
  const cx = x + 18, rimY = y + 22;
  // poteaux, poutre (treuil), manivelle
  [[x + 3], [x + 31]].forEach(([px]) => { ctx.fillStyle = N.so; ctx.fillRect(px - 1, y - 1, 4, 24); ctx.fillStyle = N.wood; ctx.fillRect(px, y, 2, 22); ctx.fillStyle = N.woodd; ctx.fillRect(px + 1, y, 1, 22); });
  ctx.fillStyle = N.so; ctx.fillRect(x + 1, y + 3, 34, 5); ctx.fillStyle = N.wood; ctx.fillRect(x + 2, y + 4, 32, 3); ctx.fillStyle = N.woodl; ctx.fillRect(x + 2, y + 4, 32, 1);
  ctx.fillStyle = N.rope; for (let k = 12; k < 25; k += 2) ctx.fillRect(x + k, y + 4, 1, 3);
  const a = s.crank || 0, hx = x - 2 + Math.round(Math.cos(a) * 3), hy = y + 5 + Math.round(Math.sin(a) * 3);
  ctx.fillStyle = N.so; ctx.fillRect(x - 1, y + 4, 3, 3); ctx.fillStyle = N.iron; ctx.fillRect(x, y + 5, 2, 1);
  ctx.fillStyle = N.iron; ctx.fillRect(Math.min(x, hx), Math.min(y + 5, hy), Math.abs(hx - x) + 1, 1); ctx.fillRect(hx, Math.min(y + 5, hy), 1, Math.abs(hy - y - 5) + 1);
  ctx.fillStyle = N.so; ctx.fillRect(hx - 2, hy - 1, 3, 3); ctx.fillStyle = N.woodl; ctx.fillRect(hx - 1, hy, 2, 1);
  // toit
  for (let r = 0; r < 8; r++) { const w = 12 + r * 3; ctx.fillStyle = N.so; ctx.fillRect(cx - w / 2 - 1, y - 9 + r, w + 2, 1); ctx.fillStyle = r % 3 === 2 ? N.woodd : N.wood; ctx.fillRect(cx - w / 2, y - 9 + r, w, 1); }
  ctx.fillStyle = N.so; ctx.fillRect(cx - 21, y - 2, 42, 1);
  // corde et seau qui se balance
  const sw = Math.round((s.swing || 0) * Math.sin(t / 260)), by = y + 10;
  ctx.fillStyle = N.rope; for (let k = y + 7; k < by; k++) ctx.fillRect(cx + Math.round(sw * (k - y - 7) / (by - y - 7)), k, 1, 1);
  const bx = cx + sw - 3;
  ctx.fillStyle = N.so; ctx.fillRect(bx - 1, by - 1, 9, 8); ctx.fillStyle = N.wood; ctx.fillRect(bx, by, 7, 6); ctx.fillStyle = N.woodl; ctx.fillRect(bx, by, 2, 6);
  ctx.fillStyle = N.iron; ctx.fillRect(bx, by + 1, 7, 1); ctx.fillRect(bx, by + 4, 7, 1); ctx.fillStyle = N.so; ctx.fillRect(bx + 1, by - 3, 5, 1); ctx.fillRect(bx, by - 2, 1, 2); ctx.fillRect(bx + 6, by - 2, 1, 2);
  drawWellBody(ctx, x, y);
  ell(ctx, cx, rimY, 17, 6, N.so); ell(ctx, cx, rimY, 16, 5, N.stl); ell(ctx, cx, rimY, 13, 3, N.hole);
  for (let k = -14; k <= 14; k += 6) { ctx.fillStyle = N.st; ctx.fillRect(cx + k, rimY + 4, 3, 1); }
  drawSpill(ctx, x, rimY, t, s.spill || 0);
}
function drawSpill(ctx, x, rimY, t, sp) {     // des cheveux, beaucoup : ils sortent du trou et débordent par-dessus le rebord
  for (let i = 0; i < 15; i++) {
    const sx = x + 5 + i * 2 + (i % 2), len = Math.round(sp * (6 + (i * 7) % 13)), top = rimY - 1 - Math.round(sp * ((i * 5) % 4));
    for (let k = 0; k < len + Math.round((rimY + 4 - top) * Math.min(1, sp * 2.5)); k++) {
      const X = sx + Math.round(Math.sin(t / 500 + k * .4 + i) * (k / 9)), Y = top + k;
      ctx.fillStyle = i % 3 ? N.hair : N.hairl; ctx.fillRect(X, Y, 1, 1);
    }
  }
}
function drawWellBody(ctx, x, y) {
  const cx = x + 18, rimY = y + 22;
  // corps du puits
  ctx.fillStyle = N.so; ctx.fillRect(x + 1, rimY, 34, 22); ell(ctx, cx, rimY + 21, 17, 4, N.so);
  ctx.fillStyle = N.st; ctx.fillRect(x + 2, rimY, 32, 21); ell(ctx, cx, rimY + 21, 16, 3, N.std);
  for (let r = 0; r < 5; r++) for (let k = (r % 2) * 4; k < 32; k += 8) { ctx.fillStyle = N.std; ctx.fillRect(x + 2 + k, rimY + 2 + r * 4, 1, 4); ctx.fillRect(x + 2, rimY + 5 + r * 4, 32, 1); }
  ctx.fillStyle = N.stl; ctx.fillRect(x + 3, rimY + 2, 2, 17);
}
// l'avant du puits, redessiné par-dessus quand quelque chose tombe dedans
function drawWellFront(ctx, x, y, t, s) {
  const cx = x + 18, rimY = y + 22;
  drawWellBody(ctx, x, y);
  ctx.save(); ctx.beginPath(); ctx.rect(x - 2, rimY + 1, 40, 40); ctx.clip();   // seulement la moitié avant : mêmes pixels qu'avant, sans couture
  ell(ctx, cx, rimY, 17, 6, N.so); ell(ctx, cx, rimY, 16, 5, N.stl); ell(ctx, cx, rimY, 13, 3, N.hole);
  for (let k = -14; k <= 14; k += 6) { ctx.fillStyle = N.st; ctx.fillRect(cx + k, rimY + 4, 3, 1); }
  drawSpill(ctx, x, rimY, t, s.spill || 0);
  ctx.restore();
}
function firefly(c, t, W, H) { for (let i = 0; i < 4; i++) { const x = (hash(i) * W + Math.sin(t / 900 + i) * 6) | 0, y = (hash(i + 5) * H * .7 + Math.cos(t / 700 + i * 2) * 4) | 0;
  c.globalAlpha = .4 + .4 * Math.sin(t / 300 + i * 3); c.fillStyle = N.fly; c.fillRect(x, y, 1, 1); } c.globalAlpha = 1; }
// carte : le puits seul. On ne voit jamais l'esprit, seulement ses cheveux.
function renderSpiritCard(t) {
  const c = ctxOf("spirit"); nightGround(c, 64, 64);
  const ph = (t % 8000) / 8000, reach = ph < .4 ? 0 : ph < .6 ? (ph - .4) / .2 : ph < .8 ? 1 : 1 - (ph - .8) / .2;
  drawWell(c, 14, 14, t, { spill: .7 + .3 * reach, swing: 1, crank: Math.PI });
  // une mèche qui tâte le sol, puis se retire
  for (let k = 0; k < Math.round(reach * 16); k++) { c.fillStyle = k % 5 === 2 ? N.hairl : N.hair; c.fillRect(46 + k, 52 + Math.round(Math.sin(t / 200 + k * .7) * .8), 1, 1); }
}

// ---------- Mini cinématique : les cheveux attrapent l'enfant par le pied ----------
const CINE_LEN = 11000;
const FRIEND_PAL = { ...PAL, c:"#5a8a4a", C:"#3e6634", l:"#86b46a", h:"#d8b060", H:"#a8803e", j:"#f4d890", p:"#6a5a4a", P:"#4a3e34" };
const CINE_TEXT = [[0, "La nuit, près du vieux puits."], [600, "Des cheveux débordent du puits et glissent hors de vue…"], [2200, "Ils ont attrapé quelque chose."],
  [2700, "Ton meilleur ami, traîné par le pied."], [4300, "Arraché du sol…"], [5600, "…et englouti."], [7000, "Le seau se balance encore."]];
let friendFrames = null, cineStart = 0;
const spriteCanvas = new Map();
function spriteToCanvas(rows, pal) {
  const key = rows.join("|"); if (spriteCanvas.has(key)) return spriteCanvas.get(key);
  const cv = document.createElement("canvas"); cv.width = 24; cv.height = rows.length; drawSprite(cv.getContext("2d"), rows, pal, 0, 0); spriteCanvas.set(key, cv); return cv;
}
// dessine l'enfant tourné : ses pieds pointent dans la direction phi
function drawTurned(ctx, rows, pal, cx, cy, phi) {
  const cv = spriteToCanvas(rows, pal);
  ctx.save(); ctx.imageSmoothingEnabled = false; ctx.translate(Math.round(cx), Math.round(cy)); ctx.rotate(phi - Math.PI / 2);
  ctx.drawImage(cv, -12, -Math.round(rows.length / 2)); ctx.restore();
}
function hairLine(ctx, ax, ay, bx, by, e, taut, i) {
  const n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay)));
  for (let k = 0; k <= n; k++) {
    const u = k / n, sag = (1 - taut) * Math.sin(u * Math.PI) * 4, wob = (1 - taut * .8) * Math.sin(e / 180 + k * .45 + i * 2);
    const X = Math.round(ax + (bx - ax) * u), Y = Math.round(ay + (by - ay) * u + sag + wob);
    ctx.fillStyle = N.hair; ctx.fillRect(X, Y, 1, 2); ctx.fillStyle = N.hairl; if (k % 3 === i % 3) ctx.fillRect(X, Y - 1, 1, 1);
  }
}
function renderCine(t) {
  const c = ctxOf("cine"), W = 128, H = 72;
  if (!friendFrames) { const r = makeHero({ child: true, hair: .35, outfit: "tunique", pact: false, combat: false }).rows; friendFrames = [r, ...walkFrames(r, 23)]; }
  const e = (t - cineStart) % CINE_LEN, ph = (a, b) => Math.max(0, Math.min(1, (e - a) / (b - a)));
  const smooth = u => u * u * (3 - 2 * u);
  nightGround(c, W, H);
  ell(c, 116, 9, 6, 6, "#2a3450"); ell(c, 116, 9, 4, 4, "#e8ecd8"); ell(c, 115, 8, 1, 1, "#c8ccb8");
  const wx = 14, wy = 16, rim = [wx + 30, wy + 25], hole = [wx + 18, wy + 21], groundY = 62;
  const crawl = ph(600, 2200), dragRaw = ph(2700, 4300), drag = dragRaw * dragRaw, lift = smooth(ph(4300, 5600)), gone = e >= 5600;
  const well = { spill: (.6 + .4 * crawl) * (1 - smooth(ph(5800, 9500))), crank: Math.PI, swing: gone ? 1.6 * (1 - ph(5600, 10000)) + .3 : .3 };
  drawWell(c, wx, wy, e, well);
  let feet = null, phi = Math.PI, body = null;
  if (dragRaw > 0 && !gone) {
    if (lift === 0) { const x = 140 - drag * 48; feet = [x - 13, groundY - 2]; body = [x, groundY - 4]; }
    else { // l'arc du schéma : il décolle tôt, monte, puis plonge dans le puits
      const p0 = [92, groundY - 4], p1 = [58, -20], p2 = [hole[0], hole[1] + 18], u = lift, v = 1 - u;
      body = [v * v * p0[0] + 2 * u * v * p1[0] + u * u * p2[0], v * v * p0[1] + 2 * u * v * p1[1] + u * u * p2[1]];
      const dx = 2 * v * (p1[0] - p0[0]) + 2 * u * (p2[0] - p1[0]), dy = 2 * v * (p1[1] - p0[1]) + 2 * u * (p2[1] - p1[1]);
      phi = Math.atan2(dy, dx); feet = [body[0] + Math.cos(phi) * 13, body[1] + Math.sin(phi) * 13];
    }
  }
  for (let i = 0; i < 4; i++) {
    if (feet) hairLine(c, rim[0], rim[1] + i, feet[0], Math.min(feet[1], lift > .5 ? wy + 22 : 99) + (i - 1.5) * .8, e, lift > 0 ? 1 : .7, i);
    else if (e > 2200 && e < 2700) hairLine(c, rim[0], rim[1] + i, 132, groundY - 2 + i, e, ph(2200, 2500), i);
    else if (crawl > 0 && !gone) { const endX = rim[0] + crawl * (134 - rim[0]); hairLine(c, rim[0], rim[1] + i, endX, groundY - 3 + i + Math.sin(i) * 2, e, 0, i); }
  }
  if (gone) { const back = 1 - ph(5600, 6800); for (let i = 0; i < 3; i++) if (back > 0) hairLine(c, rim[0], rim[1] + i, rim[0] + back * 14, rim[1] + 6 + i, e, 0, i); }
  if (body) {
    const fr = friendFrames[1 + Math.floor(e / 80) % 4];
    if (lift === 0) { c.globalAlpha = .3; c.fillStyle = N.so; c.fillRect(Math.round(body[0]) - 14, groundY + 2, 28, 2); c.globalAlpha = 1; }
    c.save();
    if (lift > .5) { c.beginPath(); c.rect(0, 0, W, wy + 25); c.clip(); }   // une fois au-dessus du trou, rien ne dépasse sous le puits
    c.globalAlpha = 1 - ph(5200, 5600) * .8;                    // il s'assombrit en s'enfonçant dans le noir
    drawTurned(c, fr, FRIEND_PAL, body[0], body[1], phi);
    c.restore();
    const fx = Math.round(feet[0]), fy = Math.round(feet[1]);
    if (!(lift > .5 && fy > wy + 22)) { c.fillStyle = N.hair; [[0,-2],[1,-1],[2,0],[1,1],[0,2],[-1,1],[-1,-1],[0,0]].forEach(([a, b]) => c.fillRect(fx + a, fy + b, 1, 1)); c.fillStyle = N.hairl; c.fillRect(fx + 1, fy - 1, 1, 1); }
    // l'avant du puits repasse devant lui : il tombe vraiment dedans
    if (lift > .5) drawWellFront(c, wx, wy, e, well);
  }
  const fade = Math.max(1 - ph(0, 600), ph(10200, 11000));
  if (fade > 0) { c.globalAlpha = fade; c.fillStyle = "#000"; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
  let line = ""; CINE_TEXT.forEach(([at, txt]) => { if (e >= at) line = txt; });
  const cap = document.getElementById("cine-cap"); if (cap.textContent !== line) cap.textContent = line;
}
