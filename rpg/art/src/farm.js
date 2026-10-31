// ---------- Animaux de ferme et objets de la grange ----------
// Petits sprites faits de formes, contourés et ombrés automatiquement (n'importe quelle taille).
//   drawHen(ctx, x, y, t, o)   une poule ; (x, y) = entre ses pattes ; o = { kind, face: 1 | -1, state, st, seed }
//     kind : "blanche" | "rousse" (la grosse rousse, plus grande) | "noire" | "grise" | "tachetee"
//     state : "idle" (picore) | "walk" | "pushed" (on la pousse : elle saute de côté en battant des ailes et caquette)
//             | "pinch" (elle pince : coup de bec en avant) | "fly" (s'envole d'une charrette et retombe) | "nest" (couchée sur son nid)
//     st : temps depuis le début de l'état (ms). henMotion(state, st, face) donne le déplacement à appliquer (dx, dy) et la fin.
//   drawSmallEgg(ctx, x, y, state)  un œuf dans la grange : "ok" | "broken"
//   FURNI.charrette, FURNI.sabot_mur, FURNI.fourche, FURNI.tonneau_eau, FURNI.nid : nouveaux meubles pour interiors.js
function spGrid(w, h) { return Array.from({ length: h }, () => Array(w).fill(".")); }
function spEll(g, cx, cy, rx, ry, k) { for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++)
  if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 && g[y] && x >= 0 && x < g[0].length) g[y][x] = k; }
function spDot(g, pts, k) { pts.forEach(([x, y]) => { if (g[y] && x >= 0 && x < g[0].length) g[y][x] = k; }); }
function spRows(g, keep = "") {          // contour + ombre en bas à droite + lumière en haut à gauche
  const W = g[0].length, at = (x, y) => (g[y] && g[y][x]) || ".", e = k => k === "." || k === "o";
  const o = g.map(r => r.slice());
  for (let y = 0; y < g.length; y++) for (let x = 0; x < W; x++) if (g[y][x] === "." && [[1,0],[-1,0],[0,1],[0,-1]].some(([a, b]) => !e(at(x + a, y + b)) && !keep.includes(at(x + a, y + b)))) o[y][x] = "o";
  const s = o.map(r => r.slice());
  for (let y = 0; y < o.length; y++) for (let x = 0; x < W; x++) { const k = o[y][x]; if (e(k)) continue;
    if (CH_SHADE[k] && (e(o[y][x + 1] || ".") || e((o[y + 1] || [])[x] || "."))) s[y][x] = CH_SHADE[k];
    else if (CH_LIGHT[k] && e(o[y][x - 1] || ".") && e((o[y - 1] || [])[x] || ".")) s[y][x] = CH_LIGHT[k]; }
  return s.map(r => r.join(""));
}
// ---- les poules ----
const HEN_PAL = {
  blanche: { c:"#f4f0e6", C:"#c9c0aa", l:"#ffffff" }, rousse: { c:"#c8642c", C:"#8e3e1e", l:"#e8925a" }, noire: { c:"#3a3440", C:"#24202a", l:"#5a5466" },
  grise: { c:"#a8a4b0", C:"#78748a", l:"#d4d0dc" }, tachetee: { c:"#b07848", C:"#7a4e2e", l:"#d8a070", w:"#f4f0e6" },
};
const HEN_BASE = { o:"#2a2030", a:"#d23a32", A:"#982c2e", r:"#f07a5a", m:"#f2a23a", y:"#e8902a", e:"#1a1418", E:"#ffffff", w:"#f4f0e6" };
const henCache = {};
// pose : "stand" | "peck" | "stepL" | "stepR" | "flap" | "flap2" | "nest" | "lunge" | "cluck"
function henRows(kind, pose) {
  const key = kind + pose; if (henCache[key]) return henCache[key];
  const s = kind === "rousse" ? 1.3 : 1, W = Math.round(18 * s), H = Math.round(16 * s), g = spGrid(W, H), S = v => v * s;
  const low = pose === "nest" ? S(3) : 0, cx = S(7.5), cy = S(9.5) + low;
  // queue, corps, aile
  spEll(g, S(2.6), S(5.5) + low, S(2.2), S(3.6), "c"); spEll(g, S(3.4), S(4) + low, S(1.4), S(2.2), "C");
  spEll(g, cx, cy, S(6), S(4.3), "c");
  // tête : selon la pose
  const head = pose === "peck" ? [S(13.4), S(10.5)] : pose === "lunge" ? [S(14.6), S(6.5)] : [S(12.6), S(4.6) + low * .6];
  spEll(g, S(11), (head[1] + cy) / 2, S(2.2), S(2.6), "c");                                  // le cou
  spEll(g, head[0], head[1], S(2.4), S(2.4), "c");
  spDot(g, [[Math.round(head[0] - S(1)), Math.round(head[1] - S(3))], [Math.round(head[0]), Math.round(head[1] - S(3.2))], [Math.round(head[0] + S(1)), Math.round(head[1] - S(2.6))]], "a");   // crête
  const bx = Math.round(head[0] + S(2.4)), by = Math.round(head[1]);
  spDot(g, [[bx, by], [bx + 1, by]], "m"); if (pose === "lunge" || pose === "cluck") spDot(g, [[bx, by + 1], [bx + 1, by + 2]], "m"); else spDot(g, [[bx, by + 1]], "m");
  spDot(g, [[Math.round(head[0] + S(1.2)), by + Math.round(S(2))]], "a");                    // barbillon
  // aile : au repos, ou levée quand elle bat des ailes
  if (pose === "flap") { spEll(g, S(6.5), S(4.5), S(4.5), S(2.4), "l"); spEll(g, S(5.5), S(3.5), S(3), S(1.4), "c"); }
  else if (pose === "flap2") { spEll(g, S(6.5), S(11), S(4.8), S(2.2), "l"); }
  else { spEll(g, S(6.8), cy, S(3.6), S(2.2), "C"); spEll(g, S(6.4), cy - S(.6), S(3), S(1.5), "c"); }
  if (kind === "tachetee") spDot(g, [[4, 9], [8, 8], [10, 11], [6, 12], [3, 6], [11, 9]].map(([x, y]) => [Math.round(S(x)), Math.round(S(y) + low)]), "w");
  // pattes
  if (pose !== "nest" && pose !== "flap2") { const l1 = pose === "stepL" ? -1 : 0, l2 = pose === "stepR" ? -1 : 0, fy = H - 1;
    [[S(6), l1], [S(9), l2]].forEach(([lx, lift]) => { const X = Math.round(lx); for (let y = Math.round(cy + S(3.5)); y <= fy + lift; y++) g[y][X] = "y"; g[fy + lift][X + 1] = "y"; g[fy + lift][X - 1] = "y"; }); }
  const rows = spRows(g, "ym"), ex = Math.round(head[0] + S(.6)), ey = Math.round(head[1] - S(.5));   // l'œil, posé après l'ombre
  const out = rows.map((r, y) => y === ey ? r.slice(0, ex) + "e" + r.slice(ex + 1) : r);
  return (henCache[key] = out);
}
// déplacement pendant un état, pour le jeu : la poule poussée saute de 14 px, celle qui s'envole décrit un arc
function henMotion(state, st, face = 1) {
  if (state === "pushed") { const u = cuClamp(st / 420); return { dx: -face * 14 * cuEase(u), dy: -Math.sin(u * Math.PI) * 6, done: st > 1100 }; }
  if (state === "pinch") { const u = st < 120 ? st / 120 : Math.max(0, 1 - (st - 120) / 260); return { dx: face * 3 * u, dy: 0, done: st > 600 }; }
  if (state === "fly") { const u = cuClamp(st / 1000); return { dx: face * 34 * u, dy: -Math.sin(u * Math.PI) * 22 + u * 10, done: st > 1200 }; }
  return { dx: 0, dy: 0, done: false };
}
function drawHen(ctx, x, y, t, o = {}) {
  const kind = o.kind || "blanche", face = o.face || 1, st = o.st || 0, state = o.state || "idle", seed = o.seed || 0;
  let pose = "stand", bubble = false;
  if (state === "idle") { const c = (t + seed * 977) % 2600; pose = c < 180 ? "peck" : c < 300 ? "stand" : c < 460 ? "peck" : "stand"; }
  else if (state === "walk") pose = ["stepL", "stand", "stepR", "stand"][Math.floor(t / 120) % 4];
  else if (state === "pushed") { pose = st < 600 ? (Math.floor(st / 70) % 2 ? "flap" : "flap2") : "cluck"; bubble = st > 300 && st < 1100; }
  else if (state === "pinch") pose = st < 260 ? "lunge" : "cluck";
  else if (state === "fly") pose = st < 1000 ? (Math.floor(st / 60) % 2 ? "flap" : "flap2") : "stand";
  else if (state === "nest") pose = "nest";
  const rows = henRows(kind, pose), W = rows[0].length, H = rows.length, m = henMotion(state, st, face);
  const X = Math.round(x + m.dx - W / 2), Y = Math.round(y + m.dy - H + 1);
  if (state !== "fly" || st > 1000) { ctx.globalAlpha = .22; ctx.fillStyle = "#1a1208"; ctx.fillRect(Math.round(x + m.dx - W / 3), Math.round(y) - 1, Math.round(W * .66), 2); ctx.globalAlpha = 1; }
  else { ctx.globalAlpha = .18; ctx.fillStyle = "#1a1208"; ctx.fillRect(Math.round(x + m.dx - 4), Math.round(y) - 1, 8, 2); ctx.globalAlpha = 1; }
  drawSprite(ctx, face > 0 ? rows : rows.map(r => [...r].reverse().join("")), { ...PAL, ...HEN_BASE, ...HEN_PAL[kind] }, X, Y);
  // plumes qui volent
  if ((state === "pushed" && st < 900) || (state === "fly" && st < 1200)) for (let i = 0; i < 4; i++) { const u = ((st / 900) + i * .23) % 1, fx = x + m.dx + Math.sin(i * 2.3 + u * 6) * (6 + u * 8), fy = Y + 4 + u * 14;
    ctx.fillStyle = HEN_PAL[kind].l; ctx.fillRect(Math.round(fx), Math.round(fy), 2, 1); }
  // caquètement : petites lignes autour de la tête
  if (bubble || pose === "cluck") { const hx = face > 0 ? X + W - 1 : X, hy = Y + 1; ctx.fillStyle = "#2a2030";
    [[2, -2], [3, 0], [2, 2]].forEach(([a, b]) => ctx.fillRect(hx + face * a, hy + b, face * 2 > 0 ? 2 : -2, 1)); }
}
// ---- œufs, nid, nouveaux meubles ----
function drawSmallEgg(ctx, x, y, state = "ok") {
  if (state === "broken") { box(ctx, x - 3, y + 1, 8, 3, "#fffaf0"); fill(ctx, "#f2b030", x, y + 2, 3, 1); fill(ctx, "#f4ead2", x - 4, y, 2, 2); return; }
  fill(ctx, IC.o, x, y, 4, 1); fill(ctx, IC.o, x - 1, y + 1, 6, 4); fill(ctx, IC.o, x, y + 5, 4, 1);
  fill(ctx, "#f4ead2", x, y + 1, 4, 4); fill(ctx, "#fffaf0", x, y + 1, 2, 2); fill(ctx, "#d4c4a4", x + 3, y + 3, 1, 2); fill(ctx, "#d4c4a4", x + 1, y + 4, 2, 1);
}
Object.assign(FURNI, {
  // un nid de paille, avec ou sans œuf (st : { egg: true })
  nid(g, x, y, w, h, t, night, st) { box(g, x + 1, y + 7, 14, 7, IC.strawd); fill(g, IC.straw, x + 2, y + 8, 12, 2); for (let i = 0; i < 6; i++) fill(g, IC.straw, x + 1 + i * 2 + (i % 2), y + 6 + (i % 3), 3, 1);
    fill(g, "#7a5a28", x + 4, y + 10, 8, 2); if (!st || st.egg !== false) drawSmallEgg(g, x + 6, y + 6); },
  // la charrette : plateau de planches, une grande roue, les brancards ; on peut y grimper
  charrette(g, x, y, w, h) { box(g, x + 2, y + 6, w - 10, h - 16, IC.wood); for (let j = y + 10; j < y + h - 12; j += 5) fill(g, IC.woodd, x + 3, j, w - 12, 1);
    box(g, x + 2, y + 2, w - 10, 6, IC.woodd); fill(g, IC.woodl, x + 3, y + 3, w - 12, 1);
    fill(g, IC.o, x + w - 9, y + h / 2 - 2, 9, 3); fill(g, IC.woodd, x + w - 8, y + h / 2 - 1, 8, 1);                            // brancards
    fill(g, IC.o, x + w - 9, y + h / 2 + 6, 9, 3); fill(g, IC.woodd, x + w - 8, y + h / 2 + 7, 8, 1);
    const cx = x + 10, cy = y + h - 9;                                                                                            // la roue
    for (let a = 0; a < 64; a++) { const an = a / 64 * 6.283; fill(g, IC.o, cx + Math.round(Math.cos(an) * 8), cy + Math.round(Math.sin(an) * 8), 2, 2); fill(g, IC.woodd, cx + Math.round(Math.cos(an) * 7), cy + Math.round(Math.sin(an) * 7)); }
    for (let k = 0; k < 4; k++) { const an = k / 4 * 3.1416; for (let r = -6; r <= 6; r++) fill(g, IC.wood, cx + Math.round(Math.cos(an) * r), cy + Math.round(Math.sin(an) * r)); }
    box(g, cx - 2, cy - 2, 4, 4, IC.iron);
    for (let i = 0; i < 6; i++) fill(g, IC.straw, x + 6 + i * 5, y + 9 + (i % 2) * 3, 4, 1); },
  // un vieux sabot accroché au mur par un clou ; st.egg : un œuf caché dedans (on le voit en levant les yeux)
  sabot_mur(g, x, y, w, h, t, night, st) { fill(g, IC.iron, x + 7, y + 2, 2, 2); fill(g, "#4e3020", x + 8, y + 3, 1, 3);
    box(g, x + 3, y + 5, 10, 7, "#9a6a40"); fill(g, "#c08a50", x + 4, y + 6, 4, 1); box(g, x + 5, y + 6, 6, 4, "#4e3020");
    if (st && st.egg) { fill(g, "#f4ead2", x + 6, y + 6, 4, 2); fill(g, "#fffaf0", x + 6, y + 6, 2, 1); } },
  // une fourche appuyée contre le mur
  fourche(g, x, y, w, h) { fill(g, IC.o, x + 6, y + 6, 3, h - 6); fill(g, IC.wood, x + 7, y + 7, 1, h - 8);
    fill(g, IC.o, x + 2, y + 4, 11, 3); [x + 3, x + 7, x + 11].forEach(px => { fill(g, IC.o, px - 1, y - 4, 3, 9); fill(g, IC.ironl, px, y - 3, 1, 8); }); fill(g, IC.iron, x + 3, y + 5, 9, 1); },
  // tonneau d'eau ouvert : on voit l'eau qui bouge
  tonneau_eau(g, x, y, w, h, t) { box(g, x + 1, y - 2, 14, 17, IC.wood); fill(g, IC.iron, x + 1, y + 2, 14, 1); fill(g, IC.iron, x + 1, y + 10, 14, 1); fill(g, IC.woodl, x + 3, y, 2, 14);
    box(g, x + 1, y - 4, 14, 5, IC.woodd); fill(g, "#3a6a9a", x + 3, y - 3, 10, 3); fill(g, "#7ab8e0", x + 4 + (Math.floor(t / 400) % 3), y - 3, 3, 1); },
});
