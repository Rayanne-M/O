// ---------- Éditeur de cartes : n'importe quelle carte, extérieur ou pièce ----------
// Calques : objets, lieux (zones), sorties, points d'arrivée, habitants. Tout est en tuiles, au pixel près (1/16).
// Sauvegarde dans la base de la page (collection maps, un document par carte : { map }), export au format de rpg/data/maps.

// ---- meubles qu'on peut ajouter dans une pièce : nom, taille par défaut en tuiles, solide ----
const FTYPES = {
  table: ["Table", 3, 2, true], chaise: ["Chaise", 1, 1, true], lit: ["Lit", 2, 3, true], chevet: ["Table de chevet", 1, 1, true], bougie: ["Bougie", 1, 1, false],
  coffre: ["Coffre", 2, 1, true], tapis: ["Tapis", 3, 2, false], tonneau: ["Tonneau", 1, 1, true], plante: ["Plante", 1, 1, true], marmite: ["Marmite", 1, 1, true],
  fauteuil: ["Fauteuil", 2, 2, true], banc: ["Banc", 3, 1, true], etagere: ["Étagère (mur)", 2, 2, false], fenetre: ["Fenêtre (mur)", 2, 2, false], porte: ["Porte (mur)", 1, 2, false],
  cheminee: ["Cheminée (mur)", 3, 3, true], poele: ["Poêle (mur)", 2, 2, true], foin: ["Botte de foin", 2, 2, true], seau: ["Seau", 1, 1, true], panier: ["Panier", 1, 1, true], sacs: ["Sacs de farine", 2, 2, true],
  comptoir: ["Comptoir", 3, 1, true], miroir: ["Miroir (mur)", 2, 2, false], bol: ["Bol", 1, 1, false], ciseaux: ["Ciseaux", 1, 1, false], couteau: ["Couteau", 1, 1, false],
  epee_bois: ["Épée en bois", 1, 1, false], ruban: ["Ruban", 1, 1, false], outils: ["Outils (mur)", 2, 2, false], echelle: ["Échelle (mur)", 1, 3, false], trappe: ["Trappe", 1, 1, false],
  charrette: ["Charrette", 3, 2, true], sabot_mur: ["Vieux sabot (mur)", 1, 1, false], fourche: ["Fourche (mur)", 1, 2, false], oeuf: ["Œuf", 1, 1, false],
  rouet: ["Rouet", 1, 2, true], herbes_sechees: ["Herbes séchées (plafond)", 4, 1, false], pot_miel: ["Pot de miel", 1, 1, false], cahier: ["Cahier", 1, 1, false],
  rideau: ["Rideau (mur)", 1, 2, false], cage_canari: ["Canari en cage", 1, 2, true], portrait: ["Portrait du prince (mur)", 2, 2, false], image_pieuse: ["Image pieuse (mur)", 1, 1, false],
  flacons: ["Flacons", 1, 1, false], rasoirs: ["Rasoirs", 1, 1, false], serviettes: ["Serviettes", 1, 1, false], pierre_affuter: ["Pierre à affûter", 1, 1, false],
  balai: ["Balai (mur)", 1, 2, false], tresse_ail: ["Tresse d'ail (mur)", 1, 2, false], bouteilles: ["Bouteilles", 1, 1, false], tresse_paille: ["Tresse de paille (mur)", 1, 1, false],
  dessins: ["Dessins au charbon (mur)", 2, 2, false], sabots: ["Sabots", 1, 1, false], seau_cendres: ["Seau à cendres", 1, 1, true], petit_miroir: ["Petit miroir (mur)", 1, 1, false],
  dessin_femme: ["Dessin (mur)", 1, 1, false], client: ["Client endormi", 2, 2, true], table_nappe: ["Table à longue nappe", 3, 2, true], fauteuil_barbier: ["Fauteuil de barbier", 2, 2, true],
  meule: ["Meule", 4, 3, true], engrenage: ["Engrenage (mur)", 2, 2, false], nichoirs: ["Nichoirs (mur)", 4, 2, true], cheveux_sol: ["Mèches au sol", 2, 1, false], poutre: ["Poutre (au-dessus)", 6, 1, false],
};
const NPC_IDS = ["hero", "mere", "margot", "basile", "elio", "aubin", "fauvel", "ysol", "mere_basile", "client", "enfant_a", "enfant_b", "enfant_c", "villageois", "poule", "poule_rousse", "poule_blanche", "chat", "chat_dort"];
const LAYERS = [["obj", "Objets"], ["zone", "Lieux"], ["exit", "Sorties"], ["spawn", "Arrivées"], ["npc", "Habitants"], ["map", "La carte"]];

// ---- état ----
const ED = { on: false, layer: "obj", sel: null, drag: null, dirty: new Set(), db: null, dl: null, msg: "" };
let MAP_DEFAULTS = {};
function edMark(id = VIEW.id) { ED.dirty.add(id); const m = MAPS[id]; if (m) m.collision = mapCollision(m); edStatus(); }
function edStatus(text) { if (text !== undefined) ED.msg = text; const el = $("ed-status"); if (!el) return;
  const n = ED.dirty.size; el.textContent = ED.msg || (n ? `${n} carte${n > 1 ? "s" : ""} modifiée${n > 1 ? "s" : ""}, pas encore sauvegardée${n > 1 ? "s" : ""}` : "Tout est sauvegardé");
  $("ed-save").disabled = !ED.db || !n; }

// ---- chargement et sauvegarde ----
async function edLoad() {
  MAP_DEFAULTS = JSON.parse(JSON.stringify(MAPS));
  const cl = window.claude; ED.db = cl ? await cl.use("db") : null; ED.dl = cl ? await cl.use("downloads") : null;
  $("ed-export").hidden = !ED.dl;
  if (!ED.db) { edStatus("La sauvegarde n'est pas disponible ici. Tes changements restent le temps de la visite."); return; }
  const timer = setTimeout(() => edStatus("La sauvegarde ne répond pas encore. Réessaie dans un instant."), 10000);
  try {
    const snap = await ED.db.collection("maps").get(); clearTimeout(timer); let added = false;
    snap.docs.forEach(d => { const v = d.data(); if (!v || !v.map || !v.map.id) return; if (!MAPS[v.map.id]) added = true; MAPS[v.map.id] = v.map; v.map.collision = mapCollision(v.map); });
    if (added) fillMapPicker(); openMap(VIEW.id, { back: true }); edStatus("");
  } catch (e) { clearTimeout(timer); edStatus("Impossible de lire la sauvegarde pour l'instant."); }
}
async function edSave() {
  if (!ED.db || !ED.dirty.size) return;
  const btn = $("ed-save"); btn.disabled = true; edStatus("Sauvegarde…");
  try {
    for (const id of [...ED.dirty]) { const m = JSON.parse(JSON.stringify(MAPS[id])); delete m.collision;
      await ED.db.doc("maps/" + id).set({ map: m, saved_at: new Date().toISOString() }); ED.dirty.delete(id); }
    edStatus("Sauvegardé");
  } catch (e) { edStatus(e && e.code === "quota_exceeded" ? "La sauvegarde est pleine." : "La sauvegarde a échoué. Réessaie."); btn.disabled = false; }
}
async function edExport() {
  const index = { ...WORLD_INDEX, maps: Object.fromEntries(Object.values(MAPS).map(m => [m.id, { name: m.name, chapter: m.chapter, kind: m.kind, file: m.id + ".json" }])) };
  const data = JSON.stringify({ index, maps: Object.fromEntries(Object.values(MAPS).map(m => [m.id, mapForExport(m)])) }, null, 1);
  try { await ED.dl.save({ filename: "cartes-du-jeu.json", data }); } catch (e) { if (e && e.code !== "declined") edStatus("L'export n'a pas pu se faire ici."); }
}
function edReset() {
  const id = VIEW.id; if (!MAP_DEFAULTS[id]) { edStatus("Cette carte est nouvelle : il n'y a pas de version d'origine."); return; }
  MAPS[id] = JSON.parse(JSON.stringify(MAP_DEFAULTS[id])); ED.sel = null; edMark(id); openMap(id, { back: true });
}

// ---- sélection ----
const r16 = v => Math.round(v * TILE) / TILE;
function edGet(sel = ED.sel) { const m = curMap(); if (!sel || !m) return null;
  if (sel.kind === "obj") return m.objects.find(o => o.id === sel.id); if (sel.kind === "zone") return m.zones[sel.id]; if (sel.kind === "exit") return m.exits.find(e => e.id === sel.id);
  if (sel.kind === "spawn") return m.spawns[sel.id]; if (sel.kind === "npc") return m.npcs[+sel.id]; return null; }
function edHit(x, y) {
  const m = curMap(), X = x / TILE, Y = y / TILE, L = ED.layer, inR = (r, pad = 0) => X >= r.x - pad && X < r.x + r.w + pad && Y >= r.y - pad && Y < r.y + (r.h || 1) + pad;
  if (L === "obj") { const hits = m.objects.filter(o => inR(o));
    hits.sort((a, b) => (b.on ? 1 : 0) - (a.on ? 1 : 0) || (m.kind === "piece" ? a.w * a.h - b.w * b.h : (b.y + b.h) - (a.y + a.h))); return hits[0] ? { kind: "obj", id: hits[0].id } : null; }
  if (L === "zone") { const z = Object.entries(m.zones).filter(([, z]) => inR(z)).sort((a, b) => a[1].w * a[1].h - b[1].w * b[1].h)[0]; return z ? { kind: "zone", id: z[0] } : null; }
  if (L === "exit") { const e = m.exits.find(e => inR(e)); return e ? { kind: "exit", id: e.id } : null; }
  if (L === "spawn") { const s = Object.entries(m.spawns).find(([, s]) => Math.hypot(s.x - X, s.y - Y) < .5); return s ? { kind: "spawn", id: s[0] } : null; }
  if (L === "npc") { const i = m.npcs.findIndex(n => X > n.x - .6 && X < n.x + .6 && Y > n.y - 1.9 && Y < n.y + .2); return i >= 0 ? { kind: "npc", id: String(i) } : null; }
  return null;
}
function edMove(it, kind, nx, ny) {
  const m = curMap(); nx = r16(nx); ny = r16(ny);
  if (kind === "obj" && m.kind === "piece") { nx = Math.max(0, Math.min(m.w - it.w, nx)); ny = Math.max(0, Math.min(m.h - it.h, ny)); }
  if (nx === it.x && ny === it.y) return false; const dx = nx - it.x, dy = ny - it.y; it.x = nx; it.y = ny;
  if (kind === "obj") { if (it.light) it.light = [r16(it.light[0] + dx), r16(it.light[1] + dy), it.light[2]];
    m.objects.filter(q => q.on === it.id).forEach(q => { q.x = r16(q.x + dx); q.y = r16(q.y + dy); if (q.light) q.light = [r16(q.light[0] + dx), r16(q.light[1] + dy), q.light[2]]; }); }
  return true;
}
function edNudge(dx, dy) { const it = edGet(); if (!it) return; if (edMove(it, ED.sel.kind, it.x + dx / TILE, it.y + dy / TILE)) edMark(); }
function edTurn(o, how) {
  if (how === "flip") o.flip = !o.flip;
  else { o.rot = ((o.rot || 0) + (how === "rot-" ? 270 : 90)) % 360; const m = curMap();
    if (m.kind === "piece" || !XTYPES[o.type]) { const cx = o.x + o.w / 2, cy = o.y + o.h / 2; [o.w, o.h] = [o.h, o.w]; o.x = r16(cx - o.w / 2); o.y = r16(cy - o.h / 2); } }
  if (!o.rot) delete o.rot; if (!o.flip) delete o.flip; edMark();
}
const uid = (base, taken) => { let k = base, i = 2; while (taken(k)) k = base + "_" + i++; return k; };

// ---- ajouter ----
function edAdd(type) {
  const m = curMap(), [cx, cy] = viewCenterTiles(), taken = k => m.objects.some(o => o.id === k);
  let o;
  if (m.kind === "piece") { const [, w, h, solid] = FTYPES[type], wall = WALL_TYPES.has(type); o = { id: uid(type, taken), type, x: Math.max(0, Math.floor((m.w - w) / 2)), y: wall ? 0 : Math.max(2, Math.floor((m.h - h) / 2)), w, h, solid }; }
  else { const ty = XTYPES[type], [w, h] = ty.size.map(v => v / TILE); o = { id: uid(type, taken), type, x: r16(cx - w / 2), y: r16(cy - h / 2), w, h, solid: !!ty.foot };
    if (["arbre", "petit_arbre", "chene", "buisson", "fleurs"].includes(type)) o.seed = Math.floor(Math.random() * 900) + 50; if (type === "rocher") o.moss = true; }
  m.objects.push(o); ED.layer = "obj"; ED.sel = { kind: "obj", id: o.id }; edMark(); edPanel();
}
function edAddOther(kind) {
  const m = curMap(), [cx, cy] = viewCenterTiles();
  if (kind === "zone") { const id = uid("lieu", k => m.zones[k]); m.zones[id] = { x: r16(cx - 1), y: r16(cy - 1), w: 2, h: 2, name: "Nouveau lieu" }; ED.sel = { kind, id }; }
  if (kind === "exit") { const id = uid("sortie", k => m.exits.some(e => e.id === k)), to = Object.keys(MAPS).find(k => k !== m.id); m.exits.push({ id, x: r16(cx - .5), y: r16(cy - .5), w: 1, h: 1, to, at: Object.keys(MAPS[to].spawns)[0] || "", label: "Vers " + MAPS[to].name }); ED.sel = { kind, id }; }
  if (kind === "spawn") { const id = uid("arrivee", k => m.spawns[k]); m.spawns[id] = { x: r16(cx), y: r16(cy), dir: "S" }; ED.sel = { kind, id }; }
  if (kind === "npc") { m.npcs.push({ id: "villageois", x: r16(cx), y: r16(cy) }); ED.sel = { kind, id: String(m.npcs.length - 1) }; }
  edMark(); edPanel();
}

// ---- panneau latéral ----
const WHEN_UI = it => { const w = it.when || {}, days = [].concat(w.day || []);
  return `<fieldset class="ed-when"><legend>Visible</legend><div class="ed-row">${[1, 2, 3, 4].map(d => `<label class="ed-check"><input type="checkbox" data-wday="${d}" ${days.includes(d) ? "checked" : ""}> J${d}</label>`).join("")}</div>
    <div class="ed-row"><select id="ed-wnight"><option value="">Jour et nuit</option><option value="jour" ${w.night === false ? "selected" : ""}>Le jour seulement</option><option value="nuit" ${w.night === true ? "selected" : ""}>La nuit seulement</option></select>
    <select id="ed-wmoment"><option value="">Tous les moments</option>${MOMENTS.map(mo => `<option ${[].concat(w.moment || []).includes(mo) ? "selected" : ""}>${mo}</option>`).join("")}</select></div>
    <p class="ed-hint">Aucun jour coché : tous les jours.${it.variants ? " Cet objet change aussi selon le moment (variantes)." : ""}</p></fieldset>`; };
function bindWhen(it) {
  const read = () => { const w = {}, days = [...document.querySelectorAll("[data-wday]")].filter(c => c.checked).map(c => +c.dataset.wday);
    if (days.length) w.day = days.length === 1 ? days[0] : days; const n = $("ed-wnight").value; if (n) w.night = n === "nuit"; const mo = $("ed-wmoment").value; if (mo) w.moment = mo;
    if (it.when && it.when.if) w.if = it.when.if; if (Object.keys(w).length) it.when = w; else delete it.when; edMark(); };
  document.querySelectorAll("[data-wday], #ed-wnight, #ed-wmoment").forEach(el => el.addEventListener("change", read));
}
function field(id, label, value, ph = "") { return `<label class="ed-field">${label}<input type="text" id="${id}" value="${esc(value)}" placeholder="${esc(ph)}"></label>`; }
function edPanel() {
  const panel = $("ed-panel"); if (!ED.on) { panel.hidden = true; refreshSide(); return; } panel.hidden = false; refreshSide();
  const m = curMap(); $("ed-where").textContent = m.name + (m.kind === "piece" ? " · pièce" : " · extérieur");
  $("ed-layers").innerHTML = LAYERS.map(([k, l]) => `<button type="button" class="small" data-layer="${k}" aria-pressed="${ED.layer === k}">${l}</button>`).join("");
  $("ed-layers").querySelectorAll("[data-layer]").forEach(b => b.addEventListener("click", () => { ED.layer = b.dataset.layer; ED.sel = null; edPanel(); }));
  const pal = $("ed-palette");
  if (ED.layer === "obj") { const types = m.kind === "piece" ? Object.entries(FTYPES).map(([k, v]) => [k, v[0]]) : Object.entries(XTYPES).map(([k, v]) => [k, v.label]);
    pal.hidden = false; pal.innerHTML = types.map(([k, l]) => `<button type="button" class="ed-add" data-add="${k}"><canvas width="28" height="28" data-prev="${k}"></canvas><span>${esc(l)}</span></button>`).join("");
    pal.querySelectorAll("[data-prev]").forEach(cv => edPreview(cv, cv.dataset.prev)); pal.querySelectorAll("[data-add]").forEach(b => b.addEventListener("click", () => edAdd(b.dataset.add))); }
  else if (ED.layer === "map") pal.hidden = true;
  else { pal.hidden = false; const lbl = { zone: "Ajouter un lieu", exit: "Ajouter une sortie", spawn: "Ajouter un point d'arrivée", npc: "Ajouter un habitant" }[ED.layer];
    pal.innerHTML = `<button type="button" class="pal" id="ed-add-other">${lbl}</button>`; $("ed-add-other").addEventListener("click", () => edAddOther(ED.layer)); }
  const props = $("ed-props");
  if (ED.layer === "map") { props.innerHTML = mapProps(m); bindMapProps(m); edStatus(); return; }
  const it = edGet(), k = ED.sel && ED.sel.kind;
  if (!it) { props.innerHTML = `<p class="lieu-desc">${{ obj: "Glisse un objet pour le déplacer, ou touche-le pour le modifier. Les boutons ci-dessus en ajoutent un, au centre de la vue.", zone: "Les lieux sont les zones que le scénario nomme : place, cachettes, rive… Touche-en un pour le modifier.", exit: "Une sortie est une zone qu'on traverse pour changer de carte : une porte, une échelle, une route.", spawn: "Les points d'arrivée sont là où le héros apparaît en entrant (les pieds du personnage).", npc: "Les habitants placés par défaut, avec le moment où ils sont là. En jeu, c'est le scénario qui les déplace." }[ED.layer]}</p>`; edStatus(); return; }
  let html = "";
  if (k === "obj") { const ty = m.kind === "piece" ? { label: (FTYPES[it.type] || [it.type])[0] } : XTYPES[it.type] || { label: it.type };
    html += `<h3>${esc(ty.label)}</h3>` + field("ed-id", "Identifiant", it.id);
    if (m.kind === "piece" || (ty.resize)) html += `<div class="ed-row"><span>Taille</span><button type="button" class="small" data-sz="-">Plus petit</button><button type="button" class="small" data-sz="+">Plus grand</button>${m.kind === "piece" || ty.resize === "free" ? `<button type="button" class="small" data-sz="w-">− large</button><button type="button" class="small" data-sz="w+">+ large</button><button type="button" class="small" data-sz="h-">− haut</button><button type="button" class="small" data-sz="h+">+ haut</button>` : ""}${it.seed !== undefined ? `<button type="button" class="small" data-sz="seed">Autre forme</button>` : ""}</div>`;
    html += `<label class="ed-check"><input type="checkbox" id="ed-solid" ${it.solid ? "checked" : ""}> Bloque le passage</label>
      <label class="ed-check"><input type="checkbox" id="ed-hidden" ${it.hidden ? "checked" : ""}> Caché jusqu'à ce qu'on le trouve</label>
      <label class="ed-check"><input type="checkbox" id="ed-secret" ${it.secret ? "checked" : ""}> Jamais signalé en jeu</label>
      ${field("ed-label", "Nom de l'interaction", it.interact && it.interact.label || "", "Aucune interaction")}
      <label class="ed-field">Ce qui se passe<textarea id="ed-text" rows="3" placeholder="Texte affiché au joueur">${esc(it.interact && it.interact.text || "")}</textarea></label>
      ${field("ed-scene", "Scène du scénario", it.interact && it.interact.scene || "", "ex. s1_oeufs")}` + WHEN_UI(it);
    html += `<div class="ed-row"><span>Orientation</span><button type="button" class="small" data-turn="rot-">⟲ Tourner</button><button type="button" class="small" data-turn="rot+">⟳ Tourner</button><button type="button" class="small" data-turn="flip" aria-pressed="${!!it.flip}">⇋ Miroir</button></div>`; }
  if (k === "zone") html += `<h3>Lieu</h3>${field("ed-id", "Identifiant", ED.sel.id)}${field("ed-name", "Nom", it.name || "")}${field("ed-cachette", "Cachette de", it.cachette || "", "ex. margot")}<div class="ed-row"><span>Taille</span><button type="button" class="small" data-sz="w-">− large</button><button type="button" class="small" data-sz="w+">+ large</button><button type="button" class="small" data-sz="h-">− haut</button><button type="button" class="small" data-sz="h+">+ haut</button></div>`;
  if (k === "exit") { const tm = MAPS[it.to];
    html += `<h3>Sortie</h3>${field("ed-id", "Identifiant", it.id)}${field("ed-name", "Texte du bouton", it.label || "")}
      <label class="ed-field">Mène à<select id="ed-to">${Object.values(MAPS).map(q => `<option value="${q.id}" ${q.id === it.to ? "selected" : ""}>${esc(q.name)}</option>`).join("")}</select></label>
      <label class="ed-field">Point d'arrivée<select id="ed-at">${Object.keys(tm ? tm.spawns : {}).map(s => `<option ${s === it.at ? "selected" : ""}>${esc(s)}</option>`).join("")}</select></label>
      <label class="ed-field">Fermée<select id="ed-locked"><option value="">Jamais</option><option value="nuit" ${it.locked === "nuit" ? "selected" : ""}>La nuit</option><option value="true" ${it.locked === true ? "selected" : ""}>Toujours (à clé)</option></select></label>
      <label class="ed-check"><input type="checkbox" id="ed-secret" ${it.secret ? "checked" : ""}> Jamais signalée en jeu</label>
      <div class="ed-row"><span>Taille</span><button type="button" class="small" data-sz="w-">− large</button><button type="button" class="small" data-sz="w+">+ large</button><button type="button" class="small" data-sz="h-">− haut</button><button type="button" class="small" data-sz="h+">+ haut</button></div>` + WHEN_UI(it); }
  if (k === "spawn") html += `<h3>Point d'arrivée</h3>${field("ed-id", "Identifiant", ED.sel.id)}<label class="ed-field">Regarde vers<select id="ed-dir">${DIRS8.map(d => `<option ${d === it.dir ? "selected" : ""}>${d}</option>`).join("")}</select></label>`;
  if (k === "npc") html += `<h3>Habitant</h3><label class="ed-field">Qui<select id="ed-npc">${NPC_IDS.map(n => `<option ${n === it.id ? "selected" : ""}>${n}</option>`).join("")}</select></label>${field("ed-look", "Apparence (palette)", it.look || "", "ex. elio_capuche")}` + WHEN_UI(it);
  html += `<div class="ed-row"><span>Ajuster</span><button type="button" class="small" data-nudge="-1,0" aria-label="Un pixel à gauche">←</button><button type="button" class="small" data-nudge="1,0" aria-label="Un pixel à droite">→</button><button type="button" class="small" data-nudge="0,-1" aria-label="Un pixel en haut">↑</button><button type="button" class="small" data-nudge="0,1" aria-label="Un pixel en bas">↓</button></div>
    <p class="ed-hint">Au clavier : flèches pour bouger d'un pixel (Maj : une demi-tuile)${k === "obj" ? ", R pour tourner, M pour le miroir" : ""}, Suppr pour enlever.</p>
    <button type="button" class="small danger" id="ed-del">Supprimer</button>`;
  props.innerHTML = html; bindProps(m, it, k); edStatus();
}
function bindProps(m, it, k) {
  const on = (id, ev, fn) => { const el = $(id); if (el) el.addEventListener(ev, fn); };
  props_sizes(m, it, k);
  document.querySelectorAll("[data-turn]").forEach(b => b.addEventListener("click", () => { edTurn(it, b.dataset.turn); edPanel(); }));
  document.querySelectorAll("[data-nudge]").forEach(b => b.addEventListener("click", () => { const [dx, dy] = b.dataset.nudge.split(",").map(Number); edNudge(dx, dy); }));
  if (document.querySelector("[data-wday]")) bindWhen(it);
  on("ed-id", "change", e => { const v = e.target.value.trim().replace(/[^\w-]/g, "_"); if (!v) return;
    if (k === "obj" && !m.objects.some(o => o.id === v)) { m.objects.filter(q => q.on === it.id).forEach(q => q.on = v); it.id = v; ED.sel.id = v; }
    if (k === "exit" && !m.exits.some(o => o.id === v)) { it.id = v; ED.sel.id = v; }
    if ((k === "zone" || k === "spawn") && !(k === "zone" ? m.zones : m.spawns)[v]) { const bag = k === "zone" ? m.zones : m.spawns; bag[v] = it; delete bag[ED.sel.id]; ED.sel.id = v; }
    edMark(); edPanel(); });
  on("ed-solid", "change", e => { it.solid = e.target.checked; edMark(); });
  ["hidden", "secret"].forEach(f => on("ed-" + f, "change", e => { if (e.target.checked) it[f] = true; else delete it[f]; edMark(); }));
  const upd = () => { const l = $("ed-label").value.trim(), t = $("ed-text").value.trim(), s = $("ed-scene").value.trim();
    if (l || t || s) { it.interact = { ...(it.interact || {}), label: l || "Objet", text: t }; if (s) it.interact.scene = s; else delete it.interact.scene; } else delete it.interact; edMark(); };
  ["ed-label", "ed-text", "ed-scene"].forEach(id => on(id, "change", upd));
  on("ed-name", "change", e => { if (k === "zone") it.name = e.target.value; else it.label = e.target.value; edMark(); if (k === "zone") buildPins(); });
  on("ed-cachette", "change", e => { if (e.target.value.trim()) it.cachette = e.target.value.trim(); else delete it.cachette; edMark(); });
  on("ed-to", "change", e => { it.to = e.target.value; it.at = Object.keys(MAPS[it.to].spawns)[0] || ""; edMark(); edPanel(); });
  on("ed-at", "change", e => { it.at = e.target.value; edMark(); });
  on("ed-locked", "change", e => { const v = e.target.value; if (!v) delete it.locked; else it.locked = v === "true" ? true : v; edMark(); });
  on("ed-dir", "change", e => { it.dir = e.target.value; edMark(); });
  on("ed-npc", "change", e => { it.id = e.target.value; edMark(); });
  on("ed-look", "change", e => { if (e.target.value.trim()) it.look = e.target.value.trim(); else delete it.look; edMark(); });
  on("ed-del", "click", () => { if (k === "obj") m.objects = m.objects.filter(q => q !== it && q.on !== it.id); if (k === "zone") delete m.zones[ED.sel.id];
    if (k === "exit") m.exits = m.exits.filter(q => q !== it); if (k === "spawn") delete m.spawns[ED.sel.id]; if (k === "npc") m.npcs.splice(+ED.sel.id, 1);
    ED.sel = null; edMark(); if (k === "zone") buildPins(); edPanel(); });
}
function props_sizes(m, it, k) {
  document.querySelectorAll("[data-sz]").forEach(b => b.addEventListener("click", () => { const s = b.dataset.sz, step = m.kind === "piece" || k !== "obj" ? 1 : .25;
    if (s === "seed") it.seed = Math.floor(Math.random() * 900) + 50;
    else if (s === "+" || s === "-") { const f = s === "+" ? 1.15 : 1 / 1.15; if (m.kind === "piece") { it.w = Math.max(1, it.w + (s === "+" ? 1 : -1)); it.h = Math.max(1, it.h + (s === "+" ? 1 : -1)); }
      else { const cx = it.x + it.w / 2, by = it.y + it.h; it.w = r16(Math.max(.25, it.w * f)); it.h = r16(Math.max(.25, it.h * f)); it.x = r16(cx - it.w / 2); it.y = r16(by - it.h); } }
    else { const dim = s[0], d = s[1] === "+" ? step : -step; it[dim] = r16(Math.max(.25, (it[dim] || 1) + d)); if (m.kind === "piece" && k === "obj") { it.w = Math.min(it.w, m.w - it.x); it.h = Math.min(it.h, m.h - it.y); } }
    edMark(); if (k === "zone") buildPins(); }));
}
// ---- la carte elle-même : nom, chapitre, taille, sol ; et nouvelle carte ----
function mapProps(m) {
  return `<h3>La carte</h3>${field("ed-mname", "Nom", m.name)}${field("ed-mchap", "Chapitre", m.chapter || "", "ex. enfance")}
    <div class="ed-row"><label class="ed-field">Largeur (tuiles)<input type="number" id="ed-mw" min="4" max="200" value="${m.w}"></label><label class="ed-field">Hauteur<input type="number" id="ed-mh" min="4" max="200" value="${m.h}"></label></div>
    ${m.kind === "piece" ? `<div class="ed-row"><label class="ed-field">Sol<select id="ed-floor">${Object.keys(FLOORS).map(f => `<option ${f === m.floor ? "selected" : ""}>${f}</option>`).join("")}</select></label><label class="ed-field">Murs<select id="ed-wall">${Object.keys(WALLS).map(f => `<option ${f === m.wall ? "selected" : ""}>${f}</option>`).join("")}</select></label></div>` : `<p class="ed-hint">Le terrain (rivière, chemins, places, champs) se règle dans le fichier de la carte.</p>`}
    <p class="ed-hint">${m.objects.length} objets, ${Object.keys(m.zones).length} lieux, ${m.exits.length} sorties, ${Object.keys(m.spawns).length} points d'arrivée.</p>
    <h3>Nouvelle carte</h3>${field("ed-nid", "Identifiant", "", "ex. foret_lisiere")}${field("ed-nname", "Nom", "", "ex. La forêt")}
    <div class="ed-row"><select id="ed-nkind"><option value="exterieur">Extérieur</option><option value="piece">Pièce</option></select><input type="number" id="ed-nw" min="4" max="200" value="24" aria-label="Largeur"><input type="number" id="ed-nh" min="4" max="200" value="16" aria-label="Hauteur"></div>
    <button type="button" class="pal" id="ed-new">Créer la carte</button>`;
}
function bindMapProps(m) {
  const on = (id, fn) => { const el = $(id); if (el) el.addEventListener("change", fn); };
  on("ed-mname", e => { m.name = e.target.value; $("map-title").textContent = m.name; fillMapPicker(); edMark(); });
  on("ed-mchap", e => { m.chapter = e.target.value.trim(); fillMapPicker(); edMark(); });
  on("ed-mw", e => { m.w = Math.max(4, +e.target.value || m.w); if (m.terrain) m.terrain = { ...m.terrain }; edMark(); openMap(m.id, { back: true }); });
  on("ed-mh", e => { m.h = Math.max(4, +e.target.value || m.h); if (m.terrain) m.terrain = { ...m.terrain }; edMark(); openMap(m.id, { back: true }); });
  on("ed-floor", e => { m.floor = e.target.value; edMark(); }); on("ed-wall", e => { m.wall = e.target.value; edMark(); });
  $("ed-new").addEventListener("click", () => { const id = $("ed-nid").value.trim().replace(/[^\w-]/g, "_"), name = $("ed-nname").value.trim();
    if (!id || MAPS[id]) { edStatus(id ? "Cet identifiant existe déjà." : "Donne un identifiant à la carte."); return; }
    const nm = blankMap(id, name || id, $("ed-nkind").value, Math.max(4, +$("ed-nw").value || 16), Math.max(4, +$("ed-nh").value || 12), m.chapter);
    MAPS[id] = nm; nm.collision = mapCollision(nm); fillMapPicker(); edMark(id); ED.layer = "obj"; openMap(id); });
}
function edPreview(cv, type) {
  const g = cv.getContext("2d"), m = curMap(); g.clearRect(0, 0, 28, 28);
  if (m.kind === "piece") { const [, w, h] = FTYPES[type], tmp = document.createElement("canvas"); tmp.width = w * TILE; tmp.height = h * TILE + 8;
    try { FURNI[type](tmp.getContext("2d"), 0, 8, w * TILE, h * TILE, 0, false, undefined, {}); } catch (e) { }
    const s = Math.min(1, 28 / tmp.width, 28 / tmp.height); g.drawImage(tmp, (28 - tmp.width * s) / 2, (28 - tmp.height * s) / 2, tmp.width * s, tmp.height * s); return; }
  const [w, h] = XTYPES[type].size, tmp = document.createElement("canvas"); tmp.width = w + 4; tmp.height = h + 4;
  try { XDRAW[type](tmp.getContext("2d"), 0, 2, 2, w, h, { seed: 120, moss: true }, { night: false }); } catch (e) { }
  const s = Math.min(1, 28 / tmp.width, 28 / tmp.height); g.drawImage(tmp, (28 - tmp.width * s) / 2, (28 - tmp.height * s) / 2, tmp.width * s, tmp.height * s);
}

// ---- glisser-déposer ----
function bindEditor() {
  const cv = $("map");
  cv.addEventListener("pointerdown", e => { if (!ED.on) return; e.stopPropagation(); const [x, y] = worldPos(e), h = edHit(x, y);
    if (!h) { if (ED.sel) { ED.sel = null; edPanel(); } return; }
    cv.setPointerCapture(e.pointerId); ED.sel = h; const it = edGet(); ED.drag = { dx: x / TILE - it.x, dy: y / TILE - it.y, moved: false }; edPanel(); }, true);
  cv.addEventListener("pointermove", e => { if (!ED.on || !ED.drag) return; const it = edGet(); if (!it) return; const [x, y] = worldPos(e);
    if (edMove(it, ED.sel.kind, x / TILE - ED.drag.dx, y / TILE - ED.drag.dy)) ED.drag.moved = true; });
  const end = () => { if (ED.drag) { if (ED.drag.moved) { edMark(); if (ED.sel.kind === "zone") buildPins(); } ED.drag = null; } };
  cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
  const tg = $("ed-toggle");
  tg.addEventListener("click", () => { ED.on = !ED.on; ED.sel = null; tg.setAttribute("aria-pressed", ED.on); tg.textContent = ED.on ? "Quitter le mode édition" : "Mode édition";
    $("map-view").classList.toggle("is-editing", ED.on); edPanel(); });
  $("ed-save").addEventListener("click", edSave); $("ed-export").addEventListener("click", edExport); $("ed-reset").addEventListener("click", edReset);
  window.addEventListener("keydown", e => { if (!ED.on || e.target.closest("input, textarea, select")) return; const it = edGet(); if (!it) return;
    const step = e.shiftKey ? 8 : 1, arrows = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (arrows[e.key]) { e.preventDefault(); edNudge(...arrows[e.key]); }
    else if (ED.sel.kind === "obj" && (e.key === "r" || e.key === "R")) { edTurn(it, e.shiftKey ? "rot-" : "rot+"); edPanel(); }
    else if (ED.sel.kind === "obj" && (e.key === "m" || e.key === "M")) { edTurn(it, "flip"); edPanel(); }
    else if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); const d = $("ed-del"); if (d) d.click(); } });
  window.addEventListener("beforeunload", e => { if (ED.dirty.size && ED.db) { e.preventDefault(); e.returnValue = ""; } });
  edLoad();
}
// ---- calques visibles en édition, et contour de la sélection (appelé après le rendu) ----
function edOverlay(t) {
  if (!ED.on) return; const m = curMap(), g = $("map").getContext("2d"), L = ED.layer;
  if (L === "zone" || L === "exit" || L === "spawn") drawZonesOverlay(g, m, t);
  if (L === "npc") m.npcs.forEach(n => strokeBox(g, n.x * TILE - 9, n.y * TILE - 30, 18, 31, "rgba(255,255,255,.5)", t, false));
  const r = ED.sel && selRect(m, ED.sel); if (r) strokeBox(g, ...r, "#ffd84a", t);
}
