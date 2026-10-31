// ---------- Monde : le format commun de toutes les cartes du jeu ----------
// Une carte = rpg/data/maps/<id>.json, la liste des cartes = rpg/data/maps/index.json (voir README).
// Unité partout : la tuile de 16 px, fractions permises (au pixel, 1/16 de tuile).
// Ce fichier ne touche pas au DOM : les scripts node (export, collisions) le chargent aussi.
const TILE = 16;
const MAPS = {};                                   // id -> carte, rempli au chargement
const MOMENTS = ["aube", "matin", "fin de matinée", "midi", "après-midi", "fin d'après-midi", "soir", "veillée", "nuit"];
const DIRS8 = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

// ---- conditions : when = { day?: n | [n], moment?: m | [m], night?: bool, if?: "drapeau && !autre" } ----
// ctx = { day, moment, night, flags } ; une clé absente du contexte ne filtre pas (la carte de travail montre tout).
function flagsOk(expr, flags) {
  return expr.split("||").some(part => part.split("&&").every(term => { const s = term.trim(), neg = s.startsWith("!"), k = neg ? s.slice(1).trim() : s;
    return !!flags[k] !== neg; }));
}
function whenOk(when, ctx = {}) {
  if (!when) return true;
  if (when.night !== undefined && ctx.night !== undefined && !!when.night !== !!ctx.night) return false;
  if (when.day !== undefined && ctx.day && ![].concat(when.day).includes(ctx.day)) return false;
  if (when.moment !== undefined && ctx.moment && ![].concat(when.moment).includes(ctx.moment)) return false;
  if (when.if && ctx.flags && !flagsOk(when.if, ctx.flags)) return false;
  return true;
}
// variants : [{ when, ...champs }] ; chaque variante qui s'applique remplace ces champs de l'objet.
// Une variante est plus stricte que when : il faut que le contexte donne le jour, le moment et les drapeaux qu'elle demande.
function whenExact(when, ctx = {}) {
  if (!when) return true;
  if (when.day !== undefined && !ctx.day) return false;
  if (when.moment !== undefined && !ctx.moment) return false;
  if (when.if && !ctx.flags) return false;
  if (when.night !== undefined && ctx.night === undefined) return false;
  return whenOk(when, ctx);
}
function resolveObj(o, ctx) {
  if (!o.variants) return o;
  return o.variants.reduce((acc, v) => { if (!whenExact(v.when, ctx)) return acc; const { when, ...rest } = v; return { ...acc, ...rest }; }, o);
}
function visibleObjects(map, ctx, opts = {}) {
  return map.objects.filter(o => whenOk(o.when, ctx)).map(o => resolveObj(o, ctx)).filter(o => !o.hidden || opts.showHidden || (opts.state && opts.state[o.id] && opts.state[o.id].shown));
}

// ---- décor extérieur : taille par défaut (px), emprise solide (px, dans la boîte) ----
// x, y, w, h d'un objet = sa boîte de dessin, en tuiles. resize : "ratio" (garde la forme), "free", ou rien (taille fixe).
const cx_ = (x, w) => x + w / 2;
const XTYPES = {
  arbre:        { label: "Arbre", size: [40, 48], resize: "ratio", foot: (x, y, w, h) => [cx_(x, w) - 4, y + h - 5, 8, 5] },
  petit_arbre:  { label: "Petit arbre", size: [28, 34], resize: "ratio", foot: (x, y, w, h) => [cx_(x, w) - 3, y + h - 4, 6, 4] },
  chene:        { label: "Grand chêne", size: [76, 92], resize: "ratio", foot: (x, y, w, h) => [cx_(x, w) - 9, y + h - 8, 18, 8] },
  buisson:      { label: "Buisson", size: [22, 20], resize: "ratio", foot: (x, y, w, h) => [x + 3, y + h - 8, w - 6, 8] },
  rocher:       { label: "Rocher", size: [12, 9], resize: "free", foot: (x, y, w, h) => [x, y, w, h] },
  caillou:      { label: "Caillou", size: [6, 4], resize: "free" },
  fleurs:       { label: "Fleurs", size: [12, 12] },
  champignons:  { label: "Champignons", size: [10, 6] },
  souche:       { label: "Souche", size: [16, 11], foot: (x, y, w, h) => [x + 2, y + 2, 12, 9] },
  tonneau:      { label: "Tonneau", size: [12, 19], foot: (x, y, w, h) => [x, y + 8, 12, 11] },
  caisse:       { label: "Caisse", size: [12, 11], foot: (x, y, w, h) => [x, y + 3, w, h - 3] },
  banc:         { label: "Banc", size: [28, 11], foot: (x, y, w, h) => [x, y + 3, w, h - 3] },
  cloture:      { label: "Clôture", size: [24, 10], foot: (x, y, w, h) => [x, y + 4, w, 6] },
  panneau:      { label: "Panneau", size: [16, 18], foot: (x, y, w, h) => [x + 5, y + 12, 6, 6] },
  maison:       { label: "Maison", size: [74, 74], foot: (x, y, w, h) => [x + 4, y + 46, 64, 28], door: [28, 50, 16, 24], windows: [[10, 48], [50, 48]] },
  grange:       { label: "Grange", size: [66, 62], foot: (x, y, w, h) => [x + 3, y + 30, 60, 32], door: [19, 35, 26, 27], windows: [] },
  moulin:       { label: "Moulin", size: [62, 64], foot: (x, y, w, h) => [x + 3, y + 30, 58, 34], door: [23, 41, 12, 23], windows: [[9, 30], [41, 28]] },
  roue:         { label: "Roue du moulin", size: [30, 30] },
  lavoir:       { label: "Lavoir", size: [58, 42], foot: (x, y, w, h) => [x + 3, y + 22, 52, 20] },
  puits:        { label: "Puits", size: [44, 56], foot: (x, y, w, h) => [x + 5, y + 32, 34, 20] },
  pont:         { label: "Pont", size: [30, 20], bridge: true },
  fontaine:     { label: "Fontaine", size: [34, 30], foot: (x, y, w, h) => [x + 2, y + 12, 30, 16] },
  table_nappe:  { label: "Table à longue nappe", size: [32, 20], foot: (x, y, w, h) => [x, y + 6, w, h - 6] },
  rouet:        { label: "Rouet", size: [18, 20], foot: (x, y, w, h) => [x + 2, y + 12, 14, 8] },
  corde_linge:  { label: "Corde à linge", size: [44, 22] },
  traces_mur:   { label: "Traces de pas (mur)", size: [8, 14] },
  tresse_paille:{ label: "Tresse de paille", size: [10, 6] },
  tombe:        { label: "Tombe", size: [12, 16], foot: (x, y, w, h) => [x + 1, y + 8, 10, 8] },
  croix:        { label: "Croix", size: [12, 20], foot: (x, y, w, h) => [x + 3, y + 14, 6, 6] },
  muret:        { label: "Muret", size: [32, 12], resize: "free", foot: (x, y, w, h) => [x, y + 2, w, h - 2] },
  portail:      { label: "Portail", size: [28, 22] },
  fosse:        { label: "Fosse", size: [20, 14], foot: (x, y, w, h) => [x, y, w, h] },
  trainee:      { label: "Traînée de cheveux", size: [48, 32], resize: "free" },
  balle:        { label: "Balle", size: [6, 6] },
  lanterne:     { label: "Lanterne", size: [6, 8] },
};

// ---- rivière : distance d'un point (px) à la ligne brisée, et abscisse le long du courant ----
function segDist(px_, py_, ax, ay, bx, by) { const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1;
  const k = Math.max(0, Math.min(1, ((px_ - ax) * dx + (py_ - ay) * dy) / L)); return [Math.hypot(px_ - ax - k * dx, py_ - ay - k * dy), k, Math.sqrt(L)]; }
function riverAtPx(river, x, y) {
  let best = 1e9, s = 0, acc = 0; const P = river.points;
  for (let i = 0; i < P.length - 1; i++) { const [d, k, L] = segDist(x, y, P[i][0] * TILE, P[i][1] * TILE, P[i + 1][0] * TILE, P[i + 1][1] * TILE);
    if (d < best) { best = d; s = acc + k * L; } acc += L; }
  return [best, s];
}
const riverHalfPx = (river, s) => river.half * TILE + (river.wobble || 0) * TILE * Math.sin(s / 37);
const inRect = (r, x, y) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;

// ---- emprises en px (pour le jeu : collisions ; pour l'éditeur : sélection) ----
function objBoxPx(o) { return [o.x * TILE, o.y * TILE, o.w * TILE, o.h * TILE]; }
function objFootPx(map, o) {
  const b = objBoxPx(o);
  if (map.kind === "piece") return b;
  const ty = XTYPES[o.type]; if (o.foot) return [b[0] + o.foot[0] * TILE, b[1] + o.foot[1] * TILE, o.foot[2] * TILE, o.foot[3] * TILE];
  return ty && ty.foot ? ty.foot(...b) : null;
}

// ---- grille de collision : une chaîne par rangée, 1 = bloqué ----
// pièce : les deux rangées du mur du fond ; partout : les meubles et bâtiments solides (tuile couverte à plus de moitié) ;
// extérieur : l'eau, sauf les hauts-fonds (terrain.shallows) et sous un pont. Les sorties restent toujours ouvertes.
// Les objets qui ont un when ne comptent pas : le jeu les gère selon le moment.
function mapCollision(map) {
  const g = Array.from({ length: Math.ceil(map.h) }, (_, y) => Array.from({ length: Math.ceil(map.w) }, () => map.kind === "piece" && y < 2));
  const block = ([fx, fy, fw, fh]) => { let x0 = Math.round(fx / TILE), x1 = Math.round((fx + fw) / TILE), y0 = Math.round(fy / TILE), y1 = Math.round((fy + fh) / TILE);
    if (x1 <= x0) { x0 = Math.floor((fx + fw / 2) / TILE); x1 = x0 + 1; } if (y1 <= y0) { y0 = Math.floor((fy + fh / 2) / TILE); y1 = y0 + 1; }
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (g[y] && x >= 0 && x < g[y].length) g[y][x] = true; };
  map.objects.filter(o => o.solid && !o.when && !o.on).forEach(o => { const f = objFootPx(map, o); if (f) block(f); });
  const ter = map.terrain || {};
  if (ter.river) { const bridges = map.objects.filter(o => XTYPES[o.type] && XTYPES[o.type].bridge);
    for (let y = 0; y < g.length; y++) for (let x = 0; x < g[y].length; x++) { const X = (x + .5) * TILE, Y = (y + .5) * TILE, [d, s] = riverAtPx(ter.river, X, Y);
      if (d >= riverHalfPx(ter.river, s) + 2) continue;
      if ((ter.shallows || []).some(r => inRect(r, x + .5, y + .5)) || bridges.some(b => inRect(b, x + .5, y + .5))) continue;
      g[y][x] = true; } }
  (map.exits || []).forEach(e => { for (let y = Math.floor(e.y); y < Math.ceil(e.y + (e.h || 1)); y++) for (let x = Math.floor(e.x); x < Math.ceil(e.x + e.w); x++) if (g[y] && x < g[y].length) g[y][x] = false; });
  return g.map(r => r.map(b => b ? 1 : 0).join(""));
}

// ---- une carte vide, prête à remplir dans l'éditeur ----
function blankMap(id, name, kind, w, h, chapter) {
  const m = { id, name, chapter: chapter || "", kind, tile: TILE, w, h, objects: [], exits: [], spawns: {}, zones: {}, npcs: [], scenes: [] };
  if (kind === "piece") { m.floor = "bois"; m.wall = "platre"; m.spawns.entree = { x: w / 2, y: h - 1.2, dir: "N" }; }
  else m.terrain = { paths: [], plazas: [], fields: [], shallows: [] };
  return m;
}
// ce qu'on écrit dans le fichier : la carte, plus sa grille de collision recalculée
function mapForExport(map) { const m = JSON.parse(JSON.stringify(map)); Object.keys(m).filter(k => k.startsWith("_")).forEach(k => delete m[k]); m.collision = mapCollision(m); return m; }

if (typeof module !== "undefined") module.exports = { TILE, MAPS, MOMENTS, DIRS8, XTYPES, whenOk, whenExact, resolveObj, visibleObjects, mapCollision, mapForExport, blankMap, riverAtPx, riverHalfPx, objFootPx };
