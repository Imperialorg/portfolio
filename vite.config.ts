import { defineConfig } from 'vite'

export default defineConfig({
  base: '/neon-district/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          gsap: ['gsap'],
          postprocessing: ['postprocessing']
        }
      }
    }
  }
})
