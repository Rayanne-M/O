import { defineConfig } from 'vite';
import { rpgContenu } from './scripts/rpg/vite-plugin.mjs';

// Deux pages : l'atelier d'équilibrage (index.html) et la tranche jouable du village (village.html).
// base './' : les chemins restent relatifs, pour publier dist/ n'importe où.
// rpgContenu : le jeu lit le contenu directement dans rpg/ (dessins, cartes, personnages) et se met à jour dès qu'il change.
export default defineConfig({
  base: './',
  plugins: [rpgContenu()],
  build: {
    rollupOptions: { input: { atelier: 'index.html', village: 'village.html', bestiaire: 'bestiaire.html' } },
    // Phaser pèse à lui seul environ 1,2 Mo
    chunkSizeWarningLimit: 1500,
  },
});
