import { defineConfig } from 'vite'

export default defineConfig(({ command }) => ({
  // Dev: serve at '/' for easy local access
  // Build: '/neon-district/' for GitHub Pages deployment
  base: command === 'build' ? '/neon-district/' : '/',
  server: { port: 4000 },
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
}))
