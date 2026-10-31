// ---------- Page « Les cartes du jeu » : chargement des cartes et boucle de rendu ----------
const ctxOf = id => document.getElementById(id).getContext("2d");
Object.values(WORLD_DATA).forEach(m => { MAPS[m.id] = m; });
fillMapPicker(); bindView(); bindEditor();
const params = new URLSearchParams(location.search), mapStill = params.has("still");
openMap(MAPS[params.get("carte")] ? params.get("carte") : "village");
if (params.has("nuit")) document.getElementById("night").click();
if (params.has("zones")) document.getElementById("show-zones").click();
function mapLoop(t) { renderView(mapStill ? 1000 : t); edOverlay(t); if (!mapStill) requestAnimationFrame(mapLoop); }
requestAnimationFrame(mapLoop);
