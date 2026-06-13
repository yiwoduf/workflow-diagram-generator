import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true, // fail fast instead of silently hopping ports
  },
  preview: {
    port: 5173,
    strictPort: true,
  },
})
