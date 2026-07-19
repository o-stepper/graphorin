import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      // Defensive peer-dependency loading paths
      // (`@napi-rs/keyring`, `@node-rs/argon2`) are exercised through
      // injected stubs in the unit tests; their `ERR_MODULE_NOT_FOUND`
      // branches are excluded because they require uninstalling the
      // optional peers from the workspace (covered by the integration
      // suite in CI when peers are absent).
      exclude: [
        'src/index.ts',
        'src/secrets/index.ts',
        'src/secrets/resolvers/index.ts',
        'src/auth/index.ts',
        'src/audit/index.ts',
        'src/sandbox/index.ts',
        'src/guard/index.ts',
        'src/guardrails/index.ts',
        'src/guardrails/builtins/index.ts',
        'src/hardening/index.ts',
        'src/oauth/index.ts',
        'src/supply-chain/index.ts',
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        // vitest 4 counts branches with AST-aware remapping (stricter
        // than 3.x); re-baselined from 80 at the 4.1.10 upgrade.
        branches: 76,
        statements: 85,
      },
    },
  },
});
