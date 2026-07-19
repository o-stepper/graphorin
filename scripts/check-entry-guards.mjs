#!/usr/bin/env node
/**
 * check-entry-guards - forbid the space-broken "am I the entrypoint?"
 * idiom (deep retest 2026-07-19, P1-1).
 *
 * The idiom
 *
 *   if (import.meta.url === `file://${process.argv[1]}`) { ... }
 *
 * compares a WHATWG file URL (spaces percent-encoded as `%20`) against
 * a raw filesystem path (literal spaces). In any checkout whose path
 * contains a space the comparison is false, so 12 benchmark runners
 * and 2 documentation gates imported cleanly, ran nothing, and exited
 * 0 - a silent false-green. The portable spelling compares REAL PATHS
 *
 *   fileURLToPath(import.meta.url) === realpathSync(process.argv[1])
 *
 * (realpath also normalizes symlinked prefixes - macOS tmpdir lives
 * behind /var -> /private/var - which plain pathToFileURL does not).
 *
 * Default mode statically scans every tracked .ts/.js/.mjs source for
 * the forbidden pattern. `--self-test` additionally proves the class
 * dynamically: it executes a fixture using the portable guard from a
 * temp directory WITH a space (must run) and one using the broken
 * idiom (must not), so the gate can never rot into a green stub.
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** The forbidden source substring (template-literal file URL over argv). */
const FORBIDDEN = /file:\/\/\$\{process\.argv/;

// The literal broken idiom, assembled so the `${...}` placeholder never
// appears verbatim in this file's source (it would trip the very lint
// rule that forbids it, and biome-ignore does not reach inside strings).
const DOLLAR = '$';
const BROKEN_IDIOM = `if (import.meta.url === \`file://${DOLLAR}{process.argv[1]}\`) {`;

function trackedSourceFiles() {
  const out = execFileSync('git', ['ls-files', '*.ts', '*.js', '*.mjs'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  return out
    .split('\n')
    .filter((line) => line.length > 0)
    .filter((line) => !line.includes('node_modules/'))
    .filter((line) => line !== 'scripts/check-entry-guards.mjs');
}

function scan() {
  const offenders = [];
  for (const rel of trackedSourceFiles()) {
    const body = readFileSync(join(ROOT, rel), 'utf8');
    if (FORBIDDEN.test(body)) offenders.push(rel);
  }
  return offenders;
}

function selfTest() {
  let checks = 0;
  // Static matcher: the broken idiom is flagged, the portable one is not.
  if (!FORBIDDEN.test(BROKEN_IDIOM)) {
    throw new Error('self-test: the matcher missed the broken idiom');
  }
  checks += 1;
  if (FORBIDDEN.test('import.meta.url === pathToFileURL(process.argv[1]).href')) {
    throw new Error('self-test: the matcher flagged the portable idiom');
  }
  checks += 1;

  // Dynamic proof from a directory WITH a space in its path.
  const dir = mkdtempSync(join(tmpdir(), 'graphorin space-guard-'));
  try {
    const okPath = join(dir, 'portable.mjs');
    // The canonical guard: realpath BOTH normalizes symlinked prefixes
    // (macOS tmpdir lives behind /var -> /private/var) and, decoded via
    // fileURLToPath, sidesteps the %20-vs-space mismatch entirely.
    writeFileSync(
      okPath,
      "import { realpathSync } from 'node:fs';\n" +
        "import { fileURLToPath } from 'node:url';\n" +
        'if (\n' +
        '  process.argv[1] !== undefined &&\n' +
        '  fileURLToPath(import.meta.url) ===\n' +
        '    (() => {\n' +
        '      try {\n' +
        '        return realpathSync(process.argv[1]);\n' +
        '      } catch {\n' +
        '        return process.argv[1];\n' +
        '      }\n' +
        '    })()\n' +
        ') {\n' +
        "  console.log('GUARD_RAN');\n" +
        '}\n',
    );
    const okOut = execFileSync(process.execPath, [okPath], { encoding: 'utf8' });
    if (!okOut.includes('GUARD_RAN')) {
      throw new Error(`self-test: portable guard did not fire from '${dir}'`);
    }
    checks += 1;

    const brokenPath = join(dir, 'broken.mjs');
    writeFileSync(brokenPath, `${BROKEN_IDIOM}\n  console.log('GUARD_RAN');\n}\n`);
    const brokenOut = execFileSync(process.execPath, [brokenPath], { encoding: 'utf8' });
    if (brokenOut.includes('GUARD_RAN')) {
      throw new Error('self-test: the broken idiom unexpectedly fired (matcher now obsolete?)');
    }
    checks += 1;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  console.log(`check-entry-guards self-test: OK (${checks} checks)`);
}

function main() {
  if (process.argv.includes('--self-test')) {
    selfTest();
    return;
  }
  const offenders = scan();
  if (offenders.length > 0) {
    console.error(
      'check-entry-guards: the space-broken entrypoint idiom (a `file://` + process.argv template) ' +
        'is forbidden - compare fileURLToPath(import.meta.url) against realpathSync(process.argv[1]) instead:',
    );
    for (const rel of offenders) console.error(`  - ${rel}`);
    process.exit(1);
  }
  console.log(`check-entry-guards: OK (${trackedSourceFiles().length} files scanned, 0 offenders)`);
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
  main();
}
