import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/facade.ts',
    'src/tiers/index.ts',
    'src/tools/index.ts',
    'src/search/index.ts',
    'src/migration/index.ts',
    'src/errors/index.ts',
    // E2: `./conflict` is a public exports subpath; without an explicit entry
    // it only shipped because `src/index.ts` re-exports it (preserveModules
    // side effect) - removing that re-export would silently 404 the subpath.
    'src/conflict/index.ts',
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
  external: [
    '@graphorin/core',
    '@graphorin/observability',
    '@graphorin/security',
    '@graphorin/tools',
    '@graphorin/store-sqlite',
    '@graphorin/embedder-transformersjs',
    'zod',
  ],
});
