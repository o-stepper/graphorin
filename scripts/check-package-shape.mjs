#!/usr/bin/env node
/**
 * check-package-shape.mjs — the pack gate (W-071).
 *
 * Everything else in CI validates the WORKSPACE, where `workspace:*`
 * symlinks and shared root devDependencies (zod 3, the current otel
 * line) mask defects of the PUBLISHED artifacts. This gate validates
 * the tarballs:
 *
 *   1. `pnpm build` produces dist (turbo outputs now RETAIN map files —
 *      they ship in the tarballs, so a cache hit must restore them).
 *   2. `pnpm pack` every public package into a scratch dir.
 *   3. `publint` + `@arethetypeswrong/cli` over every tarball.
 *   4. A scratch consumer project installs ALL tarballs in ONE
 *      `npm install ./a.tgz ./b.tgz ...` call — one-shot is load-bearing
 *      on a Version-Packages branch: the tarballs' internal deps name
 *      exact, NOT-YET-PUBLISHED versions, and only a simultaneous
 *      install lets the file: instances satisfy each other's ranges
 *      (a per-package install would ask the registry for a version
 *      that does not exist and fail through no fault of the package).
 *   5. `tsc` compiles scripts/pack-consumer/consumer.ts against the
 *      installed tarballs under a matrix: moduleResolution
 *      node16 x bundler, zod ^3 x ^4 (zod legs run skipLibCheck:false —
 *      the exact setting that exposes a broken d.ts, W-013).
 *   6. otel-freshness leg (W-014): the observability tarball installs
 *      next to @opentelemetry/sdk-node@latest +
 *      exporter-trace-otlp-http@latest; an ERESOLVE here means the
 *      peer ranges went stale (the monthly-experimental-minor class).
 *
 * Registry access is expected (this is `npm install`); the job runs
 * ubuntu-only in CI. Locally: `node scripts/check-package-shape.mjs`
 * (add `--skip-build` after a fresh `pnpm build`).
 *
 * Known-failure legs: `--allow-fail <leg>` (repeatable) downgrades a
 * named leg's failure to a warning. CI passes `--allow-fail zod4`
 * until the zod-4 type break (W-013) is fixed — the leg still RUNS and
 * its output is visible, so the sensitivity of the gate is proven
 * rather than assumed. Remove the flag once W-013 lands (wave 2).
 *
 * Exit codes: 0 ok · 1 defect · 2 invocation error.
 */

import { execFileSync, execSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const skipBuild = args.includes('--skip-build');
const allowFail = new Set(
  args.flatMap((a, i) => (a === '--allow-fail' && args[i + 1] ? [args[i + 1]] : [])),
);

/** Public (publishable) workspace packages, dir + manifest. */
function publicPackages() {
  const out = [];
  for (const dir of readdirSync(join(ROOT, 'packages'))) {
    let manifest;
    try {
      manifest = JSON.parse(readFileSync(join(ROOT, 'packages', dir, 'package.json'), 'utf8'));
    } catch {
      continue;
    }
    if (manifest.private === true) continue;
    out.push({ dir: join(ROOT, 'packages', dir), name: manifest.name, version: manifest.version });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

function sh(cmd, opts = {}) {
  return execSync(cmd, { stdio: 'pipe', encoding: 'utf8', ...opts });
}

const failures = [];
const warnings = [];

/** Run `fn` as a named leg; failure is fatal unless allow-failed. */
function leg(name, fn) {
  try {
    fn();
    console.log(`[package-shape] leg ok: ${name}`);
  } catch (err) {
    const message = `${name}: ${err.message ?? err}`;
    if (allowFail.has(name)) {
      warnings.push(message);
      console.warn(`[package-shape] leg ALLOW-FAILED (known issue, fix pending): ${message}`);
    } else {
      failures.push(message);
      console.error(`[package-shape] leg FAILED: ${message}`);
    }
  }
}

// ---------------------------------------------------------------- build
const packages = publicPackages();
if (packages.length === 0) {
  console.error('[package-shape] found zero public packages — parser drift?');
  process.exit(2);
}
console.log(`[package-shape] ${packages.length} public package(s).`);

if (!skipBuild) {
  console.log('[package-shape] pnpm build ...');
  sh('pnpm build', { cwd: ROOT, stdio: 'inherit' });
}

// ------------------------------------------------------------------ pack
const scratch = mkdtempSync(join(tmpdir(), 'graphorin-pack-gate-'));
const tarballDir = join(scratch, 'tarballs');
mkdirSync(tarballDir, { recursive: true });
console.log(`[package-shape] packing into ${tarballDir}`);
const tarballs = new Map(); // name -> tarball path
for (const pkg of packages) {
  const out = sh(`pnpm pack --pack-destination ${JSON.stringify(tarballDir)}`, { cwd: pkg.dir });
  const lines = out.trim().split('\n');
  const file = lines[lines.length - 1].trim();
  tarballs.set(pkg.name, file);
}

// --------------------------------------------------------- publint + attw
const publintBin = join(ROOT, 'node_modules', '.bin', 'publint');
const attwBin = join(ROOT, 'node_modules', '.bin', 'attw');
for (const pkg of packages) {
  const tarball = tarballs.get(pkg.name);
  leg(`publint:${pkg.name}`, () => {
    execFileSync(publintBin, [tarball, '--strict'], { stdio: 'pipe', encoding: 'utf8' });
  });
  leg(`attw:${pkg.name}`, () => {
    // `--profile esm-only` gates what the packages currently CLAIM
    // (import-only export maps). The require() condition is W-072,
    // scheduled next wave - once it lands, tighten this to
    // `--profile node16` so CJS resolution is gated too.
    execFileSync(attwBin, ['--profile', 'esm-only', tarball], { stdio: 'pipe', encoding: 'utf8' });
  });
}

// -------------------------------------------- scratch consumer (one-shot)
const consumerDir = join(scratch, 'consumer');
mkdirSync(consumerDir, { recursive: true });
writeFileSync(
  join(consumerDir, 'package.json'),
  `${JSON.stringify({ name: 'pack-consumer', private: true, version: '0.0.0', type: 'module' }, null, 2)}\n`,
);
cpSync(join(ROOT, 'scripts', 'pack-consumer', 'consumer.ts'), join(consumerDir, 'consumer.ts'));

function npmInstall(cwd, specs, legName) {
  try {
    execFileSync('npm', ['install', '--no-audit', '--no-fund', '--loglevel', 'error', ...specs], {
      cwd,
      stdio: 'pipe',
      encoding: 'utf8',
    });
  } catch (err) {
    const stderr = String(err.stderr ?? '');
    if (/E404|ETARGET/.test(stderr) && /@graphorin\//.test(stderr)) {
      throw new Error(
        `${legName}: npm went to the registry for an unpublished @graphorin version — ` +
          'the tarballs MUST be installed in one npm-install call so the file: instances ' +
          `satisfy each other's exact-version ranges. stderr:\n${stderr.slice(0, 2000)}`,
      );
    }
    throw new Error(`${legName}: npm install failed:\n${stderr.slice(0, 4000)}`);
  }
}

leg('consumer-install', () => {
  const specs = [...tarballs.values()];
  // typescript + the zod-3 baseline ride along in the same call.
  specs.push('typescript@~5.9.0', 'zod@^3.25.0');
  npmInstall(consumerDir, specs, 'consumer-install');
});

// ------------------------------------------------------------- tsc matrix
const tscBin = join(consumerDir, 'node_modules', '.bin', 'tsc');
function tscConfig(moduleResolution, skipLibCheck) {
  const moduleKind = moduleResolution === 'bundler' ? 'esnext' : 'node16';
  return {
    compilerOptions: {
      module: moduleKind,
      moduleResolution,
      target: 'es2022',
      strict: true,
      noEmit: true,
      skipLibCheck,
      esModuleInterop: true,
      forceConsistentCasingInFileNames: true,
    },
    files: ['consumer.ts'],
  };
}

function runTsc(label, moduleResolution, skipLibCheck) {
  const cfg = join(consumerDir, `tsconfig.${label}.json`);
  writeFileSync(cfg, `${JSON.stringify(tscConfig(moduleResolution, skipLibCheck), null, 2)}\n`);
  try {
    execFileSync(tscBin, ['-p', cfg], { cwd: consumerDir, stdio: 'pipe', encoding: 'utf8' });
  } catch (err) {
    throw new Error(`tsc(${label}) failed:\n${String(err.stdout ?? err.message).slice(0, 4000)}`);
  }
}

// zod@^3 legs: skipLibCheck:false — the published d.ts must be clean.
leg('zod3-node16', () => runTsc('zod3-node16', 'node16', false));
leg('zod3-bundler', () => runTsc('zod3-bundler', 'bundler', false));

// zod@^4 legs (W-013): swap zod in place, keep everything else.
leg('zod4-install', () => npmInstall(consumerDir, ['zod@^4.0.0'], 'zod4-install'));
leg('zod4', () => {
  runTsc('zod4-node16', 'node16', false);
  runTsc('zod4-bundler', 'bundler', false);
});

// ------------------------------------------- otel freshness leg (W-014)
leg('otel-freshness', () => {
  const otelDir = join(scratch, 'otel-consumer');
  mkdirSync(otelDir, { recursive: true });
  writeFileSync(
    join(otelDir, 'package.json'),
    `${JSON.stringify({ name: 'otel-consumer', private: true, version: '0.0.0' }, null, 2)}\n`,
  );
  // The peer set must resolve against LATEST — otel ships experimental
  // minors monthly, so this is the standing freshness control.
  npmInstall(
    otelDir,
    [
      tarballs.get('@graphorin/observability'),
      tarballs.get('@graphorin/core'),
      '@opentelemetry/api@latest',
      '@opentelemetry/sdk-node@latest',
      '@opentelemetry/exporter-trace-otlp-http@latest',
    ],
    'otel-freshness',
  );
});

// ------------------------------------------------------------- summary
console.log(
  `[package-shape] done: ${packages.length} package(s), ${failures.length} failure(s), ${warnings.length} allow-failed.`,
);
if (warnings.length > 0) {
  console.warn('[package-shape] allow-failed legs (tracked, fix pending):');
  for (const w of warnings) console.warn(`  ! ${w.split('\n')[0]}`);
}
if (failures.length > 0) {
  console.error('[package-shape] failures:');
  for (const f of failures) console.error(`  ✗ ${f.split('\n')[0]}`);
  process.exit(1);
}
process.exit(0);
