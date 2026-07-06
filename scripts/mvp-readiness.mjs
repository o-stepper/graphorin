#!/usr/bin/env node
/**
 * mvp-readiness.mjs
 *
 * Single entry point that runs the release-readiness gates
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
 *                          version matching the root manifest (lockstep), license
 *                          MIT, author Oleksiy Stepurenko, publishConfig.provenance
 *                          true, and no `private: true` flag. E2 additions: the
 *                          package CHANGELOG's top entry must equal the release
 *                          version (docs-11 class: stale 0.1.0 changelogs shipped
 *                          in every 0.5.0 tarball), and every `exports` target
 *                          must resolve to a real file under the package dir
 *                          (skipped under --skip-build, where dist/ may be absent).
 *
 * Flags:
 *   --skip-build     skip gates 3 + 4 (build + test). Useful for a fast
 *                    "is the surface release-shaped?" check; CI never
 *                    passes this flag.
 *   --audit-only     run ONLY gate 8 (workspace audit, including the
 *                    exports-map resolution — expects dist/ to exist).
 *                    Maintainer convenience; CI never passes this flag.
 *   --json           emit a JSON report to stdout instead of the
 *                    human-friendly stream.
 *
 * Exit codes:
 *   0 — every gate passed.
 *   1 — at least one gate failed.
 *   2 — invocation error (missing tooling, etc.).
 */

import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const PACKAGES_DIR = join(ROOT, 'packages');
// CI-4: the reference version is the root manifest's version, not a hardcoded
// literal. Every published package must match the root (lockstep), so when a
// version PR bumps the root the gate moves with it — otherwise the gate would
// reject the very release it produced (e.g. after 0.4.0 → 0.4.1 every package
// would read `version !== '0.6.0'` and fail before the publish step).
const REQUIRED_VERSION = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;
const REQUIRED_AUTHOR = 'Oleksiy Stepurenko';
const REQUIRED_LICENSE = 'MIT';

function parseInvocation() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      'skip-build': { type: 'boolean', default: false },
      'audit-only': { type: 'boolean', default: false },
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
 * Collect every concrete file target reachable from an `exports` map
 * value (strings + nested condition objects). Wildcard patterns (`*`)
 * are skipped — they cannot be statted directly.
 */
function collectExportTargets(value, out) {
  if (typeof value === 'string') {
    if (!value.includes('*')) out.push(value);
    return out;
  }
  if (value !== null && typeof value === 'object') {
    for (const nested of Object.values(value)) collectExportTargets(nested, out);
  }
  return out;
}

/**
 * Workspace audit (gate 8). Returns a `WorkspaceAuditReport` with a
 * pass / fail decision per package + a flat list of violations.
 *
 * `checkExports: false` (the --skip-build fast path) skips the
 * exports-map resolution — dist/ may legitimately be absent there.
 */
async function workspaceAudit({ checkExports } = { checkExports: true }) {
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
    // E2: exact-match instead of the old `.includes('22')` substring test,
    // which would have accepted e.g. `^0.22.0`.
    // W-072: floor raised to 22.12 - the first line where require(esm)
    // is stable, required by the `default` exports condition.
    if (manifest.engines?.node !== '>=22.12.0')
      fail('engines.node', '>=22.12.0', manifest.engines?.node);
    if (manifest.repository?.directory !== `packages/${entry.name}`)
      fail('repository.directory', `packages/${entry.name}`, manifest.repository?.directory);
    if (
      !Array.isArray(manifest.files) ||
      !manifest.files.includes('README.md') ||
      !manifest.files.includes('LICENSE') ||
      !manifest.files.includes('CHANGELOG.md') ||
      // W-136: src ships in the tarball so the relative `../src/*.ts`
      // paths inside dist/*.d.ts.map resolve for consumers
      // (go-to-definition lands on real sources).
      !manifest.files.includes('src')
    )
      fail('files', '[..., src, README.md, LICENSE, CHANGELOG.md]', manifest.files);
    // W-137: every publishable package must DECLARE its tree-shaking
    // contract - `false` (pure module scope), an array (specific
    // effectful files, e.g. the cli bin), or an explicit `true` for a
    // package with real import-time effects (security's resolver
    // registration). Absence is the only failure: it silently opts the
    // package out of bundler tree-shaking with no reviewable decision.
    if (
      manifest.sideEffects !== false &&
      manifest.sideEffects !== true &&
      !Array.isArray(manifest.sideEffects)
    )
      fail('sideEffects', 'false | true | string[]', manifest.sideEffects);

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

    // E2 / docs-11: the tarball ships CHANGELOG.md, so its top entry must be
    // the version being released — a changelog frozen at an old version
    // reaching consumers is exactly what this gate exists to stop. (The
    // 0.1.0-frozen set shipped inside every 0.5.0 tarball undetected.)
    try {
      const changelog = await readFile(join(PACKAGES_DIR, entry.name, 'CHANGELOG.md'), 'utf8');
      const top = changelog.match(/^## (\d+\.\d+\.\d+)/m);
      if (top === null) {
        fail('CHANGELOG.md', `top entry ## ${REQUIRED_VERSION}`, 'no version heading found');
      } else if (top[1] !== REQUIRED_VERSION) {
        fail('CHANGELOG.md top entry', `## ${REQUIRED_VERSION}`, `## ${top[1]}`);
      }
    } catch {
      // missing-on-disk already reported above
    }

    // E2: resolve every exports target to a real file so a subpath pointing
    // at an unbuilt/renamed dist file cannot ship (mvp-readiness runs after
    // the build gate, so dist/ must exist here).
    if (checkExports && manifest.exports !== undefined) {
      const targets = collectExportTargets(manifest.exports, []);
      for (const target of targets) {
        try {
          await stat(join(PACKAGES_DIR, entry.name, target));
        } catch {
          violations.push({
            pkg: manifest.name ?? entry.name,
            field: 'exports',
            message: `target ${JSON.stringify(target)} does not resolve to a file`,
          });
        }
      }
    }
  }
  // W-072: the Node floor must not drift by repository region - sweep
  // EVERY workspace manifest (root, examples, benchmarks, docs), not
  // just packages/. Private manifests skip the publish checks above but
  // still pin the same engines floor.
  const extraManifestGroups = [
    ['', ['package.json']],
    ['examples', null],
    ['benchmarks', null],
    ['documentation', ['documentation/package.json']],
  ];
  for (const [group, fixed] of extraManifestGroups) {
    let manifestPaths = fixed;
    if (manifestPaths === null) {
      try {
        const groupEntries = await readdir(join(ROOT, group), { withFileTypes: true });
        manifestPaths = groupEntries
          .filter((e) => e.isDirectory())
          .map((e) => `${group}/${e.name}/package.json`);
      } catch {
        manifestPaths = [];
      }
    }
    for (const rel of manifestPaths) {
      let manifest;
      try {
        manifest = JSON.parse(await readFile(join(ROOT, rel), 'utf8'));
      } catch {
        continue; // group member without a manifest
      }
      if (manifest.engines?.node !== '>=22.12.0') {
        violations.push({
          pkg: manifest.name ?? rel,
          field: 'engines.node',
          message: `expected ">=22.12.0", got ${JSON.stringify(manifest.engines?.node)} (${rel})`,
        });
      }
    }
  }
  return { ok: violations.length === 0, inspected, violations };
}

function summarise(label, ok, elapsedMs, extras = '') {
  const status = ok ? 'PASS' : 'FAIL';
  const seconds = (elapsedMs / 1000).toFixed(1);
  return `[${status}] ${label.padEnd(24)} (${seconds.padStart(5)}s)${extras ? `  ${extras}` : ''}`;
}

async function main() {
  const flags = parseInvocation();
  const json = flags.json === true;
  const skipBuild = flags['skip-build'] === true;
  const auditOnly = flags['audit-only'] === true;

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
    {
      label: 'check-version-consistency',
      kind: 'cmd',
      cmd: 'pnpm',
      args: ['run', 'check-version-consistency'],
    },
    {
      label: 'check-phantom-deps',
      kind: 'cmd',
      cmd: 'pnpm',
      args: ['run', 'check-phantom-deps'],
    },
    {
      label: 'check-gates-selftest',
      kind: 'cmd',
      cmd: 'pnpm',
      args: ['run', 'check-gates-selftest'],
    },
    { label: 'workspace-audit', kind: 'audit' },
  ]
    .filter(Boolean)
    .filter((gate) => !auditOnly || gate.kind === 'audit');

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
      const audit = await workspaceAudit({ checkExports: auditOnly || !skipBuild });
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
      console.log(
        `mvp-readiness: PASS — every gate is green; v${REQUIRED_VERSION} is release-shaped.`,
      );
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
