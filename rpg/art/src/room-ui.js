// ---------- Visite des intérieurs depuis la carte (propre à cette page) ----------
const roomUI = { id: null, hover: null, sel: null, state: {} };
function drawPersonInRoom(g, n, x, y, t) {
  const S = npcSprites(), bob = Math.floor(t / 600 + x) % 2, child = n.child || n.id === "elio";
  const pal = n.id === "hero" ? CHILD_PAL : NPC_PAL[n.id];
  g.globalAlpha = .22; g.fillStyle = "#1a1418"; g.fillRect(x + 4, y + (child ? 25 : 32), 16, 3); g.globalAlpha = 1;
  drawSprite(g, child ? (bob ? S.childBob : S.child) : (bob ? S.adultBob : S.adult), pal, x, y + (child ? 7 : 0));
}
function openRoom(id) {
  const room = INTERIORS.rooms[id]; roomUI.id = id; roomUI.hover = roomUI.sel = null;
  const cv = document.getElementById("room"); cv.width = room.w * TILE; cv.height = room.h * TILE;
  document.getElementById("room-view").hidden = false; document.getElementById("room-name").textContent = room.name;
  const ex = document.getElementById("room-exits"); ex.innerHTML = "";
  room.exits.forEach(e => { const b = document.createElement("button"); b.type = "button"; b.className = "pal"; b.textContent = e.to === "village" ? "Retour au village" : e.label;
    b.addEventListener("click", () => takeExit(e)); ex.appendChild(b); });
  layoutRoom(); roomInfo(); if (ED.on) { ED.sel = null; edPanel(); }
}
function closeRoom() { roomUI.id = null; document.getElementById("room-view").hidden = true; refreshPins(); if (ED.on) { ED.sel = null; edPanel(); } }
function takeExit(e) { if (e.to === "village") closeRoom(); else openRoom(e.to); }
function layoutRoom() { if (!roomUI.id) return; const box = document.getElementById("map-view"), room = INTERIORS.rooms[roomUI.id], cv = document.getElementById("room");
  const W = box.clientWidth, H = box.clientHeight - 52, s = Math.min(W / (room.w * TILE), H / (room.h * TILE)), k = s >= 1 ? Math.floor(s) : s;
  cv.style.width = room.w * TILE * k + "px"; cv.style.height = room.h * TILE * k + "px"; }
function roomHit(ev) { const cv = document.getElementById("room"), r = cv.getBoundingClientRect(), room = INTERIORS.rooms[roomUI.id];
  const x = (ev.clientX - r.left) / r.width * cv.width, y = (ev.clientY - r.top) / r.height * cv.height;
  const ex = room.exits.find(e => x >= e.x * TILE && x < (e.x + e.w) * TILE && y >= e.y * TILE - 8 && y < (e.y + 1) * TILE);
  const objs = room.objects.filter(o => o.interact && x >= o.x * TILE && x < (o.x + o.w) * TILE && y >= o.y * TILE - (o.type === "bougie" ? 8 : 0) && y < (o.y + o.h) * TILE);
  objs.sort((a, b) => (a.on ? 1 : 0) - (b.on ? 1 : 0) || a.w * a.h - b.w * b.h);
  return { obj: objs.find(o => o.on) || objs[0], exit: ex };
}
function roomInfo() {
  const room = INTERIORS.rooms[roomUI.id], o = room.objects.find(q => q.id === roomUI.sel), info = document.getElementById("map-info");
  if (!o) { const list = room.objects.filter(q => q.interact).map(q => `<li><button type="button" class="obj-link" data-obj="${q.id}">${q.interact.label}</button></li>`).join("");
    info.innerHTML = `<h3>${room.name}</h3><p class="lieu-desc">Touche un objet dans la pièce, ou une sortie (paillasson, porte, échelle).</p><ul class="obj-list">${list}</ul>`; }
  else { const it = o.interact, tags = [it.scene && `scène ${it.scene}`, it.flag && `drapeau ${it.flag}`, o.secret && "jamais signalé en jeu"].filter(Boolean);
    info.innerHTML = `<h3>${it.label}</h3><p>${it.text}</p>${tags.length ? `<p class="tags">${tags.map(s => `<code>${s}</code>`).join(" ")}</p>` : ""}${o.type === "bougie" ? `<button type="button" class="pal" id="blow">${roomUI.state[o.id]?.blown ? "Rallumer la bougie" : "Souffler la bougie"}</button>` : ""}<button type="button" class="small" id="obj-back">Tous les objets de la pièce</button>`;
    document.getElementById("obj-back").addEventListener("click", () => { roomUI.sel = null; roomInfo(); });
    const bl = document.getElementById("blow"); if (bl) bl.addEventListener("click", () => { const s = roomUI.state[o.id] = roomUI.state[o.id] || {}; s.blown = !s.blown; roomInfo(); }); }
  info.querySelectorAll("[data-obj]").forEach(b => b.addEventListener("click", () => { roomUI.sel = b.dataset.obj; roomInfo(); }));
}
function renderRoom(t) {
  const room = INTERIORS.rooms[roomUI.id], g = document.getElementById("room").getContext("2d");
  drawRoom(g, room, t, { night: mapState.night, state: roomUI.state, drawPerson: drawPersonInRoom });
  [roomUI.hover, roomUI.sel].forEach((id, k) => { const o = room.objects.find(q => q.id === id); if (!o) return;
    g.strokeStyle = k ? "#ffd84a" : "rgba(255,255,255,.8)"; g.lineWidth = 1; g.setLineDash([2, 2]); g.lineDashOffset = -Math.floor(t / 120) % 4;
    g.strokeRect(o.x * TILE + .5, o.y * TILE + .5 - (o.type === "bougie" ? 7 : 0), o.w * TILE - 1, o.h * TILE - 1 + (o.type === "bougie" ? 7 : 0)); g.setLineDash([]); });
}
function bindRooms() {
  const cv = document.getElementById("room");
  cv.addEventListener("pointermove", e => { const h = roomHit(e); roomUI.hover = h.obj ? h.obj.id : null; cv.style.cursor = h.obj || h.exit ? "pointer" : "default"; });
  cv.addEventListener("pointerleave", () => { roomUI.hover = null; });
  cv.addEventListener("click", e => { const h = roomHit(e); if (h.obj) { roomUI.sel = h.obj.id; roomInfo(); } else if (h.exit) takeExit(h.exit); });
  document.getElementById("room-close").addEventListener("click", closeRoom);
  new ResizeObserver(layoutRoom).observe(document.getElementById("map-view"));
}
