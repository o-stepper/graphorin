#!/usr/bin/env node
/**
 * Published-peer-graph vulnerability audit (deep-retest 0.13.8 P2).
 *
 * The workspace's own scanners audit pnpm-lock.yaml - which applies
 * pnpm overrides that npm consumers never inherit - so an advisory in
 * the PUBLISHED auto-installed dependency/peer graph is structurally
 * invisible to them. Concrete instance: the workspace pinned
 * `adm-zip >= 0.6.0` via an override (PR #206) while npm consumers of
 * `@graphorin/embedder-transformersjs` still receive the vulnerable
 * 0.5.x through `@huggingface/transformers -> onnxruntime-node`.
 *
 * This script audits what consumers actually get: for EVERY published
 * `@graphorin/*` package it performs a fresh isolated `npm install`
 * (scripts disabled - the audit is metadata-only) and runs
 * `npm audit --omit=dev`. High/critical advisories are gated against
 * the reviewed allowlist in `.github/published-peer-audit-allowlist.json`:
 *
 *   - a high/critical advisory NOT in the allowlist fails the run;
 *   - an allowlist entry that no longer appears ANYWHERE fails too, so
 *     the list (and the documented mitigations) cannot go stale;
 *   - moderate/low advisories are reported but do not fail.
 *
 * Needs npm-registry network access - wired into the consumer-smoke
 * workflow (schedule + dispatch), not a per-PR gate: it audits the
 * registry state, which no PR can change.
 *
 * Run locally: `node ./scripts/audit-published-peers.mjs [--version latest]`
 *
 * Exit codes:
 *   0 - no unlisted high/critical advisories, no stale allowlist entries.
 *   1 - audit failure (unlisted advisory or stale allowlist entry).
 *   2 - invocation / environment error.
 */

import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ALLOWLIST_PATH = join(ROOT, '.github', 'published-peer-audit-allowlist.json');

const versionFlag = process.argv.indexOf('--version');
const VERSION = versionFlag !== -1 ? (process.argv[versionFlag + 1] ?? 'latest') : 'latest';

/** Every non-private workspace package name, straight from packages/. */
function publishedPackageNames() {
  const names = [];
  for (const entry of readdirSync(join(ROOT, 'packages'))) {
    let manifest;
    try {
      manifest = JSON.parse(readFileSync(join(ROOT, 'packages', entry, 'package.json'), 'utf8'));
    } catch {
      continue;
    }
    if (manifest.private === true || typeof manifest.name !== 'string') continue;
    names.push(manifest.name);
  }
  return names.sort();
}

function run(cmd, args, options = {}) {
  return spawnSync(cmd, args, { encoding: 'utf8', ...options });
}

/** GHSA id from an advisory URL like https://github.com/advisories/GHSA-x. */
function ghsaFromUrl(url) {
  const match = /GHSA-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}$/i.exec(url ?? '');
  return match === null ? null : match[0];
}

function main() {
  let allowlist;
  try {
    allowlist = JSON.parse(readFileSync(ALLOWLIST_PATH, 'utf8')).advisories ?? [];
  } catch (error) {
    console.error(`::error::cannot read ${ALLOWLIST_PATH}: ${String(error)}`);
    process.exit(2);
  }
  const allowlisted = new Map(allowlist.map((entry) => [entry.ghsa, entry]));
  // 1.0 criterion: every temporary security exception has an owner, a
  // rationale, and an END date. A hard `expires` forces a periodic
  // re-review - on expiry either the removeWhen condition is met
  // (delete the entry) or a fresh review extends the date in the same
  // commit that re-justifies it. Without this, an allowlist entry is
  // silently permanent.
  const today = new Date().toISOString().slice(0, 10);
  const soon = new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10);
  let expiredEntries = 0;
  for (const entry of allowlist) {
    if (typeof entry.owner !== 'string' || entry.owner.length === 0) {
      console.error(
        `::error::allowlist entry ${entry.ghsa} has no 'owner' - every exception needs one.`,
      );
      expiredEntries += 1;
      continue;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.expires ?? '')) {
      console.error(
        `::error::allowlist entry ${entry.ghsa} has no 'expires' (YYYY-MM-DD) - exceptions must end.`,
      );
      expiredEntries += 1;
      continue;
    }
    if (entry.expires < today) {
      console.error(
        `::error::allowlist entry ${entry.ghsa} EXPIRED on ${entry.expires} (owner: ${entry.owner}). ` +
          `Re-review: if '${entry.removeWhen}' is now true, delete the entry (and its docs); ` +
          'otherwise extend expires in the same commit that re-justifies it.',
      );
      expiredEntries += 1;
    } else if (entry.expires <= soon) {
      console.warn(
        `[published-peer-audit] WARN: allowlist entry ${entry.ghsa} expires ${entry.expires} ` +
          `(owner: ${entry.owner}) - re-review due.`,
      );
    }
  }
  if (expiredEntries > 0) {
    console.error(
      `[published-peer-audit] FAIL: ${expiredEntries} expired/incomplete allowlist entr(y/ies).`,
    );
    process.exit(1);
  }
  const packages = publishedPackageNames();
  if (packages.length === 0) {
    console.error('::error::no published packages found under packages/ - wrong checkout?');
    process.exit(2);
  }
  console.log(
    `[published-peer-audit] auditing ${packages.length} packages at version '${VERSION}' ` +
      `(allowlist: ${allowlisted.size} reviewed advisories)`,
  );

  /** ghsa -> { advisory, packages: Set<string> } across the whole sweep. */
  const seen = new Map();
  const offending = [];
  const skipped = [];

  for (const name of packages) {
    const spec = `${name}@${VERSION}`;
    // A package that exists on main but is not published yet (first
    // release pending) must not hard-fail the Monday cron - skip LOUDLY.
    const view = run('npm', ['view', spec, 'version', '--json']);
    if (view.status !== 0 || view.stdout.trim() === '') {
      skipped.push(name);
      console.log(`::warning::[published-peer-audit] ${spec} not on the registry - SKIPPED`);
      continue;
    }
    const dir = mkdtempSync(join(tmpdir(), 'graphorin-peer-audit-'));
    try {
      writeFileSync(
        join(dir, 'package.json'),
        JSON.stringify({ name: 'peer-audit-consumer', private: true }, null, 2),
      );
      // --ignore-scripts: the audit reads metadata, native postinstalls
      // would only add minutes and attack surface. Auto-installed peers
      // (npm >= 7) are exactly what this audit is about.
      const install = run(
        'npm',
        ['install', spec, '--ignore-scripts', '--no-audit', '--no-fund', '--loglevel=error'],
        { cwd: dir },
      );
      if (install.status !== 0) {
        console.error(`::error::[published-peer-audit] npm install ${spec} failed:`);
        console.error(install.stderr.trim() || install.stdout.trim());
        process.exitCode = 1;
        continue;
      }
      // npm audit exits non-zero whenever it finds anything - parse the
      // JSON instead of trusting the exit code.
      const audit = run('npm', ['audit', '--omit=dev', '--json'], { cwd: dir });
      let report;
      try {
        report = JSON.parse(audit.stdout);
      } catch {
        console.error(`::error::[published-peer-audit] npm audit ${spec} returned no JSON`);
        process.exitCode = 1;
        continue;
      }
      const advisories = new Map();
      for (const vuln of Object.values(report.vulnerabilities ?? {})) {
        for (const via of vuln.via ?? []) {
          if (typeof via !== 'object' || via === null) continue;
          const ghsa = ghsaFromUrl(via.url);
          if (ghsa !== null) advisories.set(ghsa, via);
        }
      }
      const summary = [...advisories.values()]
        .map((a) => `${a.name} ${a.severity} (${ghsaFromUrl(a.url)})`)
        .join('; ');
      console.log(`[published-peer-audit] ${spec}: ${advisories.size === 0 ? 'clean' : summary}`);
      for (const [ghsa, advisory] of advisories) {
        const record = seen.get(ghsa) ?? { advisory, packages: new Set() };
        record.packages.add(name);
        seen.set(ghsa, record);
        const gated = advisory.severity === 'high' || advisory.severity === 'critical';
        if (gated && !allowlisted.has(ghsa)) {
          offending.push({ ghsa, advisory, package: name });
        }
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  for (const { ghsa, advisory, package: pkg } of offending) {
    console.error(
      `::error::[published-peer-audit] UNLISTED ${advisory.severity} advisory ${ghsa} ` +
        `(${advisory.name}: ${advisory.title}) reachable from ${pkg} - review it and either ` +
        'fix the chain or add a reviewed allowlist entry with a documented mitigation.',
    );
  }
  const stale = [...allowlisted.keys()].filter((ghsa) => !seen.has(ghsa));
  for (const ghsa of stale) {
    console.error(
      `::error::[published-peer-audit] STALE allowlist entry ${ghsa} - the advisory no longer ` +
        'appears in any published package graph. Remove the entry and retire its documented ' +
        'mitigation (documentation/guide/security.md).',
    );
  }
  if (skipped.length > 0) {
    console.log(`[published-peer-audit] skipped (not on registry): ${skipped.join(', ')}`);
  }

  // deep-retest-0.13.10 P2: prove the DOCUMENTED mitigation still
  // neutralizes each allowlisted advisory against the live registry.
  // An allowlist entry may declare `mitigation`: the consumer package
  // to install plus the npm `overrides` block the docs prescribe. The
  // fixture install applies the override and the advisory must be
  // GONE - if upstream shifts and the documented one-liner stops
  // working, this fails before a user discovers it the hard way.
  for (const entry of allowlist) {
    if (entry.mitigation === undefined) continue;
    if (!seen.has(entry.ghsa)) continue; // the stale path already failed above
    const spec = `${entry.mitigation.package}@${VERSION}`;
    const dir = mkdtempSync(join(tmpdir(), 'graphorin-peer-audit-mitigated-'));
    try {
      writeFileSync(
        join(dir, 'package.json'),
        JSON.stringify(
          { name: 'peer-audit-mitigated', private: true, overrides: entry.mitigation.overrides },
          null,
          2,
        ),
      );
      const install = run(
        'npm',
        ['install', spec, '--ignore-scripts', '--no-audit', '--no-fund', '--loglevel=error'],
        { cwd: dir },
      );
      if (install.status !== 0) {
        console.error(`::error::[published-peer-audit] mitigated install ${spec} failed:`);
        console.error(install.stderr.trim() || install.stdout.trim());
        process.exitCode = 1;
        continue;
      }
      const audit = run('npm', ['audit', '--omit=dev', '--json'], { cwd: dir });
      let report;
      try {
        report = JSON.parse(audit.stdout);
      } catch {
        console.error(
          `::error::[published-peer-audit] mitigated npm audit ${spec} returned no JSON`,
        );
        process.exitCode = 1;
        continue;
      }
      const still = new Set();
      for (const vuln of Object.values(report.vulnerabilities ?? {})) {
        for (const via of vuln.via ?? []) {
          if (typeof via !== 'object' || via === null) continue;
          const ghsa = ghsaFromUrl(via.url);
          if (ghsa !== null) still.add(ghsa);
        }
      }
      if (still.has(entry.ghsa)) {
        console.error(
          `::error::[published-peer-audit] MITIGATION FAILED for ${entry.ghsa}: the documented ` +
            `override no longer removes the advisory from ${spec} - update the mitigation ` +
            'and its docs together.',
        );
        process.exitCode = 1;
      } else {
        console.log(
          `[published-peer-audit] mitigation verified: ${entry.ghsa} absent from ${spec} ` +
            'with the documented override',
        );
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  if (offending.length > 0 || stale.length > 0 || process.exitCode === 1) {
    process.exit(1);
  }
  console.log(
    `[published-peer-audit] PASS: ${packages.length - skipped.length} package graphs audited, ` +
      `${seen.size} known advisories total, all high/critical ones allowlisted, live, ` +
      'and their documented mitigations verified.',
  );
}

main();
