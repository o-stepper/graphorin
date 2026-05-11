import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/tracer/index.ts',
    'src/redaction/index.ts',
    'src/redaction/config.ts',
    'src/redaction/patterns.ts',
    'src/redaction/imperative-patterns.ts',
    'src/exporters/index.ts',
    'src/gen-ai/index.ts',
    'src/openinference/index.ts',
    'src/cost/index.ts',
    'src/replay/index.ts',
    'src/replay/config.ts',
    'src/eval/index.ts',
    'src/logger/index.ts',
    'src/telemetry/index.ts',
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
    '@opentelemetry/api',
    '@opentelemetry/sdk-node',
    '@opentelemetry/exporter-trace-otlp-http',
  ],
});
