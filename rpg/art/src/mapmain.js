const ctxOf = id => document.getElementById(id).getContext("2d");
bindMap(); bindRooms(); bindEditor();
const mapStill = new URLSearchParams(location.search).has("still");
function mapLoop(t) { if (roomUI.id) renderRoom(t); else renderMap(t); edOverlay(t); if (!mapStill) requestAnimationFrame(mapLoop); }
requestAnimationFrame(mapLoop);
