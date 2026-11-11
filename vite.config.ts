import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': { target: process.env.ZW_API ?? 'https://zerowaitpdf-backend-a60f8.containers.snapdeploy.app', changeOrigin: true } },
  },
})
