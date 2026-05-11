import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/client-message.ts',
    'src/server-message.ts',
    'src/subprotocol.ts',
    'src/close-codes.ts',
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
  external: ['zod'],
});
