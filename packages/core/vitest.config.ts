import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
      thresholds: {
        lines: 90,
        functions: 90,
        // Ratcheted 60 -> 80 after the durable-channels / tool-return /
        // flatten-usage unit suites landed (measured 83.98% on
        // 2026-07-20); vitest 4 counts branches with AST-aware
        // remapping, stricter than 3.x.
        branches: 80,
        statements: 90,
      },
    },
  },
});
