import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import mkcert from 'vite-plugin-mkcert'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
    mkcert()
  ],
  root: './',
  server: {
    host: '0.0.0.0',
    port: 3000,
    https: true as any,
    hmr: true,
    open: true
  },
  build: {
    outDir: 'dist',
    minify: 'esbuild',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
