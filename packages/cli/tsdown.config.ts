import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts', 'src/bin/graphorin.ts', 'src/commands/index.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node22',
  outputOptions: {
    entryFileNames: '[name].js',
    chunkFileNames: '[name]-[hash].js',
    preserveModules: true,
    preserveModulesRoot: 'src',
    banner: ({ fileName }) => (fileName === 'bin/graphorin.js' ? '#!/usr/bin/env node' : ''),
  },
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  external: [
    '@graphorin/core',
    '@graphorin/eslint-plugin',
    '@graphorin/memory',
    '@graphorin/pricing',
    '@graphorin/security',
    '@graphorin/server',
    '@graphorin/sessions',
    '@graphorin/skills',
    '@graphorin/store-sqlite',
    'commander',
  ],
});
