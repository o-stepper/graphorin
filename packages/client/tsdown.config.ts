import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/graphorin-client.ts',
    'src/transport/index.ts',
    'src/reconnect.ts',
    'src/errors.ts',
  ],
  format: ['esm'],
  platform: 'neutral',
  target: 'es2023',
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
  external: ['@graphorin/protocol', 'zod'],
});
