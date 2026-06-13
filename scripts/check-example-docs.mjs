#!/usr/bin/env node
/**
 * check-example-docs.mjs — EB-8 / CI-13.
 *
 * Manifest-driven guard over every runnable example's README. It replaces the
 * old stub (which checked a single substring in one of nine READMEs while
 * claiming to guard "required operator guidance strings" across the examples).
 *
 * Each runnable example app — auto-discovered as an `examples/<name>` dir that
 * has a `dev` script and a `README.md` (so the `example-trace-helper` library
 * and the infra templates under docker/ k8s/ systemd/ github-actions/ are
 * excluded) — is checked for:
 *
 *   1. **Version drift** — the README cites the current framework version
 *      (root `package.json`). A version bump that misses a README footer fails.
 *   2. **Quickstart commands** — every `pnpm --filter ./examples/<name> <script>`
 *      command names THIS example's dir and a script that actually exists in
 *      its `package.json` (catches renamed/removed scripts and copy-pasted
 *      wrong example names).
 *   3. **Smoke coverage** — the example is exercised by the smoke runner
 *      (`scripts/smoke-examples.mjs` CASES) or listed in {@link SMOKE_EXCEPTIONS}
 *      with a reason (so a new example app can't silently ship un-smoked).
 *   4. **Required guidance strings** — any per-example operator-guidance
 *      substrings in {@link REQUIRED_STRINGS} are present.
 *
 * Run `--self-test` to exercise the failure paths against in-memory fixtures.
 *
 * Usage:
 *   pnpm run check-example-docs
 *   node scripts/check-example-docs.mjs --self-test
 *
 * Exit codes: 0 ok · 1 violations · 2 invocation error.
 */

import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const EXAMPLES_DIR = join(ROOT, 'examples');

/**
 * Per-example required operator-guidance substrings. Extends the original
 * single-needle check; add an entry when a README must keep a specific string.
 */
const REQUIRED_STRINGS = {
  'three-agent-harness': ['.graphorin/progress/'],
};

/**
 * Runnable examples intentionally absent from the smoke runner, each mapped to
 * the reason. Empty today — every runnable example is a smoke CASE.
 */
const SMOKE_EXCEPTIONS = {};

/**
 * `pnpm --filter ./examples/<name> [run] <token>` — capture the dir, an
 * optional `run `, and the following token.
 */
const FILTER_CMD = /pnpm --filter \.\/examples\/([\w-]+) (run )?([\w:-]+)/g;

/**
 * pnpm's own subcommands that take `--filter` and look like a bareword — e.g.
 * `pnpm --filter X add <dep>` or `pnpm --filter X exec <bin>`. The token after
 * one of these is a dependency / binary, NOT a package script, so it must not
 * be checked against `package.json` scripts. (`dev`/`build`/`test`/… stay out
 * of this set so they ARE validated as scripts.)
 */
const PNPM_BUILTINS = new Set([
  'add',
  'remove',
  'install',
  'i',
  'update',
  'up',
  'exec',
  'dlx',
  'why',
  'list',
  'ls',
  'outdated',
  'publish',
  'pack',
  'rebuild',
  'prune',
  'link',
  'unlink',
  'audit',
  'licenses',
  'import',
  'fetch',
  'deploy',
  'patch',
  'store',
  'config',
  'create',
  'init',
  'setup',
  'env',
  'root',
  'bin',
  'dedupe',
  'run',
]);

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

/** The example names the smoke runner exercises (parsed from its CASES array). */
async function readSmokeCases() {
  const src = await readFile(join(ROOT, 'scripts/smoke-examples.mjs'), 'utf8');
  const names = new Set();
  for (const m of src.matchAll(/name:\s*'([^']+)'/g)) names.add(m[1]);
  return names;
}

/** Discover runnable example apps (a dir with a README and a `dev` script). */
async function discoverExamples() {
  const out = [];
  for (const entry of await readdir(EXAMPLES_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = join(EXAMPLES_DIR, entry.name);
    const pkgPath = join(dir, 'package.json');
    const readmePath = join(dir, 'README.md');
    if (!existsSync(pkgPath) || !existsSync(readmePath)) continue;
    const pkg = await readJson(pkgPath);
    if (pkg.scripts?.dev === undefined) continue; // libraries (no `dev`) are out
    out.push({ name: entry.name, pkg, readme: await readFile(readmePath, 'utf8') });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Pure per-example checks → array of human-readable violation strings (empty
 * when clean). Exported so {@link selfTest} (and any future unit test) can
 * exercise it without touching the filesystem.
 */
export function checkExample(ex, { rootVersion, smoke }) {
  const violations = [];

  if (!ex.readme.includes(`v${rootVersion}`)) {
    violations.push(`README does not cite the current version v${rootVersion}`);
  }

  const scripts = new Set(Object.keys(ex.pkg.scripts ?? {}));
  for (const [, named, runPrefix, token] of ex.readme.matchAll(FILTER_CMD)) {
    if (named !== ex.name) {
      violations.push(
        `quickstart command targets ./examples/${named} but this README belongs to ${ex.name}`,
      );
      continue;
    }
    // `run <script>` always references a script; a bare token references a
    // script unless it's a pnpm built-in subcommand (add/exec/…).
    const referencesScript = runPrefix !== undefined || !PNPM_BUILTINS.has(token);
    if (referencesScript && !scripts.has(token)) {
      violations.push(
        `quickstart 'pnpm --filter ./examples/${ex.name} ${runPrefix ?? ''}${token}' names a script that does not exist in package.json`,
      );
    }
  }

  if (!smoke.has(ex.name) && SMOKE_EXCEPTIONS[ex.name] === undefined) {
    violations.push(
      'runnable example is not in scripts/smoke-examples.mjs CASES (add it there, or add a SMOKE_EXCEPTIONS entry with a reason)',
    );
  }

  for (const needle of REQUIRED_STRINGS[ex.name] ?? []) {
    if (!ex.readme.includes(needle)) {
      violations.push(`missing required operator-guidance substring ${JSON.stringify(needle)}`);
    }
  }

  return violations;
}

async function run() {
  const rootVersion = (await readJson(join(ROOT, 'package.json'))).version;
  const smoke = await readSmokeCases();
  const examples = await discoverExamples();
  if (examples.length === 0) {
    console.error('[check-example-docs] no runnable examples discovered — wrong cwd?');
    process.exit(2);
  }

  let failed = 0;
  for (const ex of examples) {
    for (const msg of checkExample(ex, { rootVersion, smoke })) {
      failed += 1;
      console.error(`✗ ${ex.name}: ${msg}`);
    }
  }

  // The manifest must not reference examples that no longer exist.
  const names = new Set(examples.map((e) => e.name));
  for (const key of [...Object.keys(REQUIRED_STRINGS), ...Object.keys(SMOKE_EXCEPTIONS)]) {
    if (!names.has(key)) {
      failed += 1;
      console.error(`✗ manifest references unknown example '${key}'`);
    }
  }

  console.log(
    `[check-example-docs] checked ${examples.length} example(s) against v${rootVersion}; ${failed} violation(s).`,
  );
  process.exit(failed > 0 ? 1 : 0);
}

/** Exercise each failure path against in-memory fixtures. */
function selfTest() {
  const ok = {
    name: 'demo',
    pkg: { scripts: { dev: 'tsx ./src', build: 'tsdown' } },
    readme: 'Run `pnpm --filter ./examples/demo dev`.\n**Graphorin** · v9.9.9',
  };
  const smoke = new Set(['demo']);
  const opts = { rootVersion: '9.9.9', smoke };
  const cases = [
    { label: 'clean passes', ex: ok, opts, want: null },
    {
      label: 'stale version',
      ex: { ...ok, readme: ok.readme.replace('v9.9.9', 'v0.0.1') },
      opts,
      want: /current version v9\.9\.9/,
    },
    {
      label: 'missing script',
      ex: { ...ok, readme: 'pnpm --filter ./examples/demo nope\nv9.9.9' },
      opts,
      want: /does not exist/,
    },
    {
      label: 'wrong dir name',
      ex: { ...ok, readme: 'pnpm --filter ./examples/other dev\nv9.9.9' },
      opts,
      want: /targets \.\/examples\/other/,
    },
    {
      label: 'uncovered by smoke',
      ex: ok,
      opts: { ...opts, smoke: new Set() },
      want: /smoke-examples/,
    },
    {
      label: 'missing required string',
      ex: { ...ok, name: 'three-agent-harness', readme: 'v9.9.9' },
      opts: { rootVersion: '9.9.9', smoke: new Set(['three-agent-harness']) },
      want: /required operator-guidance substring/,
    },
  ];
  let bad = 0;
  for (const c of cases) {
    const v = checkExample(c.ex, c.opts);
    const pass = c.want === null ? v.length === 0 : v.some((m) => c.want.test(m));
    if (!pass) {
      bad += 1;
      console.error(`✗ self-test [${c.label}] — got ${JSON.stringify(v)}`);
    }
  }
  console.log(
    bad === 0
      ? `[check-example-docs] self-test: ${cases.length}/${cases.length} ok`
      : `[check-example-docs] self-test: ${bad} failed`,
  );
  process.exit(bad > 0 ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.includes('--self-test')) selfTest();
  else await run();
}
