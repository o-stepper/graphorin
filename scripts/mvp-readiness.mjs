#!/usr/bin/env node
/**
 * mvp-readiness.mjs
 *
 * Single entry point that runs the v0.4.0 release-readiness gates
 * end-to-end. Used both locally (`pnpm run mvp-readiness`) and from
 * the release CI workflow before any package gets published.
 *
 * Gates (run sequentially; first failure aborts the run):
 *
 *   1. lint              — `pnpm lint`              (Biome, repo-wide)
 *   2. typecheck         — `pnpm typecheck`         (turbo run typecheck; `dependsOn: ["^build"]`)
 *   3. build             — `pnpm build`             (turbo run build; tsdown across the workspace)
 *   4. test              — `pnpm test`              (turbo run test; vitest across the workspace)
 *   5. check-no-network  — `pnpm run check-no-network` (zero-default-telemetry promise)
 *   6. check-anthropic-spec — `pnpm run check-anthropic-spec` (Skills format snapshot drift)
 *   7. check-licenses    — `pnpm run check-licenses`   (SPDX allowlist enforcement)
 *   8. workspace audit   — every published @graphorin/* package has a non-stub
 *                          version 0.4.0, license MIT, author Oleksiy Stepurenko,
 *                          publishConfig.provenance true, and no `private: true` flag.
 *
 * Flags:
 *   --skip-build     skip gates 3 + 4 (build + test). Useful for a fast
 *                    "is the surface release-shaped?" check; CI never
 *                    passes this flag.
 *   --json           emit a JSON report to stdout instead of the
 *                    human-friendly stream.
 *
 * Exit codes:
 *   0 — every gate passed.
 *   1 — at least one gate failed.
 *   2 — invocation error (missing tooling, etc.).
 */

import { spawn } from 'node:child_process';
import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const PACKAGES_DIR = join(ROOT, 'packages');
const REQUIRED_VERSION = '0.4.0';
const REQUIRED_AUTHOR = 'Oleksiy Stepurenko';
const REQUIRED_LICENSE = 'MIT';

function parseInvocation() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      'skip-build': { type: 'boolean', default: false },
      json: { type: 'boolean', default: false },
    },
    allowPositionals: false,
  });
  return values;
}

/**
 * Run a child process and stream stdout / stderr to the parent. The
 * resolved promise carries the elapsed wall-clock time in milliseconds
 * and the exit code; the caller decides how to react.
 */
function runCommand(label, cmd, args, { quiet }) {
  return new Promise((resolveRun) => {
    const startedAt = Date.now();
    const child = spawn(cmd, args, {
      cwd: ROOT,
      stdio: quiet ? ['ignore', 'pipe', 'pipe'] : 'inherit',
      env: { ...process.env, FORCE_COLOR: '0' },
    });
    let stdout = '';
    let stderr = '';
    if (quiet && child.stdout) child.stdout.on('data', (b) => (stdout += b.toString('utf8')));
    if (quiet && child.stderr) child.stderr.on('data', (b) => (stderr += b.toString('utf8')));
    child.on('close', (code) => {
      const elapsedMs = Date.now() - startedAt;
      resolveRun({ label, exitCode: code ?? 1, elapsedMs, stdout, stderr });
    });
    child.on('error', (err) => {
      const elapsedMs = Date.now() - startedAt;
      resolveRun({
        label,
        exitCode: 127,
        elapsedMs,
        stdout: '',
        stderr: err.stack ?? String(err),
      });
    });
  });
}

/**
 * Workspace audit (gate 8). Returns a `WorkspaceAuditReport` with a
 * pass / fail decision per package + a flat list of violations.
 */
async function workspaceAudit() {
  const violations = [];
  const inspected = [];
  let entries;
  try {
    entries = await readdir(PACKAGES_DIR, { withFileTypes: true });
  } catch (err) {
    return {
      ok: false,
      inspected: [],
      violations: [
        { pkg: '<workspace>', field: 'packages/', message: `cannot enumerate: ${err.message}` },
      ],
    };
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const manifestPath = join(PACKAGES_DIR, entry.name, 'package.json');
    let manifest;
    try {
      manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    } catch (err) {
      violations.push({
        pkg: entry.name,
        field: 'package.json',
        message: `cannot parse: ${err.message}`,
      });
      continue;
    }
    inspected.push(manifest.name ?? entry.name);
    const fail = (field, expected, actual) =>
      violations.push({
        pkg: manifest.name ?? entry.name,
        field,
        message: `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
      });
    if (manifest.private === true) fail('private', false, true);
    if (manifest.version !== REQUIRED_VERSION) fail('version', REQUIRED_VERSION, manifest.version);
    if (manifest.license !== REQUIRED_LICENSE) fail('license', REQUIRED_LICENSE, manifest.license);
    if (manifest.author !== REQUIRED_AUTHOR) fail('author', REQUIRED_AUTHOR, manifest.author);
    if (manifest.publishConfig?.provenance !== true)
      fail('publishConfig.provenance', true, manifest.publishConfig?.provenance);
    if (manifest.publishConfig?.access !== 'public')
      fail('publishConfig.access', 'public', manifest.publishConfig?.access);
    if (!manifest.engines?.node?.includes('22'))
      fail('engines.node', '>=22.0.0', manifest.engines?.node);
    if (manifest.repository?.directory !== `packages/${entry.name}`)
      fail('repository.directory', `packages/${entry.name}`, manifest.repository?.directory);
    if (
      !Array.isArray(manifest.files) ||
      !manifest.files.includes('README.md') ||
      !manifest.files.includes('LICENSE') ||
      !manifest.files.includes('CHANGELOG.md')
    )
      fail('files', '[..., README.md, LICENSE, CHANGELOG.md]', manifest.files);

    for (const required of ['README.md', 'LICENSE', 'CHANGELOG.md']) {
      const filePath = join(PACKAGES_DIR, entry.name, required);
      try {
        await stat(filePath);
      } catch {
        violations.push({
          pkg: manifest.name ?? entry.name,
          field: required,
          message: 'file missing on disk',
        });
      }
    }
  }
  return { ok: violations.length === 0, inspected, violations };
}

function summarise(label, ok, elapsedMs, extras = '') {
  const status = ok ? 'PASS' : 'FAIL';
  const seconds = (elapsedMs / 1000).toFixed(1);
  return `[${status}] ${label.padEnd(24)} (${seconds.padStart(5)}s)${extras ? '  ' + extras : ''}`;
}

async function main() {
  const flags = parseInvocation();
  const json = flags.json === true;
  const skipBuild = flags['skip-build'] === true;

  // Use the turbo-aware aliases for typecheck / build / test instead of
  // `pnpm -r ...`. The `typecheck` and `test` tasks declare
  // `dependsOn: ["^build"]` in turbo.json, so producers (e.g.
  // `@graphorin/core`) are built first and consumers can resolve
  // `dist/*.d.ts` types. Plain `pnpm -r typecheck` is
  // topology-aware but never produces those build artifacts, which
  // surfaces as `TS2307: Cannot find module '@graphorin/core'`.
  const gates = [
    { label: 'lint', kind: 'cmd', cmd: 'pnpm', args: ['lint'] },
    { label: 'typecheck', kind: 'cmd', cmd: 'pnpm', args: ['typecheck'] },
    !skipBuild && { label: 'build', kind: 'cmd', cmd: 'pnpm', args: ['build'] },
    !skipBuild && { label: 'test', kind: 'cmd', cmd: 'pnpm', args: ['test'] },
    {
      label: 'check-no-network',
      kind: 'cmd',
      cmd: 'pnpm',
      args: ['run', 'check-no-network'],
    },
    {
      label: 'check-anthropic-spec',
      kind: 'cmd',
      cmd: 'pnpm',
      args: ['run', 'check-anthropic-spec'],
    },
    {
      label: 'check-licenses',
      kind: 'cmd',
      cmd: 'pnpm',
      args: ['run', 'check-licenses'],
    },
    { label: 'workspace-audit', kind: 'audit' },
  ].filter(Boolean);

  const lines = [];
  const results = [];
  let firstFailureIndex = -1;
  if (!json) {
    console.log(
      `mvp-readiness: starting${skipBuild ? ' (skip-build)' : ''} — ${gates.length} gates.`,
    );
  }

  for (const [index, gate] of gates.entries()) {
    if (gate.kind === 'cmd') {
      if (!json) console.log(`\n--- gate ${index + 1}/${gates.length}: ${gate.label} ---`);
      const result = await runCommand(gate.label, gate.cmd, gate.args, { quiet: json });
      const ok = result.exitCode === 0;
      results.push({ gate: gate.label, ok, elapsedMs: result.elapsedMs });
      lines.push(summarise(gate.label, ok, result.elapsedMs));
      if (!ok && firstFailureIndex < 0) firstFailureIndex = index;
      if (!ok) {
        if (!json && result.stderr) console.error(result.stderr);
        break;
      }
    } else {
      if (!json) console.log(`\n--- gate ${index + 1}/${gates.length}: workspace-audit ---`);
      const startedAt = Date.now();
      const audit = await workspaceAudit();
      const elapsedMs = Date.now() - startedAt;
      const ok = audit.ok;
      results.push({
        gate: 'workspace-audit',
        ok,
        elapsedMs,
        inspected: audit.inspected.length,
        violations: audit.violations,
      });
      lines.push(
        summarise(
          'workspace-audit',
          ok,
          elapsedMs,
          `${audit.inspected.length} package(s) inspected; ${audit.violations.length} violation(s)`,
        ),
      );
      if (!ok && firstFailureIndex < 0) firstFailureIndex = index;
      if (!ok && !json) {
        for (const v of audit.violations) {
          console.error(`  - ${v.pkg}: ${v.field} — ${v.message}`);
        }
      }
    }
  }

  const overallOk = firstFailureIndex < 0;

  if (json) {
    process.stdout.write(`${JSON.stringify({ ok: overallOk, results }, null, 2)}\n`);
  } else {
    console.log('\n=== mvp-readiness summary ===');
    for (const line of lines) console.log(line);
    console.log('==============================');
    if (overallOk) {
      console.log('mvp-readiness: PASS — every gate is green; v0.4.0 is release-shaped.');
    } else {
      console.error(
        `mvp-readiness: FAIL — gate '${results.find((r) => !r.ok)?.gate ?? '<unknown>'}' failed; remaining gates skipped.`,
      );
    }
  }
  process.exit(overallOk ? 0 : 1);
}

main().catch((err) => {
  console.error('mvp-readiness: ERROR');
  console.error(err);
  process.exit(2);
});
