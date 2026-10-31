// Planche du bestiaire : Giorgio, animé avec les fonctions du jeu.
const still = matchMedia("(prefers-reduced-motion: reduce)").matches, renders = [];
function el(tag, attrs = {}, kids = []) { const e = document.createElement(tag); Object.assign(e, attrs); kids.forEach(k => e.append(k)); return e; }
function anim(cv, fn) { renders.push([cv, fn]); return cv; }
const card = (id, cv, name, sub) => document.getElementById(id).append(el("div", { className: "sprite" }, [cv, el("b", { textContent: name }), ...(sub ? [sub] : [])]));

const EXPRS = ["neutre", "serieux", "malin", "joie", "colere"];
EXPRS.slice(0, 3).forEach((e0, i) => { const cv = el("canvas", { width: 64, height: 64 }), g = cv.getContext("2d"); let e = i; const b = el("span", { textContent: EXPRS[e] });
  cv.style.cssText = "width:128px;height:128px;cursor:pointer"; cv.onclick = () => { e = (e + 1) % EXPRS.length; b.textContent = EXPRS[e]; };
  card("g-portraits", cv, "Giorgio", b);
  anim(cv, t => drawPortrait(g, "giorgio", t, { expr: EXPRS[e], open: i === 2 && (t % 3000) < 1600 ? talkMouth("Tu as faim, toi.", Math.floor((t % 3000) / 120), t) : 0 })); });

["N", "NE", "E", "SE", "S", "SW", "W", "NW"].forEach(d => { const cv = el("canvas", { width: 28, height: 38 }), g = cv.getContext("2d");
  cv.style.cssText = "width:84px;height:114px"; card("g-dirs", cv, d);
  anim(cv, t => { g.clearRect(0, 0, 28, 38); drawChar(g, CHARS.giorgio, 2, 3, { dir: d, pose: "walk", t }); }); });

const tv = document.getElementById("travel"), tg = tv.getContext("2d");
anim(tv, t => { tg.clearRect(0, 0, TRAVEL_W, TRAVEL_H); drawRainbowTravel(tg, t); });

[["pates", "Le héros"], ["reflet", "Le reflet"], ["or", "Un cupide"]].forEach(([d, name]) => {
  const cv = el("canvas", { width: 40, height: 44 }), g = cv.getContext("2d"); cv.style.cssText = "width:100px;height:110px"; card("g-pots", cv, name);
  anim(cv, t => { g.clearRect(0, 0, 40, 44); drawCauldron(g, 4, 12, t, d); }); });

function frame(t) { renders.forEach(([cv, fn]) => { cv.getContext("2d").imageSmoothingEnabled = false; fn(t); }); if (!still) requestAnimationFrame(frame); }
requestAnimationFrame(frame);
