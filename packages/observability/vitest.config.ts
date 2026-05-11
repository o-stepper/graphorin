import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/index.ts',
        'src/tracer/index.ts',
        'src/redaction/index.ts',
        'src/exporters/index.ts',
        'src/gen-ai/index.ts',
        'src/openinference/index.ts',
        'src/cost/index.ts',
        'src/replay/index.ts',
        'src/eval/index.ts',
        'src/logger/index.ts',
        'src/telemetry/index.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
