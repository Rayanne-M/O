// ---------- Poses spéciales, pour n'importe quel personnage du gabarit (chars.js) ----------
//   drawCharWading(ctx, ch, x, y, o)  dans l'eau jusqu'à la taille ; o = { dir, t, moving, splash } ; l'eau bouge et éclabousse quand il marche
//   drawCharPose(ctx, ch, x, y, pose, o)  pose : "assis_genoux" (assis par terre, bras autour des genoux, vu de face)
//        | "a_genoux" (agenouillé) | "affale" (endormi assis, la tête sur les bras, vu de face) | "assis_serviette" (assis, une serviette chaude sur le visage)
//        | "assis_lit" (assis dans un lit : seulement le haut du corps, la couverture est dessinée par le lit) | "allonge" (couché sur le dos, vu de dessus)
//        | "tambourine" (bras levé qui frappe à une porte, 2 images) | "bras_ouverts" (le héros tend les bras, pour le ruban ou la balle)
//   drawCharMark(ctx, ch, x, y, o, mark)  une marque posée sur le sprite : "tache_paume" (la tache d'araignée écrasée, jusqu'au soir)
// Comme drawChar, (x, y) est le coin haut-gauche d'une case de 24 px de large et de la hauteur du personnage.
const POSE_CACHE = {};
function poseRows(ch, pose, f = 0) {
  const key = ch.spec.id + pose + f; if (POSE_CACHE[key]) return POSE_CACHE[key];
  const spec = ch.spec, b = CH_BODY[spec.age || "child"], o = spec.outfit || {}, H = chHairStyle(spec.hair), child = b.H === 27;
  const g = chGrid(b.H), head = chGrid(16);
  const paste = dy => { for (let y = 0; y < 16; y++) for (let x = 0; x < CH_W; x++) if (head[y][x] !== "." && g[y + dy]) g[y + dy][x] = head[y][x]; };
  if (pose === "assis_genoux" || pose === "a_genoux" || pose === "assis_lit" || pose === "assis_serviette" || pose === "tambourine" || pose === "bras_ouverts") {
    const drop = pose === "assis_genoux" ? (child ? 5 : 8) : pose === "a_genoux" ? (child ? 3 : 6) : pose === "assis_serviette" ? (child ? 3 : 5) : 0;
    chHairBack(g, "S", H, b);
    const tb = { ...b, torso: [b.torso[0] + drop, Math.min(b.H - 3, b.torso[1] + drop)], arm: [b.arm[0] + drop, b.arm[1] + drop], hand: b.hand + drop };
    const cx = 12, w = b.tw, [t0, t1] = tb.torso;
    chRect(g, cx - w + 2, 14 + drop, cx + w - 3, 15 + drop, "s"); chRect(g, cx - w, t0, cx + w - 1, Math.min(t1, b.H - 2), "c");
    if (pose === "assis_genoux") {      // genoux remontés devant le torse, bras qui les entourent, pieds devant
      chEll(g, cx - 3.5, t0 + 4, 3.4, 3, "p"); chEll(g, cx + 3, t0 + 4, 3.4, 3, "p");
      chRect(g, cx - w - 1, t0 + 3, cx + w, t0 + 4, "c"); chRect(g, cx - 2, t0 + 4, cx + 1, t0 + 4, "s");
      chRect(g, cx - 7, b.H - 3, cx - 3, b.H - 2, "B"); chRect(g, cx + 2, b.H - 3, cx + 6, b.H - 2, "B");
    } else if (pose === "a_genoux") {   // cuisses au sol, pieds derrière
      chRect(g, cx - w - 2, tb.arm[0], cx - w - 2, tb.hand - 1, "c"); chRect(g, cx + w + 1, tb.arm[0], cx + w + 1, tb.hand - 1, "c"); chRect(g, cx - w - 2, tb.hand, cx - w - 2, tb.hand, "s"); chRect(g, cx + w + 1, tb.hand, cx + w + 1, tb.hand, "s");
      chRect(g, cx - w + 1, b.H - 4, cx + w - 2, b.H - 2, "p"); chRect(g, cx - w, b.H - 2, cx - w + 2, b.H - 2, "B"); chRect(g, cx + w - 3, b.H - 2, cx + w - 1, b.H - 2, "B");
    } else if (pose === "tambourine") { // un bras levé (le poing en haut), l'autre le long du corps ; f = 0 ou 1
      const up = f ? 2 : 0; chRect(g, cx + w + 1, 8 + up, cx + w + 2, t0 + 2, "c"); chRect(g, cx + w + 1, 6 + up, cx + w + 2, 7 + up, "s");
      chRect(g, cx - w - 2, b.arm[0], cx - w - 2, b.arm[1], "c"); chRect(g, cx - w - 2, b.hand, cx - w - 2, b.hand, "s");
      [[cx - 6, 0], [cx + 3, 0]].forEach(([lx]) => { chRect(g, lx, b.legs[0], lx + 2, b.legs[1], "p"); chRect(g, lx, b.shoe[0], lx + 2, b.shoe[1], "B"); });
    } else if (pose === "bras_ouverts") { // les deux bras tendus devant, mains ouvertes
      chRect(g, cx - w - 2, b.arm[0], cx - w - 1, b.arm[0] + 2, "c"); chRect(g, cx + w, b.arm[0], cx + w + 1, b.arm[0] + 2, "c");
      chRect(g, cx - 4, b.arm[0] + 3, cx - 2, b.arm[0] + 4, "s"); chRect(g, cx + 1, b.arm[0] + 3, cx + 3, b.arm[0] + 4, "s"); chRect(g, cx - w, b.arm[0] + 2, cx - 4, b.arm[0] + 2, "c"); chRect(g, cx + 3, b.arm[0] + 2, cx + w - 1, b.arm[0] + 2, "c");
      [[cx - 6, 0], [cx + 3, 0]].forEach(([lx]) => { chRect(g, lx, b.legs[0], lx + 2, b.legs[1], "p"); chRect(g, lx, b.shoe[0], lx + 2, b.shoe[1], "B"); });
    } else if (pose === "assis_serviette") { // assis au fauteuil : jambes vers l'avant (raccourcies)
      chRect(g, cx - w - 2, tb.arm[0], cx - w - 2, tb.hand, "c"); chRect(g, cx + w + 1, tb.arm[0], cx + w + 1, tb.hand, "c");
      chRect(g, cx - 6, b.H - 5, cx - 3, b.H - 3, "p"); chRect(g, cx + 2, b.H - 5, cx + 5, b.H - 3, "p"); chRect(g, cx - 6, b.H - 2, cx - 3, b.H - 2, "B"); chRect(g, cx + 2, b.H - 2, cx + 5, b.H - 2, "B");
    } else { chRect(g, cx - w - 2, tb.arm[0], cx - w - 2, tb.arm[0] + 3, "c"); chRect(g, cx + w + 1, tb.arm[0], cx + w + 1, tb.arm[0] + 3, "c"); }
    chHead(head, "S", spec, b); paste(drop);
    if (H.style === "hero") chHeroLocks(g, "S", H, b); else chHairFront(g, "S", H, b);
    if (pose === "assis_serviette") { chEll(g, 11.5, 8 + drop, 9, 7.5, "q"); chRect(g, 3, 9 + drop, 20, 14 + drop, "q"); }
    if (pose === "assis_lit") for (let y = t0 + 4; y < b.H; y++) g[y] = Array(CH_W).fill(".");
  } else if (pose === "affale") {        // vu de face, assis à une table : le dessus de la tête posé sur les bras croisés
    const by = child ? 15 : 18;
    chRect(g, 3, by, 20, by + 4, "c"); chRect(g, 4, by + 5, 19, b.H - 4, "c");
    chHead(head, "N", spec, b); for (let y = 0; y < 16; y++) for (let x = 0; x < CH_W; x++) if (head[y][x] !== "." && g[y + by - 13]) g[y + by - 13][x] = head[y][x];
    chRect(g, 3, by + 3, 20, by + 4, "c"); chRect(g, 2, by + 3, 3, by + 4, "s"); chRect(g, 20, by + 3, 21, by + 4, "s");
    for (let y = 0; y < by - 8; y++) g[y] = Array(CH_W).fill(".");
  } else if (pose === "allonge") {       // vu de dessus : la vue de face posée à plat (le jeu la tourne si besoin)
    return (POSE_CACHE[key] = charFrame(ch, "S", "idle", 0));
  }
  return (POSE_CACHE[key] = chRows(g));
}
function drawCharPose(ctx, ch, x, y, pose, o = {}) {
  const pal = { ...PAL, ...CH_PAL, ...(ch.spec.pal || {}), ...(o.pal || {}) }, f = pose === "tambourine" ? Math.floor((o.t || 0) / 160) % 2 : 0;
  if (pose === "allonge") { const rows = poseRows(ch, pose); const cv = spriteToCanvas ? spriteToCanvas(rows, pal) : null;
    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.translate(Math.round(x + ch.H / 2), Math.round(y + 12)); ctx.rotate(-Math.PI / 2); ctx.drawImage(cv, -12, -Math.round(rows.length / 2)); ctx.restore(); return; }
  if (o.shadow !== false && pose !== "affale" && pose !== "assis_lit") { ctx.globalAlpha = .22; ctx.fillStyle = "#1a3a2a"; ctx.fillRect(Math.round(x) + 3, Math.round(y) + ch.H - 2, 18, 3); ctx.globalAlpha = 1; }
  drawSprite(ctx, poseRows(ch, pose, f), pal, Math.round(x), Math.round(y));
}
// dans l'eau jusqu'à la taille : on coupe le sprite sous la taille, une ligne d'eau claire ondule autour, des gouttes jaillissent en marchant
function drawCharWading(ctx, ch, x, y, o = {}) {
  const t = o.t || 0, b = CH_BODY[ch.spec.age || "child"], cut = b.torso[1] - 2, rows = charFrame(ch, o.dir || "S", o.moving ? "walk" : "idle", t).slice(0, cut);
  const pal = { ...PAL, ...CH_PAL, ...(ch.spec.pal || {}), ...(o.pal || {}) }, X = Math.round(x), Y = Math.round(y) + (b.H - cut) - 4;     // il s'enfonce : le haut du corps descend
  drawSprite(ctx, rows, pal, X, Y);
  const wl = Y + cut, wob = k => Math.round(Math.sin(t / 220 + k * .8));
  for (let k = -2; k < 26; k++) { ctx.fillStyle = (k + Math.floor(t / 200)) % 5 === 0 ? "#ffffff" : "#bfe4f4"; ctx.fillRect(X + k, wl - 1 + wob(k) * (k % 3 === 0 ? 1 : 0), 1, 1); }
  ctx.fillStyle = "rgba(42,94,148,.45)"; ctx.fillRect(X - 2, wl, 28, 2);
  if (o.moving || o.splash) for (let i = 0; i < 6; i++) { const u = ((t / 420) + i / 6) % 1, sx = X + 12 + Math.cos(i * 2.1) * (8 + u * 6), sy = wl - Math.sin(u * Math.PI) * 7;
    ctx.fillStyle = i % 2 ? "#ffffff" : "#bfe4f4"; ctx.fillRect(Math.round(sx), Math.round(sy), 1, 1); }
}
// une marque sur le sprite, au bon endroit selon la direction
function drawCharMark(ctx, ch, x, y, o = {}, mark = "tache_paume") {
  const b = CH_BODY[ch.spec.age || "child"], dir = o.dir || "S", X = Math.round(x), Y = Math.round(y) + (o.pose === "walk" && Math.floor((o.t || 0) / 130) % 2 ? 1 : 0);
  if (mark === "tache_paume") { ctx.fillStyle = "#3a2220";
    const pts = { S: [[19 + 1, b.hand]], SE: [[20, b.hand]], SW: [[3, b.hand]], E: [[12, b.hand]], W: [[11, b.hand]], N: [], NE: [], NW: [] }[dir] || [];
    pts.forEach(([a, c]) => ctx.fillRect(X + a, Y + c, 1, 1)); }
}
