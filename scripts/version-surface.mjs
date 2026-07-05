/**
 * version-surface.mjs
 *
 * The single, shared inventory of every place a framework version
 * string lives OUTSIDE the code path that derives it automatically.
 *
 * Source code needs no entry here: every package exports
 * `VERSION = pkg.version` from its own `package.json` (build-time
 * derived), embedded strings interpolate that constant, and tests
 * compare against their package manifest. What remains is plain text
 * consumed off-platform (GitHub, npm, kubectl, benchmark baselines),
 * which cannot be derived at render time. Those sites are enumerated
 * below as anchored regexes and consumed by two tools:
 *
 *   - scripts/check-version-consistency.mjs  (CI gate: every match
 *     must equal the canonical version)
 *   - scripts/bump-version.mjs               (release pass: rewrite
 *     every match to the new version)
 *
 * Adding a new hardcoded version to the repo? Either derive it in
 * code, or add its anchored pattern here - the checker fails on any
 * drift either way once the pattern exists, and a version literal in
 * package sources/tests fails the negative check below.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** The canonical framework version: the lockstep group, read off core. */
export function canonicalVersion() {
  return JSON.parse(readFileSync(join(ROOT, 'packages/core/package.json'), 'utf8')).version;
}

/** Tracked text files the anchored patterns scan over. */
export function trackedTextFiles() {
  const out = execFileSync('git', ['ls-files', '*.md', '*.yaml', '*.yml', '*.json'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  return out
    .split('\n')
    .filter(Boolean)
    .filter(
      (f) =>
        !f.startsWith('documentation/api/') &&
        !f.startsWith('.changeset/') &&
        !f.endsWith('CHANGELOG.md') &&
        !f.endsWith('pnpm-lock.yaml') &&
        f !== 'scripts/datasets.lock.json' &&
        !f.includes('__fixtures__') &&
        !f.includes('tests/fixtures'),
    );
}

/**
 * Anchored version-bearing patterns. Each regex has exactly ONE
 * capture group: the version (or minor line) it carries. `kind`
 * selects what the capture must equal:
 *   - 'full'  -> canonical `x.y.z`
 *   - 'minor' -> canonical `x.y` (SECURITY.md support line)
 */
export const VERSION_PATTERNS = [
  // Footer/attribution lines in every form they occur: `**Graphorin** · v`,
  // `Project Graphorin · v` (blockquote, no bold), `**Graphorin** v` (middot
  // after the version instead of before it).
  {
    name: 'md footer',
    regex: /(?:Project )?Graphorin(?:\*\*)?(?: ·)? v(\d+\.\d+\.\d+)/g,
    kind: 'full',
  },
  { name: 'readme version line', regex: /- \*\*Version:\*\* v(\d+\.\d+\.\d+)/g, kind: 'full' },
  { name: 'readme published line', regex: /\*\*Published:\*\* v(\d+\.\d+\.\d+)/g, kind: 'full' },
  // Sample CLI banner lines quoted in example READMEs (`graphorin v0.6.0
  // document-pipeline - ...`); the real banner derives from VERSION, so the
  // quoted expected output must track it.
  { name: 'example cli banner', regex: /graphorin v(\d+\.\d+\.\d+) /g, kind: 'full' },
  { name: 'readme status line', regex: /\*\*Status:\*\* v(\d+\.\d+\.\d+)/g, kind: 'full' },
  { name: 'version badge url', regex: /badge\/version-v(\d+\.\d+\.\d+)-blue/g, kind: 'full' },
  { name: 'version badge alt', regex: /!\[Version: (\d+\.\d+\.\d+)\]/g, kind: 'full' },
  {
    name: 'latest release teaser',
    regex: /Latest release: \*\*(\d+\.\d+\.\d+)\*\*/g,
    kind: 'full',
  },
  { name: 'pre-release line', regex: /`v(\d+\.\d+\.\d+)`(?:\*\*)? pre-release/g, kind: 'full' },
  { name: 'docker image tag', regex: /graphorin:(\d+\.\d+\.\d+)/g, kind: 'full' },
  {
    name: 'k8s version label',
    regex: /app\.kubernetes\.io\/version: "(\d+\.\d+\.\d+)"/g,
    kind: 'full',
  },
  {
    name: 'benchmark baseline frameworkVersion',
    regex: /"frameworkVersion": "(\d+\.\d+\.\d+)"/g,
    kind: 'full',
  },
  {
    name: 'skills runtime-compat example',
    regex: /runtimeVersion: '(\d+\.\d+\.\d+)'/g,
    kind: 'full',
  },
  {
    name: 'skills runtime-compat range example',
    regex: /graphorin-runtime-compat: \^(\d+\.\d+\.\d+)/g,
    kind: 'full',
  },
  {
    name: 'third-party release stamp',
    regex: /as of the v(\d+\.\d+\.\d+) release/g,
    kind: 'full',
  },
  {
    name: 'third-party exceptions heading',
    regex: /Documented exceptions \(v(\d+\.\d+\.\d+)\)/g,
    kind: 'full',
  },
  {
    name: 'security supported-versions line',
    regex: /\| (\d+\.\d+)\.x\s+\| Yes \(current pre-release line\)/g,
    kind: 'minor',
  },
  {
    name: 'health example version',
    regex: /"version": "(\d+\.\d+\.\d+)",\n\s+"uptimeSeconds"/g,
    kind: 'full',
  },
];

/** Workspace manifests whose `version` must equal the canonical one. */
export function workspaceManifests() {
  const out = execFileSync(
    'git',
    [
      'ls-files',
      'package.json',
      'packages/*/package.json',
      'benchmarks/*/package.json',
      'examples/*/package.json',
      'documentation/package.json',
    ],
    { cwd: ROOT, encoding: 'utf8' },
  );
  return out.split('\n').filter(Boolean);
}
