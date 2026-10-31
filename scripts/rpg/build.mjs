// npm run rpg : vérifie que tout le contenu tient ensemble, puis refait les planches (cartes.html, direction-artistique.html,
// enfance-assets.html) à partir de rpg/. Le jeu, lui, n'a besoin de rien : il lit rpg/ directement.
import { relative } from 'node:path';
import { ROOT, buildPages } from './contenu.mjs';
import { verifier, rapport } from './verifier.mjs';

const r = verifier();
console.log(rapport(r, { details: process.argv.includes('--details') }));
for (const f of buildPages()) console.log(`  ↻ ${relative(ROOT, f)}`);
if (r.erreurs.length) process.exit(1);
