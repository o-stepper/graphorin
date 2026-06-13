#!/usr/bin/env node
/**
 * check-anthropic-spec.mjs
 *
 * Verifies that `@graphorin/skills` remains forward-compatible with the
 * upstream **Agent Skills** packaging format (an open file-format
 * specification published by Anthropic at
 * https://github.com/anthropics/skills).
 *
 * Graphorin treats the Agent Skills packaging format as an
 * *interoperability standard*: any `SKILL.md` file authored against
 * the upstream format must load in `@graphorin/skills` without
 * modification, and any Graphorin-specific extensions live under the
 * `graphorin-*` namespace prefix on the frontmatter so they remain
 * forward-compatible.
 *
 * This helper is invoked manually, or by the `mvp-readiness` gate
 * (gate 6) which runs it in no-upstream skip mode. There is NO
 * scheduled CI job that supplies an upstream snapshot — so in every
 * automated context today the diff is skipped and the gate only
 * confirms the bundled snapshot parses. Real drift detection requires
 * the maintainer to pass `--upstream <path>` (or set
 * `GRAPHORIN_UPSTREAM_SPEC_PATH`) with a snapshot fetched manually from
 * `https://agentskills.io/specification`.
 *
 * It compares the bundled `packages/skills/anthropic-spec-snapshot.json`
 * against that upstream snapshot. When none is supplied the helper exits
 * 0 with a "no upstream supplied" notice (a skip, not a verification) so
 * it can run offline.
 *
 * Usage:
 *
 *   pnpm run check-anthropic-spec
 *   pnpm run check-anthropic-spec -- --upstream ./tmp/upstream-snapshot.json
 *   GRAPHORIN_UPSTREAM_SPEC_PATH=./tmp/upstream-snapshot.json \
 *     pnpm run check-anthropic-spec
 *
 * Exit codes:
 *   0 — no drift (bundled covers every upstream field), OR no upstream
 *       snapshot was supplied so the diff was skipped.
 *   1 — upstream snapshot adds or removes a field; review required.
 *   2 — invocation error (file missing, JSON parse failure, etc.).
 */

import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const BUNDLED_PATH = join(ROOT, 'packages', 'skills', 'anthropic-spec-snapshot.json');

const NOTICE = 'check-anthropic-spec';

/** Best-effort ISO-8601 date diff in days. */
function daysBetween(a, b) {
  const ad = new Date(a);
  const bd = new Date(b);
  if (Number.isNaN(ad.getTime()) || Number.isNaN(bd.getTime())) return null;
  const ms = bd.getTime() - ad.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function parseInvocation() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      upstream: { type: 'string' },
    },
    allowPositionals: false,
  });
  const upstream = values.upstream ?? process.env.GRAPHORIN_UPSTREAM_SPEC_PATH ?? null;
  return { upstream };
}

async function loadJson(path, label) {
  try {
    const raw = await readFile(path, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`${NOTICE}: cannot read ${label} '${path}': ${err.message}`);
    process.exit(2);
  }
}

function diffFields(bundled, upstream) {
  const bundledKeys = Object.keys(bundled.knownFields ?? {});
  const upstreamKeys = Object.keys(upstream.knownFields ?? {});
  const added = upstreamKeys.filter((k) => !bundledKeys.includes(k));
  const removed = bundledKeys.filter((k) => !upstreamKeys.includes(k));
  const changed = [];
  for (const key of upstreamKeys) {
    if (!bundledKeys.includes(key)) continue;
    const a = bundled.knownFields[key];
    const b = upstream.knownFields[key];
    if (
      a.required !== b.required ||
      a.type !== b.type ||
      (a.stability ?? null) !== (b.stability ?? null)
    ) {
      changed.push({ field: key, before: a, after: b });
    }
  }
  return { added, removed, changed };
}

function reportNoUpstream(bundled) {
  const ageDays = daysBetween(bundled.snapshotDate, new Date().toISOString().slice(0, 10));
  console.log(`${NOTICE}: bundled snapshot date ${bundled.snapshotDate}.`);
  if (ageDays !== null && ageDays > 90) {
    console.log(
      `${NOTICE}: WARNING — bundled snapshot is ${ageDays} days old; consider refreshing.`,
    );
  }
  console.log(`${NOTICE}: no upstream snapshot supplied; skipping diff (PASS).`);
  console.log(
    `${NOTICE}: re-run with '--upstream <path>' or set GRAPHORIN_UPSTREAM_SPEC_PATH to compare against`,
  );
  console.log(`${NOTICE}: a snapshot fetched from ${bundled.specSource}.`);
}

async function main() {
  const invocation = parseInvocation();
  const bundled = await loadJson(BUNDLED_PATH, 'bundled snapshot');
  if (invocation.upstream === null || invocation.upstream === '') {
    reportNoUpstream(bundled);
    process.exit(0);
  }
  const upstream = await loadJson(invocation.upstream, 'upstream snapshot');

  const diff = diffFields(bundled, upstream);
  console.log(`${NOTICE}: bundled  snapshot date: ${bundled.snapshotDate}`);
  console.log(`${NOTICE}: upstream snapshot date: ${upstream.snapshotDate ?? '<unknown>'}`);
  console.log(
    `${NOTICE}: bundled known-field count: ${Object.keys(bundled.knownFields ?? {}).length}`,
  );
  console.log(
    `${NOTICE}: upstream known-field count: ${Object.keys(upstream.knownFields ?? {}).length}`,
  );

  let drift = false;
  if (diff.added.length > 0) {
    console.log(`${NOTICE}: ADDED upstream fields:`);
    for (const field of diff.added) console.log(`  + ${field}`);
    drift = true;
  }
  if (diff.removed.length > 0) {
    console.log(`${NOTICE}: REMOVED upstream fields (still in bundled):`);
    for (const field of diff.removed) console.log(`  - ${field}`);
    drift = true;
  }
  if (diff.changed.length > 0) {
    console.log(`${NOTICE}: CHANGED upstream fields:`);
    for (const entry of diff.changed) {
      console.log(
        `  ~ ${entry.field}: ${JSON.stringify(entry.before)} -> ${JSON.stringify(entry.after)}`,
      );
    }
    drift = true;
  }

  if (!drift) {
    console.log(`${NOTICE}: PASS — no drift between bundled and upstream snapshots.`);
    process.exit(0);
  }
  console.error(
    `${NOTICE}: FAIL — drift detected. Review the diff and refresh packages/skills/anthropic-spec-snapshot.json + the graphorinMapping table when promoting new fields.`,
  );
  process.exit(1);
}

main().catch((err) => {
  console.error(`${NOTICE}: ERROR`);
  console.error(err);
  process.exit(2);
});
