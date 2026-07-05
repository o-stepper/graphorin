import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/runner.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node22',
  outputOptions: {
    entryFileNames: '[name].js',
    chunkFileNames: '[name]-[hash].js',
    preserveModules: true,
    preserveModulesRoot: 'src',
  },
  dts: false,
  clean: true,
  sourcemap: true,
  treeshake: true,
});
