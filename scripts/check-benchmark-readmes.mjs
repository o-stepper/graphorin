#!/usr/bin/env node
/**
 * check-benchmark-readmes.mjs - deep-retest 0.13.12 P2.
 *
 * The multilingual LOCOMO README shipped a runner path
 * (`benchmarks/locomo/dist/runner.js`) whose package directory does not
 * exist - a documented command that fails with MODULE_NOT_FOUND on
 * first contact. The existing doc gates scan `documentation/` and
 * `examples/`; benchmark READMEs had no executable-command validation
 * at all. This gate closes that class for every `benchmarks/<pkg>/README.md`:
 *
 *   1. **`node <path>` commands** - a path under `benchmarks/` must point
 *      into an EXISTING package directory; non-`dist/` paths must exist as
 *      files. (`dist/` contents are build outputs, so only their package
 *      dir is required - the gate must pass on a fresh checkout.)
 *   2. **`pnpm --filter <name>` commands** - the named workspace package
 *      (`@graphorin/*` or a `./benchmarks/...` dir filter) must exist.
 *
 * Run `--self-test` to exercise the failure paths against in-memory fixtures.
 *
 * Usage:
 *   pnpm run check-benchmark-readmes
 *   node scripts/check-benchmark-readmes.mjs --self-test
 *
 * Exit codes: 0 ok / 1 violations / 2 invocation error.
 */

import { existsSync, realpathSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BENCHMARKS_DIR = join(ROOT, 'benchmarks');

/** `node <path>` where the path points somewhere under benchmarks/. */
const NODE_CMD = /\bnode\s+(\.\/)?(benchmarks\/[\w./-]+\.(?:mjs|cjs|js))/g;

/** `pnpm --filter <name>` - scoped package name or a ./benchmarks dir filter. */
const FILTER_CMD = /pnpm --filter (@[\w-]+\/[\w-]+|\.\/benchmarks\/[\w-]+)/g;

/**
 * Validate one README's text. Pure so the self-test can feed fixtures;
 * `fsExists` is injectable for the same reason.
 */
export function checkReadmeText(name, text, { workspaceNames, fsExists }) {
  const violations = [];
  for (const m of text.matchAll(NODE_CMD)) {
    const rel = m[2];
    const segments = rel.split('/');
    const pkgDir = segments.slice(0, 2).join('/');
    if (!fsExists(pkgDir)) {
      violations.push(
        `${name}: documented command references '${rel}' but the package directory ` +
          `'${pkgDir}' does not exist`,
      );
      continue;
    }
    if (!rel.includes('/dist/') && !fsExists(rel)) {
      violations.push(`${name}: documented command references missing file '${rel}'`);
    }
  }
  for (const m of text.matchAll(FILTER_CMD)) {
    const target = m[1];
    if (target.startsWith('./benchmarks/')) {
      if (!fsExists(target.slice(2))) {
        violations.push(`${name}: pnpm --filter targets missing directory '${target}'`);
      }
    } else if (!workspaceNames.has(target)) {
      violations.push(`${name}: pnpm --filter targets unknown workspace package '${target}'`);
    }
  }
  return violations;
}

async function collectWorkspaceNames() {
  const names = new Set();
  for (const group of ['packages', 'benchmarks', 'examples']) {
    const groupDir = join(ROOT, group);
    if (!existsSync(groupDir)) continue;
    for (const entry of await readdir(groupDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const pkgPath = join(groupDir, entry.name, 'package.json');
      if (!existsSync(pkgPath)) continue;
      const pkg = JSON.parse(await readFile(pkgPath, 'utf8'));
      if (typeof pkg.name === 'string') names.add(pkg.name);
    }
  }
  return names;
}

async function main() {
  const workspaceNames = await collectWorkspaceNames();
  const fsExists = (rel) => existsSync(join(ROOT, rel));
  const violations = [];
  for (const entry of await readdir(BENCHMARKS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const readmePath = join(BENCHMARKS_DIR, entry.name, 'README.md');
    if (!existsSync(readmePath)) continue;
    const text = await readFile(readmePath, 'utf8');
    violations.push(
      ...checkReadmeText(`benchmarks/${entry.name}/README.md`, text, { workspaceNames, fsExists }),
    );
  }
  if (violations.length > 0) {
    for (const v of violations) console.error(`[check-benchmark-readmes] ${v}`);
    process.exit(1);
  }
  console.log('[check-benchmark-readmes] OK: every documented benchmark command resolves.');
}

function selfTest() {
  const workspaceNames = new Set(['@graphorin/benchmark-memory-smoke']);
  const fsExists = (rel) =>
    rel === 'benchmarks/memory-smoke' || rel === 'benchmarks/memory-smoke/src/runner.mjs';
  const cases = [
    {
      name: 'missing package dir fails (the shipped locomo bug)',
      text: 'Run `node ./benchmarks/locomo/dist/runner.js --subset ru`.',
      expectViolation: /package directory 'benchmarks\/locomo' does not exist/,
    },
    {
      name: 'existing dist path passes without a build',
      text: 'Run `node benchmarks/memory-smoke/dist/runner.js --subset ru`.',
      expectViolation: null,
    },
    {
      name: 'missing non-dist file fails',
      text: 'Run `node benchmarks/memory-smoke/scripts/fetch.mjs`.',
      expectViolation: /missing file/,
    },
    {
      name: 'existing non-dist file passes',
      text: 'Run `node benchmarks/memory-smoke/src/runner.mjs`.',
      expectViolation: null,
    },
    {
      name: 'unknown --filter package fails',
      text: 'Run `pnpm --filter @graphorin/benchmark-locomo build`.',
      expectViolation: /unknown workspace package/,
    },
    {
      name: 'known --filter package passes',
      text: 'Run `pnpm --filter @graphorin/benchmark-memory-smoke build`.',
      expectViolation: null,
    },
  ];
  let failed = 0;
  for (const c of cases) {
    const violations = checkReadmeText('fixture/README.md', c.text, { workspaceNames, fsExists });
    const ok =
      c.expectViolation === null
        ? violations.length === 0
        : violations.some((v) => c.expectViolation.test(v));
    if (!ok) {
      failed += 1;
      console.error(`[check-benchmark-readmes] SELF-TEST FAIL: ${c.name} -> ${violations}`);
    }
  }
  if (failed > 0) process.exit(1);
  console.log(`[check-benchmark-readmes] self-test OK (${cases.length} cases).`);
}

if (
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) ===
    (() => {
      try {
        return realpathSync(process.argv[1]);
      } catch {
        return process.argv[1];
      }
    })()
) {
  if (process.argv.includes('--self-test')) {
    selfTest();
  } else {
    await main();
  }
}
