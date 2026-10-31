// ---------- Le héros dans les 8 directions ----------
// Chaque vue est composée de formes simples (ellipses, rectangles), puis contourée et ombrée automatiquement.
function grid(h = 34) { return Array.from({ length: h }, () => Array(24).fill(".")); }
function fillR(g, x0, y0, x1, y1, k) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (g[y] && x >= 0 && x < 24) g[y][x] = k; }
function fillE(g, cx, cy, rx, ry, k, cond = () => true) { for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++)
  if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 && g[y] && x >= 0 && x < 24 && cond(x, y)) g[y][x] = k; }
function dot(g, pts, k) { pts.forEach(([x, y]) => { if (g[y] && x >= 0 && x < 24) g[y][x] = k; }); }
function outline(g) { const o = g.map(r => r.slice());
  for (let y = 0; y < g.length; y++) for (let x = 0; x < 24; x++) if (g[y][x] === "." && [[1,0],[-1,0],[0,1],[0,-1]].some(([a, b]) => g[y + b] && g[y + b][x + a] && g[y + b][x + a] !== "." && g[y + b][x + a] !== "o")) o[y][x] = "o";
  return o; }
const rowsOf = g => autoshade(outline(g).map(r => r.join("")));
const flipRows = rows => rows.map(r => r.split("").reverse().join(""));
// jambes : pose 0 = au repos, 1 = jambe avant en avant, -1 = l'autre
function legsFront(g, pose, x0 = 6, x1 = 14) {
  [[x0, pose > 0 ? -1 : 0], [x1, pose < 0 ? -1 : 0]].forEach(([lx, lift]) => { fillR(g, lx, 26, lx + 3, 29 + lift, "p"); fillR(g, lx, 30 + lift, lx + 3, 32 + lift, "B"); fillR(g, lx - 1, 31 + lift, lx - 1, 32 + lift, "B"); });
}
function body(g, cx, w, opts = {}) {             // torse vu de face ou de dos
  fillR(g, cx - w, 17, cx + w - 1, 25, "c"); fillR(g, cx - w, 22, cx + w - 1, 22, "b");
  fillR(g, cx - w - 3, 18, cx - w - 1, 23, "c"); fillR(g, cx + w, 18, cx + w + 2, 23, "c");          // bras
  fillR(g, cx - w - 3, 24, cx - w - 1, 24, "s"); fillR(g, cx + w, 24, cx + w + 2, 24, "s");
  fillR(g, cx - w + 1, 16, cx + w - 2, 17, "a");
}
// têtes dessinées pixel par pixel, à partir de la vue de face
const HEAD_E = [
"..........hh.hh.........",
"..........hhhhhh........",
"........hhhhhhhhhh......",
".......hjhhhhhhhhhh.....",
"......hjhhjhhhhhhhhh....",
".....hhhhjhhhhhhhhhhh...",
".....hhhhhhhhhhhhhhhh...",
".....hhhhhhhhhhhhhhhhh..",
".....hhhhhhhhhshhshsh...",
".....hhhhhhhhhsshsssh...",
".....hhhhhhhhsssoossso..",
".....hhhhhhhhsssEessse..",
".....hhhhhhhhssseRssses.",
"......hhhhhhssRRssssss..",
"..........hhhssssssMM...",
"...............ssss....."];
const HEAD_NE = [
"........oo.oo.oo........",
"......oojHojHoHHoo......",
".....ojjjhhhHhhhHHo.....",
"....ojhjhhhhHhhhhHHo....",
"...ojhjhhhjHhhhhhhHHo...",
"...ojhhhhjhhHhhhhhHHo...",
"..ojhhhhhhhhhhhhhhHHHo..",
"..ojhhhhhhhhhhhhhhHHHo..",
"..ojhhhhhHhhhhHhhHhHHo..",
"..ojhhhhhHhhhhHhhhhHHo..",
"..ojhhhhHhhhhhhHhhhsHo..",
"..ojhhhhHhhhhhhHhhssHo..",
"..oHhhhhHhhhhhhHhhSsHo..",
"...oHhhhhhhhhhhhhhSHo...",
"....oHHhhhhhhhhhHHo.....",
".....ooooSsssSSoooo....."];
const HEAD_N = [
"........oo.oo.oo........",
"......oojHojHoHHoo......",
".....ojjjhhhHhhhHHo.....",
"....ojhjhhhhHhhhhHHo....",
"...ojhjhhhjHhhhhhhHHo...",
"...ojhhhhjhhHhhhhhHHo...",
"..ojhhhhhhhhhhhhhhHHHo..",
"..ojhhhhhhhhhhhhhhHHHo..",
"..ojhhhhhHhhhhHhhHhHHo..",
"..ojhhhhhHhhhhHhhhhHHo..",
"..ojhhhhHhhhhhhHhhhHHo..",
"..ojhhhhHhhhhhhHhhhhHo..",
"..oHhhhhHhhhhhhHhhhhHo..",
"...oHhhhhhhhhhhhhhHHo...",
"....oHHhhhhhhhhhHHo.....",
".....ooooSsssSSoooo....."];
const VIEWS = {
  // de dos (nord)
  N(pose) { const g = grid();
    HEAD_N.forEach((r, y) => r.split("").forEach((k, x) => { if (k !== ".") g[y][x] = k; }));   // même coupe que de face, vue de dos
    fillR(g, 9, 15, 14, 16, "S");
    body(g, 12, 6); dot(g, [[11,18],[12,18],[11,19],[12,19],[12,20],[13,21],[12,21]], "A");   // noeud et pans de l'écharpe
    for (let k = 0; k < 8; k++) dot(g, [[16 - k, 18 + k]], "b");                       // sangle dans le dos
    legsFront(g, pose); return rowsOf(g); },
  // de profil, vers la droite (est)
  E(pose) { const g = grid(), sw = pose === 0 ? 0 : pose;
    HEAD_E.forEach((r, y) => r.split("").forEach((k, x) => { if (k !== ".") g[y][x] = k; }));   // tête dessinée pixel par pixel
    fillR(g, 12, 15, 15, 16, "S");
    fillR(g, 8, 17, 16, 25, "c"); fillR(g, 8, 22, 16, 22, "b"); fillR(g, 9, 16, 16, 17, "a"); fillR(g, 5, 17, 8, 18, "a"); dot(g, [[4,19],[5,19],[4,20]], "A");   // écharpe qui flotte derrière
    // jambes qui se croisent
    const L = [[10 - sw * 2, 0], [12 + sw * 2, 0]];
    L.forEach(([lx], i) => { fillR(g, lx, 26, lx + 2, 29, i ? "p" : "P"); fillR(g, lx, 30, lx + 3, 32, i ? "B" : "K"); });
    // bras avant, qui balance
    const ax = 11 - sw; fillR(g, ax - 1, 17, ax + 3, 17, "o"); fillR(g, ax - 1, 18, ax - 1, 24, "o"); fillR(g, ax + 3, 18, ax + 3, 24, "o");
    fillR(g, ax, 18, ax + 2, 23, "c"); fillR(g, ax, 24, ax + 2, 24, "s"); fillR(g, ax - 1, 25, ax + 3, 25, "o");
    dot(g, [[15,17],[14,18],[13,19],[12,20]], "b");
    return rowsOf(g); },
  // trois quarts face (sud-est)
  SE(pose) { const g = grid();
    ADULT().slice(0, 16).forEach((r, y) => r.split("").forEach((k, x) => { if (k !== ".") g[y][x] = k; }));   // même tête que de face
    fillR(g, 10, 15, 15, 16, "S");
    body(g, 12, 6);
    dot(g, [[8,17],[9,18],[10,19],[11,20],[12,21],[14,23],[15,24]], "b"); dot(g, [[15,23],[16,23],[16,24],[17,24]], "b"); dot(g, [[16,24]], "m");
    dot(g, [[15,17],[16,17],[16,18],[17,19],[17,20]], "A"); dot(g, [[12,22],[13,22]], "m");
    legsFront(g, pose); return rowsOf(g); },
  // trois quarts dos (nord-est)
  NE(pose) { const g = grid();
    HEAD_NE.forEach((r, y) => r.split("").forEach((k, x) => { if (k !== ".") g[y][x] = k; }));
    fillR(g, 9, 15, 14, 16, "S");
    body(g, 12, 6); dot(g, [[9,18],[10,18],[9,19],[10,19],[9,20],[8,21],[9,21]], "A");
    for (let k = 0; k < 8; k++) dot(g, [[15 - k, 18 + k]], "b");
    legsFront(g, pose); return rowsOf(g); },
};
VIEWS.S = pose => pose === 0 ? ADULT() : stepLegs(stepLegs(ADULT(), pose > 0 ? "L" : "R", 27), pose > 0 ? "L" : "R", 27);
// 8 directions : les vues gauche sont des miroirs des vues droite
const DIRS = { S: ["S", false], SE: ["SE", false], E: ["E", false], NE: ["NE", false], N: ["N", false], NW: ["NE", true], W: ["E", true], SW: ["SE", true] };
const dirCache = {};
function dirFrames(dir) {
  if (dirCache[dir]) return dirCache[dir];
  const [v, flip] = DIRS[dir], f = p => flip ? flipRows(VIEWS[v](p)) : VIEWS[v](p);
  const bobbed = rows => [".".repeat(24), ...rows.slice(0, 26), ...rows.slice(27)];
  return (dirCache[dir] = [f(1), bobbed(f(0)), f(-1), bobbed(f(0))]);
}
function idleRows(dir) { const k = "idle-" + dir; if (!dirCache[k]) { const [v, flip] = DIRS[dir]; dirCache[k] = flip ? flipRows(VIEWS[v](0)) : VIEWS[v](0); } return dirCache[k]; }
const DIR_ORDER = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
function renderDirs(t) {
  const c = ctxOf("dirs"); c.fillStyle = "#86d69a"; c.fillRect(0, 0, 232, 40);
  DIR_ORDER.forEach((d, i) => { const fr = dirFrames(d)[Math.floor(t / 130) % 4]; c.globalAlpha = .22; c.fillStyle = "#1a3a2a"; c.fillRect(i * 29 + 5, 36, 18, 3); c.globalAlpha = 1; drawSprite(c, fr, PAL, i * 29 + 2, 3); });
}
// petit terrain : le héros se promène tout seul, ou au clavier (flèches, ZQSD, WASD)
const walker = { x: 60, y: 40, dir: "S", keys: new Set(), auto: true, path: 0 };
const AUTO = [[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
function dirName(dx, dy) { return (dy < 0 ? "N" : dy > 0 ? "S" : "") + (dx > 0 ? "E" : dx < 0 ? "W" : ""); }
function renderField(t, dt) {
  const c = ctxOf("field"), W = 160, H = 90;
  for (let y = 0; y < H; y += 16) for (let x = 0; x < W; x += 16) grassTile(c, x, y);
  let dx = 0, dy = 0;
  if (walker.keys.size) { walker.auto = false;
    if (["arrowleft","q","a"].some(k => walker.keys.has(k))) dx--; if (["arrowright","d"].some(k => walker.keys.has(k))) dx++;
    if (["arrowup","z","w"].some(k => walker.keys.has(k))) dy--; if (["arrowdown","s"].some(k => walker.keys.has(k))) dy++; }
  else if (walker.auto) { [dx, dy] = AUTO[Math.floor(t / 1400) % 8]; }
  const moving = dx || dy;
  if (moving) { const sp = .045 * dt / Math.hypot(dx, dy); walker.x = Math.max(0, Math.min(W - 24, walker.x + dx * sp)); walker.y = Math.max(-2, Math.min(H - 36, walker.y + dy * sp)); walker.dir = dirName(dx, dy); }
  const fr = moving ? dirFrames(walker.dir)[Math.floor(t / 130) % 4] : idleRows(walker.dir);
  c.globalAlpha = .22; c.fillStyle = "#1a3a2a"; c.fillRect(Math.round(walker.x) + 3, Math.round(walker.y) + 32, 18, 3); c.globalAlpha = 1;
  drawSprite(c, fr, PAL, Math.round(walker.x), Math.round(walker.y));
}
function bindField() {
  const el = document.getElementById("field");
  el.addEventListener("keydown", e => { const k = e.key.toLowerCase(); if (["arrowleft","arrowright","arrowup","arrowdown","z","q","s","d","w","a"].includes(k)) { walker.keys.add(k); e.preventDefault(); } });
  el.addEventListener("keyup", e => walker.keys.delete(e.key.toLowerCase()));
  el.addEventListener("blur", () => walker.keys.clear());
  document.querySelectorAll("[data-pad]").forEach(b => { const k = b.dataset.pad;
    const on = e => { e.preventDefault(); walker.keys.add(k); }, off = () => walker.keys.delete(k);
    b.addEventListener("pointerdown", on); b.addEventListener("pointerup", off); b.addEventListener("pointerleave", off); });
}
