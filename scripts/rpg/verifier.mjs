// Vérifie que tout le contenu tient ensemble : chaque id cité quelque part existe là où il doit exister.
// Cartes ↔ personnages ↔ dessins ↔ scénario ↔ code des chapitres.
// Usage : node scripts/rpg/verifier.mjs   (lancé aussi par npm test, npm run rpg et npm run dev)
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ROOT, ART_SRC, MAPS_DIR, loadMaps, loadPersonnages, loadScenarios } from './contenu.mjs';

/** Les clés de premier niveau d'un objet littéral « const NOM = { … }; » d'un fichier de dessin. */
function artKeys(file, name) {
  const f = join(ART_SRC, file);
  if (!existsSync(f)) return null;
  const code = readFileSync(f, 'utf8');
  const start = code.search(new RegExp(`^const ${name} = \\{`, 'm'));
  if (start < 0) return null;
  const keys = new Set();
  let depth = 0, str = null, line = '';
  for (let i = code.indexOf('{', start); i < code.length; i++) {
    const c = code[i];
    if (str) { if (c === '\\') i++; else if (c === str) str = null; continue; }
    if (c === '"' || c === "'" || c === '`') { str = c; continue; }
    if (c === '{' || c === '[' || c === '(') { if (depth === 1) { const m = /([A-Za-z_$][\w$]*)\s*:\s*$/.exec(line); if (m) keys.add(m[1]); } depth++; line = ''; continue; }
    if (c === '}' || c === ']' || c === ')') { if (--depth === 0) break; continue; }
    if (depth === 1) {
      if (c === ',' || c === '\n') { const m = /^\s*([A-Za-z_$][\w$]*)\s*:/.exec(line); if (m) keys.add(m[1]); line = ''; }
      else line += c;
    }
  }
  return keys;
}

function walkFiles(dir, ext, out = []) {
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walkFiles(p, ext, out);
    else if (p.endsWith(ext) && !p.endsWith('.test.ts')) out.push(p);
  }
  return out;
}

const lineOf = (code, index) => code.slice(0, index).split('\n').length;

/**
 * Lance toutes les vérifications. Renvoie { erreurs, avertissements } : chaque entrée est { ou, quoi }.
 * Une erreur casse quelque chose (le jeu ne trouvera pas l'objet, la carte ou le personnage) ;
 * un avertissement signale un écart à regarder (le scénario ne connaît pas une scène posée sur la carte).
 */
export function verifier() {
  const erreurs = [], avertissements = [];
  const err = (ou, quoi) => erreurs.push({ ou, quoi });
  const warn = (ou, quoi) => avertissements.push({ ou, quoi });
  const rel = (p) => relative(ROOT, p);

  // ---------- Personnages et dessins ----------
  const reg = loadPersonnages();
  const P = reg.personnages, betes = new Set(reg.betes ?? []);
  const isPerso = (id) => id in P;
  const chars = artKeys('chars.js', 'CHAR_SPECS'), portraits = artKeys('portraits.js', 'PORTRAITS'), npcPal = artKeys('exterior.js', 'NPC_PAL');
  const PERSO = 'rpg/data/personnages.json';
  for (const [id, p] of Object.entries(P)) {
    if (!p.nom && p.nom !== '') err(`${PERSO} › ${id}`, 'pas de « nom »');
    if (p.sprite && chars && !chars.has(p.sprite)) err(`${PERSO} › ${id}`, `sprite « ${p.sprite} » absent de CHAR_SPECS (rpg/art/src/chars.js)`);
    if (p.portrait && portraits && !portraits.has(p.portrait)) err(`${PERSO} › ${id}`, `portrait « ${p.portrait} » absent de PORTRAITS (rpg/art/src/portraits.js)`);
    if (p.palette && !['PAL', 'CHILD_PAL'].includes(p.palette) && npcPal && !npcPal.has(p.palette)) err(`${PERSO} › ${id}`, `palette « ${p.palette} » absente de NPC_PAL (rpg/art/src/exterior.js)`);
    if (p.variante_de && !isPerso(p.variante_de)) err(`${PERSO} › ${id}`, `variante_de « ${p.variante_de} » : personnage inconnu`);
  }
  if (chars) for (const c of chars) if (!Object.values(P).some((p) => p.sprite === c) && !c.startsWith('heros_')) warn('rpg/art/src/chars.js', `gabarit « ${c} » dessiné mais utilisé par aucun personnage du registre`);

  // ---------- Cartes ----------
  const { index, maps } = loadMaps();
  const IDX = 'rpg/data/maps/index.json';
  const places = (m) => new Set([...Object.keys(m?.spawns ?? {}), ...Object.keys(m?.zones ?? {})]);
  for (const [id, entry] of Object.entries(index.maps)) {
    const m = maps[id];
    if (!m) { err(IDX, `carte « ${id} » : fichier ${entry.file} introuvable`); continue; }
    const at = `rpg/data/maps/${entry.file}`;
    if (m.id !== id) err(at, `id « ${m.id} » différent de celui de index.json (« ${id} »)`);
    if (entry.chapter && !(entry.chapter in (index.chapters ?? {}))) err(IDX, `carte « ${id} » : chapitre « ${entry.chapter} » inconnu`);
    const ids = new Set();
    for (const o of m.objects ?? []) { if (ids.has(o.id)) err(at, `deux objets portent l'id « ${o.id} »`); ids.add(o.id); }
    for (const o of m.objects ?? []) if (o.on && !ids.has(o.on)) err(at, `objet « ${o.id} » posé sur « ${o.on} », qui n'existe pas`);
    for (const x of m.exits ?? []) {
      if (!maps[x.to]) { err(at, `sortie « ${x.id} » vers la carte « ${x.to} », qui n'existe pas`); continue; }
      if (x.at && !places(maps[x.to]).has(x.at)) err(at, `sortie « ${x.id} » : point d'arrivée « ${x.at} » absent de la carte « ${x.to} »`);
    }
    for (const n of m.npcs ?? []) {
      if (!isPerso(n.id) && !betes.has(n.id)) err(at, `habitant « ${n.id} » absent du registre des personnages (${PERSO})`);
      if (n.look && !isPerso(n.look)) err(at, `habitant « ${n.id} » : look « ${n.look} » absent du registre des personnages`);
    }
    for (const s of m.scenes ?? []) if (s.zone && !places(m).has(s.zone)) err(at, `scène « ${s.id} » : lieu « ${s.zone} » absent de la carte`);
  }
  if (index.start && !places(maps[index.start.map]).has(index.start.at)) err(IDX, `départ : « ${index.start.at} » absent de la carte « ${index.start.map} »`);
  for (const f of readdirSync(MAPS_DIR).filter((f) => f.endsWith('.json') && f !== 'index.json'))
    if (!Object.values(index.maps).some((e) => e.file === f)) warn(`rpg/data/maps/${f}`, 'carte absente de index.json : le jeu ne la charge pas');

  // ---------- Scénario ----------
  const scenarios = loadScenarios();
  for (const [name, sc] of Object.entries(scenarios)) {
    const at = `rpg/scenario/${name}.json`;
    const seen = new Set();
    (function walk(x, path) {
      if (Array.isArray(x)) return x.forEach((v, i) => walk(v, `${path}[${i}]`));
      if (!x || typeof x !== 'object') return;
      if (typeof x.qui === 'string' && !isPerso(x.qui)) err(`${at} › ${path}`, `« qui » : « ${x.qui} » absent du registre des personnages`);
      if (Array.isArray(x.pnj)) for (const p of x.pnj) if (!isPerso(p)) err(`${at} › ${path}`, `« pnj » : « ${p} » absent du registre des personnages`);
      if (typeof x.carte === 'string' && !maps[x.carte]) err(`${at} › ${path}`, `« carte » : « ${x.carte} » n'existe pas`);
      if (typeof x.carte === 'string' && typeof x.zone === 'string' && maps[x.carte] && !places(maps[x.carte]).has(x.zone)) err(`${at} › ${path}`, `« zone » : « ${x.zone} » absente de la carte « ${x.carte} »`);
      if (typeof x.id === 'string' && path.includes('scenes')) seen.add(x.id);
      for (const [k, v] of Object.entries(x)) walk(v, path ? `${path}.${k}` : k);
    })(sc, '');
    // les scènes posées sur les cartes et celles du scénario se répondent-elles ?
    for (const [id, m] of Object.entries(maps))
      if (index.maps[id]?.chapter === name)
        for (const s of m.scenes ?? []) if (!seen.has(s.id)) warn(`rpg/data/maps/${index.maps[id].file}`, `scène « ${s.id} » absente de ${at}`);
  }

  // ---------- Code des chapitres : ce que l'histoire cite doit exister ----------
  const allObjects = new Set(), allZones = new Set(), allExits = new Set();
  for (const m of Object.values(maps)) {
    for (const o of m.objects ?? []) allObjects.add(o.id);
    for (const z of Object.keys(m.zones ?? {})) allZones.add(z);
    for (const x of m.exits ?? []) allExits.add(x.id);
  }
  const has = (kind, map, id) => {
    const m = maps[map];
    if (kind === 'object') return (m.objects ?? []).some((o) => o.id === id);
    if (kind === 'zone' || kind === 'enter') return id in (m.zones ?? {});
    return id === '*' || (m.exits ?? []).some((x) => x.id === id);
  };
  const pool = { object: allObjects, zone: allZones, enter: allZones, exit: allExits };
  const SPECIAL = new Set(['narr', 'hero']);
  const files = walkFiles(join(ROOT, 'src', 'game', 'chapters'), '.ts').map((f) => ({ f, code: readFileSync(f, 'utf8') }));
  // ce que le code crée lui-même : figurants (les poules de la grange) et lieux ajoutés au chargement (v.zones.baton = …)
  const local = new Set(), localZones = new Set();
  for (const { code } of files) {
    for (const m of code.matchAll(/\b(?:put|actor|hen)\(\s*(?:g,\s*)?'([a-z_0-9]+)'/g)) local.add(m[1]);
    for (const m of code.matchAll(/\.zones(?:\.([a-z_0-9]+)|\[\s*'([a-z_0-9]+)'\s*\])\s*=[^=]/g)) localZones.add(m[1] ?? m[2]);
  }
  const knownActor = (id) => isPerso(id) || betes.has(id) || SPECIAL.has(id) || local.has(id);
  for (const { f: file, code } of files) {
    const at = (i) => `${rel(file)}:${lineOf(code, i)}`;
    // réactions : 'object:carte/id', 'zone:id', 'exit:carte/*', 'actor:id'
    for (const m of code.matchAll(/'(object|zone|enter|exit|actor):([^'/]+)(?:\/([^']+))?'/g)) {
      const [, kind, a, b] = m;
      if (kind === 'actor') { if (!knownActor(a)) err(at(m.index), `personnage « ${a} » absent du registre`); continue; }
      const what = { object: 'objet', zone: 'lieu', enter: 'lieu', exit: 'sortie' }[kind];
      if ((kind === 'zone' || kind === 'enter') && localZones.has(b ?? a)) continue;
      if (b !== undefined) {
        if (!maps[a]) err(at(m.index), `carte « ${a} » inconnue`);
        else if (!has(kind, a, b)) err(at(m.index), `${what} « ${b} » absent de la carte « ${a} »`);
      } else if (!pool[kind].has(a)) err(at(m.index), `${what} « ${a} » : aucune carte n'a cet id`);
    }
    // répliques : say('mere:triste', …), choose('elio', …), lignes ['basile', '…']
    for (const m of code.matchAll(/\b(?:say|choose)\(\s*'([a-z_]+)(?::[a-z_]+)?'|\[\s*'([a-z_]+)(?::[a-z_]+)?',\s*['`"]/g)) {
      const id = m[1] ?? m[2];
      if (!isPerso(id) && !SPECIAL.has(id)) (m[1] ? err : warn)(at(m.index), `« ${id} » parle mais n'est pas dans le registre (sa réplique n'aura pas de nom)`);
    }
    // placements : goto('village', 'place'), cutTo(g, 'grange', 'entree'), put('mere', 'maison_cuisine', 'porte')
    const checkPlace = (i, map, place) => { if (maps[map] && !places(maps[map]).has(place) && !localZones.has(place)) err(at(i), `point « ${place} » absent de la carte « ${map} » (ni arrivée ni lieu)`); };
    for (const m of code.matchAll(/\b(?:goto|cutTo)\(\s*(?:g,\s*)?'([a-z_0-9]+)',\s*'([a-z_0-9]+)'/g)) checkPlace(m.index, m[1], m[2]);
    for (const m of code.matchAll(/\bput\(\s*'[a-z_0-9]+',\s*'([a-z_0-9]+)',\s*'([a-z_0-9]+)'/g)) checkPlace(m.index, m[1], m[2]);
    const checkMap = (i, map) => { if (!maps[map]) err(at(i), `carte « ${map} » inconnue`); };
    for (const m of code.matchAll(/\b(?:goto|cutTo)\(\s*(?:g,\s*)?'([a-z_0-9]+)'/g)) checkMap(m.index, m[1]);
    for (const m of code.matchAll(/\bput\(\s*'[a-z_0-9]+',\s*'([a-z_0-9]+)'/g)) checkMap(m.index, m[1]);
  }
  return { erreurs, avertissements };
}

/** Le rapport, lisible dans un terminal. */
export function rapport({ erreurs, avertissements }, { details = true } = {}) {
  const lines = [];
  if (!erreurs.length) lines.push(`✓ Contenu cohérent : aucune référence cassée${avertissements.length ? ` (${avertissements.length} avertissement${avertissements.length > 1 ? 's' : ''})` : ''}.`);
  else lines.push(`✗ ${erreurs.length} référence${erreurs.length > 1 ? 's' : ''} cassée${erreurs.length > 1 ? 's' : ''} :`);
  for (const e of erreurs) lines.push(`  ✗ ${e.ou} : ${e.quoi}`);
  if (details) for (const w of avertissements) lines.push(`  · ${w.ou} : ${w.quoi}`);
  return lines.join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = verifier();
  console.log(rapport(r, { details: !process.argv.includes('--court') }));
  process.exit(r.erreurs.length ? 1 : 0);
}
