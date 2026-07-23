import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
// import mkcert from 'vite-plugin-mkcert'
// import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  // 后端地址（来自 .env.development VITE_APP_URL，fallback 到当前环境）
  const backendTarget = env.VITE_APP_URL || 'https://192.168.100.161:16445'

  return {
    plugins: [
      vue(),
      vueJsx(),
      // vueDevTools(),
      // mkcert()
    ],
    root: './',
    server: {
      host: '0.0.0.0',
      port: 3000,
      // https: true as any,
      hmr: true,
      open: true,
      proxy: {
        // 音频对讲 WebSocket（H5sPlayerAudBack 使用 /api/v1/h5saudbackapi）
        '/api/v1': {
          target: backendTarget,
          ws: true,          // 代理 WebSocket 升级请求
          secure: false,     // 允许自签名证书
          changeOrigin: true,
        },
      },
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
  }
})

