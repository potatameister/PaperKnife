import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/logo.svg'],
      workbox: {
        sourcemap: false,
      },
      manifest: {
        name: 'PaperKnife PDF',
        short_name: 'PaperKnife',
        description: 'Privacy-first local PDF tools',
        theme_color: '#F43F5E',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/PaperKnife/',
        icons: [
          {
            src: 'icons/logo.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  base: '/PaperKnife/',
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
          'vendor-ui': ['react', 'react-dom', 'react-router-dom', 'lucide-react', 'sonner'],
          'vendor-utils': ['jszip', '@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities']
        }
      }
    }
  }
})
