import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/index.ts',
        'src/tiers/index.ts',
        'src/tools/index.ts',
        'src/search/index.ts',
        'src/migration/index.ts',
        'src/errors/index.ts',
        'src/internal/storage-adapter.ts',
        'src/search/types.ts',
        'src/tools/types.ts',
        'src/context-engine/index.ts',
        // Pure type-declaration modules — no runtime emission, hence 0%
        // coverage by construction. Excluded from the threshold.
        'src/context-engine/compaction/types.ts',
        'src/context-engine/compaction/hooks/types.ts',
        'src/context-engine/tool-budget/types.ts',
        // Barrel files (re-exports only).
        'src/context-engine/compaction/index.ts',
        'src/context-engine/tool-budget/index.ts',
        'src/context-engine/locale-packs/index.ts',
        'src/context-engine/preambles/inbound-en.ts',
        'src/context-engine/templates/base-en.ts',
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 75,
        statements: 85,
      },
    },
  },
});
