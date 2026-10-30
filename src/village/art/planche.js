// Code de dessin repris de la planche « Direction artistique » (version 16),
// publiée par le fil « Définir le style pixel art du jeu ».
// Tout est dessiné par du code : demi-sprites miroirs, ombrage et contours automatiques.
// Seules les parties propres à la planche (curseurs, boutons, boucle d'animation) ont été retirées,
// et la cinématique du puits a été rendue paramétrable (drawCine, en bas du fichier).
// Pour retoucher un dessin, modifier d'abord la planche, puis reporter ici.

// Demi-sprites gauches (12 colonnes), miroir automatique, ombrage automatique
const ADULT_L = [
"........oo.o",
"......oohhoh",
".....ohhhhhh",
"....ohhhhhhh",
"...ohhhhhhhh",
"...ohhhhhhhh",
"..ohhhhhhhhh",
"..ohhhhhhhhs",
"..ohhhhhshss",
"..ohhhssssss",
"..ohhsoossss",
"..ohssEessss",
"..ohsseessss",
"...ossssssss",
"....osssssss",
".....ooooSss",
"....oaaaaaaa",
"...oaaaaaaaa",
"..oocccccccc",
".occcccccccc",
".occoccccccc",
".occoccccccc",
".occobbbbbbm",
".ossoccccccc",
"..ooocccccc",
"...occccccc",
"...occcccco.",
".....oppppo.",
".....oppppo.",
".....oppppo.",
".....oBBBBo.",
"....oBBBBBo.",
"....oBBBBBo.",
"....oooooo..",
];
const CHILD_L = [
...ADULT_L.slice(0, 15),
".....ooooSss",
"....occccccc",
"...occcccccc",
"..ococcccccc",
"..ococcccccc",
"..osoccccccc",
"...ooccccccc",
"....occcccc.",
".....opppo..",
".....oBBBo..",
"....oBBBBo..",
"....ooooo...",
];
const pad = r => (r + "............").slice(0, 12);
const build = L => L.map(r => { r = pad(r); return r + r.split("").reverse().join(""); });
const SHADE = { h:"H", s:"S", c:"C", a:"A", p:"P", B:"K", b:"b", u:"U", q:"Q" };
const LIGHT = { h:"j", c:"l", a:"r", B:"k", u:"v", q:"w" };
function autoshade(rows) {
  const g = rows.map(r => r.split(""));
  const at = (x, y) => (g[y] && g[y][x]) || ".";
  const edge = k => k === "o" || k === ".";
  const out = g.map(r => r.slice());
  for (let y = 0; y < g.length; y++) for (let x = 0; x < g[y].length; x++) {
    const k = g[y][x];
    if (edge(k)) continue;
    if (SHADE[k] && (edge(at(x + 1, y)) || edge(at(x, y + 1)) || (x >= 12 && edge(at(x + 2, y))))) out[y][x] = SHADE[k];
    else if (LIGHT[k] && (edge(at(x - 1, y - 1)) && edge(at(x, y - 1)) || (edge(at(x - 1, y)) && x < 12))) out[y][x] = LIGHT[k];
  }
  return out.map(r => r.join(""));
}
const set = (rows, pts, k) => { const g = rows.map(r => r.split("")); pts.forEach(([x, y]) => { if (g[y]) g[y][x] = k; }); return g.map(r => r.join("")); };
function stepLegs(rows, side, from) {
  // décale la jambe d'un côté d'un pixel vers le haut
  const g = rows.map(r => r.split(""));
  const xs = side === "L" ? [0, 12] : [12, 24];
  for (let y = from; y < g.length; y++) for (let x = xs[0]; x < xs[1]; x++) g[y][x] = (rows[y + 1] || ".".repeat(24))[x];
  return g.map(r => r.join(""));
}
const bob = rows => [".".repeat(24), ...rows.slice(0, rows.length - 1)];
// le rebond tasse le haut du corps sans couper les pieds
function bobUpper(rows, cut) { const up = rows.slice(0, cut), low = rows.slice(cut); return [".".repeat(24), ...up.slice(0, up.length), ...low.slice(1)]; }

// détails asymétriques posés après le miroir
function details(rows, adult) {
  let r = rows;
  r = set(r, [[11,13],[12,13]], "M");
  r = set(r, [[7,12],[16,12]], "R");
  r = set(r, [[6,4],[7,3],[8,2],[9,5],[10,4]], "j");
  r = set(r, [[18,6],[18,7],[17,8]], "H");
  if (adult) {
    r = set(r, [[7,18],[8,19],[9,20],[10,21],[13,23],[14,24],[15,25]], "b");
    r = set(r, [[15,23],[16,23],[17,23],[16,24],[17,24],[16,25],[17,25]], "b");
    r = set(r, [[16,24]], "m");
    r = set(r, [[15,18],[16,18],[15,19],[16,19],[16,20]], "A");
  }
  return r;
}
function mix(a, b, t) { const p = h => [1,3,5].map(i => parseInt(h.slice(i, i + 2), 16)); const x = p(a), y = p(b);
  return "#" + x.map((v, i) => Math.round(v * (1 - t) + y[i] * t).toString(16).padStart(2, "0")).join(""); }
function drawSprite(ctx, rows, pal, x0, y0) {
  const at = (x, y) => (rows[y] && rows[y][x]) || ".";
  rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) {
    const k = row[x]; if (k === ".") continue;
    let col = pal[k] || "#f0f";
    if (k === "o") {
      const n = [at(x+1,y), at(x-1,y), at(x,y+1), at(x,y-1)];
      if (!n.includes(".")) { const inner = n.find(v => v !== "o"); if (inner && pal[inner]) col = mix(pal[inner], pal.o, .6); }
    }
    ctx.fillStyle = col; ctx.fillRect(x0 + x, y0 + y, 1, 1);
  }});
}
const ADULT = () => details(autoshade(build(ADULT_L)), true);
const CHILD = () => details(autoshade(build(CHILD_L)), false);
function walkFrames(base, cut) { const sL = stepLegs(stepLegs(base, "L", cut), "L", cut), sR = stepLegs(stepLegs(base, "R", cut), "R", cut);
  return [sL, bobUpper(base, cut), sR, bobUpper(base, cut)]; }

// ---------- Palette (originale, fraîche, inspirée des RPG DS) ----------
const PAL = {
  o:"#2a2030", h:"#5a3a2e", H:"#3e2620", j:"#8a5a40", s:"#f6cfae", S:"#d9967e", e:"#2a2030", E:"#ffffff", M:"#b0605a", R:"#f2a6a0",
  c:"#3d7bb0", C:"#2b5884", l:"#6aa6d4", a:"#d2463c", A:"#982c2e", r:"#f07a5a", b:"#6a4428", m:"#f2c64a",
  p:"#4a4458", P:"#33303f", B:"#7a4a2c", K:"#53301e", k:"#a86c40",
};
const CHILD_PAL = { ...PAL, c:"#e0a03a", C:"#b0702a", l:"#f6c868", h:"#6a4632", H:"#4a2e22", j:"#9a6a48" };
const VARIANTS = {
  scar: { pal: PAL, mod: r => set(r, [[14,9],[15,10],[17,12],[18,13]], "X"), extra: { X:"#b23a36" } },
  curse: { pal: { ...PAL, c:"#4e3a6e", C:"#33264e", l:"#7a5aa0", s:"#d8c0c0", S:"#a08494", a:"#3a2a48", A:"#241a30", h:"#2e2a36", H:"#1c1822", j:"#4a4458" },
           mod: r => set(set(r, [[8,11],[15,11]], "G"), [[17,13],[17,14],[18,14],[6,14]], "V"), extra: { G:"#b46cff", V:"#6a3a8a" } },
  bless: { pal: { ...PAL, h:"#e8d8a8", H:"#c2a870", j:"#fff6d8", a:"#f2e6c0", A:"#cbb98c", c:"#f4f0e6", C:"#c9c0aa", l:"#ffffff", m:"#ffd84a" },
           mod: r => r, extra: {} },
};
const T = { g:"#86d69a", gd:"#6cbf84", gl:"#a8e8b4", tg:"#43ad5c", tgd:"#2c8644", tgl:"#74d17c", to:"#1f5a35",
  f1:"#4f8f3e", f2:"#3a6b33", f3:"#7eb84e", fo:"#22402a", tr:"#7a4e30", trd:"#4e3020",
  sa:"#f0d79c", sad:"#dcbc7c", sab:"#c8e3a0", rf:"#c4504a", rfd:"#8e3434", rfl:"#e27a62", wa:"#f4ead2", wad:"#d4c4a4", wd:"#8a5a38", wdd:"#5a3a24", win:"#7ab8e0", fw:"#ffffff", fy:"#ffd84a", fp:"#f28cb0" };

function px(ctx, c, x, y, w = 1, h = 1) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
function grassTile(ctx, x, y) {
  px(ctx, T.g, x, y, 16, 16);
  [[2,3],[10,1],[6,9],[13,11],[4,14]].forEach(([a,b]) => px(ctx, T.gl, x + a, y + b));
  [[3,3],[11,1],[7,9],[14,11],[5,14]].forEach(([a,b]) => px(ctx, T.gd, x + a, y + b));
}
const LEAF = ["...oo...","..oLGo..",".oLGGGo.","oLGGGDGo","oGGDGDGo",".oGDDGo.","..oDDo..","...oo..."];
function tallGrass(ctx, x, y) {
  px(ctx, T.tgd, x, y, 16, 16);
  [[0,0],[8,0],[4,6],[12,6],[0,10],[8,10]].forEach(([a,b]) => LEAF.forEach((row, j) => [...row].forEach((k, i) => {
    if (k === ".") return; const X = x + a + i, Y = y + b + j; if (X >= x + 16 || Y >= y + 16) return;
    px(ctx, { o:T.to, L:T.tgl, G:T.tg, D:T.tgd }[k], X, Y); })));
}
function flower(ctx, x, y, petal) {
  px(ctx, T.f2, x + 2, y + 5, 1, 3); px(ctx, T.f3, x + 3, y + 6, 2, 1);
  px(ctx, T.fo, x + 1, y, 3, 5); px(ctx, T.fo, x, y + 1, 5, 3);
  px(ctx, petal, x + 1, y + 1, 3, 3); px(ctx, petal, x + 2, y); px(ctx, petal, x + 2, y + 4); px(ctx, petal, x, y + 2); px(ctx, petal, x + 4, y + 2);
  px(ctx, T.fy, x + 2, y + 2);
}
let treeCache = null;
function treeSprite() {
  if (treeCache) return treeCache;
  const c = document.createElement("canvas"); c.width = 48; c.height = 64; const g = c.getContext("2d");
  const cx = 23.5, tiers = [[0, 18, 10], [12, 18, 16], [25, 24, 22]];
  const hwAt = y => { let best = -1, tier = -1, ly = 0; tiers.forEach(([y0, h, max], i) => { if (y < y0 || y >= y0 + h) return;
      const l = y - y0, w = Math.min(max, 2 + l * 1.1) - (l > h - 3 ? (l - (h - 3)) * 1.5 : 0); if (w > best) { best = w; tier = i; ly = l; } }); return [best, tier, ly]; };
  const inside = (x, y) => { const [w] = hwAt(y); return w > 0 && Math.abs(x + .5 - cx) <= w; };
  // tronc
  for (let y = 46; y < 63; y++) for (let x = 19; x < 29; x++) {
    const edge = x === 19 || x === 28 || y === 62; px(g, edge ? T.fo : (x < 23 ? T.tr : T.trd), x, y);
  }
  for (let y = 0; y < 49; y++) for (let x = 0; x < 48; x++) {
    if (!inside(x, y)) continue;
    const [w, tier, ly] = hwAt(y), rel = (x + .5 - cx) / w;
    let col = T.f1;
    if (rel < -.1 && rel > -.8 && ly < tiers[tier][1] - 4) col = T.f3;
    if (rel > .4) col = T.f2;
    if (!inside(x, y + 1) || ly >= tiers[tier][1] - 3) col = (x + y) % 2 ? T.f2 : col === T.f3 ? T.f1 : T.f2;
    if (rel < -.25 && rel > -.6 && ly > 1 && ly < 8 && (x + y) % 3) col = "#9ccc66";
    if (!inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1)) col = T.fo;
    px(g, col, x, y);
  }
  return (treeCache = c);
}
function cottage(ctx, x, y) {
  const Wd = 72;
  px(ctx, T.fo, x + 4, y + 30, Wd - 8, 34); px(ctx, T.wa, x + 5, y + 31, Wd - 10, 32);
  px(ctx, T.wad, x + 5, y + 56, Wd - 10, 7);
  [5, 35, Wd - 6].forEach(bx => px(ctx, T.wd, x + bx, y + 31, 2, 32));
  px(ctx, T.wdd, x + 28, y + 40, 16, 24); px(ctx, T.wd, x + 29, y + 41, 14, 23); px(ctx, T.wdd, x + 35, y + 41, 2, 23); px(ctx, T.fy, x + 40, y + 52, 2, 2);
  px(ctx, "#a8784c", x + 29, y + 41, 14, 2);
  [[10, 38], [50, 38]].forEach(([wx, wy]) => { px(ctx, T.wdd, x + wx, y + wy, 12, 11); px(ctx, T.win, x + wx + 1, y + wy + 1, 10, 9); px(ctx, "#cfe8f8", x + wx + 1, y + wy + 1, 4, 3); px(ctx, T.wdd, x + wx + 5, y + wy + 1, 2, 9); px(ctx, T.wdd, x + wx + 1, y + wy + 5, 10, 1); px(ctx, T.f2, x + wx - 1, y + wy + 11, 14, 3); px(ctx, T.fp, x + wx + 2, y + wy + 11); px(ctx, T.fp, x + wx + 8, y + wy + 12); });
  px(ctx, T.fo, x + 48, y - 8, 10, 16); px(ctx, "#9a8a80", x + 49, y - 7, 8, 15); px(ctx, "#bcae9e", x + 49, y - 7, 3, 15); px(ctx, T.fo, x + 47, y - 9, 12, 2);
  for (let r = 0; r < 32; r++) {
    const inset = Math.max(0, 14 - Math.floor(r / 2)), w = Wd - inset * 2;
    const col = r >= 30 ? T.rfd : (r % 5 === 4 ? T.rfd : (r < 5 ? T.rfl : T.rf));
    px(ctx, T.fo, x + inset - 1, y + r, w + 2, 1); px(ctx, col, x + inset, y + r, w, 1);
    for (let k = inset + (r % 10 < 5 ? 1 : 4); k < Wd - inset; k += 7) if (r % 5 !== 4) px(ctx, T.rfd, x + k, y + r);
    if (r % 5 === 1) for (let k = inset + (r % 10 < 5 ? 3 : 6); k < Wd - inset; k += 7) px(ctx, T.rfl, x + k, y + r);
  }
  px(ctx, T.fo, x - 1, y + 31, Wd + 2, 1);
}
function sandPath(ctx, x, y, w, h) {
  px(ctx, T.sab, x - 2, y, w + 4, h); px(ctx, T.sa, x, y, w, h);
  for (let j = 0; j < h; j += 4) for (let i = (j % 8 ? 2 : 6); i < w; i += 8) px(ctx, T.sad, x + i, y + j + 1);
  for (let j = 0; j < h; j += 3) { px(ctx, T.g, x - 2, y + j, 1, 1); px(ctx, T.g, x + w + 1, y + j + 1, 1, 1); }
}

// ---------- Générateur d'apparence : un seul dessin, des paramètres continus ----------
const OUTFITS = {
  tunique: { name: "Tunique de voyage", pal: {} },
  mage: { name: "Robe de mage", pal: { c:"#5a4aa8", C:"#3c3078", l:"#8a7ad0", a:"#e2b84a", A:"#a8822e", r:"#ffe08a" },
    rows: L => { const R = L.slice(); R[24] = "..oooccccccc"; R.splice(25, 9, "...occcccccc", "...occcccccc", "...occcccccc", "..occcccccccc".slice(0, 12), "..occcccccccc".slice(0, 12), "..oaaaaaaaaa", "..oooooooooo", ".....oBBBo..", ".....ooooo.."); return R; }, legCut: 32 },
  guerrier: { name: "Armure de guerrier", pal: { c:"#8e9aac", C:"#5f6a7c", l:"#c8d0dc", q:"#b4bdca", Q:"#6e7888", w:"#eef1f6", b:"#5a3a26" },
    rows: L => { const R = L.slice(); R[16] = "...ooaaaaaaa"; R[17] = "..oqqoaaaaaa"; R[18] = ".oqqqqoccccc"; R[19] = ".oqqqqoccccc"; R[20] = "..oooocccccc"; return R; } },
  voleur: { name: "Cape de voleur", pal: { c:"#4e4a3c", C:"#302e26", l:"#6e6a54", u:"#3c4a3a", U:"#25301f", v:"#5e7254", a:"#2e2a30", A:"#1c1a20", r:"#4a4450" },
    rows: L => L.map((r, y) => { r = pad(r); if (y <= 8) r = r.replace(/h/g, "u"); if (y >= 9 && y <= 17) r = ".ouu" + r.slice(4); if (y === 13 || y === 14) r = r.slice(0, 7) + "aaaaa"; if (y === 18) r = ".oo" + r.slice(3); return r; }),
    hood: true, mask: true },
};
// Cheveux : frange + deux mèches devant (à l'intérieur des bras) + une masse derrière le corps
function growHair(L, len, child, floating) {
  const R = L.map(pad);
  const put = (y, x, k) => { if (!R[y]) return; const g = R[y].split(""); g[x] = k; R[y] = g.join(""); };
  if (len >= 1) R[9] = "..ohhhhhssss";
  if (len >= 3) R[10] = "..ohhhoossss";
  if (floating || len < 3) return R;
  const n = Math.min(len - 2, child ? 9 : 13);
  for (let k = 0; k <= n; k++) {
    const y = 12 + k, end = k === n;
    if (y <= 15) { put(y, 2, "o"); put(y, 3, end ? "o" : "h"); put(y, 4, end ? "o" : "h"); }
    else { put(y, 3, "o"); put(y, 4, end ? "o" : "h"); put(y, 5, end ? "o" : "h"); put(y, 6, "o"); }
  }
  return R;
}
function backHair(len, H) {
  if (len < 2) return null;
  const end = Math.min(H - 3, 10 + Math.round(len * 1.4)), L = [];
  for (let y = 0; y < H; y++) {
    if (y < 6 || y > end + 1) { L.push("."); continue; }
    const x0 = y < 12 ? 2 : y < 18 ? 1 : y < 24 ? 2 : Math.min(5, 3 + Math.floor((y - 24) / 3));
    if (y === end + 1) { L.push(".".repeat(x0 - 1) + [..."o".repeat(13 - x0)].map((c, i) => i % 2 ? "." : "o").join("")); continue; }
    L.push(".".repeat(x0 - 1) + "o" + "h".repeat(12 - x0));
  }
  return autoshade(build(L));
}
// Pacte de l'Esprit capillaire : en combat, les cheveux se soulèvent et ondulent
function drawLiveHair(ctx, x0, y0, len, t, pal) {
  if (len < 2) return;
  const anchors = [[4, 10, Math.PI + .45], [19, 10, -.45], [3, 14, Math.PI + .1], [20, 14, -.1], [7, 3, Math.PI + 1.15], [16, 3, -1.15]];
  const n = Math.min(anchors.length, 2 + Math.floor(len / 3)), L = 3 + len * 1.15;
  const strands = [];
  anchors.slice(0, n).forEach((a, i) => { strands.push([a, L, 0, i, 0]); strands.push([[a[0], a[1] + 1, a[2] + .12], L * .8, 0, i, 1.3]); });
  if (len >= 12) strands.push([[20, 12, .5], L * 1.4, 1, 7, 0]);       // la mèche qui saisit
  strands.forEach(([[ax, ay, base], len2, grab, i, ph], si) => {
    let x = x0 + ax, y = y0 + ay;
    for (let s = 0; s < len2; s++) {
      const k = s / len2, curl = grab ? Math.max(0, k - .65) * 7 : 0;
      const th = base + .6 * Math.sin(t / 300 + s * .38 + i * 1.7 + ph) * k + curl + (grab ? .3 * Math.sin(t / 480) : 0);
      x += Math.cos(th); y += Math.sin(th);
      const X = Math.round(x), Y = Math.round(y);
      ctx.fillStyle = s % 6 === 3 ? pal.j : (ph ? pal.h : pal.H);
      ctx.fillRect(X, Y, 1, 1);
      if (s < 3) { ctx.fillStyle = pal.h; ctx.fillRect(X, Y + 1, 1, 1); }
    }
  });
}
function beard(rows, amount) {
  if (amount <= 0) return rows;
  const stub = [[9,14],[14,14],[11,14],[12,14],[6,13],[17,13]];
  const full = [[10,13],[13,13],[5,13],[6,13],[17,13],[18,13],[6,14],[7,14],[9,14],[10,14],[11,14],[12,14],[13,14],[14,14],[16,14],[17,14],[8,15],[9,15],[10,15],[11,15],[12,15],[13,15],[14,15],[15,15],[10,16],[11,16],[12,16],[13,16]];
  if (amount < .5) return set(rows, stub, "S");
  rows = set(rows, full, "h");
  return set(rows, [[7,13],[16,13],[8,14],[15,14]], "j");
}
function makeHero(o) {
  const outfit = OUTFITS[o.outfit];
  let L = o.child ? CHILD_L.slice() : ADULT_L.slice();
  const len = Math.round(o.hair * (o.child ? 9 : 14));
  if (!o.child && outfit.rows && !outfit.hood) L = outfit.rows(L);
  const floating = o.pact && o.combat;
  L = growHair(L, len, o.child, floating);
  if (outfit.hood) L = outfit.rows(L);
  let rows = details(autoshade(build(L)), !o.child && o.outfit !== "mage");
  if (!o.child && !outfit.mask) rows = beard(rows, Math.max(0, (o.hair - .45) / .55));
  if (outfit.hood) rows = rows.map((r, y) => y <= 8 ? r.replace(/[jH]/g, "U") : r);
  if (outfit.mask) rows = set(rows, [[11,13],[12,13]], "a");
  const cut = o.child ? 23 : (outfit.legCut || 27);
  return { rows, cut, len, back: floating ? null : backHair(len, rows.length) };
}
const BLESS_PAL = { h:"#efe2b4", H:"#c9b07a", j:"#fffbe6", s:"#ffe6cc", S:"#e8b896", c:"#f4f0e6", C:"#c9c0aa", l:"#ffffff", a:"#f2e6c0", A:"#cbb98c", m:"#ffd84a", u:"#e8e0c8", U:"#bfb294", v:"#fffaf0", q:"#f0e2a8", Q:"#c4a85a", w:"#fffbe0" };
const CURSE_PAL = { h:"#2e2a36", H:"#1c1822", j:"#4a4458", s:"#d4bcc4", S:"#9c8090", c:"#4e3a6e", C:"#33264e", l:"#7a5aa0", a:"#3a2a48", A:"#241a30", u:"#2e2240", U:"#1c1428", v:"#4a3a66", q:"#6a5a88", Q:"#3a2e54", w:"#9a8ab8", e:"#5a2a7a" };
function heroPalette(o) {
  const base = { ...PAL, ...(o.child ? { c:"#e0a03a", C:"#b0702a", l:"#f6c868" } : {}), ...OUTFITS[o.outfit].pal, X:"#b23a36" };
  if (o.pact) { base.h = mix(base.h, "#2a2238", .55); base.H = mix(base.H, "#16121e", .55); base.j = mix(base.j, "#6a5a8a", .5); }
  const out = {}, bw = o.bless * .65, cw = o.curse * .65;
  for (const k in base) {
    const mb = BLESS_PAL[k] ? mix(base[k], BLESS_PAL[k], bw) : base[k];
    const mc = CURSE_PAL[k] ? mix(base[k], CURSE_PAL[k], cw) : base[k];
    out[k] = bw + cw > 0 ? mix(mb, mc, cw / (bw + cw)) : base[k];
  }
  return out;
}
const VEINS = [[17,13],[6,13],[18,14],[5,14],[17,10],[6,10],[1,22],[22,21],[2,21],[21,22],[18,9],[5,9]];
function ring(rows, x0, y0, dist) {
  const solid = (x, y) => rows[y] && rows[y][x] && rows[y][x] !== ".";
  const pts = [];
  for (let y = -dist; y < rows.length + dist; y++) for (let x = -dist; x < 24 + dist; x++) {
    if (solid(x, y)) continue;
    let near = false;
    for (let dy = -dist; dy <= dist && !near; dy++) for (let dx = -dist; dx <= dist; dx++) if (Math.abs(dx) + Math.abs(dy) <= dist && solid(x + dx, y + dy)) { near = true; break; }
    let nearer = false;
    if (dist > 1) for (let dy = -(dist - 1); dy <= dist - 1 && !nearer; dy++) for (let dx = -(dist - 1); dx <= dist - 1; dx++) if (Math.abs(dx) + Math.abs(dy) <= dist - 1 && solid(x + dx, y + dy)) { nearer = true; break; }
    if (near && !nearer) pts.push([x0 + x, y0 + y]);
  }
  return pts;
}
// Le corps porte les marques (couleurs, veines, yeux). L'aura vient des croyances : voir drawAura.
function drawHero(ctx, o, frame, x0, y0, t, back, len) {
  const pal = heroPalette(o), rows = frame;
  if (back) drawSprite(ctx, back, pal, x0, y0);
  if (o.pact && o.combat) drawLiveHair(ctx, x0, y0, len, t, pal);
  const c = o.curse, pulse = .5 + .5 * Math.sin(t / 260);
  drawSprite(ctx, rows, pal, x0, y0);
  const nv = Math.floor(Math.max(0, c - .2) / .8 * VEINS.length);
  ctx.fillStyle = "#6a2a8a"; VEINS.slice(0, nv).forEach(([x, y]) => { if (rows[y] && rows[y][x] !== "." && rows[y][x] !== "o") ctx.fillRect(x0 + x, y0 + y, 1, 1); });
  if (c > .3) { ctx.globalAlpha = Math.min(1, (c - .3) / .5) * (.6 + .4 * pulse); ctx.fillStyle = "#d090ff"; [[7,11],[16,11]].forEach(([x, y]) => { if (rows[y][x] !== "a") ctx.fillRect(x0 + x, y0 + y, 1, 1); }); }
  ctx.globalAlpha = 1;
}
// ---------- Auras : allégeance × renommée × regard des gens ----------
const FAITHS = {
  aucune: { name: "Aucune allégeance" },
  divin: { name: "Un dieu de lumière", aime: { glow:"#ffd86a", mote:"#fff3b0", ray:"#ffe9a0" }, craint: { glow:"#dfeeff", mote:"#ffffff", ray:"#f4fbff" } },
  sombre: { name: "Un diable ou dieu sombre", aime: { glow:"#4a1240", smoke:"#8a2a6a", ember:"#ff7a4a" }, craint: { glow:"#0c0610", smoke:"#1a1220", ember:"#ff2a2a" } },
  paien: { name: "Un esprit des légendes", aime: { glow:"#2a8a5a", wisp:"#a8f4c8", core:"#ffffff", leaf:"#7ac050" }, craint: { glow:"#3a2a1a", wisp:"#e8e0c8", core:"#c04030", leaf:"#8a5a30" } },
  athee: { name: "Athée, refuse tout" },
};
const hash = n => { n = Math.sin(n * 127.1) * 43758.5453; return n - Math.floor(n); };
function auraColors(o) {
  const F = FAITHS[o.faith], k = (o.regard + 1) / 2, out = {};
  for (const key in F.aime) out[key] = mix(F.craint[key], F.aime[key], k);
  return out;
}
function ellipse(ctx, cx, cy, rx, ry, col, alpha) {
  ctx.globalAlpha = alpha; ctx.fillStyle = col;
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) ctx.fillRect(cx + x, cy + y, 1, 1);
  ctx.globalAlpha = 1;
}
function drawAura(ctx, o, x0, y0, t, layer, h = 34) {
  const r = o.renown, f = o.faith; if (f === "aucune" || r <= 0) return;
  const cx = x0 + 12, fy = y0 + h - 1, n = 4 + Math.round(r * 16), feared = o.regard < 0;
  if (f === "athee") {
    if (layer === "back") { const rx = 11 + Math.round(r * 3); ctx.fillStyle = "#b8bec6";
      for (let a = 0; a < 6.28; a += .2) { if (Math.floor(a * 5 + t / 400) % 3 === 0) continue; ctx.globalAlpha = .55 * r; ctx.fillRect(Math.round(cx + Math.cos(a) * rx), Math.round(fy + Math.sin(a) * 3), 1, 1); }
      ctx.globalAlpha = 1; return; }
    if (r < .2) return;
    // la magie s'éteint à son contact : des étincelles grises qui grésillent
    const k = Math.floor(t / 180);
    for (let i = 0; i < 2 + Math.round(r * 5); i++) { const s = k * 7 + i; if (hash(s) > .7) continue;
      const a = hash(s + 1) * 6.28, d = 12 + hash(s + 2) * 4; ctx.globalAlpha = .7; ctx.fillStyle = "#9aa0a8";
      ctx.fillRect(Math.round(cx + Math.cos(a) * d), Math.round(y0 + h / 2 + Math.sin(a) * d * .7), 1, 1); ctx.fillStyle = "#d8dce2"; ctx.fillRect(Math.round(cx + Math.cos(a) * (d + 1)), Math.round(y0 + h / 2 + Math.sin(a) * (d + 1) * .7), 1, 1); }
    ctx.globalAlpha = 1; return;
  }
  const C = auraColors(o);
  if (f === "divin") {
    if (layer === "back") {
      ellipse(ctx, cx, fy, 9 + Math.round(r * 5), 3, C.glow, .25 + .3 * r);
      const top = y0 - 8 - Math.round(r * 8);
      ctx.globalAlpha = .12 + .18 * r; ctx.fillStyle = C.glow; ctx.fillRect(cx - 9, top + 6, 18, fy - top - 6);
      [-10, -5, 0, 5, 10].forEach((dx, i) => { const a = (.2 + .3 * r) * (.4 + .6 * Math.sin(t / 300 + i * 1.7) ** 2) * (feared ? 1.3 : 1);
        ctx.globalAlpha = Math.min(1, a); ctx.fillStyle = C.ray; ctx.fillRect(cx + dx, top + (i % 2) * 4, i === 2 ? 2 : 1, fy - top); });
    } else for (let i = 0; i < n; i++) {
      const p = (t / 45 + i * 37) % 44, x = cx - 12 + Math.round(hash(i) * 24), y = fy - p;
      ctx.globalAlpha = Math.max(0, 1 - p / 44) * (.6 + .4 * r); ctx.fillStyle = C.mote; ctx.fillRect(x, Math.round(y), 1, 1);
      if (i % 3 === 0) { ctx.fillRect(x - 1, Math.round(y), 3, 1); ctx.fillRect(x, Math.round(y) - 1, 1, 3); }
    }
  }
  if (f === "sombre") {
    if (layer === "back") ellipse(ctx, cx, fy, 10 + Math.round(r * 6), 3 + Math.round(r), C.glow, .35 + .35 * r);
    for (let i = 0; i < n; i++) {
      if ((i % 2 === 0) !== (layer === "back")) continue;
      const p = (t / 60 + i * 29) % 44, sway = Math.round(Math.sin(t / 420 + i) * 2);
      const x = cx - 13 + Math.round(hash(i + 9) * 26) + sway, y = Math.round(fy - 1 - p), sz = p < 12 ? 4 : p < 26 ? 3 : 2;
      ctx.globalAlpha = Math.max(0, 1 - p / 44) * (.55 + .4 * r); ctx.fillStyle = C.smoke; ctx.fillRect(x, y, sz, sz - 1); ctx.fillRect(x + 1, y - 1, sz - 2 || 1, 1);
    }
    if (layer === "front") for (let i = 0; i < 2 + Math.round(r * 7); i++) {
      const p = (t / 30 + i * 41) % 36; ctx.globalAlpha = Math.max(0, 1 - p / 36); ctx.fillStyle = C.ember;
      ctx.fillRect(cx - 10 + Math.round(hash(i + 3) * 20), Math.round(fy - 4 - p), 1, 1);
    }
    // une présence qui veille derrière lui, quand il est très craint
    if (layer === "back" && feared && r > .65) { const a = (r - .65) / .35 * (.6 + .4 * Math.sin(t / 500)); ctx.globalAlpha = a; ctx.fillStyle = C.ember;
      ctx.fillRect(cx - 4, y0 - 4, 2, 1); ctx.fillRect(cx + 3, y0 - 4, 2, 1); }
  }
  if (f === "paien") {
    if (layer === "back") ellipse(ctx, cx, fy, 8 + Math.round(r * 5), 2, C.glow, .25 + .25 * r);
    const m = 1 + Math.round(r * 4);
    for (let i = 0; i < m; i++) for (let tr = 5; tr >= 0; tr--) {
      const a = (t - tr * 60) / 700 + i * 6.283 / m, front = Math.sin(a) > 0;
      if (front !== (layer === "front")) continue;
      const x = Math.round(cx + Math.cos(a) * 15), y = Math.round(y0 + h * .55 + Math.sin(a) * 5 - Math.sin(t / 500 + i) * 2);
      ctx.globalAlpha = tr ? .8 / tr : 1; ctx.fillStyle = C.wisp; ctx.fillRect(x, y, tr < 3 ? 2 : 1, tr < 3 ? 2 : 1);
      if (!tr) { ctx.fillRect(x - 1, y, 4, 2); ctx.fillRect(x, y - 1, 2, 4); ctx.fillStyle = C.core; ctx.fillRect(x, y, 2, 2); }
    }
    if (layer === "front" && r > .3) for (let i = 0; i < 1 + Math.round(r * 7); i++) {
      const p = (t / 70 + i * 23) % 40, x = cx - 12 + Math.round(hash(i + 20) * 24 + Math.sin(t / 300 + i) * 2);
      ctx.globalAlpha = Math.max(0, 1 - p / 40); ctx.fillStyle = C.leaf; ctx.fillRect(x, Math.round(y0 - 6 + p), 2, 1);
    }
  }
  ctx.globalAlpha = 1;
}
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
// ---------- Mini cinématique : les cheveux attrapent l'enfant par le pied ----------
const CINE_LEN = 11000;
const FRIEND_PAL = { ...PAL, c:"#5a8a4a", C:"#3e6634", l:"#86b46a", h:"#d8b060", H:"#a8803e", j:"#f4d890", p:"#6a5a4a", P:"#4a3e34" };
const CINE_TEXT = [[0, "La nuit, près du vieux puits."], [600, "Des cheveux débordent du puits et glissent hors de vue…"], [2200, "Ils ont attrapé quelque chose."],
  [2700, "Ton meilleur ami, traîné par le pied."], [4300, "Arraché du sol…"], [5600, "…et englouti."], [7000, "Le seau se balance encore."]];
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
// ---------- Au fond du puits : la vue plongeante (plus détaillée que le jeu) ----------
const HORROR_W = 160, HORROR_H = 120, BAYER4 = [[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
const horrorImgs = {};
function buildHorror(variant) {
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
    P(F[0] + x, F[1] + y, ramp(GOLD, .6 + .4 * Math.sin(x * 1.4 + y * .2) - d * .4, x, y)); }   // cheveux blonds mouillés
  for (let y = -fry; y <= fry; y++) for (let x = -frx; x <= frx; x++) {
    const d = (x / frx) ** 2 + (y / fry) ** 2; if (d > 1) continue;
    const nx = x / frx, ny = y / fry, nz = Math.sqrt(Math.max(0, 1 - d));
    let v = Math.max(0, nx * .45 - ny * .5 + nz * .74) * .85 + .1;
    v -= Math.max(0, 1 - ((x + 8) / 7) ** 2 - ((y - 6) / 5) ** 2) * .08 + Math.max(0, 1 - ((x - 8) / 7) ** 2 - ((y - 6) / 5) ** 2) * .12;   // joues
    v += Math.max(0, 1 - (x / 2) ** 2 - ((y - 1) / 6) ** 2) * .15;                                                                 // arête du nez
    P(F[0] + x, F[1] + y, ramp(SKIN, v, x + 80, y + 64));
  }
  [[-9, 4], [-7, 6], [-11, 6], [9, 5], [7, 3], [11, 7], [-2, 2], [2, 3], [-5, 5]].forEach(([x, y]) => P(F[0] + x, F[1] + y, SKIN[2]));   // taches de rousseur
  for (let x = -frx + 2; x <= frx - 2; x += 2) strand(F[0] + x, F[1] - fry - 3, 1.57 + x * .015, 4 + Math.abs(Math.sin(x * 3)) * 7, 1, .2, 0, 3);   // mèches blondes collées au front
  for (let x = -frx + 3; x <= frx - 3; x += 3) { const l = 3 + Math.abs(Math.sin(x * 2)) * 6; for (let k = 0; k < l; k++) P(F[0] + x + Math.sin(k * .5) * .6, F[1] - fry + k, GOLD[k % 3 ? 3 : 2]); }
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
function renderHorror(ctx, p, variant = 1) {
  if (!horrorImgs[variant]) horrorImgs[variant] = buildHorror(variant);
  const { data, th } = horrorImgs[variant], out = ctx.createImageData(HORROR_W, HORROR_H);
  for (let i = 0; i < th.length; i++) {
    const f = Math.max(0, Math.min(1, (p - th[i]) / .22)), x = i % HORROR_W, y = (i / HORROR_W) | 0;
    const k = f >= 1 ? 1 : (BAYER4[y & 3][x & 3] / 16 < f ? (f > .5 ? .7 : .35) : 0);
    out.data[i * 4] = data.data[i * 4] * k; out.data[i * 4 + 1] = data.data[i * 4 + 1] * k; out.data[i * 4 + 2] = data.data[i * 4 + 2] * k; out.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(out, 0, 0);
}

// ---------- L'esprit parle à travers l'enfant : portrait de dialogue animé ----------
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

// ---------- Mini cinématique, version jeu ----------
// e : temps écoulé en ms (0 → CINE_LEN). opts.ground = false : pas de sol ni de lune, pour la poser sur la carte.
// Le puits est dessiné en (wx, wy) = (14, 16) dans le repère de la cinématique, l'ami part de x = 140.
// opts.friend = { rows, pal } : un autre dessin pour l'ami (par défaut, l'ami blond de la planche).
const friendCache = new Map();
function drawCine(c, e, opts = {}) {
  const W = opts.width || 128, H = opts.height || 72, ground = opts.ground !== false;
  const base = opts.friend ? opts.friend.rows : makeHero({ child: true, hair: .35, outfit: "tunique", pact: false, combat: false }).rows;
  const friendPal = opts.friend ? opts.friend.pal : FRIEND_PAL;
  const key = base.join("|");
  if (!friendCache.has(key)) friendCache.set(key, [base, ...walkFrames(base, 23)]);
  const friendFrames = friendCache.get(key);
  const ph = (a, b) => Math.max(0, Math.min(1, (e - a) / (b - a)));
  const smooth = u => u * u * (3 - 2 * u);
  if (ground) { nightGround(c, W, H); ell(c, 116, 9, 6, 6, "#2a3450"); ell(c, 116, 9, 4, 4, "#e8ecd8"); ell(c, 115, 8, 1, 1, "#c8ccb8"); }
  const wx = 14, wy = 16, rim = [wx + 30, wy + 25], hole = [wx + 18, wy + 21], groundY = 62;
  const crawl = ph(600, 2200), dragRaw = ph(2700, 4300), drag = dragRaw * dragRaw, lift = smooth(ph(4300, 5600)), gone = e >= 5600;
  const well = { spill: (.6 + .4 * crawl) * (1 - smooth(ph(5800, 9500))), crank: Math.PI, swing: gone ? 1.6 * (1 - ph(5600, 10000)) + .3 : .3 };
  drawWell(c, wx, wy, e, well);
  let feet = null, phi = Math.PI, body = null;
  if (dragRaw > 0 && !gone) {
    if (lift === 0) { const x = 140 - drag * 48; feet = [x - 13, groundY - 2]; body = [x, groundY - 4]; }
    else {
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
    if (lift > .5) { c.beginPath(); c.rect(-1000, -1000, 2000 + W, 1000 + wy + 25); c.clip(); }
    c.globalAlpha = 1 - ph(5200, 5600) * .8;
    drawTurned(c, fr, friendPal, body[0], body[1], phi);
    c.restore();
    const fx = Math.round(feet[0]), fy = Math.round(feet[1]);
    if (!(lift > .5 && fy > wy + 22)) { c.fillStyle = N.hair; [[0,-2],[1,-1],[2,0],[1,1],[0,2],[-1,1],[-1,-1],[0,0]].forEach(([a, b]) => c.fillRect(fx + a, fy + b, 1, 1)); c.fillStyle = N.hairl; c.fillRect(fx + 1, fy - 1, 1, 1); }
    if (lift > .5) drawWellFront(c, wx, wy, e, well);
  }
  if (ground) { const fade = Math.max(1 - ph(0, 600), ph(10200, 11000)); if (fade > 0) { c.globalAlpha = fade; c.fillStyle = "#000"; c.fillRect(0, 0, W, H); c.globalAlpha = 1; } }
}

export {
  PAL, CHILD_PAL, FRIEND_PAL, T, N, VARIANTS,
  ADULT, CHILD, autoshade, build, set, stepLegs, bobUpper, walkFrames, drawSprite, mix, hash,
  VIEWS, DIRS, dirFrames, idleRows, flipRows, makeHero, heroPalette, drawHero,
  px, grassTile, tallGrass, flower, treeSprite, cottage, sandPath,
  nightGround, ell, drawWell, drawWellFront, firefly,
  CINE_LEN, CINE_TEXT, drawCine,
  HORROR_W, HORROR_H, renderHorror, talkPortrait,
};
