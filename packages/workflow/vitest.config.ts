import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/errors/index.ts'],
      thresholds: {
        lines: 85,
        functions: 85,
        // vitest 4 counts branches with AST-aware remapping (stricter
        // than 3.x); re-baselined from 80 at the 4.1.10 upgrade.
        branches: 78,
        statements: 85,
      },
    },
  },
});
