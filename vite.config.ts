import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import * as path from 'node:path';

export default defineConfig({
  plugins: [sveltekit()],
  resolve: {
    alias: {
      '$components': path.resolve('./src/lib/components'),
      '$mocks': path.resolve('./src/lib/mocks'),
      '$stores': path.resolve('./src/lib/stores'),
      '$types': path.resolve('./src/lib/types')
    }
  }
});
