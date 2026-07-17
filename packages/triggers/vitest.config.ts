import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // Nearly every scheduler test opens a real SQLite store (fresh tmp
    // dir + full migration run) - some in the test body, some in a
    // beforeEach hook; on a cold Windows CI runner a single open can
    // spike past the default windows (30s test / 10s hook - both
    // observed: main 2026-07-16 run 29532335992, PR #193 first round).
    // The suites use fake clocks, so generous wall-clock bounds cost
    // nothing on the happy path.
    testTimeout: 120_000,
    hookTimeout: 120_000,
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
