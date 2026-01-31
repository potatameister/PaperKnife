import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/PaperKnife/',
  server: {
    host: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf-core': ['pdf-lib'],
          'pdf-viewer': ['pdfjs-dist'],
          'utilities': ['jszip', '@dnd-kit/core', '@dnd-kit/sortable']
        }
      }
    }
  }
})
