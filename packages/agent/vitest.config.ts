import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/index.ts',
        'src/run-state/index.ts',
        'src/filters/index.ts',
        'src/fallback/index.ts',
        'src/preferred-model/index.ts',
        'src/fanout/index.ts',
        'src/evaluator-optimizer/index.ts',
        'src/progress/index.ts',
        'src/lateral-leak/index.ts',
        'src/errors/index.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
});
