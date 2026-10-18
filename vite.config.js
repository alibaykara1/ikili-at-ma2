import { defineConfig } from 'vite';

export default defineConfig({
  // Göreli yollar: dist/ klasörü herhangi bir alt adreste (ör. GitHub Pages) çalışır
  base: './',
  build: {
    // Phaser tek başına ~1.2 MB; bu beklenen bir boyut
    chunkSizeWarningLimit: 1500,
  },
});
