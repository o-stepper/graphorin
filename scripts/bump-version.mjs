#!/usr/bin/env node

/**
 * bump-version.mjs
 *
 * Applies the framework version to every non-derived site in one
 * pass, using the shared inventory in scripts/version-surface.mjs.
 *
 * Usage:
 *   node scripts/bump-version.mjs --sync
 *       Read the canonical version from packages/core/package.json
 *       (i.e. after `changeset version` bumped the public packages)
 *       and propagate it to the private workspaces and every text
 *       site. This is the normal release step.
 *
 *   node scripts/bump-version.mjs 0.7.0
 *       Set EVERY workspace manifest (public packages included) and
 *       every text site to the given version. Escape hatch for a
 *       manual bump without changesets.
 *
 * The script is idempotent and finishes by running the consistency
 * checker. It intentionally does NOT touch CHANGELOGs (changesets
 * territory), documentation/api (regenerated), or historical version
 * mentions (they do not match the anchored patterns).
 */

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  canonicalVersion,
  ROOT,
  trackedTextFiles,
  VERSION_PATTERNS,
  workspaceManifests,
} from './version-surface.mjs';

const arg = process.argv[2];
if (arg === undefined || (arg !== '--sync' && !/^\d+\.\d+\.\d+$/.test(arg))) {
  console.error('usage: node scripts/bump-version.mjs (--sync | <x.y.z>)');
  process.exit(2);
}
const explicit = arg !== '--sync';
const target = explicit ? arg : canonicalVersion();
const targetMinor = target.split('.').slice(0, 2).join('.');

// 1. Workspace manifests. In --sync mode the public packages were
//    already bumped by changesets; rewriting them to the same value
//    is a no-op, so one unconditional pass is safe in both modes.
let manifestsChanged = 0;
for (const manifest of workspaceManifests()) {
  const path = join(ROOT, manifest);
  const before = readFileSync(path, 'utf8');
  const after = before.replace(/^(\s*"version": ")\d+\.\d+\.\d+(",?)$/m, `$1${target}$2`);
  if (after !== before) {
    writeFileSync(path, after);
    manifestsChanged += 1;
  }
}

// 1b. Sibling peer floors (W-135). The wide range
//     `workspace:>=X.Y.0 <1.0.0` (today: server -> agent/memory/
//     sessions/workflow) exists because a STATIC narrow range
//     re-triggers the changesets fixed-group escalation to a phantom
//     1.0.0 (`onlyUpdatePeerDependentsWhenOutOfRange` sees the peer as
//     out of range during `changeset version`). Rewriting the floor
//     AFTER versioning keeps the peers in-range during the bump while
//     the PUBLISHED artifact requires the current minor - closing the
//     mixed-install window (agent@0.5.0 under server@0.6.1) npm would
//     otherwise happily assemble.
let peerFloorsChanged = 0;
const PEER_FLOOR_RE = /^(\s*"@graphorin\/[a-z0-9-]+": "workspace:>=)\d+\.\d+(\.0 <1\.0\.0",?)$/gm;
for (const manifest of workspaceManifests()) {
  const path = join(ROOT, manifest);
  const before = readFileSync(path, 'utf8');
  const after = before.replace(PEER_FLOOR_RE, `$1${targetMinor}$2`);
  if (after !== before) {
    writeFileSync(path, after);
    peerFloorsChanged += 1;
  }
}

// 2. Anchored text sites.
let sitesChanged = 0;
for (const file of trackedTextFiles()) {
  const path = join(ROOT, file);
  const before = readFileSync(path, 'utf8');
  let after = before;
  for (const { regex, kind } of VERSION_PATTERNS) {
    regex.lastIndex = 0;
    after = after.replace(regex, (whole, found) => {
      const expected = kind === 'minor' ? targetMinor : target;
      return found === expected ? whole : whole.replace(found, expected);
    });
  }
  if (after !== before) {
    writeFileSync(path, after);
    sitesChanged += 1;
  }
}

console.log(
  `[bump-version] v${target}: ${manifestsChanged} manifest(s) + ${sitesChanged} text file(s) updated` +
    `${peerFloorsChanged > 0 ? ` + ${peerFloorsChanged} peer-floor manifest(s) rewritten to >=${targetMinor}.0` : ''}.`,
);
console.log('[bump-version] manual follow-ups the script cannot decide for you:');
console.log(
  '  - root CHANGELOG.md: write the release section (changesets only writes per-package logs)',
);
console.log('  - README.md "Latest release" line: refresh the date + highlights text');
console.log('  - documentation/guide/migration.md: retitle the "-> next (unreleased)" section');
console.log(
  '  - regenerate documentation/api (pnpm --filter @graphorin/docs run clean && build:typedoc && build:sanitise)',
);

const check = spawnSync(process.execPath, [join(ROOT, 'scripts/check-version-consistency.mjs')], {
  stdio: 'inherit',
});
process.exit(check.status ?? 1);
