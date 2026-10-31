// Le contenu du jeu, en un seul endroit : le dossier rpg/ du dépôt.
//   rpg/art/src/          le code de dessin (sprites, décors, portraits, cinématiques)
//   rpg/data/maps/        toutes les cartes (index.json les liste)
//   rpg/data/personnages.json   le registre des personnages, par id
//   rpg/scenario/         le scénario
// Tout ce qui s'affiche (le jeu, la page des cartes, les planches) est fabriqué à partir de ces fichiers,
// jamais recopié à la main. Ce module sait lire le contenu et fabriquer chaque sortie.
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const RPG = join(ROOT, 'rpg');
export const ART_SRC = join(RPG, 'art', 'src');
export const MAPS_DIR = join(RPG, 'data', 'maps');
export const PERSONNAGES_FILE = join(RPG, 'data', 'personnages.json');
export const SCENARIO_DIR = join(RPG, 'scenario');

const readJson = (f) => JSON.parse(readFileSync(f, 'utf8'));
const read = (f) => readFileSync(join(ART_SRC, f), 'utf8');

/** Toutes les cartes : { index, maps: { id: carte } }. */
export function loadMaps() {
  const index = readJson(join(MAPS_DIR, 'index.json'));
  const maps = {};
  for (const [id, m] of Object.entries(index.maps)) {
    const f = join(MAPS_DIR, m.file);
    if (existsSync(f)) maps[id] = readJson(f);
  }
  return { index, maps };
}

/** Le registre des personnages. */
export const loadPersonnages = () => readJson(PERSONNAGES_FILE);

/** Les scénarios : { enfance: {...} }. */
export function loadScenarios() {
  const out = {};
  for (const f of readdirSync(SCENARIO_DIR).filter((f) => f.endsWith('.json'))) out[f.replace(/\.json$/, '')] = readJson(join(SCENARIO_DIR, f));
  return out;
}

/** Données injectées en tête de chaque page : le registre des personnages, visible du code de dessin. */
const prelude = () => `const PERSONNAGES = ${JSON.stringify(loadPersonnages().personnages)};\n`;

// ---------- Le module de dessin du jeu ----------

// Ordre de la page des cartes, puis les personnages et objets du chapitre 1, sans les fichiers d'interface des planches.
export const GAME_ART_FILES = ['sprites.js', 'scene.js', 'herolab.js', 'dirs.js', 'nature.js', 'spirit.js', 'horror.js', 'world.js', 'interiors.js', 'exterior.js',
  'closeups.js', 'chars.js', 'farm.js', 'portraits.js', 'poses.js', 'props.js', 'cinematics.js', 'fx.js', 'giorgio.js'];
// Fonctions des planches qui touchent à leur propre page : jamais appelées par le jeu.
const SKIP = new Set(['renderDirs', 'renderField', 'bindField', 'bindLab', 'renderLab', 'rebuildLab', 'layoutView', 'clampView',
  'applyView', 'zoomTo', 'focusPlace', 'bindMap', 'refreshPins', 'select', 'bindEditor', 'edOverlay', 'edPanel']);

/** Les noms déclarés par une instruction const/let qui commence à i (virgules au premier niveau seulement). */
function declared(code, i) {
  const out = [];
  let depth = 0, expectName = true, str = null;
  for (; i < code.length; i++) {
    const c = code[i];
    if (str) { if (c === '\\') i++; else if (c === str) str = null; continue; }
    if (expectName) {
      const m = /^\s*([A-Za-z_$][\w$]*)\s*=/.exec(code.slice(i, i + 80));
      if (m) out.push(m[1]);
      expectName = false;
    }
    if (c === '"' || c === "'" || c === '`') str = c;
    else if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) depth--;
    else if (c === ',' && depth === 0) expectName = true;
    else if ((c === ';' || c === '\n') && depth === 0) break;
  }
  return out;
}

/** Fin d'une déclaration de fonction qui commence à i (accolade fermante du corps). */
function functionEnd(code, i) {
  let depth = 0, str = null, seen = false;
  for (; i < code.length; i++) {
    const c = code[i];
    if (str) { if (c === '\\') i++; else if (c === str) str = null; continue; }
    if (c === '"' || c === "'" || c === '`') str = c;
    else if (c === '/' && code[i + 1] === '/') i = code.indexOf('\n', i) - 1;
    else if (c === '{') { depth++; seen = true; }
    else if (c === '}' && --depth === 0 && seen) return i + 1;
  }
  return code.length;
}

/**
 * Réunit les fichiers de dessin (scripts globaux, écrits pour les planches) en un seul module ES pour le jeu.
 * Rien n'est écrit sur le disque : le plugin Vite le sert à la volée sous le nom « virtual:rpg-art ».
 */
export function buildArtModule() {
  const sources = GAME_ART_FILES.filter((f) => existsSync(join(ART_SRC, f)) || (console.warn('[rpg] fichier de dessin absent :', f), false))
    .map((f) => ({ f, code: read(f) }));
  // Dans des scripts globaux, une fonction redéclarée remplace la précédente partout : on retire les versions écrasées.
  for (let k = 0; k < sources.length; k++)
    for (const m of [...sources[k].code.matchAll(/^function\s+([A-Za-z_$][\w$]*)/gm)]) {
      const later = sources.slice(k + 1).some((s) => new RegExp(`^function\\s+${m[1]}\\b`, 'm').test(s.code));
      if (!later) continue;
      const src = sources[k], at = src.code.search(new RegExp(`^function\\s+${m[1]}\\b`, 'm'));
      src.code = src.code.slice(0, at) + `/* ${m[1]} : remplacée plus loin */` + src.code.slice(functionEnd(src.code, at));
    }
  const parts = [], names = new Set(['PERSONNAGES']);
  for (const { f, code } of sources) {
    parts.push(`// ---------- ${f} ----------\n${code}`);
    for (const m of code.matchAll(/^(?:const|let|function)\s+([A-Za-z_$][\w$]*)/gm)) if (!SKIP.has(m[1])) names.add(m[1]);
    for (const m of code.matchAll(/^(?:const|let)\s/gm)) for (const n of declared(code, m.index + m[0].length)) if (!SKIP.has(n)) names.add(n);
  }
  return `// Module fabriqué à la volée depuis rpg/art/src/ et rpg/data/personnages.json (scripts/rpg/contenu.mjs).
/* eslint-disable */
const ctxOf = (id) => document.getElementById(id).getContext('2d');
${prelude()}${parts.join('\n')}
export { ${[...names].join(', ')} };
`;
}

// ---------- Les planches (pages HTML autonomes) ----------

const HEAD = (title) => `<title>${title}</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@500;700&family=Atkinson+Hyperlegible:wght@400;700&display=swap">\n`;

/** Chaque planche : son titre, sa sortie, ses fichiers de dessin, son corps HTML. Une nouvelle planche = une entrée ici. */
export const PAGES = [
  {
    id: 'cartes', title: 'Cartes du jeu', out: 'cartes.html', body: 'cartes-body.html', css: ['style.css', 'map.css'], world: true,
    files: ['sprites.js', 'scene.js', 'herolab.js', 'dirs.js', 'nature.js', 'spirit.js', 'chars.js', 'world.js', 'interiors.js', 'exterior.js', 'viewer.js', 'editor.js', 'cartesmain.js'],
  },
  {
    id: 'direction-artistique', title: 'Direction artistique du RPG', out: 'direction-artistique.html', body: 'body.html', css: ['style.css'],
    files: ['sprites.js', 'scene.js', 'herolab.js', 'dirs.js', 'nature.js', 'spirit.js', 'horror.js', 'main.js'],
  },
  {
    id: 'enfance-assets', title: "Assets de l'enfance", out: 'enfance-assets.html', body: 'enfance-body.html', css: ['style.css'],
    files: ['sprites.js', 'scene.js', 'dirs.js', 'nature.js', 'spirit.js', 'horror.js', 'interiors-data.js', 'interiors.js', 'closeups.js', 'chars.js', 'farm.js',
      'portraits.js', 'poses.js', 'props.js', 'cinematics.js', 'fx.js', 'enfance-main.js'],
  },
  {
    id: 'bestiaire', title: 'Bestiaire du RPG', out: 'bestiaire.html', body: 'bestiaire-body.html', css: ['style.css'],
    files: ['sprites.js', 'scene.js', 'dirs.js', 'closeups.js', 'chars.js', 'portraits.js', 'giorgio.js', 'bestiaire-main.js'],
  },
];

/** Fabrique le HTML d'une planche. */
export function buildPage(page) {
  let js = prelude();
  if (page.world) {
    const { index, maps } = loadMaps();
    js += `const WORLD_INDEX = ${JSON.stringify(index)};\nconst WORLD_DATA = ${JSON.stringify(maps)};\n`;
  }
  js += page.files.map(read).join('\n');
  const [first, ...more] = page.css;
  const css = read(first) + more.map((f) => `\n<style>\n${read(f)}</style>`).join('');
  return `${HEAD(page.title)}${css}\n${read(page.body)}\n<script>\n${js}\n</script>\n`;
}

/** Réécrit toutes les planches dans rpg/art/. Renvoie la liste des fichiers écrits. */
export function buildPages(outDir = join(RPG, 'art')) {
  const written = [];
  for (const page of PAGES) {
    const f = join(outDir, page.out);
    const html = buildPage(page);
    if (!existsSync(f) || readFileSync(f, 'utf8') !== html) writeFileSync(f, html);
    written.push(f);
  }
  return written;
}
