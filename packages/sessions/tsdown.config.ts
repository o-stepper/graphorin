import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/facade.ts',
    'src/agent-registry.ts',
    'src/commentary/index.ts',
    'src/export/index.ts',
    'src/replay/index.ts',
    'src/cassette/index.ts',
    'src/migrations/index.ts',
    'src/errors/index.ts',
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
    '@graphorin/memory',
    '@graphorin/observability',
    '@graphorin/security',
  ],
});
