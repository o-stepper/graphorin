import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
      thresholds: {
        lines: 70,
        functions: 70,
        // vitest 4 counts branches with AST-aware remapping (stricter
        // than 3.x); re-baselined from 70 at the 4.1.10 upgrade.
        branches: 60,
        statements: 70,
      },
    },
  },
});
