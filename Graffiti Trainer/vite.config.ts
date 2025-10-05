import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

//for GitHub Pages we use a relative base so assets work under /<repo>/ (or any subpath)
export default defineConfig({
  base: './',
  plugins: [react()],
})
