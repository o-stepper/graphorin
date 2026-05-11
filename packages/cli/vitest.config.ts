import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/index.ts',
        'src/bin/graphorin.ts',
        'src/commands/index.ts',
        // The interactive prompt helpers wrap node:readline and are
        // exercised end-to-end via the binary; vitest cannot reach
        // them without a real TTY.
        'src/internal/prompts.ts',
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
