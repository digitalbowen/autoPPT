import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vercel serves api/* as Serverless Functions; Vite handles the SPA.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  // pdfjs-dist worker is pulled in via `?worker` import in the parser.
  optimizeDeps: {
    include: ['pdfjs-dist'],
  },
})
