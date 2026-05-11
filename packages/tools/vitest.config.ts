import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/index.ts',
        'src/builder/index.ts',
        'src/registry/index.ts',
        'src/executor/index.ts',
        'src/streaming/index.ts',
        'src/inbound/index.ts',
        'src/result/index.ts',
        'src/built-in/index.ts',
        'src/audit/index.ts',
        'src/errors/index.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});
