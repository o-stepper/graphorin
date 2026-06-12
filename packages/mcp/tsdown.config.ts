import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/client/index.ts',
    'src/transport/index.ts',
    'src/oauth/index.ts',
    'src/helpers/index.ts',
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
    '@graphorin/observability',
    '@graphorin/security',
    '@graphorin/tools',
    '@modelcontextprotocol/sdk',
    'zod',
  ],
});
