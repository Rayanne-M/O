// Copie le code de dessin partagé (rpg/art/src/, écrit en scripts globaux pour les planches)
// en un seul module ES pour le jeu : src/game/art/shared.js.
// Usage : node scripts/import-art.mjs [dossier source] (par défaut /mnt/project-files/rpg/art/src)
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SRC = process.argv[2] ?? '/mnt/project-files/rpg/art/src';
const DATA = join(SRC, '..', '..', 'data');
// Ordre de la planche des cartes (cartesbuild.py), puis les personnages et objets du chapitre 1, sans les fichiers d'interface.
const FILES = ['sprites.js', 'scene.js', 'herolab.js', 'dirs.js', 'nature.js', 'spirit.js', 'horror.js', 'world.js', 'interiors.js', 'exterior.js',
  'closeups.js', 'chars.js', 'farm.js', 'portraits.js', 'poses.js', 'props.js', 'cinematics.js', 'fx.js'];
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

const sources = FILES.filter((f) => existsSync(join(SRC, f)) || (console.warn('absent :', f), false)).map((f) => ({ f, code: readFileSync(join(SRC, f), 'utf8') }));
// Dans des scripts globaux, une fonction redéclarée remplace la précédente partout : on retire les versions écrasées.
for (let k = 0; k < sources.length; k++)
  for (const m of [...sources[k].code.matchAll(/^function\s+([A-Za-z_$][\w$]*)/gm)]) {
    const later = sources.slice(k + 1).some((s) => new RegExp(`^function\\s+${m[1]}\\b`, 'm').test(s.code));
    if (!later) continue;
    const src = sources[k], at = src.code.search(new RegExp(`^function\\s+${m[1]}\\b`, 'm'));
    src.code = src.code.slice(0, at) + `/* ${m[1]} : remplacée plus loin */` + src.code.slice(functionEnd(src.code, at));
  }
const parts = [], names = new Set();
for (const { f, code } of sources) {
  parts.push(`// ---------- ${f} ----------\n${code}`);
  for (const m of code.matchAll(/^(?:const|let|function)\s+([A-Za-z_$][\w$]*)/gm)) if (!SKIP.has(m[1])) names.add(m[1]);
  // déclarations multiples : const A = 1, B = [[…]], C = {…};
  for (const m of code.matchAll(/^(?:const|let)\s/gm)) for (const n of declared(code, m.index + m[0].length)) if (!SKIP.has(n)) names.add(n);
}
const out = `// Fichier généré par scripts/import-art.mjs depuis rpg/art/src/ : ne pas modifier à la main.
/* eslint-disable */
// @ts-nocheck
const ctxOf = (id) => document.getElementById(id).getContext('2d');
${parts.join('\n')}
export { ${[...names].join(', ')} };
`;
mkdirSync('src/game/art', { recursive: true });
writeFileSync('src/game/art/shared.js', out);
// Types : tout est « any », le code de dessin n'est pas typé.
writeFileSync('src/game/art/shared.d.ts', `// Généré par scripts/import-art.mjs.\n/* eslint-disable */\n${[...names].map((n) => `export const ${n}: any;`).join('\n')}\n`);
console.log(`src/game/art/shared.js : ${names.size} noms exportés`);
// Les données des cartes, telles quelles.
mkdirSync('src/game/data', { recursive: true });
const MAPS = join(DATA, 'maps');
mkdirSync('src/game/data/maps', { recursive: true });
for (const f of readdirSync(MAPS).filter((f) => f.endsWith('.json'))) copyFileSync(join(MAPS, f), join('src/game/data/maps', f));
console.log(`src/game/data/maps : ${readdirSync('src/game/data/maps').length} fichiers`);
