// ---------- Giorgio, le gardien du pied de l'arc-en-ciel (section adolescent, easter egg) ----------
// Son sprite est la fiche CHAR_SPECS.giorgio (chars.js), son portrait PORTRAITS.giorgio (portraits.js).
// Ici : ce qui n'appartient qu'à lui, l'arc-en-ciel qu'il invoque pour se déplacer et son chaudron.
//   drawRainbow(ctx, x0, x1, sol, h, p, from, alpha)   un arc-en-ciel posé au sol, tracé de 0 à p (et effacé avant from)
//   drawRainbowTravel(ctx, t)                          la petite scène 160 × 90 : il l'invoque, glisse dessus, retombe plus loin
//   drawCauldron(ctx, x, y, t, desire)                 le chaudron 32 × 30 ; desire : "pates" (ce qu'y voit le héros), "or", "reflet"

const RAINBOW = ["#e0505a", "#ee9a40", "#f2d860", "#5eb87a", "#4a86d0", "#8a62c8"];
function gioPx(ctx, c, x, y, w = 1, h = 1) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); }

function drawRainbow(ctx, x0, x1, ground, h, p, from = 0, alpha = .85) {
  const cx = (x0 + x1) / 2, rx = (x1 - x0) / 2;
  ctx.globalAlpha = alpha;
  RAINBOW.forEach((col, i) => { const r = rx - i * 2, ry = h - i * 2;
    for (let s = 0; s <= 1; s += 1 / (r * 3)) { if (s > p || s < from) continue;
      const a = Math.PI * (1 - s); gioPx(ctx, col, cx + Math.cos(a) * r, ground - Math.sin(a) * ry, 1, 2); } });
  ctx.globalAlpha = 1;
}

const TRAVEL_W = 160, TRAVEL_H = 90, TRAVEL_LEN = 4200;
function drawRainbowTravel(ctx, e) {
  const t = e % TRAVEL_LEN, G = 80, X0 = 18, X1 = 142, Hh = 44, ch = CHARS.giorgio;
  const grow = Math.min(1, Math.max(0, (t - 500) / 800)), ride = Math.min(1, Math.max(0, (t - 1400) / 1300)), fade = Math.min(1, Math.max(0, (t - 2700) / 600));
  if (grow > 0) drawRainbow(ctx, X0, X1, G, Hh, grow, fade);
  const a = Math.PI * (1 - ride), onArc = [(X0 + X1) / 2 + Math.cos(a) * ((X1 - X0) / 2 - 5), G - Math.sin(a) * (Hh - 5)];
  const [fx, fy] = t < 1400 ? [X0 + 5, G] : t < 2700 ? onArc : [X1 - 5, G];
  for (let i = 0; i < 8; i++) { const k = (t / 60 + i * 7) % 20;                     // des étincelles qui le suivent
    if (t > 400 && t < 3000) gioPx(ctx, RAINBOW[i % 6], fx - 6 + (i * 37) % 12 - (t >= 1400 ? k * .8 : 0), fy - 4 - (i * 13 + k * 2) % 22); }
  const riding = t >= 1400 && t < 2700;
  drawChar(ctx, ch, fx - 12, fy - ch.H, { dir: riding ? "E" : "S", pose: riding ? "walk" : "idle", t, shadow: !riding });
}

// Le chaudron montre à celui qui regarde ce qu'il désire le plus. Le héros, lui, y voit des pâtes.
const POT = { o: "#1a1620", i: "#3a3644", I: "#262230", w: "#5c5868", g: "#c89a3a" };
const POT_FILL = { pates: ["#f4d27a", "#e0b456", "#fbe6a6"], or: ["#f2c64a", "#c8962a", "#fff0a0"] };
function drawCauldron(ctx, x0, y0, t, desire = "pates") {
  const cx = x0 + 16, top = y0 + 12, row = (ry, rx, y) => Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
  for (let i = 0; i < 3; i++) { const ph = (t / 900 + i / 3) % 1, sx = cx - 6 + i * 6 + Math.sin(t / 300 + i * 2) * 1.5;   // vapeur
    for (let k = 0; k < 4; k++) gioPx(ctx, mix("#ffffff", "#c8c4d0", ph), sx + Math.sin(ph * 6 + k) * 1.2, top - 2 - ph * 9 - k); }
  gioPx(ctx, POT.o, x0 + 6, y0 + 27, 3, 3); gioPx(ctx, POT.o, x0 + 23, y0 + 27, 3, 3);                                     // pieds
  gioPx(ctx, POT.o, x0 + 1, top + 3, 2, 4); gioPx(ctx, POT.o, x0 + 29, top + 3, 2, 4);                                     // anses
  for (let y = 0; y <= 14; y++) { const w = row(15, 14, y);                                                                // la panse
    for (let x = -w; x <= w; x++) gioPx(ctx, Math.abs(x) === w || y === 14 ? POT.o : x > w * .45 ? POT.I : POT.i, cx + x, top + 1 + y); }
  for (let y = 2; y <= 8; y++) gioPx(ctx, POT.w, cx - 10 + Math.floor(y / 3), top + 1 + y);
  gioPx(ctx, POT.g, cx - 3, top + 8, 6, 1);                                                                                // cerclage doré, pour la légende
  for (let y = -3; y <= 3; y++) { const w = row(3, 14, y);                                                                 // le bord et ce qu'il y a dedans
    for (let x = -w; x <= w; x++) { const rim = Math.abs(x) >= w - 1 || Math.abs(y) === 3; let col = POT.o;
      if (!rim) col = desire === "pates" ? POT_FILL.pates[(Math.abs(Math.round(Math.sin(x * .9 + y * 2.1) * 3)) + (y & 1)) % 3]
        : desire === "or" ? POT_FILL.or[(Math.abs(x) + (y + 4) * 3) % 4 === 0 ? 2 : (x + y) & 1]
        : mix(RAINBOW[Math.abs(x + y + Math.floor(t / 120)) % 6], "#2a2a40", .35 + .1 * (((x * 7 + y * 13 + Math.floor(t / 180)) & 7) & 1));
      else if (y === -3 || (y < 0 && Math.abs(x) >= w - 1)) col = POT.w;
      gioPx(ctx, col, cx + x, top + y); } }
  if (desire === "pates") {                                                                                                // des spaghettis qui débordent, une fourchette
    [[-11, 1], [-10, 2], [-10, 3], [9, 1], [10, 2]].forEach(([x, y]) => gioPx(ctx, POT_FILL.pates[1], cx + x, top + y));
    gioPx(ctx, "#b8bcc8", cx + 4, top - 9, 1, 9); gioPx(ctx, "#b8bcc8", cx + 3, top - 10, 3, 1); [3, 4, 5].forEach(x => gioPx(ctx, "#b8bcc8", cx + x, top - 12, 1, 2));
  } else if (desire === "or") [[-4, -4], [2, -4], [-1, -5]].forEach(([x, y]) => gioPx(ctx, POT_FILL.or[2], cx + x, top + y, 2, 1));
}
