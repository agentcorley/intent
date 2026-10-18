import { defineConfig } from 'vite';

// One self-contained, minified IIFE: dist/intent.min.js. Core, config, and tracker are bundled in.
export default defineConfig({
  publicDir: false,
  // Escape non-ASCII so the file reads correctly on hosts that don't serve it as UTF-8.
  esbuild: { charset: 'ascii' },
  build: {
    target: 'es2022', // native class fields, so no helpers leak outside the IIFE
    minify: 'esbuild',
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: 'src/index.ts',
      formats: ['iife'],
      name: 'intentSnippet',
      fileName: () => 'intent.min.js',
    },
  },
});
