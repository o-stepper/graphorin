import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/index.ts',
        'src/client/index.ts',
        'src/client/types.ts',
        'src/transport/index.ts',
        'src/transport/types.ts',
        'src/event-store/index.ts',
        'src/event-store/types.ts',
        'src/oauth/index.ts',
        'src/helpers/index.ts',
        'src/errors/index.ts',
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
