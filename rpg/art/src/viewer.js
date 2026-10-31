// ---------- Visite des cartes (propre à la page « Les cartes du jeu ») ----------
// Une seule vue pour toutes les cartes : on glisse, on zoome, on touche un lieu, un objet ou une sortie.
const VIEW = { id: null, history: [], hover: null, sel: null, state: {}, night: false, day: 0, moment: "", showZones: false };
const view = { z: 1, x: 0, y: 0, base: 1 };
const $ = id => document.getElementById(id);
const curMap = () => MAPS[VIEW.id];
const mapPxW = m => Math.ceil(m.w * TILE), mapPxH = m => Math.ceil(m.h * TILE);
function viewCtx() { return { day: VIEW.day || undefined, moment: VIEW.moment || undefined, night: VIEW.night }; }
const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ---- zoom et déplacement ----
function layoutView() {
  const m = curMap(); if (!m) return; const box = $("map-view"), W = box.clientWidth, H = box.clientHeight;
  view.base = m.kind === "piece" ? Math.min(W / mapPxW(m), H / mapPxH(m)) * .94 : Math.max(W / mapPxW(m), H / mapPxH(m)); clampView(); applyView();
}
function clampView() { const m = curMap(), box = $("map-view"), W = box.clientWidth, H = box.clientHeight, s = view.base * view.z, MW = mapPxW(m), MH = mapPxH(m);
  view.x = Math.min(0, Math.max(W - MW * s, view.x)); view.y = Math.min(0, Math.max(H - MH * s, view.y));
  if (MW * s < W) view.x = (W - MW * s) / 2; if (MH * s < H) view.y = (H - MH * s) / 2; }
function applyView() { const s = view.base * view.z;
  $("map-layer").style.transform = `translate(${view.x}px, ${view.y}px) scale(${s})`;
  document.querySelectorAll(".pin").forEach(p => p.style.transform = `translate(-50%, -100%) scale(${1 / s})`);
  $("zoom-level").textContent = "×" + view.z; }
function zoomTo(z, cx, cy) { const box = $("map-view"); cx ??= box.clientWidth / 2; cy ??= box.clientHeight / 2;
  const s0 = view.base * view.z, wx = (cx - view.x) / s0, wy = (cy - view.y) / s0; view.z = Math.max(1, Math.min(6, z));
  const s1 = view.base * view.z; view.x = cx - wx * s1; view.y = cy - wy * s1; clampView(); applyView(); }
function focusAt(px_, py_) { const box = $("map-view"); if (view.z < 2) view.z = 2; const s = view.base * view.z;
  view.x = box.clientWidth / 2 - px_ * s; view.y = box.clientHeight / 2 - py_ * s; clampView(); applyView(); }
function viewCenterTiles() { const box = $("map-view"), s = view.base * view.z; return [(box.clientWidth / 2 - view.x) / s / TILE, (box.clientHeight / 2 - view.y) / s / TILE]; }

// ---- changer de carte ----
function openMap(id, opts = {}) {
  const m = MAPS[id]; if (!m) return;
  if (VIEW.id && VIEW.id !== id && !opts.back) VIEW.history.push(VIEW.id);
  VIEW.id = id; VIEW.hover = VIEW.sel = null; if (typeof ED !== "undefined") { ED.sel = null; ED.drag = null; }
  const cv = $("map"), layer = $("map-layer"); cv.width = mapPxW(m); cv.height = mapPxH(m);
  cv.style.width = layer.style.width = cv.width + "px"; cv.style.height = layer.style.height = cv.height + "px";
  $("map-view").classList.toggle("is-piece", m.kind === "piece");
  $("map-pick").value = id; $("map-back").hidden = !VIEW.history.length;
  $("map-title").textContent = m.name;
  view.z = 1; layoutView(); buildPins(); refreshSide();
  if (opts.at && m.spawns[opts.at] && m.kind !== "piece") { const sp = m.spawns[opts.at]; focusAt(sp.x * TILE, sp.y * TILE); }
  if (typeof edPanel === "function") edPanel();
}
function goBack() { const id = VIEW.history.pop(); if (id) openMap(id, { back: true }); }
function takeExit(e) { if (!MAPS[e.to]) return; openMap(e.to, { at: e.at }); }

// ---- textes : moments, scènes ----
function whenLabel(w) {
  if (!w) return "Toujours";
  const d = w.day === undefined ? "" : [].concat(w.day).join(", "), m = w.moment === undefined ? "" : [].concat(w.moment).join(" ou ");
  if (w.night) return d ? `Nuit ${d}` : "Chaque nuit";
  const head = d ? `Jour ${d}` : w.night === false ? "Le jour" : "";
  return [head, m].filter(Boolean).join(", ") || "Toujours";
}
function sceneLi(s, dim) { return `<li class="${s.when && s.when.night ? "nuit" : ""}${dim ? " dim" : ""}"><span class="when">${esc(whenLabel(s.when))}</span><b>${esc(s.title)}</b>${s.who ? `<span class="who">${esc(s.who)}</span>` : ""}${s.line && !dim ? `<q>${esc(s.line)}</q>` : ""}</li>`; }
function scenesFor(m, zone) { const ctx = viewCtx(), all = (m.scenes || []).filter(s => zone === undefined || (s.zone || null) === zone);
  return { on: all.filter(s => whenOk(s.when, ctx)), off: all.filter(s => !whenOk(s.when, ctx)) }; }
function scenesHtml(m, zone) { const { on, off } = scenesFor(m, zone);
  return on.length || off.length ? `<ul class="events">${on.map(s => sceneLi(s)).join("")}${off.map(s => sceneLi(s, true)).join("")}</ul>` : ""; }

// ---- épingles des lieux (zones nommées) ----
function buildPins() {
  const layer = $("map-layer"), m = curMap(); layer.querySelectorAll(".pin").forEach(p => p.remove());
  if (m.kind === "piece") return;
  Object.entries(m.zones || {}).filter(([, z]) => z.name).forEach(([id, z], i) => {   // une épingle par lieu nommé ; on ne montre que ceux où il se passe quelque chose
    const b = document.createElement("button"); b.className = "pin"; b.type = "button"; b.dataset.zone = id;
    b.style.left = (z.x + z.w / 2) * TILE + "px"; b.style.top = z.y * TILE + "px";
    b.innerHTML = `<span class="num">${i + 1}</span><span class="lbl">${esc(z.name)}</span>`;
    b.addEventListener("click", e => { e.stopPropagation(); VIEW.sel = { kind: "zone", id }; refreshSide(); }); layer.appendChild(b);
  });
  applyView();
}
function refreshPins() {
  const m = curMap(); document.querySelectorAll(".pin").forEach(p => { const id = p.dataset.zone, on = scenesFor(m, id).on.length > 0, picked = !!(VIEW.sel && VIEW.sel.kind === "zone" && VIEW.sel.id === id);
    p.hidden = !on && !picked && !VIEW.showZones; p.classList.toggle("off", !on); p.setAttribute("aria-pressed", !!(VIEW.sel && VIEW.sel.kind === "zone" && VIEW.sel.id === id)); });
  document.querySelectorAll("[data-pick-zone]").forEach(b => { const id = b.dataset.pickZone; b.classList.toggle("off", !scenesFor(m, id).on.length); b.setAttribute("aria-pressed", !!(VIEW.sel && VIEW.sel.id === id)); });
}

// ---- panneau latéral : ce qu'on a touché ----
function refreshSide() {
  const m = curMap(), info = $("map-info"), list = $("map-list"), sel = VIEW.sel, ctx = viewCtx();
  if (typeof ED !== "undefined" && ED.on) { info.hidden = true; list.hidden = true; return; } info.hidden = false; list.hidden = false;
  let html = "";
  if (sel && sel.kind === "zone") { const z = m.zones[sel.id];
    html = `<h3>${esc(z.name || sel.id)}</h3>${z.cachette ? `<p class="tags"><code>cachette : ${esc(z.cachette)}</code></p>` : ""}${scenesHtml(m, sel.id) || `<p class="lieu-desc">Rien de prévu ici pour l'instant.</p>`}`; }
  else if (sel && sel.kind === "obj") { const o = m.objects.find(q => q.id === sel.id), it = o.interact || {};
    const tags = [it.scene && `scène ${it.scene}`, it.flag && `drapeau ${it.flag}`, o.secret && "jamais signalé en jeu", o.hidden && "caché jusqu'à ce qu'on le trouve", o.when && whenLabel(o.when)].filter(Boolean);
    html = `<h3>${esc(it.label || o.name || o.id)}</h3>${it.text ? `<p>${esc(it.text)}</p>` : ""}${tags.length ? `<p class="tags">${tags.map(s => `<code>${esc(s)}</code>`).join(" ")}</p>` : ""}`;
    if (o.type === "bougie") html += `<button type="button" class="pal" id="blow">${VIEW.state[o.id]?.blown ? "Rallumer la bougie" : "Souffler la bougie"}</button>`; }
  else if (sel && sel.kind === "exit") { const e = m.exits.find(q => q.id === sel.id), t = MAPS[e.to];
    html = `<h3>${esc(e.label || "Sortie")}</h3><p class="lieu-desc">Mène à ${esc(t ? t.name : e.to)}.</p>${e.locked ? `<p class="tags"><code>fermée ${e.locked === true ? "à clé" : "la " + esc(e.locked)}</code></p>` : ""}${e.secret ? `<p class="tags"><code>jamais signalée en jeu</code></p>` : ""}<button type="button" class="pal" id="go-exit">Y aller</button>`; }
  else { const { on, off } = scenesFor(m, null);
    html = `<h3>${esc(m.name)}</h3><p class="lieu-desc">${m.kind === "piece" ? "Touche un objet ou une sortie (paillasson, porte, échelle)." : "Touche un lieu pour voir ce qui s'y passe, ou une porte pour entrer."}</p>`;
    if (on.length || off.length) html += `<ul class="events">${on.map(s => sceneLi(s)).join("")}${off.map(s => sceneLi(s, true)).join("")}</ul>`; }
  if (sel) html += `<button type="button" class="small" id="sel-clear">Retour à ${esc(m.name)}</button>`;
  info.innerHTML = html;
  const bl = $("blow"); if (bl) bl.addEventListener("click", () => { const s = VIEW.state[sel.id] = VIEW.state[sel.id] || {}; s.blown = !s.blown; refreshSide(); });
  const go = $("go-exit"); if (go) go.addEventListener("click", () => takeExit(m.exits.find(q => q.id === sel.id)));
  const cl = $("sel-clear"); if (cl) cl.addEventListener("click", () => { VIEW.sel = null; refreshSide(); });
  // listes : lieux, objets, sorties
  const zones = Object.entries(m.zones || {}).filter(([, z]) => z.name), objs = visibleObjects(m, ctx, { showHidden: VIEW.showZones }).filter(o => o.interact);
  const exits = (m.exits || []).filter(e => whenOk(e.when, ctx));
  list.innerHTML = (m.kind !== "piece" && zones.length ? `<p class="eyebrow">Lieux</p>${zones.map(([id, z], i) => `<button type="button" class="place-btn" data-pick-zone="${id}"><span class="num">${i + 1}</span>${esc(z.name)}</button>`).join("")}` : "")
    + (objs.length ? `<p class="eyebrow">Objets</p><ul class="obj-list">${objs.map(o => `<li><button type="button" class="obj-link" data-pick-obj="${o.id}">${esc(o.interact.label)}</button></li>`).join("")}</ul>` : "")
    + (exits.length ? `<p class="eyebrow">Sorties</p><ul class="obj-list">${exits.map(e => `<li><button type="button" class="obj-link" data-go="${e.id}">${esc(e.label || (MAPS[e.to] || {}).name || e.to)} →</button></li>`).join("")}</ul>` : "");
  list.querySelectorAll("[data-pick-zone]").forEach(b => b.addEventListener("click", () => { VIEW.sel = { kind: "zone", id: b.dataset.pickZone }; const z = m.zones[b.dataset.pickZone]; focusAt((z.x + z.w / 2) * TILE, (z.y + z.h / 2) * TILE); refreshSide(); }));
  list.querySelectorAll("[data-pick-obj]").forEach(b => b.addEventListener("click", () => { VIEW.sel = { kind: "obj", id: b.dataset.pickObj }; refreshSide(); }));
  list.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", () => takeExit(m.exits.find(e => e.id === b.dataset.go))));
  refreshPins();
}

// ---- ce qui est sous le doigt (coordonnées en px de carte) ----
function worldPos(ev) { const cv = $("map"), r = cv.getBoundingClientRect(); return [(ev.clientX - r.left) / r.width * cv.width, (ev.clientY - r.top) / r.height * cv.height]; }
function hitView(x, y) {
  const m = curMap(), ctx = viewCtx(), X = x / TILE, Y = y / TILE;
  const objs = visibleObjects(m, ctx, { showHidden: VIEW.showZones }).filter(o => o.interact && X >= o.x && X < o.x + o.w && Y >= o.y - (o.type === "bougie" ? .5 : 0) && Y < o.y + o.h);
  objs.sort((a, b) => (b.on ? 1 : 0) - (a.on ? 1 : 0) || a.w * a.h - b.w * b.h);
  const exit = (m.exits || []).find(e => whenOk(e.when, ctx) && X >= e.x && X < e.x + e.w && Y >= e.y - .5 && Y < e.y + (e.h || 1));
  const zone = Object.entries(m.zones || {}).find(([, z]) => z.name && X >= z.x && X < z.x + z.w && Y >= z.y && Y < z.y + z.h);
  if (exit && (!objs.length || m.kind !== "piece")) return { kind: "exit", id: exit.id };
  if (objs.length) return { kind: "obj", id: objs[0].id };
  if (zone) return { kind: "zone", id: zone[0] };
  return null;
}

// ---- rendu ----
function strokeBox(g, x, y, w, h, col, t, dash = true) { g.strokeStyle = col; g.lineWidth = 1; if (dash) { g.setLineDash([2, 2]); g.lineDashOffset = -Math.floor(t / 120) % 4; } g.strokeRect(Math.round(x) + .5, Math.round(y) + .5, Math.max(1, Math.round(w) - 1), Math.max(1, Math.round(h) - 1)); g.setLineDash([]); }
function renderView(t) {
  const m = curMap(); if (!m) return; const g = $("map").getContext("2d"), editing = typeof ED !== "undefined" && ED.on;
  drawAnyMap(g, m, t, { night: VIEW.night, day: VIEW.day || undefined, moment: VIEW.moment || undefined, state: VIEW.state, showHidden: VIEW.showZones || editing });
  if (VIEW.showZones && !editing) drawZonesOverlay(g, m, t);
  if (!editing) [VIEW.hover, VIEW.sel].forEach((h, k) => { if (!h) return; const r = selRect(m, h); if (r) strokeBox(g, ...r, k ? "#ffd84a" : "rgba(255,255,255,.85)", t); });
}
function selRect(m, h) {
  if (h.kind === "obj") { const o = m.objects.find(q => q.id === h.id); return o && [o.x * TILE, o.y * TILE - (o.type === "bougie" ? 7 : 0), o.w * TILE, o.h * TILE + (o.type === "bougie" ? 7 : 0)]; }
  if (h.kind === "exit") { const e = m.exits.find(q => q.id === h.id); return e && [e.x * TILE, e.y * TILE, e.w * TILE, (e.h || 1) * TILE]; }
  if (h.kind === "zone") { const z = m.zones[h.id]; return z && [z.x * TILE, z.y * TILE, z.w * TILE, z.h * TILE]; }
  if (h.kind === "spawn") { const s = m.spawns[h.id]; return s && [s.x * TILE - 5, s.y * TILE - 5, 10, 10]; }
  if (h.kind === "npc") { const n = m.npcs[+h.id]; return n && [n.x * TILE - 9, n.y * TILE - 30, 18, 31]; }
  return null;
}
function drawZonesOverlay(g, m, t) {
  g.globalAlpha = .18; g.fillStyle = "#ffd84a"; Object.values(m.zones || {}).forEach(z => g.fillRect(z.x * TILE, z.y * TILE, z.w * TILE, z.h * TILE)); g.globalAlpha = 1;
  Object.values(m.zones || {}).forEach(z => strokeBox(g, z.x * TILE, z.y * TILE, z.w * TILE, z.h * TILE, "#ffd84a", t));
  (m.exits || []).forEach(e => strokeBox(g, e.x * TILE, e.y * TILE, e.w * TILE, (e.h || 1) * TILE, "#7af0ff", t));
  Object.values(m.spawns || {}).forEach(s => { g.fillStyle = "#7af0ff"; g.fillRect(Math.round(s.x * TILE) - 2, Math.round(s.y * TILE) - 2, 4, 4); });
  if (m.collision) { g.globalAlpha = .22; g.fillStyle = "#ff3a5a"; m.collision.forEach((row, y) => [...row].forEach((c, x) => { if (c === "1") g.fillRect(x * TILE, y * TILE, TILE, TILE); })); g.globalAlpha = 1; }
}

// ---- liste des cartes ----
function fillMapPicker() {
  const sel = $("map-pick"), chapters = {}; Object.values(MAPS).forEach(m => (chapters[m.chapter || ""] = chapters[m.chapter || ""] || []).push(m));
  sel.innerHTML = Object.entries(chapters).map(([ch, ms]) => `<optgroup label="${esc((WORLD_INDEX.chapters || {})[ch] || ch || "Sans chapitre")}">${ms.map(m => `<option value="${m.id}">${esc(m.name)}</option>`).join("")}</optgroup>`).join("");
  if (VIEW.id) sel.value = VIEW.id;
}

function bindView() {
  const box = $("map-view"), cv = $("map");
  // glisser pour se déplacer, molette ou pincement pour zoomer
  const pts = new Map(); let pinch0 = 0, z0 = 1, moved = 0;
  box.addEventListener("pointerdown", e => { if (e.target.closest(".pin, .map-tools, .map-bar")) return; box.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); moved = 0;
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]); z0 = view.z; } });
  box.addEventListener("pointermove", e => { if (!pts.has(e.pointerId)) { if (!(typeof ED !== "undefined" && ED.on)) { const h = hitView(...worldPos(e)); VIEW.hover = h; cv.style.cursor = h ? "pointer" : ""; } return; }
    const [ox, oy] = pts.get(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); moved += Math.abs(e.clientX - ox) + Math.abs(e.clientY - oy);
    if (pts.size === 1) { view.x += e.clientX - ox; view.y += e.clientY - oy; clampView(); applyView(); }
    else if (pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]), r = box.getBoundingClientRect();
      const z = Math.round(z0 * d / pinch0); if (z !== view.z) zoomTo(z, (a[0] + b[0]) / 2 - r.left, (a[1] + b[1]) / 2 - r.top); } });
  const up = e => { const was = pts.has(e.pointerId) && pts.size === 1; pts.delete(e.pointerId);
    if (was && moved < 6 && e.type === "pointerup" && !(typeof ED !== "undefined" && ED.on)) { const h = hitView(...worldPos(e));
      if (h && h.kind === "exit") takeExit(curMap().exits.find(q => q.id === h.id)); else { VIEW.sel = h; refreshSide(); } } };
  box.addEventListener("pointerup", up); box.addEventListener("pointercancel", up);
  box.addEventListener("pointerleave", () => { VIEW.hover = null; });
  box.addEventListener("wheel", e => { e.preventDefault(); const r = box.getBoundingClientRect(); zoomTo(view.z + (e.deltaY < 0 ? 1 : -1), e.clientX - r.left, e.clientY - r.top); }, { passive: false });
  $("zoom-in").addEventListener("click", () => zoomTo(view.z + 1));
  $("zoom-out").addEventListener("click", () => zoomTo(view.z - 1));
  $("zoom-fit").addEventListener("click", () => { view.z = 1; clampView(); applyView(); });
  $("map-back").addEventListener("click", goBack);
  $("map-pick").addEventListener("change", e => openMap(e.target.value));
  document.querySelectorAll("[data-day]").forEach(b => b.addEventListener("click", () => { VIEW.day = +b.dataset.day;
    document.querySelectorAll("[data-day]").forEach(o => o.setAttribute("aria-pressed", o === b)); refreshSide(); }));
  $("moment").innerHTML = `<option value="">Tous les moments</option>` + MOMENTS.map(m => `<option>${m}</option>`).join("");
  $("moment").addEventListener("change", e => { VIEW.moment = e.target.value; if (VIEW.moment === "nuit" && !VIEW.night) $("night").click(); refreshSide(); });
  const nb = $("night"); nb.addEventListener("click", () => { VIEW.night = !VIEW.night; nb.setAttribute("aria-pressed", VIEW.night);
    nb.textContent = VIEW.night ? "Passer au jour" : "Passer à la nuit"; box.classList.toggle("is-night", VIEW.night); refreshSide(); });
  const zb = $("show-zones"); zb.addEventListener("click", () => { VIEW.showZones = !VIEW.showZones; zb.setAttribute("aria-pressed", VIEW.showZones); refreshSide(); });
  window.addEventListener("resize", layoutView); new ResizeObserver(layoutView).observe(box);
}
