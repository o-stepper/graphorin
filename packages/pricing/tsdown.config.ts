import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts', 'src/snapshot/index.ts', 'src/config.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node22',
  outputOptions: {
    entryFileNames: '[name].js',
    chunkFileNames: '[name]-[hash].js',
    preserveModules: true,
    preserveModulesRoot: 'src',
  },
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
});
