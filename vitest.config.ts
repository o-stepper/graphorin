import { defineConfig } from 'vitest/config';

// Root-level convenience only: `pnpm exec vitest` from the repo root
// fans out to every package / example suite. CI and `pnpm test` run
// per-package via turbo, where each package's own vitest.config.ts is
// the one that applies. (vitest 4 removed vitest.workspace.ts; the
// former workspace globs live on as `projects`.)
export default defineConfig({
  test: {
    projects: ['packages/*', 'examples/*'],
  },
});
