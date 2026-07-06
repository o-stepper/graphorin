#!/usr/bin/env node
/**
 * check-version-consistency.mjs
 *
 * CI gate: every version-bearing site in the repository agrees with
 * the canonical framework version (packages/core/package.json).
 *
 * Three checks:
 *   1. Every workspace manifest (public, private, docs) carries the
 *      canonical version.
 *   2. Every anchored text pattern from scripts/version-surface.mjs
 *      matches the canonical version (or its minor line).
 *   3. Negative guard: no package source or test hardcodes the
 *      framework version as a string literal, and the pre-refactor
 *      `export const VERSION = '<semver>'` shape never comes back -
 *      versions in code must derive from `package.json`.
 *
 * Exit 0 when consistent; exit 1 with a per-site report otherwise.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  canonicalVersion,
  ROOT,
  trackedTextFiles,
  VERSION_PATTERNS,
  workspaceManifests,
} from './version-surface.mjs';

const canonical = canonicalVersion();
const canonicalMinor = canonical.split('.').slice(0, 2).join('.');
const failures = [];

// 1. Workspace manifests.
for (const manifest of workspaceManifests()) {
  const parsed = JSON.parse(readFileSync(join(ROOT, manifest), 'utf8'));
  const { name, version } = parsed;
  if (version !== canonical) {
    failures.push(`${manifest}: ${name ?? '<unnamed>'} is ${version}, expected ${canonical}`);
  }
  // 1b. Sibling peer floors (W-135): `workspace:>=X.Y.0 <1.0.0` peers
  // must have X.Y == the current minor. bump-version --sync rewrites
  // them AFTER `changeset version` (a static narrow range would
  // re-trigger the fixed-group 1.0.0 escalation); this check catches a
  // manual release pass that skipped the rewrite.
  for (const [peer, range] of Object.entries(parsed.peerDependencies ?? {})) {
    if (!peer.startsWith('@graphorin/')) continue;
    const m = /^workspace:>=(\d+\.\d+)\.0 <1\.0\.0$/.exec(String(range));
    if (m !== null && m[1] !== canonicalMinor) {
      failures.push(
        `${manifest}: peer ${peer} floor is >=${m[1]}.0, expected >=${canonicalMinor}.0 ` +
          '(W-135; bump-version --sync rewrites it)',
      );
    }
  }
}

// 2. Anchored text patterns.
for (const file of trackedTextFiles()) {
  const body = readFileSync(join(ROOT, file), 'utf8');
  for (const { name, regex, kind } of VERSION_PATTERNS) {
    regex.lastIndex = 0;
    for (const match of body.matchAll(regex)) {
      const found = match[1];
      const expected = kind === 'minor' ? canonicalMinor : canonical;
      if (found !== expected) {
        const line = body.slice(0, match.index).split('\n').length;
        failures.push(`${file}:${line}: ${name} says ${found}, expected ${expected}`);
      }
    }
  }
}

// 3. Negative guards over package/example sources and tests.
function grepTracked(pattern, globs) {
  try {
    return execFileSync('git', ['grep', '-n', '-E', pattern, '--', ...globs], {
      cwd: ROOT,
      encoding: 'utf8',
    })
      .split('\n')
      .filter(Boolean);
  } catch (error) {
    if (error.status === 1) return []; // no matches
    throw error;
  }
}

const codeGlobs = [
  'packages/*/src',
  'packages/*/tests',
  'examples/*/src',
  'examples/*/tests',
  'benchmarks/*/src',
  'benchmarks/*/tests',
];
// The constant-shape guard also covers markdown (a doc sample showing the
// pre-refactor `export const VERSION = '<semver>'` form would teach readers
// the drifting pattern back).
const constGuardGlobs = [...codeGlobs, 'packages/*/README.md', 'examples/*/README.md'];
for (const hit of grepTracked("export const VERSION = '", constGuardGlobs)) {
  failures.push(`${hit} <- hardcoded VERSION constant; derive from package.json instead`);
}
for (const hit of grepTracked(`'${canonical.replaceAll('.', '\\.')}'`, codeGlobs)) {
  failures.push(`${hit} <- framework version literal in code; derive from package.json instead`);
}

if (failures.length > 0) {
  console.error(`[check-version-consistency] FAIL against canonical v${canonical}:`);
  for (const f of failures) console.error(`  - ${f}`);
  console.error(
    `[check-version-consistency] ${failures.length} site(s) drifted. Run 'node scripts/bump-version.mjs --sync' or fix the site.`,
  );
  process.exit(1);
}

console.log(
  `[check-version-consistency] OK - every workspace manifest and text site agrees with v${canonical}.`,
);
