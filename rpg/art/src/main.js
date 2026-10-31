const A = ADULT(), C = CHILD();
const sprites = { walk: walkFrames(A, 27), idle: [A, bobUpper(A, 27)], child: C, childBob: bobUpper(C, 23) };
const sceneCtx = document.getElementById("scene").getContext("2d");
const ctxOf = id => document.getElementById(id).getContext("2d");
const OLD = ["................","....oooooooo....","...ohhhhhhhho...","...ohhhhhhhHo...","...ohssssssHo...","...osesssseso...","...osssssssSo...","....oSssssSo....","....ooSSSSoo....","...ocllcccCo....","..oclcccccCCo...",".ococcccccCCoco.",".oCoccccccCCoCo.",".osobbbmbbbboso.","..oocccccccCoo..","...occcCcccCo...","...oCCCooCCCo...","....oppooppo....","....oppooppo....","....oppooppo....","....oBBooBBo....","...oBBBooBBBo...","...oooo..oooo...","................"];
function paint(id, rows, pal, dy = 0) { const c = ctxOf(id); c.clearRect(0, 0, 28, 38); drawSprite(c, rows, pal, 2, 2 + dy); return c; }
function renderSprites(t) {
  const i2 = Math.floor(t / 500) % 2, idle = sprites.idle[i2];
  paint("sp-child", i2 ? sprites.childBob : sprites.child, CHILD_PAL, 34 - C.length);
  paint("sp-idle", idle, PAL);
  paint("sp-walk", sprites.walk[Math.floor(t / 130) % 4], PAL);
  const v = (name, id) => { const V = VARIANTS[name]; return paint(id, V.mod(idle), { ...V.pal, ...V.extra }); };
  v("scar", "sp-scar");
  const cc = v("curse", "sp-curse"); cc.globalAlpha = .5 + .5 * Math.sin(t / 200); cc.fillStyle = "#d6a0ff"; cc.fillRect(10, 13 + i2, 1, 1); cc.fillRect(17, 13 + i2, 1, 1); cc.globalAlpha = 1;
  const bc = v("bless", "sp-bless"); bc.globalAlpha = .6 + .3 * Math.sin(t / 300); bc.fillStyle = "#ffd84a"; bc.fillRect(9, 0 + i2, 10, 1); bc.fillRect(8, 1 + i2, 1, 1); bc.fillRect(19, 1 + i2, 1, 1); bc.globalAlpha = 1;
  const sp = Math.floor(t / 140) % 8; bc.fillStyle = "#fff6c8"; bc.fillRect(3 + sp * 3, 34 - sp * 4, 1, 1);
}
function renderCompare() {
  const c = ctxOf("compare"); c.fillStyle = "#86d69a"; c.fillRect(0, 0, 64, 40);
  drawSprite(c, OLD, { ...PAL, c:"#3f7a5a", C:"#2a5442", l:"#6ea87b" }, 8, 14);
  drawSprite(c, A, PAL, 34, 4);
  c.fillStyle = "#2a2030"; c.globalAlpha = .25; c.fillRect(0, 38, 64, 1); c.globalAlpha = 1;
}
renderCompare();
bindLab();
bindField();
let horrorT0 = 0, horrorV = 3, horrorRun = 0;
function playHorror() { horrorT0 = performance.now(); const run = ++horrorRun, c = document.getElementById("horror").getContext("2d");
  (function step(now) { if (run !== horrorRun) return; const p = Math.max(0, (now - horrorT0 - 1200) / 6000);
    if (p < 1 && !still) { renderHorror(c, p, horrorV); requestAnimationFrame(step); } else renderHorror(c, 1, horrorV); })(horrorT0); }
document.getElementById("horror-show").addEventListener("click", () => { ["horror", "horror-again", "talk-box"].forEach(id => document.getElementById(id).hidden = false); document.getElementById("horror-veil").hidden = true; playHorror(); });
document.getElementById("horror-again").addEventListener("click", playHorror);

document.getElementById("cine-replay").addEventListener("click", () => { cineStart = performance.now(); if (still) renderCine(cineStart + 5000); });
const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
let lastT = 0;
function loop(t) { const dt = Math.min(50, t - lastT || 16); lastT = t; renderDirs(t); renderField(t, dt); renderNature(t); drawScene(sceneCtx, t, sprites); renderSprites(t); renderLab(t); renderSpiritCard(t); renderCine(t); if (!document.getElementById("talk-box").hidden) renderTalk(t); if (!still) requestAnimationFrame(loop); }
requestAnimationFrame(loop);

if (still) { renderSpiritCard(4000); renderCine(5000); }
