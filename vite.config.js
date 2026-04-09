import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/namma-transport/' : '/',
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/bmtc': {
        target: 'https://bmtcmobileapi.karnataka.gov.in',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/bmtc/, '/WebAPI'),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Origin', 'https://nammabmtcapp.karnataka.gov.in');
            proxyReq.setHeader('Referer', 'https://nammabmtcapp.karnataka.gov.in/');
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
          });
        },
      },
    },
  },
})
