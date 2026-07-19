import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        // vitest 4 counts branches with AST-aware remapping (stricter
        // than 3.x); re-baselined from 75 at the 4.1.10 upgrade.
        branches: 66,
        statements: 80,
      },
    },
  },
});
