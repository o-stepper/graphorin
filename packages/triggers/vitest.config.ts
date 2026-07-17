import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // Nearly every scheduler test opens a real SQLite store (fresh tmp
    // dir + full migration run); on a cold Windows CI runner a single
    // open can spike past the default 30s window (observed once on
    // main, 2026-07-16). The suites use fake clocks, so a generous
    // wall-clock bound costs nothing on the happy path.
    testTimeout: 120_000,
    coverage: {
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 65,
        statements: 80,
      },
    },
  },
});
