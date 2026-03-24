import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      'pdf-lib': 'pdf-lib/dist/pdf-lib.min.js'
    }
  },
  base: process.env.VITE_BASE || './',
  server: {
    host: true,
    port: 3000,
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: {
      ignored: ['**/android/**']
    }
  },
  build: {
    target: 'esnext',
    minify: 'esbuild', // Faster and more stable in resource-constrained environments
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('pdf-lib')) return 'pdf-lib-core';
          if (id.includes('pdfjs-dist')) return 'pdfjs-viewer';
          if (id.includes('tesseract.js') && process.env.VITE_DISABLE_OCR !== 'true') return 'tesseract-core';
          if (id.includes('node_modules')) {
            if (['react', 'react-dom', 'react-router-dom', 'lucide-react', 'sonner'].some(m => id.includes(m))) return 'vendor-ui';
            if (['jszip', '@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'].some(m => id.includes(m))) return 'vendor-utils';
          }
        }
      }
    }
  }
})
