#!/usr/bin/env node
/**
 * run-typedoc-checked.mjs - TypeDoc with the {@link} validation gate
 * (W-130).
 *
 * TypeDoc runs with `validation.invalidLink: true` (typedoc.json), but
 * its only escalation switch is the global `treatWarningsAsErrors`,
 * and this repo's packages-mode conversion currently emits ~2400
 * PRE-EXISTING warnings of unrelated classes (the per-package tag
 * config of `entryPointStrategy: "packages"` does not inherit the
 * root blockTags, so every `@stable` logs "unknown block tag"; plus
 * the referenced-but-not-included converter notices). Flipping the
 * global flag would hold the W-130 fix hostage to that cleanup, so
 * this wrapper escalates EXACTLY the link-validation classes:
 *
 *   - "Failed to resolve link to ..."            (broken {@link})
 *   - "... which was resolved but is not included ..." (link target
 *     not part of the docs)
 *
 * Any such warning fails the build; everything else passes through
 * untouched. `skipErrorChecking: true` stays in typedoc.json on
 * purpose: TS errors are covered by the per-package typecheck gates,
 * TypeDoc must not duplicate them.
 *
 * Exit codes: 0 ok · 1 link warnings or typedoc failure.
 */

import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DOCS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const LINK_WARNING_RE = /Failed to resolve link to|which was resolved but is not included/;

const result = spawnSync('npx', ['typedoc', '--options', './typedoc.json'], {
  cwd: DOCS_DIR,
  encoding: 'utf8',
  shell: process.platform === 'win32',
  maxBuffer: 64 * 1024 * 1024,
});

const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
process.stdout.write(result.stdout ?? '');
process.stderr.write(result.stderr ?? '');

if (result.status !== 0) {
  console.error(`[run-typedoc-checked] typedoc exited ${result.status}.`);
  process.exit(result.status ?? 1);
}

const offenders = output
  .split('\n')
  .filter((line) => LINK_WARNING_RE.test(line))
  // Strip ANSI colour codes for a clean report.
  .map((line) => line.replace(/\[[0-9;]*m/g, '').trim());

if (offenders.length > 0) {
  console.error(
    `\n[run-typedoc-checked] FAIL - ${offenders.length} {@link} validation warning(s) (W-130):`,
  );
  for (const line of offenders) console.error(`  ${line}`);
  console.error(
    '\nFix the TSDoc link (prefer a resolvable target; use plain `code` text for ' +
      'cross-package/unexported references) - see the wave-6 W-130 sweep for examples.',
  );
  process.exit(1);
}
console.log('[run-typedoc-checked] OK - no {@link} validation warnings.');
