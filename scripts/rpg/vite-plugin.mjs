// Branche Vite (npm run dev, npm run build, npm test) sur le dossier rpg/ :
// - « virtual:rpg-art » : le code de dessin de rpg/art/src, réuni en module à la volée (plus aucune copie dans src/) ;
// - pendant npm run dev, dès qu'un fichier de rpg/ change : le jeu se recharge, les planches (cartes.html…) sont
//   refaites, et la vérification des liens s'affiche dans le terminal (et dans le navigateur si un lien est cassé).
import { relative, sep } from 'node:path';
import { RPG, buildArtModule, buildPages, PAGES } from './contenu.mjs';
import { verifier, rapport } from './verifier.mjs';

const ID = 'virtual:rpg-art';
const RESOLVED = '\0' + ID;
// fichiers que le plugin réécrit lui-même : ne pas réagir à leur écriture
const OUTPUTS = new Set(PAGES.map((p) => `art${sep}${p.out}`));

export function rpgContenu() {
  let timer = null;
  return {
    name: 'rpg-contenu',
    resolveId(id) {
      if (id === ID) return RESOLVED;
    },
    load(id) {
      if (id === RESOLVED) return buildArtModule();
    },
    configureServer(server) {
      server.watcher.add(RPG);
      const onChange = (file) => {
        const rel = relative(RPG, file);
        if (rel.startsWith('..') || OUTPUTS.has(rel)) return;
        clearTimeout(timer);
        timer = setTimeout(() => {
          const mod = server.moduleGraph.getModuleById(RESOLVED);
          if (mod) server.moduleGraph.invalidateModule(mod);
          try {
            buildPages();
          } catch (e) {
            server.config.logger.error(`[rpg] planches non refaites : ${e.message}`);
          }
          const r = verifier();
          server.config.logger.info(`[rpg] ${rel} a changé : jeu et planches à jour.\n${rapport(r, { details: false })}`, { timestamp: true });
          if (r.erreurs.length)
            server.ws.send({ type: 'error', err: { message: rapport(r, { details: false }), stack: '', plugin: 'rpg-contenu', id: file } });
          else server.ws.send({ type: 'full-reload' });
        }, 120);
      };
      server.watcher.on('change', onChange);
      server.watcher.on('add', onChange);
      server.watcher.on('unlink', onChange);
      const r = verifier();
      server.config.logger.info(`[rpg] ${rapport(r, { details: false })}`);
    },
  };
}
