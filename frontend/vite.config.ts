import { defineConfig } from "vite"
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { createPWAConfig } from './pwa.config.ts';

export default defineConfig({
  plugins: [react(), tailwindcss(), createPWAConfig()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})