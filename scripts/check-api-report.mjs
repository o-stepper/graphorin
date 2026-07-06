#!/usr/bin/env node
/**
 * check-api-report.mjs - the @graphorin/core API surface gate (W-127).
 *
 * The README claims semver discipline for the core surface, but until
 * now nothing DIFFED that surface: a PR could widen/narrow/reshape a
 * public type and reviewers had to notice it inside a d.ts-shaped
 * diff. api-extractor renders the surface into a committed report
 * (packages/core/etc/core.api.md); this script re-extracts from the
 * just-built dist and fails when the committed report no longer
 * matches - every public-surface change becomes an explicit, reviewed
 * file change.
 *
 * Requires a built packages/core/dist (run after the workspace
 * build, exactly like check-doc-snippets).
 *
 * To ACCEPT an intentional surface change:
 *   pnpm --filter @graphorin/core build
 *   node scripts/check-api-report.mjs --update
 *   git add packages/core/etc/core.api.md
 *
 * Exit codes: 0 ok · 1 report drift · 2 invocation error.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CORE = join(ROOT, 'packages', 'core');
const REPORT = join(CORE, 'etc', 'core.api.md');
const BIN = join(
  ROOT,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'api-extractor.cmd' : 'api-extractor',
);

const update = process.argv.includes('--update');

if (!existsSync(join(CORE, 'dist', 'index.d.ts'))) {
  console.error(
    'check-api-report: ERROR - packages/core/dist is missing; build core first ' +
      '(pnpm --filter @graphorin/core build).',
  );
  process.exit(2);
}
if (!update && !existsSync(REPORT)) {
  console.error('check-api-report: ERROR - committed report missing at packages/core/etc.');
  process.exit(2);
}

const before = update ? null : readFileSync(REPORT, 'utf8');
try {
  // `--local` writes the freshly extracted report over etc/; the gate
  // then diffs text. (api-extractor's own non-local compare mode is
  // wired for Rush's tooling expectations; a plain text diff of the
  // regenerated file is equivalent and keeps --update trivial.)
  execFileSync(BIN, ['run', '--local'], {
    cwd: CORE,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    // Windows resolves the .cmd shim through the shell.
    shell: process.platform === 'win32',
  });
} catch (err) {
  console.error('check-api-report: ERROR - api-extractor failed:');
  console.error(err.stdout ?? '');
  console.error(err.stderr ?? err.message);
  process.exit(2);
}

if (update) {
  console.log('check-api-report: report regenerated at packages/core/etc/core.api.md.');
  process.exit(0);
}

const after = readFileSync(REPORT, 'utf8');
if (after !== before) {
  // Leave the regenerated report in place: `git diff` now SHOWS the
  // surface change, which is exactly what the reviewer needs.
  console.error(
    'check-api-report: FAIL - the @graphorin/core public surface changed but ' +
      'packages/core/etc/core.api.md was not updated.\n' +
      'Inspect `git diff packages/core/etc/core.api.md`; if the change is intentional, ' +
      'commit the regenerated report (see the header of scripts/check-api-report.mjs).',
  );
  process.exit(1);
}
console.log('check-api-report: OK - core.api.md matches the built surface.');
process.exit(0);
