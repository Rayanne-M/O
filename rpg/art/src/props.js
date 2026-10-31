// ---------- Objets et décors du chapitre 1, au format des intérieurs (interiors.js) et de la carte ----------
// Meubles : FURNI.type(g, x, y, w, h, t, night, st) ; (x, y, w, h) en pixels, comme dans drawRoom. st = état propre à l'objet.
// Décors d'extérieur : drawXxx(ctx, x, y, t, o), (x, y) = pied de l'objet sauf mention contraire.
// Icônes d'inventaire 16 × 16 : drawIcon(ctx, id, x, y).
const PR = { o: IC.o, metal: "#b4b8c4", metald: "#6a6e7a", metall: "#eef0f6", glassG: "#6ab48a", glassB: "#6a8ad0", glassA: "#d0a050", ribbon: "#3a7cb6", ribbond: "#2a5884", burn: "#2a1a14",
  gold: "#d8b048", goldd: "#9a7a2a", paper: "#efe6d0", paperd: "#c8bc9c", charcoal: "#3a3438", bird: "#f2d038", birdd: "#c8a020", hay: IC.straw, hayd: IC.strawd };
const prR = (g, x, y, w, h, c) => fill(g, c, Math.round(x), Math.round(y), Math.round(w), Math.round(h));
Object.assign(FURNI, {
  // ---- salon de Fauvel ----
  // clochette au-dessus de la porte ; st.ring : temps depuis qu'on a ouvert (ms), elle se balance 1 s
  clochette(g, x, y, w, h, t, night, st) { const a = st && st.ring != null && st.ring < 1000 ? Math.sin(st.ring / 50) * 2 * (1 - st.ring / 1000) : 0;
    prR(g, x + 4, y + 2, 8, 1, IC.woodk); prR(g, x + 7, y + 2, 1, 3, PR.metald); box(g, x + 5 + a, y + 5, 6, 5, PR.gold); prR(g, x + 6 + a, y + 6, 2, 2, "#f4e090"); prR(g, x + 7 + a * 1.5, y + 10, 2, 1, PR.goldd);
    if (a) { prR(g, x + 1, y + 6, 2, 1, "#f4e090"); prR(g, x + 13, y + 7, 2, 1, "#f4e090"); } },
  // étagère de flacons de lotion (mur) : verts, bleus, ambrés
  flacons(g, x, y, w, h) { box(g, x, y + h - 9, w, 4, IC.woodd); prR(g, x + 1, y + h - 9, w - 2, 1, IC.woodl);
    for (let i = 0; i < Math.floor((w - 4) / 6); i++) { const c = [PR.glassG, PR.glassB, PR.glassA][i % 3], fx = x + 3 + i * 6, tall = i % 2 ? 7 : 9;
      box(g, fx, y + h - 9 - tall, 5, tall, c); prR(g, fx + 1, y + h - 9 - tall - 2, 3, 2, IC.woodk); prR(g, fx + 1, y + h - 8 - tall, 1, tall - 3, "#ffffff"); } },
  // rasoirs, pierre à affûter et peignes posés sur le comptoir
  rasoirs(g, x, y, w, h) { box(g, x + 1, y + 6, 6, 3, "#8a8a96"); prR(g, x + 2, y + 6, 4, 1, "#b4b4c0");
    [[x + 8, y + 4], [x + 10, y + 8]].forEach(([a, b]) => { box(g, a, b, 5, 2, IC.woodk); prR(g, a + 4, b, 4, 1, PR.metall); prR(g, a + 4, b + 1, 4, 1, PR.metald); }); },
  // pile de serviettes chaudes ; une vapeur monte
  serviettes(g, x, y, w, h, t) { [0, 3, 6].forEach((k, i) => box(g, x + 2, y + 9 - k, 12, 4, i % 2 ? IC.cloth : "#ffffff")); prR(g, x + 3, y + 10, 10, 1, IC.clothd);
    for (let i = 0; i < 3; i++) { const u = ((t / 1400) + i / 3) % 1; g.globalAlpha = .6 * (1 - u); prR(g, x + 5 + i * 3 + Math.sin(u * 6 + i) * 1.5, y + 1 - u * 8, 1, 2, "#ffffff"); g.globalAlpha = 1; } },
  // canari en cage (accroché) ; st.sing : il chante, sautille et des notes s'échappent
  canari(g, x, y, w, h, t, night, st) { const sing = st && st.sing, hop = sing && Math.floor(t / 180) % 2 ? 1 : 0;
    prR(g, x + 7, y, 2, 3, PR.goldd); for (let k = 0; k < 6; k++) prR(g, x + 2 + k * 2.4, y + 4, 1, 11, PR.goldd); prR(g, x + 2, y + 3, 13, 1, PR.gold); prR(g, x + 1, y + 15, 15, 2, PR.goldd); prR(g, x + 3, y + 11, 11, 1, IC.woodk);
    box(g, x + 6, y + 6 - hop, 5, 5, PR.bird); prR(g, x + 10, y + 7 - hop, 2, 1, "#e88a2a"); prR(g, x + 8, y + 7 - hop, 1, 1, IC.o); prR(g, x + 5, y + 9 - hop, 2, 2, PR.birdd);
    if (sing) for (let i = 0; i < 2; i++) { const u = ((t / 900) + i / 2) % 1; g.globalAlpha = 1 - u; prR(g, x + 13 + u * 6, y + 4 - u * 8 + i * 2, 2, 2, "#2a2030"); prR(g, x + 14 + u * 6, y + 1 - u * 8 + i * 2, 1, 3, "#2a2030"); g.globalAlpha = 1; } },
  // portrait du prince Élu, cadre doré, couronne de fleurs séchées (mur). st.small : la petite image pieuse de la chambre d'Élio
  portrait_prince(g, x, y, w, h, t, night, st) { const s = st && st.small, W = s ? 10 : w - 4, H = s ? 12 : h - 6, X = x + (w - W) / 2, Y = y + 2;
    box(g, X, Y, W, H, s ? PR.paper : PR.gold); box(g, X + 2, Y + 2, W - 4, H - 4, "#3a4a7a");
    const cx = X + W / 2, hy = Y + H * .42; prR(g, cx - 2, hy - 2, 4, 5, "#f4d4b4"); prR(g, cx - 3, hy - 4, 6, 2, PR.gold); prR(g, cx - 3, hy + 3, 6, H * .3, "#f4f0e6"); prR(g, cx - 2, hy, 1, 1, IC.o); prR(g, cx + 1, hy, 1, 1, IC.o);
    if (!s) { [[1, 0], [W - 3, 1], [0, H - 3], [W - 2, H - 4], [W / 2 - 1, -1]].forEach(([a, b], i) => { prR(g, X + a, Y + b, 3, 3, ["#c86a7a", "#d8b048", "#9a6aa8"][i % 3]); prR(g, X + a + 1, Y + b + 1, 1, 1, "#7a4a3a"); }); } },
  // balai appuyé au mur ; st.tas : les mèches poussées en petit tas devant
  balai(g, x, y, w, h, t, night, st) { prR(g, x + 7, y - 6, 2, h, IC.woodk); prR(g, x + 7, y - 6, 1, h, IC.wood); box(g, x + 3, y + h - 8, 10, 8, PR.hayd); for (let k = 0; k < 4; k++) prR(g, x + 4 + k * 2, y + h - 6, 1, 6, PR.hay);
    if (st && st.tas) { box(g, x + 12, y + h - 4, 7, 4, "#6a4632"); prR(g, x + 13, y + h - 4, 3, 1, "#9a6a48"); } },
  // rideau de l'arrière-boutique (mur, porte) ; st.open : écarté
  rideau(g, x, y, w, h, t, night, st) { prR(g, x, y, w, 2, IC.woodk); const o = st && st.open ? 6 : 0;
    for (let k = 0; k < (w - o) / 3; k++) { const px = x + 1 + k * 3 + (k > (w - o) / 6 ? o : 0); prR(g, px, y + 2, 3, h - 2, k % 2 ? "#8e3030" : "#b44a3a"); prR(g, px + 2, y + 2, 1, h - 2, "#6a2424"); }
    if (o) prR(g, x + w / 2 - 3, y + 2, 6, h - 2, "#1a1418"); },
  // ---- maison du héros ----
  // tresses d'ail suspendues (mur)
  tresses_ail(g, x, y, w, h) { prR(g, x + 7, y + 1, 2, 2, PR.metald); prR(g, x + 7, y + 3, 2, h - 5, PR.hayd);
    for (let k = 0; k < Math.floor((h - 6) / 3); k++) { const a = x + 3 + (k % 2) * 5, b = y + 4 + k * 3; cuEll(g, a + 3, b + 2, 3, 2.4, (nx, ny) => nx + ny < -.3 ? "#ffffff" : nx + ny > .5 ? "#c8b898" : "#f0e8d8"); prR(g, a + 3, b - 1, 1, 1, "#a89870"); } },
  // le bol du gardien de la maison, près du poêle ; st.etat : "plein" | "bu" | "retourne" ; st.pain : le quignon posé à côté
  bol_gardien(g, x, y, w, h, t, night, st) { const e = (st && st.etat) || "plein";
    if (e === "retourne") { box(g, x + 4, y + 7, 8, 4, IC.cloth); prR(g, x + 5, y + 7, 6, 1, "#ffffff"); prR(g, x + 7, y + 6, 2, 1, IC.clothd); }
    else { box(g, x + 4, y + 6, 8, 5, IC.cloth); prR(g, x + 5, y + 6, 6, 2, e === "plein" ? IC.milk : "#c8bca8"); if (e === "bu") prR(g, x + 6, y + 7, 2, 1, IC.milk); prR(g, x + 5, y + 9, 6, 1, IC.clothd); }
    if (st && st.pain) { box(g, x + 11, y + 8, 5, 4, "#c8904a"); prR(g, x + 12, y + 8, 2, 1, "#e8b070"); } },
  // le quignon de pain, seul
  pain(g, x, y) { box(g, x + 4, y + 6, 8, 6, "#c8904a"); prR(g, x + 5, y + 6, 5, 2, "#e8b070"); prR(g, x + 6, y + 9, 3, 1, "#8a5a28"); },
  // les sabots du héros devant la porte ; st.etat : "normaux" | "cires" (ils brillent) | "un" (il en manque un)
  sabots(g, x, y, w, h, t, night, st) { const e = (st && st.etat) || "normaux", sh = e === "cires";
    [[x + 2, y + 7], [x + 9, y + 8]].forEach(([a, b], i) => { if (e === "un" && i === 1) return; box(g, a, b, 6, 6, sh ? "#b07a40" : "#9a6a40"); box(g, a + 1, b, 4, 3, "#4e3020"); if (sh) { prR(g, a + 1, b + 4, 2, 1, "#ffe0a0"); if (Math.floor(t / 400) % 3 === i) prR(g, a + 4, b + 3, 1, 1, "#ffffff"); } }); },
  // seau à cendres ; st.sabot : le sabot disparu est dedans
  seau_cendres(g, x, y, w, h, t, night, st) { box(g, x + 3, y + 5, 10, 10, "#6a6a78"); prR(g, x + 3, y + 8, 10, 1, "#4a4a56"); prR(g, x + 4, y + 5, 8, 2, "#8a8490"); prR(g, x + 5, y + 5, 2, 1, "#b0aab4");
    if (st && st.sabot) { box(g, x + 5, y + 2, 6, 5, "#9a6a40"); prR(g, x + 6, y + 2, 4, 2, "#4e3020"); } prR(g, x + 2, y + 3, 1, 4, PR.metald); prR(g, x + 13, y + 3, 1, 4, PR.metald); },
  // dessins au charbon sur le mur de la chambre : le seul retour visible des jauges. st = { guerrier, mage, voleur } de 0 à 5
  dessins_mur(g, x, y, w, h, t, night, st) { const s = st || {}, C = PR.charcoal, d = (a, b, c = C) => prR(g, a, b, 1, 1, c);
    const stick = (cx, cy) => { d(cx, cy - 4); d(cx - 1, cy - 4); d(cx, cy - 3); d(cx - 1, cy - 3); for (let k = -2; k < 3; k++) d(cx, cy + k); d(cx - 1, cy + 3); d(cx + 1, cy + 3); d(cx - 2, cy - 1); d(cx + 2, cy - 1); };
    const gv = s.guerrier || 0, mv = s.mage || 0, vv = s.voleur || 0;
    if (gv) { const cx = x + 5, cy = y + 10; stick(cx, cy); if (gv >= 2) for (let k = 0; k < 5; k++) d(cx + 3, cy - 4 + k); if (gv >= 3) { d(cx - 3, cy - 2); d(cx - 3, cy - 1); d(cx - 4, cy - 1); d(cx - 4, cy); } if (gv >= 4) { d(cx - 1, cy - 6); d(cx, cy - 6); d(cx + 1, cy - 6); } if (gv >= 5) { d(cx - 3, cy + 4, "#b23a36"); d(cx + 3, cy + 4, "#b23a36"); } }
    if (mv) { const cx = x + w / 2, cy = y + 10; stick(cx, cy); if (mv >= 2) { d(cx - 1, cy - 6); d(cx, cy - 7); d(cx + 1, cy - 6); d(cx, cy - 5); } if (mv >= 3) for (let k = 0; k < 6; k++) d(cx + 3, cy - 3 + k); if (mv >= 4) { d(cx + 4, cy - 5, "#6a8ad0"); d(cx + 5, cy - 6, "#6a8ad0"); d(cx + 3, cy - 6, "#6a8ad0"); } if (mv >= 5) { d(cx - 4, cy - 6, "#d8b048"); d(cx + 6, cy - 2, "#d8b048"); } }
    if (vv) { const cx = x + w - 5, cy = y + 10; stick(cx, cy); if (vv >= 2) { d(cx - 2, cy - 5); d(cx - 1, cy - 5); d(cx, cy - 5); d(cx + 1, cy - 5); d(cx + 2, cy - 5); } if (vv >= 3) { d(cx + 3, cy); d(cx + 4, cy + 1); } if (vv >= 4) { d(cx - 3, cy + 2, "#d8b048"); d(cx - 4, cy + 2, "#d8b048"); } if (vv >= 5) { d(cx - 1, cy - 3, "#2a2030"); d(cx, cy - 3, "#2a2030"); d(cx + 1, cy - 3, "#2a2030"); } } },
  // coffre à jouets ouvert : épée de bois, étoile en papier, masque de chiffon
  coffre_jouets(g, x, y, w, h) { box(g, x + 1, y + 6, w - 2, h - 6, IC.wood); prR(g, x + 2, y + 9, w - 4, 1, IC.woodd); box(g, x + 1, y, w - 2, 5, IC.woodd);
    prR(g, x + 5, y + 2, 1, 8, "#c8945e"); prR(g, x + 3, y + 7, 5, 1, "#7a4e30");                                                     // épée
    prR(g, x + 12, y + 4, 5, 1, PR.gold); prR(g, x + 14, y + 2, 1, 5, PR.gold); prR(g, x + 13, y + 3, 3, 3, "#f4e090");                // étoile
    box(g, x + w - 10, y + 4, 7, 5, "#d8c8b0"); prR(g, x + w - 9, y + 6, 1, 1, IC.o); prR(g, x + w - 6, y + 6, 1, 1, IC.o); },          // masque
  // ---- chez Grand-mère Ysol ----
  // le rouet ; st.spin : la roue tourne
  rouet(g, x, y, w, h, t, night, st) { const cx = x + 10, cy = y + 9, a = st && st.spin ? t / 300 : 0;
    for (let k = 0; k < 40; k++) { const an = k / 40 * 6.283; prR(g, cx + Math.cos(an) * 8, cy + Math.sin(an) * 8, 1, 1, IC.woodk); }
    for (let k = 0; k < 4; k++) { const an = a + k * .785; for (let r = -7; r <= 7; r++) prR(g, cx + Math.cos(an) * r, cy + Math.sin(an) * r, 1, 1, IC.wood); }
    box(g, cx - 2, cy - 2, 4, 4, IC.woodd); prR(g, x + 2, y + 18, w - 4, 3, IC.woodd); prR(g, x + 3, cy, 1, 11, IC.woodk); prR(g, x + w - 4, y + 4, 1, 15, IC.woodk); box(g, x + w - 7, y + 2, 6, 4, "#e8e0d0"); },
  // bouquets d'herbes séchées au plafond (au-dessus)
  herbes(g, x, y, w, h, t) { prR(g, x, y + 1, w, 1, IC.woodk); for (let k = 0; k < Math.floor(w / 6); k++) { const a = x + 2 + k * 6, sw = Math.round(Math.sin(t / 900 + k) * .6);
    prR(g, a + 1, y + 2, 1, 3, "#8a6a40"); box(g, a - 1 + sw, y + 5, 5, 7, ["#6a8a4a", "#8a7a4a", "#7a5a6a"][k % 3]); prR(g, a + sw, y + 6, 1, 5, "#a8b870"); } },
  // pot de miel
  pot_miel(g, x, y) { box(g, x + 4, y + 5, 8, 9, "#c88a30"); prR(g, x + 5, y + 6, 2, 6, "#f0c060"); box(g, x + 3, y + 3, 10, 3, "#e8e0d0"); prR(g, x + 7, y + 1, 1, 3, IC.woodk); },
  // le cahier de comptines, ouvert
  cahier(g, x, y) { box(g, x + 1, y + 6, 14, 8, PR.paperd); prR(g, x + 2, y + 7, 5, 6, PR.paper); prR(g, x + 9, y + 7, 5, 6, PR.paper); prR(g, x + 8, y + 6, 1, 8, IC.woodk);
    for (let k = 0; k < 3; k++) { prR(g, x + 3, y + 8 + k * 2, 3, 1, "#6a6a7a"); prR(g, x + 10, y + 8 + k * 2, 3, 1, "#6a6a7a"); } },
  // table à longue nappe, jusqu'au sol (un enfant peut s'y cacher)
  table_nappe(g, x, y, w, h, t, night, st) { box(g, x, y + 2, w, h - 2, "#e8dcc8"); prR(g, x + 1, y + 3, w - 2, 3, "#fff6e4"); for (let k = x + 4; k < x + w - 2; k += 6) prR(g, k, y + 7, 1, h - 8, "#c8bca4");
    prR(g, x + 1, y + h - 2, w - 2, 1, "#c8bca4"); for (let k = x + 2; k < x + w - 1; k += 4) prR(g, k, y + h - 1, 2, 1, "#c84a3a"); },
  // ---- moulin ----
  // bouteilles vides (sur la table) ; st.couchee : une couchée
  bouteilles(g, x, y, w, h, t, night, st) { [[x + 3, 0], [x + 8, 1], [x + 12, 0]].forEach(([a, k], i) => { if (st && st.couchee && i === 1) { box(g, a - 2, y + 11, 9, 4, "#3a6a4a"); prR(g, a + 6, y + 12, 2, 2, "#2a4a34"); prR(g, a - 1, y + 12, 5, 1, "#7aaa8a"); return; }
    box(g, a, y + 5 + k, 4, 9, "#3a6a4a"); prR(g, a + 1, y + 2 + k, 2, 3, "#2a4a34"); prR(g, a + 1, y + 6 + k, 1, 5, "#7aaa8a"); }); },
  // le poêle avec les restes des tresses dans la cendre (porte ouverte)
  poele_tresses(g, x, y, w, h, t) { box(g, x + 1, y + 2, w - 2, h - 2, "#3a3440"); prR(g, x + 2, y + 3, w - 4, 2, "#5a5466"); box(g, x + 4, y + 7, w - 8, h - 10, "#1a1418");
    prR(g, x + 5, y + h - 5, w - 10, 2, "#6a6460"); for (let k = 0; k < 4; k++) prR(g, x + 6 + k * 2, y + h - 6 - (k % 2), 2, 1, k % 2 ? "#d8b060" : "#a8803e");
    if (Math.floor(t / 300) % 4 === 0) prR(g, x + 8, y + h - 7, 1, 1, "#e0602a"); prR(g, x + w / 2 - 1, y - 6, 3, 8, "#3a3440"); },
  // petit miroir (mur) et dessin d'une femme aux longues tresses punaisé (mur)
  petit_miroir(g, x, y) { box(g, x + 4, y + 2, 8, 10, IC.woodd); prR(g, x + 5, y + 3, 6, 8, "#a8c8d8"); prR(g, x + 6, y + 4, 2, 3, "#e8f4f8"); },
  dessin_femme(g, x, y) { box(g, x + 3, y + 1, 11, 13, PR.paper); prR(g, x + 8, y, 1, 1, "#b23a36"); const C = PR.charcoal;
    prR(g, x + 7, y + 4, 3, 3, C); prR(g, x + 8, y + 5, 1, 1, PR.paper); prR(g, x + 6, y + 5, 1, 7, "#a8803e"); prR(g, x + 10, y + 5, 1, 7, "#a8803e"); prR(g, x + 7, y + 8, 3, 4, C); },
  // le lit vide, le drap traîné jusqu'au sol
  lit_vide(g, x, y, w, h) { box(g, x, y + 2, w, h - 2, IC.woodd); box(g, x + 2, y + 4, w - 4, 6, IC.cloth); box(g, x + 2, y + 10, w - 4, h - 12, "#d8d0c0");
    for (let k = 0; k < 6; k++) prR(g, x + w - 6 + k, y + h - 6 + k, 6, 2, k % 2 ? IC.clothd : IC.cloth); prR(g, x + 4, y + 13, w - 8, 1, "#b8b0a0"); },
  // fenêtre grande ouverte, rideau qui bat, la nuit
  fenetre_ouverte(g, x, y, w, h, t, night, st) { box(g, x, y, w, h - 4, IC.woodd); prR(g, x + 2, y + 2, w - 4, h - 8, night ? IC.night : IC.glass);
    if (night) prR(g, x + w - 8, y + 4, 3, 3, IC.moon); const sw = Math.sin(t / 260) * 3 + Math.sin(t / 110);
    for (let k = 0; k < h - 6; k++) prR(g, x + 2 + Math.max(0, sw * k / (h - 6)), y + 2 + k, 4, 1, k % 3 ? "#e8e0d0" : "#c8bca8");
    prR(g, x - 1, y + h - 5, w + 2, 2, IC.wood); if (st && st.cheveux) for (let k = 0; k < 7; k++) prR(g, x + 4 + k * 2, y + h - 4 + (k % 2), 2, 1, "#100c16"); },
  // la tresse de paille clouée au-dessus des portes, contre la Rancunière
  tresse_paille(g, x, y) { prR(g, x + 7, y + 1, 2, 2, PR.metald); for (let k = 0; k < 5; k++) { box(g, x + 5 + (k % 2), y + 3 + k * 2, 5, 3, k % 2 ? PR.hayd : PR.hay); } prR(g, x + 6, y + 13, 1, 2, PR.hay); prR(g, x + 9, y + 13, 1, 2, PR.hay); },
  // le cercueil, vu de dessus ; st.ouvert : le couvercle posé à côté ; st.contenu : "corps" | "vide" | "eau" (l'eau rouge) ; st.fleurs
  cercueil(g, x, y, w, h, t, night, st) { const W = Math.min(w, 32), H = Math.min(h, 14), c = (st && st.contenu) || "corps";
    if (st && st.ouvert) { box(g, x, y + 2, W, H, "#6a4630"); prR(g, x + 2, y + 4, W - 4, H - 4, "#2a1a14");
      if (c === "corps") { prR(g, x + 3, y + 6, 6, 6, "#f0c8a0"); prR(g, x + 3, y + 6, 6, 1, "#c89878"); prR(g, x + 9, y + 5, W - 13, H - 6, "#e8e0d0"); prR(g, x + 9, y + 9, W - 13, 1, "#c8bca8"); }
      else if (c === "eau") for (let i = 0; i < W - 4; i++) prR(g, x + 2 + i, y + 10 + (i % 5 === 0 ? 1 : 0), 1, H - 10 - (i % 5 === 0 ? 1 : 0), "#7a1e22");
      box(g, x + 4, y + H + 3, W, 5, "#6a4630"); prR(g, x + 5, y + H + 4, W - 2, 1, "#8a5e40"); prR(g, x + 4 + W / 2 - 1, y + H + 4, 2, 3, "#d8c8a0"); }
    else { box(g, x, y + 2, W, H, "#6a4630"); prR(g, x + 1, y + 3, W - 2, 2, "#8a5e40"); prR(g, x + W / 2 - 1, y + 4, 2, H - 6, "#d8c8a0"); prR(g, x + W / 2 - 3, y + 6, 6, 2, "#d8c8a0"); }
    if (st && st.fleurs) [[4, 1], [W - 7, 2], [W / 2 + 4, 0]].forEach(([a, b], i) => { prR(g, x + a, y + b, 3, 3, ["#f2d038", "#ffffff", "#c86a7a"][i]); }); },
});
["clochette", "flacons", "portrait_prince", "rideau", "tresses_ail", "dessins_mur", "petit_miroir", "dessin_femme", "fenetre_ouverte", "tresse_paille", "canari"].forEach(k => WALL_TYPES.add(k));

// ---------- Décors d'extérieur (carte) ----------
// le grand chêne de la place ; o.margot : elle est perchée dedans ; o.glands : des glands tombent quand on passe dessous
function drawOak(ctx, x, y, t, o = {}) {
  ctx.fillStyle = "rgba(26,58,42,.25)"; ctx.fillRect(x - 30, y - 4, 60, 8);
  box(ctx, x - 6, y - 30, 12, 30, "#6a4428"); fill(ctx, "#8a5a38", x - 5, y - 29, 3, 28); fill(ctx, "#4e3020", x + 2, y - 26, 2, 22);
  fill(ctx, "#6a4428", x - 16, y - 42, 12, 4); fill(ctx, "#6a4428", x + 4, y - 46, 12, 4);                                            // branches
  const tufts = [[-22, -56, 16], [0, -66, 18], [22, -56, 16], [-12, -44, 14], [14, -44, 14], [0, -50, 14]];
  tufts.forEach(([a, b, r]) => cuEll(ctx, x + a, y + b, r + 1, r * .8 + 1, IC.o));
  tufts.forEach(([a, b, r], i) => cuEll(ctx, x + a, y + b + Math.round(Math.sin(t / 1300 + i) * .5), r, r * .8, (nx, ny, X, Y) => cuTone(.62 - nx * .25 - ny * .3, X, Y, ["#2a5a32", "#3e7a3e", "#5a9a4a", "#7eb85a"])));
  if (o.margot) { const ch = CHARS.margot, swing = Math.round(Math.sin(t / 700)); drawSprite(ctx, charFrame(ch, "S", "idle", 0).slice(0, 20), { ...PAL, ...CH_PAL, ...ch.spec.pal }, x + 6 + swing, y - 66);
    cuEll(ctx, x + 18, y - 48, 9, 6, (nx, ny, X, Y) => cuTone(.55 - ny * .3, X, Y, ["#2a5a32", "#3e7a3e", "#5a9a4a"])); fill(ctx, "#4e3020", x + 12, y - 46, 2, 1); }   // des feuilles la cachent à moitié
  if (o.glands) for (let i = 0; i < 4; i++) { const u = ((t / 1100) + i * .27) % 1; if (u > .85) continue; const gx = x - 14 + i * 9, gy = y - 40 + u * 44;
    fill(ctx, "#6a4428", gx, gy, 2, 2); fill(ctx, "#9a6a38", gx, gy + 2, 2, 1); }
}
// un buisson ; o.pieds : les pieds de Basile dépassent, et bougent un peu
function drawHideBush(ctx, x, y, t, o = {}) {
  if (o.pieds) { const w = Math.floor(t / 600) % 4 === 0 ? 1 : 0; box(ctx, x - 8 + w, y - 4, 5, 4, "#7a4a2c"); box(ctx, x - 2, y - 4, 5, 4, "#7a4a2c"); fill(ctx, "#a86c40", x - 7 + w, y - 3, 2, 1); fill(ctx, "#7a6a50", x - 7 + w, y - 6, 3, 2); fill(ctx, "#7a6a50", x - 1, y - 6, 3, 2); }
  drawBush ? drawBush(ctx, t, x + 4, y - 2, 37, 11) : cuEll(ctx, x, y - 10, 12, 9, "#3e7a3e");
}
// la caisse sous la fenêtre de Margot, et les traces de pas sur le mur (x, y = pied du mur sous la fenêtre)
function drawMargotCrate(ctx, x, y) { box(ctx, x - 7, y - 10, 14, 10, IC.wood); fill(ctx, IC.woodd, x - 6, y - 5, 12, 1); fill(ctx, IC.woodl, x - 6, y - 9, 12, 1);
  [[-3, -14], [2, -18], [-2, -22]].forEach(([a, b]) => { fill(ctx, "#6a5a48", x + a, y + b, 3, 2); fill(ctx, "#6a5a48", x + a + 1, y + b - 1, 1, 1); }); }
// une traînée de cheveux mouillés au sol, le long d'un chemin de points (nuit 3)
function drawWetHairTrail(ctx, pts, t) { for (let k = 0; k < pts.length - 1; k++) { const [x0, y0] = pts[k], [x1, y1] = pts[k + 1], n = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
  for (let s = 0; s < n; s++) { const u = s / n, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u; for (let i = -2; i <= 2; i++) fill(ctx, (s + i) % 5 === 0 ? "#3e3858" : "#100c16", Math.round(x + i * .4), Math.round(y + i + Math.sin(s * .5 + i) * .8), 1, 1);
    if ((s + k * 7) % 23 === 0) fill(ctx, "#6a8ab0", Math.round(x + 2), Math.round(y - 2), 1, 1); } } }
// une lanterne tenue (fouilles) : halo qui vacille ; (x, y) = la lanterne
function drawLantern(ctx, x, y, t) { const f = .5 + .2 * Math.sin(t / 90) + .1 * Math.sin(t / 37); ctx.globalAlpha = .18 * f + .08; cuEll(ctx, x, y + 2, 26, 18, "#ffd890"); ctx.globalAlpha = .3 * f;
  cuEll(ctx, x, y + 2, 12, 9, "#ffe8b0"); ctx.globalAlpha = 1; box(ctx, x - 2, y - 3, 5, 6, "#ffd06a"); fill(ctx, "#fff4c0", x - 1, y - 1, 2, 2); fill(ctx, IC.iron, x - 2, y - 5, 5, 2); fill(ctx, IC.iron, x, y - 7, 1, 2); }
// la balle de la rivière : (x, y) = au sol ou à la surface, z = hauteur ; o.water : rebond sur l'eau (éclaboussure)
function drawBall(ctx, x, y, z = 0, o = {}) { ctx.globalAlpha = .25; fill(ctx, "#1a2a3a", Math.round(x) - 3, Math.round(y), 7, 2); ctx.globalAlpha = 1;
  const X = Math.round(x), Y = Math.round(y - z - 6); box(ctx, X - 3, Y, 7, 7, "#d84a3a"); fill(ctx, "#f4ead2", X - 2, Y + 3, 5, 1); fill(ctx, "#f07a5a", X - 2, Y + 1, 2, 1);
  if (o.water && z < 2) [[-5, -2], [5, -3], [-3, -4], [4, -1]].forEach(([a, b]) => fill(ctx, "#ffffff", X + a, Y + 6 + b, 1, 1)); }
// coin de rivière peu profond (où l'on se baigne) : eau claire, galets visibles, petites vagues ; (x, y, w, h) zone en pixels
function drawShallows(ctx, x, y, w, h, t) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const d = Math.min(i, j, w - 1 - i, h - 1 - j), deep = Math.min(1, d / 18);
  fill(ctx, cuTone(.75 - deep * .5 + Math.sin((i + t / 60) / 9 + j / 5) * .06, x + i, y + j, ["#2a5e94", "#3a7cb6", "#5aa0d0", "#8ac8e8"]), x + i, y + j, 1, 1); }
  for (let k = 0; k < w * h / 220; k++) { const gx = x + cuH(k * 3.3) * w, gy = y + cuH(k * 5.1) * h; fill(ctx, "#7a9ab0", Math.round(gx), Math.round(gy), 3, 2); fill(ctx, "#a8c4d4", Math.round(gx), Math.round(gy), 1, 1); }
  for (let k = 0; k < 10; k++) { const u = ((t / 2400) + k / 10) % 1, gx = x + cuH(k * 7.7) * w, gy = y + cuH(k * 2.9) * h; ctx.globalAlpha = 1 - u; fill(ctx, "#ffffff", Math.round(gx + u * 6), Math.round(gy), 3, 1); ctx.globalAlpha = 1; } }
// cimetière : une tombe ; kind "croix" | "stele" | "fraiche" (terre retournée, la fosse ouverte si o.fosse)
function drawGrave(ctx, x, y, kind = "croix", o = {}) {
  if (kind === "fraiche") { box(ctx, x - 14, y - 8, 28, 10, "#5a4026"); fill(ctx, "#7a5a36", x - 12, y - 7, 24, 2); if (o.fosse) { box(ctx, x - 11, y - 6, 22, 7, "#1e140c"); box(ctx, x - 16, y - 14, 10, 6, "#6a4a2c"); } return; }
  ctx.globalAlpha = .22; fill(ctx, "#1a3a2a", x - 7, y - 2, 14, 3); ctx.globalAlpha = 1;
  if (kind === "croix") { box(ctx, x - 2, y - 18, 4, 18, "#7a7a86"); box(ctx, x - 6, y - 14, 12, 4, "#7a7a86"); fill(ctx, "#a4a4b0", x - 1, y - 17, 1, 16); }
  else { box(ctx, x - 6, y - 14, 12, 14, "#8a8a94"); fill(ctx, "#8a8a94", x - 5, y - 16, 10, 2); fill(ctx, "#b4b4be", x - 5, y - 13, 2, 11); fill(ctx, "#5a5a66", x - 3, y - 10, 6, 1); fill(ctx, "#5a5a66", x - 3, y - 7, 6, 1);
    fill(ctx, "#4a7a3e", x - 6, y - 3, 3, 3); }
}
// ---------- Icônes d'inventaire 16 × 16 ----------
const ICONS = {
  ciseaux(g, x, y) { [[3, 11], [8, 12]].forEach(([a, b]) => { box(g, x + a, y + b - 2, 5, 5, "#b23a36"); fill(g, "#2a2030", x + a + 1, y + b - 1, 3, 3); fill(g, "#e85a4a", x + a + 1, y + b - 2, 2, 1); });
    fill(g, IC.o, x + 6, y + 1, 3, 10); fill(g, PR.metall, x + 7, y + 2, 1, 8); fill(g, IC.o, x + 9, y + 2, 3, 9); fill(g, PR.metal, x + 10, y + 3, 1, 7); fill(g, PR.gold, x + 8, y + 8, 2, 2); },
  ruban(g, x, y) { fill(g, IC.o, x + 2, y + 3, 12, 6); fill(g, PR.ribbon, x + 3, y + 4, 10, 4); fill(g, "#5a9ad6", x + 3, y + 4, 10, 1);
    fill(g, IC.o, x + 9, y + 8, 4, 6); fill(g, PR.ribbond, x + 10, y + 9, 2, 4); fill(g, IC.o, x + 4, y + 8, 4, 5); fill(g, PR.ribbond, x + 5, y + 9, 2, 3); fill(g, PR.burn, x + 2, y + 4, 3, 4); fill(g, "#e0602a", x + 3, y + 5, 1, 1); fill(g, "#5a4a3a", x + 5, y + 7, 2, 1); },
  baton(g, x, y) { for (let k = 0; k < 13; k++) { fill(g, IC.o, x + 1 + k, y + 13 - k, 3, 3); } for (let k = 0; k < 13; k++) { fill(g, k % 4 === 1 ? "#a8784c" : "#7a4e30", x + 2 + k, y + 13 - k, 1, 1); fill(g, "#5a3a24", x + 3 + k, y + 13 - k, 1, 1); } fill(g, "#4a7a3e", x + 5, y + 8, 2, 2); },
  oeuf(g, x, y) { drawSmallEgg(g, x + 6, y + 5); },
  pain(g, x, y) { FURNI.pain(g, x, y - 2); },
};
function drawIcon(ctx, id, x, y) { ICONS[id](ctx, x, y); }
