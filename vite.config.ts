import { defineConfig } from 'vite';

// Deux pages : l'atelier d'équilibrage (index.html) et la tranche jouable du village (village.html).
// base './' : les chemins restent relatifs, pour publier dist/ n'importe où.
export default defineConfig({
  base: './',
  build: {
    rollupOptions: { input: { atelier: 'index.html', village: 'village.html' } },
    // Phaser pèse à lui seul environ 1,2 Mo
    chunkSizeWarningLimit: 1500,
  },
});
