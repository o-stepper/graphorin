import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // Many CLI tests open a real SQLite store (store-context, memory inspect /
    // review, audit, triggers). The 5 s vitest default is too tight on a loaded
    // shared CI runner - observed memory-review.test.ts timing out on windows.
    // Give the suite headroom; the tests normally finish in well under a second.
    testTimeout: 20_000,
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
        // Ratcheted DOWN from the aspirational 70 to the measured floor
        // (65.6%) on the day the CI coverage leg turned enforcement on -
        // a threshold that never runs protects nothing. Raise it back
        // toward 70 as command-branch tests land; never lower it.
        // vitest 4 counts branches with AST-aware remapping (stricter
        // than 3.x); re-baselined from 65 at the 4.1.10 upgrade.
        branches: 62,
        statements: 80,
      },
    },
  },
});
