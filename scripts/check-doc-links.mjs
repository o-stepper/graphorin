#!/usr/bin/env node
/**
 * check-doc-links.mjs - docs-domain drift gate (deep-retest-0.13.9
 * P2).
 *
 * The documentation site lives at `docs.graphorin.com`; the landing
 * page at `graphorin.com` serves no `/guide`, `/api`, or `/reference`
 * paths, so a docs link on the bare domain is a guaranteed live 404.
 * Exactly that class shipped twice (the root README release teaser
 * and the store-sqlite concurrency-matrix link) because the lychee
 * link gate runs in offline file mode and never resolves external
 * URLs. This gate closes the structural blind spot for the one
 * external-link class the repo itself mints.
 *
 * Scope: every tracked *.md, including generated documentation/api
 * (shipped content; the api-freshness gate keeps it in sync with the
 * sources this gate also scans).
 *
 * Exit codes: 0 ok · 1 wrong-domain docs link found · 2 invocation
 * error.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Docs-site path roots that do not exist on the landing domain. A
 * `graphorin.com/<root>` link (without the `docs.` host) is always a
 * 404.
 */
export const DOCS_PATH_ROOTS = ['guide', 'api', 'reference'];

const WRONG_DOMAIN = new RegExp(
  `(?<!docs\\.)\\bgraphorin\\.com/(?:${DOCS_PATH_ROOTS.join('|')})(?=[/#?"')\\s]|$)`,
);

/**
 * Files exempt from the rule. Each entry must carry a reason (for
 * example a changelog quoting an old broken link verbatim). An empty
 * list is the healthy state.
 *
 * @type {ReadonlyArray<{ file: string; reason: string }>}
 */
export const ALLOWLIST = [];

/** Scan one file's text. Returns `{ line, match }` per hit. */
export function scanText(text) {
  const hits = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const m = WRONG_DOMAIN.exec(lines[i]);
    if (m !== null) hits.push({ line: i + 1, match: m[0] });
  }
  return hits;
}

/** Tracked markdown files, repo-relative with forward slashes. */
export function collectFiles() {
  return execFileSync('git', ['ls-files', '-z', '*.md'], {
    cwd: ROOT,
    encoding: 'utf8',
  })
    .split('\0')
    .filter(Boolean);
}

export function run() {
  const allowed = new Set(ALLOWLIST.map((a) => a.file));
  let bad = 0;
  for (const file of collectFiles()) {
    if (allowed.has(file)) continue;
    const hits = scanText(readFileSync(join(ROOT, file), 'utf8'));
    for (const h of hits) {
      console.error(`${file}:${h.line}: docs link on the landing domain: ${h.match}`);
      bad += 1;
    }
  }
  if (bad > 0) {
    console.error(
      `check-doc-links: FAIL - ${bad} docs link(s) on graphorin.com. ` +
        'The documentation site is docs.graphorin.com; rewrite the host ' +
        'or add the file to ALLOWLIST with a justifying reason.',
    );
    return 1;
  }
  console.log('check-doc-links: OK');
  return 0;
}

export function selfTest() {
  const cases = [
    ['wrong-domain guide link detected', 'see https://graphorin.com/guide/migration', 1],
    ['wrong-domain api link detected', '[api](https://graphorin.com/api/@graphorin/core)', 1],
    ['wrong-domain reference link detected', 'https://graphorin.com/reference/faq', 1],
    ['anchor form detected', 'https://graphorin.com/guide/storage#concurrency-matrix', 1],
    ['docs domain allowed', 'see https://docs.graphorin.com/guide/migration', 0],
    ['landing root allowed', 'visit https://graphorin.com for the project site', 0],
    ['landing assets allowed', 'https://graphorin.com/assets/logo.svg', 0],
    ['unrelated guide word allowed', 'the guide at docs.graphorin.com/guide is canonical', 0],
    ['guidepost path allowed', 'https://graphorin.com/guidepost', 0],
  ];
  let failed = 0;
  for (const [label, text, expected] of cases) {
    const got = scanText(text).length;
    if (got !== expected) {
      console.error(`self-test FAIL: ${label} (expected ${expected}, got ${got})`);
      failed += 1;
    }
  }
  const positioned = scanText('ok\nbad https://graphorin.com/guide/x here')[0];
  if (positioned === undefined || positioned.line !== 2) {
    console.error('self-test FAIL: line position');
    failed += 1;
  }
  for (const entry of ALLOWLIST) {
    if (!entry.file || !entry.reason || entry.reason.length < 10) {
      console.error(`self-test FAIL: allowlist entry without a justifying reason: ${entry.file}`);
      failed += 1;
    }
  }
  if (failed > 0) {
    console.error(`check-doc-links: self-test FAIL (${failed})`);
    return 1;
  }
  console.log('check-doc-links: self-test OK');
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    process.exit(process.argv.includes('--self-test') ? selfTest() : run());
  } catch (err) {
    console.error('check-doc-links: ERROR');
    console.error(err);
    process.exit(2);
  }
}
