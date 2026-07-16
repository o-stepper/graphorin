#!/usr/bin/env node
/**
 * Consumer-install smoke (audit 2026-07-16, P1-3 follow-up).
 *
 * Reproduces a brand-new consumer project on a pnpm-10 machine: a temp
 * directory OUTSIDE the workspace, the documented
 * `pnpm.onlyBuiltDependencies` approval block, `pnpm add` of the
 * PUBLISHED `@graphorin/*` packages from the npm registry, then a
 * two-process write / reopen / search run against SQLite (FTS-only, no
 * embedding model needed). This catches the failure class the
 * workspace CI can never see: build-script approval lives in each
 * project's own package.json, so the repo root's approval does not
 * protect consumers, and a packaging regression only exists in the
 * published artifacts.
 *
 * Needs npm-registry network access - wired as a scheduled / dispatch
 * workflow (.github/workflows/consumer-smoke.yml), not a per-PR gate.
 *
 * Run locally: `node ./scripts/smoke-consumer.mjs [--version latest]`
 *
 * Exit codes:
 *   0 - install clean and both phases passed.
 *   1 - smoke failure (skipped build scripts, bindings, or recall).
 *   2 - invocation / environment error.
 */

import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const versionFlag = process.argv.indexOf('--version');
const VERSION = versionFlag !== -1 ? (process.argv[versionFlag + 1] ?? 'latest') : 'latest';

/** The exact consumer recipe the installation guide documents. */
const CONSUMER_PACKAGE_JSON = {
  name: 'graphorin-consumer-smoke',
  private: true,
  type: 'module',
  // Pin the workspace's own pnpm so the smoke exercises the same
  // build-script policy generation (pnpm 10+) the docs warn about.
  packageManager: JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).packageManager,
  pnpm: {
    onlyBuiltDependencies: ['better-sqlite3', 'sqlite-vec'],
  },
};

/**
 * The consumer program: phase `write` persists one fact and closes;
 * phase `read` starts from a cold process, reopens the same database
 * file and must recall the fact through FTS-backed semantic search.
 */
const SMOKE_MJS = `import { createMemory } from '@graphorin/memory';
import { createSqliteStore } from '@graphorin/store-sqlite';

const phase = process.argv[2];
const scope = { userId: 'smoke-user' };
const store = await createSqliteStore({ path: './smoke.db' });
await store.init();
const memory = createMemory({
  store: store.memory,
  embeddings: store.embeddings,
  contextEngine: { compaction: false },
});
if (phase === 'write') {
  await memory.semantic.remember(scope, { text: 'Loves quiet parks and specialty coffee.' });
} else if (phase === 'read') {
  const hits = await memory.semantic.search(scope, 'specialty coffee');
  if (!hits.some((h) => h.record.text.includes('specialty coffee'))) {
    console.error('read phase: expected fact not found; hits =', JSON.stringify(hits));
    process.exit(1);
  }
} else {
  console.error('usage: node smoke.mjs <write|read>');
  process.exit(2);
}
await store.close();
console.log(phase + ' phase OK');
`;

function run(label, command, args, options) {
  process.stdout.write(`\n[smoke-consumer] ${label}\n`);
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 600_000,
    ...options,
  });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  process.stdout.write(output);
  if (result.error !== undefined) {
    console.error(`[smoke-consumer] ${label}: failed to spawn:`, result.error.message);
    process.exit(2);
  }
  return { status: result.status ?? 1, output };
}

const projectDir = mkdtempSync(join(tmpdir(), 'graphorin-consumer-smoke-'));
process.stdout.write(`[smoke-consumer] consumer project: ${projectDir}\n`);
process.stdout.write(`[smoke-consumer] package version tag: ${VERSION}\n`);
let failed = false;

try {
  writeFileSync(
    join(projectDir, 'package.json'),
    `${JSON.stringify(CONSUMER_PACKAGE_JSON, null, 2)}\n`,
  );
  writeFileSync(join(projectDir, 'smoke.mjs'), SMOKE_MJS);

  const install = run(
    'pnpm add (published packages, cold registry install)',
    'pnpm',
    [
      'add',
      `@graphorin/memory@${VERSION}`,
      `@graphorin/store-sqlite@${VERSION}`,
      'better-sqlite3',
      'sqlite-vec',
      'zod',
    ],
    { cwd: projectDir },
  );
  if (install.status !== 0) {
    console.error('[smoke-consumer] FAIL: pnpm add exited non-zero');
    failed = true;
  } else if (/Ignored build scripts:[^\n]*better-sqlite3/.test(install.output)) {
    // The one line the whole smoke exists for: if approval did not
    // take, the install "succeeds" and the first open dies later.
    console.error(
      '[smoke-consumer] FAIL: pnpm ignored the better-sqlite3 build script despite onlyBuiltDependencies',
    );
    failed = true;
  }

  if (!failed) {
    const write = run('phase 1/2: write + close', 'node', ['smoke.mjs', 'write'], {
      cwd: projectDir,
    });
    if (write.status !== 0) {
      console.error('[smoke-consumer] FAIL: write phase exited non-zero');
      failed = true;
    }
  }
  if (!failed) {
    const read = run('phase 2/2: cold reopen + search', 'node', ['smoke.mjs', 'read'], {
      cwd: projectDir,
    });
    if (read.status !== 0) {
      console.error('[smoke-consumer] FAIL: read phase exited non-zero');
      failed = true;
    }
  }
} finally {
  if (failed) {
    process.stdout.write(`[smoke-consumer] kept for inspection: ${projectDir}\n`);
  } else {
    rmSync(projectDir, { recursive: true, force: true });
  }
}

if (failed) process.exit(1);
process.stdout.write('\n[smoke-consumer] PASS: consumer install + write / reopen / search\n');
