// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const home = os.homedir();
const nodeModules = path.resolve(__dirname, 'node_modules');
// aube resolves packages via virtual-store outside the repo; Vite must allow serving them in dev.
const aubeFsAllow = [
  __dirname,
  nodeModules,
  path.join(home, '.cache/aube'),
  path.join(home, '.local/share/aube'),
];

// https://astro.build/config
export default defineConfig({
  site: 'https://akunzai.github.io',
  base: '/wisdom-quotes',
  output: 'static',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        '@astrojs/react/client.js',
        'zod',
        'dexie',
      ],
    },
    server: {
      fs: { allow: aubeFsAllow },
    },
  },
});