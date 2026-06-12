import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // The cipher/swap suite does real temp-file I/O behind a stub driver; the
    // default 5s timeout occasionally trips on the slow, AV-scanned Windows CI
    // runner (e.g. "respects a non-default cipher selection"). 20s is ample
    // margin on every platform without masking a genuine hang.
    testTimeout: 20_000,
    coverage: {
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      thresholds: {
        lines: 75,
        functions: 75,
        branches: 65,
        statements: 75,
      },
    },
  },
});
