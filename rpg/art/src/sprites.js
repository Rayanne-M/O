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
