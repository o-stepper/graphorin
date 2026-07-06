#!/usr/bin/env node
/**
 * check-dep-signatures.mjs - real dependency signature verification
 * (W-077).
 *
 * The old security.yml step ran `pnpm audit signatures`, but pnpm has
 * no such subcommand: the positional argument was silently ignored and
 * an ordinary vulnerability audit ran instead, duplicating the step
 * next to it while verifying nothing - and its failures were swallowed
 * by `|| echo ::warning`. The mechanism that actually verifies
 * Sigstore provenance and registry signatures is `npm audit
 * signatures`, which needs an npm-shaped installed tree - something a
 * pnpm workspace (symlinks, workspace: ranges) cannot offer.
 *
 * So: collect the union of EXTERNAL dependencies (dependencies of
 * every publishable packages/*\/package.json plus root
 * devDependencies, skipping @graphorin/* and workspace: specifiers),
 * `npm install --ignore-scripts` them into a mktemp scratch project
 * (NOT the workspace - a symlink would bypass registry verification;
 * same reasoning as the C4 post-publish smoke in release.yml), and run
 * `npm audit signatures` there. A lock-only install is NOT enough: npm
 * then reports "found no dependencies to audit that were installed
 * from a supported registry" (probe-verified), so real tarballs are
 * fetched, with install scripts disabled.
 *
 * Anti-vacuous guard (the E2 lesson from C4: `npm audit signatures` on
 * an empty project exits 0): the output must contain a NON-ZERO
 * "N packages have verified registry signatures" count, otherwise this
 * script fails even when npm exits 0.
 *
 * Coverage is approximate by design: npm's resolution of the scratch
 * graph may pick different versions than pnpm-lock. That does not
 * devalue the signal (a registry-side signature/attestation compromise
 * for these packages still trips), and exact lock parity would require
 * converting pnpm-lock for marginal gain. `--legacy-peer-deps` keeps
 * peer conflicts out of the way - peer correctness is the pack gate's
 * job, not this one's.
 *
 * Exit codes: 0 ok · 1 verification failed or vacuous · 2 invocation
 * error.
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Union of external dependency specifiers: root devDependencies plus
 * `dependencies` of every publishable package. `@graphorin/*` and
 * `workspace:` ranges are internal and excluded. First declaration of
 * a name wins - the ranges agree across the workspace, and signature
 * verification cares about the resolved artifact, not the exact range.
 */
export function collectExternalSpecifiers() {
  const specs = new Map();
  const add = (deps) => {
    for (const [name, range] of Object.entries(deps ?? {})) {
      if (name.startsWith('@graphorin/')) continue;
      if (String(range).startsWith('workspace:')) continue;
      if (!specs.has(name)) specs.set(name, range);
    }
  };
  add(JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).devDependencies);
  for (const dir of readdirSync(join(ROOT, 'packages'))) {
    const manifestPath = join(ROOT, 'packages', dir, 'package.json');
    try {
      if (!statSync(manifestPath).isFile()) continue;
    } catch {
      continue;
    }
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    if (manifest.private) continue;
    add(manifest.dependencies);
  }
  return [...specs.entries()].map(([name, range]) => `${name}@${range}`);
}

/**
 * Install `specifiers` into a scratch project and run
 * `npm audit signatures` there. Returns 0 on verified-non-zero
 * signatures, 1 otherwise. Exported so the vacuousness guard can be
 * negative-tested with an empty list.
 */
export function verifySignatures(specifiers) {
  const workdir = mkdtempSync(join(tmpdir(), 'graphorin-sig-'));
  writeFileSync(
    join(workdir, 'package.json'),
    `${JSON.stringify({ name: 'graphorin-sig-scratch', private: true, version: '0.0.0' }, null, 2)}\n`,
  );

  if (specifiers.length > 0) {
    const installArgs = [
      'install',
      '--ignore-scripts',
      '--no-fund',
      '--no-audit',
      '--legacy-peer-deps',
      ...specifiers,
    ];
    // One retry absorbs registry flakes (mirrors the C4 smoke); a second
    // failure is a real signal and fails the step hard.
    for (let attempt = 1; ; attempt += 1) {
      try {
        execFileSync('npm', installArgs, { cwd: workdir, stdio: 'inherit' });
        break;
      } catch (err) {
        if (attempt >= 2) throw err;
        console.warn('check-dep-signatures: install failed once (registry flake?); retrying');
      }
    }
  }

  let output = '';
  let auditFailed = false;
  try {
    output = execFileSync('npm', ['audit', 'signatures'], {
      cwd: workdir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    auditFailed = true;
    output = `${err.stdout ?? ''}\n${err.stderr ?? ''}`;
  }
  process.stdout.write(output);

  if (auditFailed) {
    console.error('check-dep-signatures: FAIL - npm audit signatures exited non-zero.');
    return 1;
  }

  const verified = output.match(/(\d+)\s+packages?\s+have\s+verified\s+registry\s+signatures/);
  const count = verified ? Number(verified[1]) : 0;
  if (count <= 0) {
    console.error(
      'check-dep-signatures: FAIL - zero (or unparsable) verified-signature count; ' +
        'a vacuous pass is indistinguishable from a broken step, so it fails (E2 guard).',
    );
    return 1;
  }
  console.log(`check-dep-signatures: OK - ${count} packages with verified registry signatures.`);
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const specifiers = collectExternalSpecifiers();
    console.log(`check-dep-signatures: verifying ${specifiers.length} external specifier(s).`);
    process.exit(verifySignatures(specifiers));
  } catch (err) {
    console.error('check-dep-signatures: ERROR');
    console.error(err);
    process.exit(2);
  }
}
