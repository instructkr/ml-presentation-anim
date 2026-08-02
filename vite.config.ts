import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      input: {
        deck: fileURLToPath(new URL('./index.html', import.meta.url)),
        editor: fileURLToPath(new URL('./editor.html', import.meta.url)),
        notes: fileURLToPath(new URL('./notes.html', import.meta.url)),
      },
    },
  },
});
