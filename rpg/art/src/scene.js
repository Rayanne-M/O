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
function cottageOld(ctx, x, y) {
  // mur
  px(ctx, T.fo, x + 3, y + 22, 42, 24); px(ctx, T.wa, x + 4, y + 23, 40, 22);
  px(ctx, T.wad, x + 4, y + 40, 40, 5);
  [4, 22, 43].forEach(bx => px(ctx, T.wd, x + bx, y + 23, 1, 22));
  // porte et fenêtres
  px(ctx, T.wdd, x + 18, y + 30, 12, 16); px(ctx, T.wd, x + 19, y + 31, 10, 15); px(ctx, T.wdd, x + 23, y + 31, 1, 15); px(ctx, T.fy, x + 26, y + 38);
  [[7, 28], [33, 28]].forEach(([wx, wy]) => { px(ctx, T.wdd, x + wx, y + wy, 9, 8); px(ctx, T.win, x + wx + 1, y + wy + 1, 7, 6); px(ctx, "#bfe0f4", x + wx + 1, y + wy + 1, 3, 2); px(ctx, T.wdd, x + wx + 4, y + wy + 1, 1, 6); });
  // toit
  for (let r = 0; r < 24; r++) {
    const inset = Math.max(0, 10 - Math.floor(r / 2)), w = 48 - inset * 2;
    const col = r === 23 ? T.rfd : (r % 4 === 3 ? T.rfd : (r < 4 ? T.rfl : T.rf));
    px(ctx, T.fo, x + inset - 1, y + r, w + 2, 1); px(ctx, col, x + inset, y + r, w, 1);
    for (let k = inset + (r % 8 < 4 ? 0 : 3); k < 48 - inset; k += 6) if (r % 4 !== 3) px(ctx, T.rfd, x + k, y + r);
  }
  px(ctx, T.fo, x + 33, y - 6, 7, 10); px(ctx, "#9a8a80", x + 34, y - 5, 5, 9); px(ctx, "#bcae9e", x + 34, y - 5, 2, 9);
}
function sandPath(ctx, x, y, w, h) {
  px(ctx, T.sab, x - 2, y, w + 4, h); px(ctx, T.sa, x, y, w, h);
  for (let j = 0; j < h; j += 4) for (let i = (j % 8 ? 2 : 6); i < w; i += 8) px(ctx, T.sad, x + i, y + j + 1);
  for (let j = 0; j < h; j += 3) { px(ctx, T.g, x - 2, y + j, 1, 1); px(ctx, T.g, x + w + 1, y + j + 1, 1, 1); }
}

function drawScene(ctx, t, sprites) {
  const W = 384, H = 216;
  for (let y = 0; y < H; y += 16) for (let x = 0; x < W; x += 16) grassTile(ctx, x, y);
  sandPath(ctx, 196, 74, 32, 142);
  sandPath(ctx, 228, 150, 156, 24);
  for (let y = 152; y < 216; y += 16) for (let x = 72; x < 168; x += 16) tallGrass(ctx, x, y);
  [[96,70,T.fw],[108,78,T.fp],[120,66,T.fw],[146,76,T.fp],[158,64,T.fw],[100,122,T.fp],[160,118,T.fw],[262,90,T.fp],[274,98,T.fw],[288,86,T.fw],[300,104,T.fp],[250,120,T.fw]].forEach(([x,y,c]) => flower(ctx, x, y, c));
  const items = [];
  const tree = treeSprite();
  const trees = [[-20,-30],[18,-14],[-20,16],[20,40],[-20,62],[20,96],[-20,110],[20,150],[-20,158],[300,-30],[344,-6],[330,70],[276,150],[346,166],[150,170]];
  trees.forEach(([x, y]) => items.push({ y: y + 62, fn: () => ctx.drawImage(tree, x, y) }));
  items.push({ y: 74, fn: () => cottage(ctx, 176, 10) });
  // héros adulte qui marche sur le chemin
  const hy = 72 + Math.floor((t / 45) % 150), f = Math.floor(t / 130) % 4;
  items.push({ y: hy + 34, fn: () => { ctx.globalAlpha = .22; px(ctx, "#1a3a2a", 203, hy + 32, 18, 3); ctx.globalAlpha = 1; drawSprite(ctx, sprites.walk[f], PAL, 200, hy); } });
  // l'enfant qu'on était, près des fleurs
  const cf = Math.floor(t / 600) % 2;
  items.push({ y: 108, fn: () => { ctx.globalAlpha = .22; px(ctx, "#1a3a2a", 131, 106, 16, 3); ctx.globalAlpha = 1; drawSprite(ctx, cf ? sprites.childBob : sprites.child, CHILD_PAL, 128, 82); } });
  items.sort((a, b) => a.y - b.y).forEach(i => i.fn());
}
