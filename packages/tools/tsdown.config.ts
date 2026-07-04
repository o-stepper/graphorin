import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/builder/index.ts',
    'src/registry/index.ts',
    'src/executor/index.ts',
    'src/streaming/index.ts',
    'src/inbound/index.ts',
    'src/result/index.ts',
    'src/built-in/index.ts',
    'src/audit/index.ts',
    'src/errors/index.ts',
    'src/code-mode/index.ts',
    'src/schema/index.ts',
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
  external: ['zod', '@graphorin/core', '@graphorin/observability', '@graphorin/security'],
});
