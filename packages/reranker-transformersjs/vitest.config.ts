import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      thresholds: {
        lines: 80,
        // vitest 4's AST-aware remapping counts functions differently;
        // re-baselined from 80 at the 4.1.10 upgrade.
        functions: 78,
        branches: 70,
        statements: 80,
      },
    },
  },
});
