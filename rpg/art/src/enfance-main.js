// Page de présentation des assets de l'enfance : tout est animé avec les fonctions du jeu.
const still = matchMedia("(prefers-reduced-motion: reduce)").matches, renders = [];
function el(tag, attrs = {}, kids = []) { const e = document.createElement(tag); Object.assign(e, attrs); kids.forEach(k => e.append(k)); return e; }
const visible = new Set(), io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
function anim(cv, fn) { io.observe(cv); renders.push([cv, fn]); return cv; }

// personnages : chacun tourne et marche
const DIRS8 = ["S", "SE", "E", "NE", "N", "NW", "W", "SW"], CHAR_NAMES = { heros_long: "Héros, cheveux longs", heros_pointes: "Héros, les pointes", heros_court: "Héros, court", elio: "Élio", elio_rase: "Élio rasé", elio_capuche: "Élio, capuche", margot: "Margot", basile: "Basile", mere: "La mère", ysol: "Grand-mère Ysol", aubin: "Aubin", fauvel: "Maître Fauvel", mere_basile: "La mère de Basile" };
Object.keys(CHARS).filter(k => !CHAR_SPECS[k].chapter).forEach(k => { const cv = el("canvas", { width: 28, height: 38 }), g = cv.getContext("2d");
  document.getElementById("g-chars").append(el("div", { className: "sprite" }, [cv, el("b", { textContent: CHAR_NAMES[k] || k.replace(/_/g, " ") })]));
  anim(cv, t => { g.clearRect(0, 0, 28, 38); const d = DIRS8[Math.floor(t / 1600) % 8]; drawChar(g, CHARS[k], 2, 38 - CHARS[k].H - 1, { dir: d, pose: "walk", t }); }); });
// portraits : la bouche parle, un clic change d'expression
const EXPRS = Object.keys(EXPR);
Object.keys(PORTRAITS).filter(k => !PORTRAITS[k].chapter).forEach(k => { const cv = el("canvas", { width: 64, height: 64 }), g = cv.getContext("2d"); let e = 0; const b = el("span", { textContent: "neutre" });
  cv.style.cssText = "width:128px;height:128px;cursor:pointer"; cv.onclick = () => { e = (e + 1) % EXPRS.length; b.textContent = EXPRS[e]; };
  document.getElementById("g-portraits").append(el("div", { className: "sprite" }, [cv, el("b", { textContent: PORTRAITS[k].name + (k.includes("_") ? " (" + k.split("_")[1] + ")" : "") }), b]));
  anim(cv, t => drawPortrait(g, k, t, { expr: EXPRS[e], open: (t % 3000) < 1600 ? talkMouth("Bonjour à toi", Math.floor((t % 3000) / 120), t) : 0 })); });
// poses
{ const cv = document.getElementById("poses"), g = cv.getContext("2d"), P = [["elio", "assis_genoux"], ["elio_capuche", "assis_genoux"], ["aubin", "a_genoux"], ["aubin", "affale"], ["fauvel", "assis_serviette"], ["heros_long", "assis_lit"], ["aubin", "tambourine"], ["heros_court", "bras_ouverts"], ["elio", "allonge"]];
  anim(cv, t => { g.fillStyle = "#86c070"; g.fillRect(0, 0, 300, 60); g.fillStyle = "#4a8ac0"; g.fillRect(0, 60, 300, 60);
    P.forEach(([k, p], i) => drawCharPose(g, CHARS[k], 4 + i * 32, 8 + (34 - CHARS[k].H), p, { t }));
    ["heros_long", "margot", "basile", "elio", "heros_court"].forEach((k, i) => drawCharWading(g, CHARS[k], 8 + i * 30, 70, { dir: ["S", "E", "SE", "W", "N"][i], t: t + i * 200, moving: i % 2 === 0 }));
    drawChar(g, CHARS.heros_long, 170, 70, { dir: "S" }); drawCharMark(g, CHARS.heros_long, 170, 70, { dir: "S" }); }); }
// poules : chacune réagit tour à tour quand on la pousse
{ const cv = document.getElementById("farm"), g = cv.getContext("2d"), K = ["blanche", "rousse", "noire", "grise", "tachetee"], S = ["idle", "walk", "pushed", "pinch", "fly"];
  anim(cv, t => { g.fillStyle = "#c8a868"; g.fillRect(0, 0, 300, 90); FURNI.nid(g, 236, 30, 24, 16, t, false, { egg: true }); drawSmallEgg(g, 280, 60, "ok"); drawSmallEgg(g, 290, 60, "broken");
    K.forEach((k, i) => drawHen(g, 22 + i * 44, 56, t, { kind: k, face: i % 2 ? -1 : 1, state: S[(i + Math.floor(t / 2000)) % 5], seed: i })); }); }
// objets et décors
{ const cv = document.getElementById("props"), g = cv.getContext("2d");
  const L = [["clochette", 16, 12, { ring: 300 }], ["flacons", 30, 20], ["rasoirs", 16, 12], ["serviettes", 16, 16], ["canari", 16, 20, { sing: 1 }], ["portrait_prince", 20, 24], ["balai", 12, 28, { tas: 1 }], ["rideau", 20, 30],
    ["tresses_ail", 16, 20], ["bol_gardien", 16, 12, { etat: "plein", pain: 1 }], ["sabots", 16, 10, { etat: "cires" }], ["seau_cendres", 14, 14, { sabot: 1 }], ["dessins_mur", 32, 20, { guerrier: 3, mage: 2, voleur: 5 }], ["coffre_jouets", 24, 18],
    ["rouet", 24, 24, { spin: 1 }], ["herbes", 30, 14], ["pot_miel", 10, 10], ["cahier", 14, 10], ["table_nappe", 40, 24], ["bouteilles", 20, 12, { couchee: 1 }], ["poele_tresses", 20, 28], ["petit_miroir", 12, 14], ["dessin_femme", 14, 16], ["lit_vide", 24, 32], ["fenetre_ouverte", 24, 28], ["tresse_paille", 16, 14], ["cercueil", 32, 22, { ouvert: 1, contenu: "corps" }], ["cercueil", 32, 22, { fleurs: 1 }]];
  anim(cv, t => { g.fillStyle = "#c8b090"; g.fillRect(0, 0, 400, 130); g.fillStyle = "#86c070"; g.fillRect(0, 130, 400, 130);
    let x = 4, y = 4, rh = 0; L.forEach(([k, w, h, st]) => { if (x + w > 396) { x = 4; y += rh + 6; rh = 0; } FURNI[k](g, x, y, w, h, t, false, st || {}); x += w + 6; rh = Math.max(rh, h); });
    drawOak(g, 40, 250, t, { margot: 1, glands: 1 }); drawHideBush(g, 100, 250, t, { pieds: 1 }); drawMargotCrate(g, 140, 250); drawWetHairTrail(g, [[160, 240], [190, 245], [210, 235]], t); drawLantern(g, 230, 230, t);
    drawBall(g, 250, 250, Math.abs(Math.sin(t / 300)) * 8, {}); drawShallows(g, 262, 200, 60, 40, t); drawGrave(g, 340, 250, "croix"); drawGrave(g, 360, 250, "stele"); drawGrave(g, 380, 240, "fraiche", { fosse: 1 });
    ["ciseaux", "ruban", "baton", "oeuf", "pain"].forEach((k, i) => { g.fillStyle = "#333"; g.fillRect(150 + i * 20, 140, 16, 16); drawIcon(g, k, 150 + i * 20, 140); }); }); }
// effets au puits
{ const cv = document.getElementById("fx"), g = cv.getContext("2d");
  anim(cv, t => { nightGround(g, 320, 80); for (let i = 0; i < 5; i++) drawWell(g, 10 + i * 62, 20, t, { spill: .2 });
    const c = t % 1200; drawWellLocks(g, 10, 20, t, { hp: [1, 0, 1], hit: { i: 0, t: c } }); drawHitFx(g, 19, 30, c % 250, "ciseaux");
    drawWellLocks(g, 72, 20, t, { hp: [3, 2, 0] }); drawHitFx(g, 90, 22, c % 250, "baton"); drawFallingLock(g, 110, 50, c, 1);
    drawWellLocks(g, 134, 20, t, {}); drawHairGrab(g, 152, 42, 172, 64, t, Math.min(1, c / 600)); drawChar(g, CHARS.heros_court, 163, 40, { dir: "W" });
    drawFallingRibbon(g, 196, 20, t % 1800, { x: 236, y: 30 }, { spill: .2 }); drawChar(g, CHARS.heros_court, 226, 36, { dir: "W" });
    drawHairTransfer(g, 258, 20, 300, 45, t % 3500); drawChar(g, CHARS.heros_long, 288, 40, { dir: "W" }); drawInteractHint(g, 28, 12, t); }); }
// plans spéciaux : [id, titre, légende, fonction, durée, variantes, gore]
const PLANS = [
  ["UI-02", "Le décompte du cache-cache", "Jour 1, midi. Yeux fermés contre le mur ; « Ouvrir un œil » montre Margot qui grimpe au chêne pendant une seconde.", drawCountdown, COUNTDOWN_LEN, [["Décompte", {}], ["Ouvrir un œil", { peek: 1 }]]],
  ["PLAN-01", "Le panier et l'araignée", "Jour 1, la grange. L'araignée monte sur la main ; trois issues.", drawBasketCloseup, 12000, [["Choix", {}], ["Écraser", { suite: "ecraser" }], ["Secouer", { suite: "secouer" }], ["Reposer", { suite: "reposer" }]]],
  ["PLAN-03", "La coupe chez Fauvel", "Jour 2, matin. Les mèches tombent sur le carrelage, puis le héros se regarde dans le miroir piqué.", drawHaircut, HAIRCUT_LEN, [["Les pointes", { coupe: "pointes" }], ["Court", { coupe: "court" }]]],
  ["PLAN-03b", "Le ruban d'Élio", "Jour 3, matin. Sa main s'ouvre sur un ruban bleu à moitié brûlé.", drawRibbonHand, RIBBON_HAND_LEN, [["Lecture", {}]]],
  ["PLAN-02", "Au fond du puits, de jour", "Jour 1. L'eau noire, le reflet du héros ; une goutte le fait trembler.", drawWellLook, 5000, [["Reflet", { fond: "reflet" }]]],
  ["PLAN-04", "Le rêve", "Nuit 3. Cinq plans serrés, jamais la scène entière, puis « Vous vous réveillez en sueur. ».", (c, t) => t < DREAM_LEN ? drawDream(c, t) : drawWakeText(c, t - DREAM_LEN, {}), DREAM_LEN + 3500, [["Lecture", {}]]],
  ["PLAN-05", "Le réveil", "Nuit 3. Il se redresse, la bougie fume, la lune pose une tache claire sur le rebord de la fenêtre entrouverte.", drawWakeUp, 8000, [["Les pointes", { coupe: "pointes" }], ["Court", { coupe: "court" }]]],
  ["PLAN-13", "Les fins de la nuit", "Nuit 3, au bord du puits. On ne voit jamais l'Esprit, seulement ses cheveux.", drawNightEnding, NIGHT_END_LEN, [["Apaisement", { fin: "chante" }], ["Victoire", { fin: "fuit" }], ["Incrédulité", { fin: "relache" }]]],
  ["PLAN-14", "Les fouilles à l'aube", "Aube 4. Aubin devant, les hommes et leurs lanternes dans la brume.", drawDawnSearch, 12000, [["Lecture", {}]]],
  ["PLAN-08/09", "Le puits au matin", "Aube 4. Le corps d'Élio, ou seulement l'eau rouge. Version atténuée disponible.", drawWellLook, 6000, [["Eau rouge", { fond: "eau_rouge" }], ["Corps", { fond: "corps" }], ["Corps, atténué", { fond: "corps", doux: true }]], true],
  ["PLAN-06", "La tête au fond du puits", "Nuit 3. Élio a été rasé par son père : la tête n'a plus ses cheveux blonds. L'image arrive à mesure que les yeux s'habituent.", (c, t, o) => { c.fillStyle = "#000"; c.fillRect(0, 0, 384, 216); const [hc, hg] = ciCache.hz || (ciCache.hz = cuLayer(160, 120)); renderHorror(hg, Math.min(1, t / 3000), o.v || 1, o); c.imageSmoothingEnabled = false; c.drawImage(hc, 48, 0, 288, 216); }, 5000, [["Version 1", { v: 1 }], ["Version 2", { v: 2 }], ["Atténuée", { v: 2, doux: true }]], true],
  ["PLAN-10", "Fin pacte : le matin", "Matin 4. La mère coiffe le héros : ses cheveux ont poussé d'un doigt, quelques mèches sont noires.", drawPactMorning, PACT_MORNING_LEN, [["Les pointes", { coupe: "pointes" }], ["Court", { coupe: "court" }]]],
  ["PLAN-11", "Fin défaite : repêché", "Aube 4. Au fond du puits, Aubin tend la main et remonte le héros.", drawWellRescue, RESCUE_LEN, [["Lecture", {}]]],
  ["PLAN-12", "L'enterrement", "Fin de l'acte. Aubin sobre pour la première fois. Le ruban donné ou gardé ; le cercueil vide quand il ne reste que l'eau rouge.", drawFuneral, FUNERAL_LEN, [["Ruban donné", { ruban: "donne" }], ["Ruban gardé", { ruban: "garde" }], ["Cercueil vide", { vide: true }]]],
];
PLANS.forEach(([id, title, cap, fn, len, vars, gore]) => {
  const cv = el("canvas", { width: 384, height: 216, className: "scene" }), g = cv.getContext("2d"); let opts = vars[0][1], t0 = performance.now(), shown = !gore;
  const bar = el("div", { className: "toolbar" }), btns = vars.map(([label, o], i) => { const b = el("button", { className: "pal", textContent: label, type: "button" }); b.setAttribute("aria-pressed", i === 0);
    b.onclick = () => { opts = o; t0 = performance.now(); btns.forEach(x => x.setAttribute("aria-pressed", x === b)); }; return b; });
  bar.append(...btns);
  const box = el("div", { className: "stage" }, [cv, bar, el("p", { className: "caption", textContent: id + " · " + cap })]);
  if (gore) { cv.hidden = true; const v = el("div", { className: "veil" }, [el("p", { textContent: "Image choquante : la mort d'un enfant." }), el("button", { className: "pal", textContent: "Afficher", type: "button", onclick: () => { v.remove(); cv.hidden = false; shown = true; t0 = performance.now(); } })]); v.style.aspectRatio = "16/9"; box.prepend(v); }
  document.getElementById("plans").append(el("div", { style: "display:grid;gap:10px" }, [el("h3", { textContent: title }), box]));
  anim(cv, now => { if (!shown) return; const t = still ? len * .6 : Math.max(0, now - t0) % (len + 1500), o = { ...opts };
    if (o.peek) o.peek_t = (t % 3000) - 1500; if (o.suite) o.suite_t = Math.max(0, t - 3000);
    g.save(); fn(g, t, o); g.restore(); });
});
function loop(now) { renders.forEach(([cv, fn]) => { if (visible.has(cv)) fn(still ? 1200 : now); }); if (!still) requestAnimationFrame(loop); }
requestAnimationFrame(now => { renders.forEach(([cv, fn]) => fn(1200)); loop(now); });            // une première image partout, puis on n'anime que ce qui est à l'écran
