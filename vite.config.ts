import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  base: process.env.VITE_BASE || './',
  server: {
    host: true,
    port: 3000,
    hmr: process.env.DISABLE_HMR !== 'true',
  },
  build: {
    target: 'esnext',
    minify: 'esbuild', // Faster and more stable in resource-constrained environments
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
