/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/pit-docx-converter/',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node',
    setupFiles: ['./src/vitest.setup.ts'],
    globals: true,
  },
})
