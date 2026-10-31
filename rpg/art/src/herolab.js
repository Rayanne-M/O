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
const labState = { pact: false, combat: false, child: false, hair: .15, bless: 0, curse: 0, outfit: "tunique", faith: "divin", renown: .6, regard: .6 };
let labHero = null;
function rebuildLab() {
  const h = makeHero(labState), bb = h.back && [".".repeat(24), ...h.back.slice(0, -1)];
  labHero = { idle: [h.rows, bobUpper(h.rows, h.cut)], walk: walkFrames(h.rows, h.cut), back: h.back, backBob: bb, len: h.len };
}
function renderLab(t) {
  if (!labHero) rebuildLab();
  const c = ctxOf("lab"); c.clearRect(0, 0, 96, 60);
  c.fillStyle = "#86d69a"; c.fillRect(0, 0, 96, 60);
  [[5,7],[29,3],[50,9],[13,44],[82,30],[44,52],[70,6],[90,50]].forEach(([x, y]) => { c.fillStyle = "#a8e8b4"; c.fillRect(x, y, 1, 1); c.fillStyle = "#6cbf84"; c.fillRect(x + 1, y, 1, 1); });
  const h = labHero.idle[0].length, y0 = 58 - h - 3;
  const i2 = Math.floor(t / 500) % 2, w4 = Math.floor(t / 130) % 4;
  const heroes = [[14, labHero.idle[i2], i2 ? labHero.backBob : labHero.back], [58, labHero.walk[w4], w4 % 2 ? labHero.backBob : labHero.back]];
  heroes.forEach(([x, fr]) => { c.globalAlpha = .22; c.fillStyle = "#1a3a2a"; c.fillRect(x + 3, y0 + h - 2, 18, 3); c.globalAlpha = 1; drawAura(c, labState, x, y0, t, "back", h); });
  heroes.forEach(([x, fr, bk]) => { drawHero(c, labState, fr, x, y0, t, bk, labHero.len); drawAura(c, labState, x, y0, t, "front", h); });
}
function bindLab() {
  const out = (id, txt) => { document.getElementById(id).textContent = txt; };
  const upd = () => {
    const days = +document.getElementById("hair").value;
    labState.hair = days / 365; labState.bless = +document.getElementById("bless").value / 100; labState.curse = +document.getElementById("curse").value / 100;
    labState.outfit = document.querySelector('input[name="outfit"]:checked').value; labState.child = document.getElementById("age").value === "child";
    labState.pact = document.getElementById("pact").checked; labState.combat = document.getElementById("combat").checked;
    const L = Math.round(labState.hair * (labState.child ? 9 : 14));
    out("pact-v", !labState.pact ? "" : L === 0 ? "le pacte dort" : L < 5 ? "faible" : L < 10 ? "forte" : "maximale");
    labState.faith = document.getElementById("faith").value; labState.renown = +document.getElementById("renown").value / 100; labState.regard = +document.getElementById("regard").value / 100;
    const rg = labState.regard; out("renown-v", Math.round(labState.renown * 100)); out("regard-v", rg < -.6 ? "terrifie" : rg < -.15 ? "inquiète" : rg <= .15 ? "partagé" : rg <= .6 ? "respecté" : "adoré");
    out("hair-v", days === 0 ? "le jour même" : days < 60 ? days + " jours" : Math.round(days / 30) + " mois");
    out("bless-v", Math.round(labState.bless * 100)); out("curse-v", Math.round(labState.curse * 100));
    rebuildLab();
  };
  document.querySelectorAll(".lab-controls input, .lab-controls select").forEach(el => el.addEventListener("input", upd));
  document.getElementById("barber").addEventListener("click", () => { document.getElementById("hair").value = 0; upd(); });
  upd();
}
