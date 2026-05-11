import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/connection.ts',
    'src/migrations/index.ts',
    'src/encryption/index.ts',
  ],
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
  external: ['better-sqlite3', 'better-sqlite3-multiple-ciphers', 'sqlite-vec'],
  loader: {
    '.sql': 'text',
  },
});
