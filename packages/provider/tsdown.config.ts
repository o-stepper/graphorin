import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/adapters/vercel.ts',
    'src/adapters/ollama.ts',
    'src/adapters/llamacpp-server.ts',
    'src/adapters/openai-compatible.ts',
    'src/middleware/index.ts',
    'src/counters/index.ts',
    'src/trust/index.ts',
    'src/model-tier/index.ts',
    'src/reasoning/index.ts',
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
    'ai',
    '@ai-sdk/provider',
    'js-tiktoken',
    '@graphorin/core',
    '@graphorin/observability',
  ],
});
