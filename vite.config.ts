import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { jsonApi } from './server/jsonApi.ts';

export default defineConfig({
  // Precisa ser igual ao nome do repositório: https://nucleoeadsenai.github.io/CalendarioEaD/
  base: '/CalendarioEaD/',
  plugins: [react(), tailwindcss(), jsonApi({ arquivo: 'data/db.json' })],
});
