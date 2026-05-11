import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/loader/index.ts',
    'src/registry/index.ts',
    'src/frontmatter/index.ts',
    'src/migration/index.ts',
    'src/spec/index.ts',
    'src/activation/index.ts',
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
  external: ['yaml', '@graphorin/core', '@graphorin/security', '@graphorin/tools'],
});
