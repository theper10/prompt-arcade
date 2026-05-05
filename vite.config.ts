import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

const isStaticDemo = process.env.VITE_STATIC_DEMO === 'true'

// https://vite.dev/config/
export default defineConfig({
  base: isStaticDemo ? '/prompt-arcade/' : '/',
  plugins: [react(), tailwindcss()],
})