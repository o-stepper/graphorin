import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node22',
  dts: true,
  outputOptions: {
    entryFileNames: '[name].js',
  },
  clean: true,
  sourcemap: true,
});
