import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/logo.svg', 'cmaps/*.bcmap', 'fonts/*.woff2'],
      workbox: {
        sourcemap: false,
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,mjs,wasm,bcmap}'],
        // Increase limit for heavy PDF/OCR chunks
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, 
      },
      manifest: {
        name: 'PaperKnife PDF',
        short_name: 'PaperKnife',
        description: 'Privacy-first local PDF tools',
        theme_color: '#F43F5E',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: './',
        icons: [
          {
            src: 'icons/logo.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'icons/logo.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'icons/logo.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
  base: process.env.CAPACITOR_BUILD === 'true' ? './' : '/PaperKnife/',
  server: {
    host: true
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf-lib-core': ['pdf-lib'],
          'pdfjs-viewer': ['pdfjs-dist'],
          'tesseract-core': ['tesseract.js'],
          'vendor-ui': ['react', 'react-dom', 'react-router-dom', 'lucide-react', 'sonner'],
          'vendor-utils': ['jszip', '@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities']
        }
      }
    }
  }
})