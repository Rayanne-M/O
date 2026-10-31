import { defineConfig } from 'vite';

// Trois pages : l'atelier d'équilibrage (index.html), la tranche jouable du village (village.html)
// et l'écran de combat (combat.html).
// base './' : les chemins restent relatifs, pour publier dist/ n'importe où.
export default defineConfig({
  base: './',
  build: {
    rollupOptions: { input: { atelier: 'index.html', village: 'village.html', combat: 'combat.html' } },
    // Phaser pèse à lui seul environ 1,2 Mo
    chunkSizeWarningLimit: 1500,
  },
});
