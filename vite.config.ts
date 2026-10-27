import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'node:url'
import pkg from './package.json' with { type: 'json' }

export default defineConfig({
  // Rutas relativas: el build funciona en cualquier hosting (GitHub Pages, Netlify, Capacitor…)
  base: './',
  // La fecha de compilación permite comprobar en el teléfono si ya llegó la versión nueva
  define: { __APP_VERSION__: JSON.stringify(`${pkg.version} · ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`) },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'brand/*.png'],
      manifest: {
        name: 'Mi Hebraica',
        short_name: 'Mi Hebraica',
        description: 'App oficial para socios de Hebraica – Centro Social Cultural Deportivo y Religioso',
        lang: 'es',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0B0C10',
        theme_color: '#0B0C10',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
})
