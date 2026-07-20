#!/usr/bin/env node
/**
 * check-dist-budget.mjs - size budgets for the built docs site.
 *
 * The API reference once weighed 1.0 GB of a 1.1 GB dist because the
 * full TypeDoc symbol sidebar (~320 KB of DOM) was server-rendered
 * into every one of ~3200 pages. The sidebar diet (package-contextual
 * module-level sidebar in .vitepress/sidebar.ts) brought the dist to
 * ~145 MB; this gate keeps any such amplification from regressing
 * silently. Budgets live in documentation/docs-dist-budget.json.
 *
 * Checks:
 *   - total dist size
 *   - average and p95 size of api/**.html pages
 *   - largest single file in the dist
 *
 * Usage: node documentation/scripts/check-dist-budget.mjs [--self-test]
 * Exit codes: 0 ok - 1 budget breached / dist missing - 2 self-test failure.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const DOCS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(DOCS_DIR, '.vitepress', 'dist');
const BUDGET_PATH = join(DOCS_DIR, 'docs-dist-budget.json');

function walk(dir, out) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile()) out.push({ path: full, size: statSync(full).size });
  }
  return out;
}

function mb(bytes) {
  return `${(bytes / 1e6).toFixed(1)} MB`;
}

function kb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function loadBudget() {
  const budget = JSON.parse(readFileSync(BUDGET_PATH, 'utf8'));
  for (const key of [
    'maxTotalBytes',
    'maxApiHtmlAvgBytes',
    'maxApiHtmlP95Bytes',
    'maxLargestAssetBytes',
  ]) {
    if (typeof budget[key] !== 'number' || budget[key] <= 0) {
      throw new Error(`docs-dist-budget.json: ${key} must be a positive number`);
    }
  }
  return budget;
}

if (process.argv.includes('--self-test')) {
  try {
    loadBudget();
    console.log('[check-dist-budget] self-test OK - budget file parses and is positive.');
    process.exit(0);
  } catch (err) {
    console.error(
      `[check-dist-budget] self-test FAIL - ${err instanceof Error ? err.message : err}`,
    );
    process.exit(2);
  }
}

let budget;
try {
  budget = loadBudget();
} catch (err) {
  console.error(`[check-dist-budget] ${err instanceof Error ? err.message : err}`);
  process.exit(1);
}

let files;
try {
  files = walk(DIST, []);
} catch {
  console.error(`[check-dist-budget] dist not found at ${DIST} - run pnpm docs:build first.`);
  process.exit(1);
}

const total = files.reduce((sum, f) => sum + f.size, 0);
const API_PREFIX = join(DIST, 'api') + (process.platform === 'win32' ? '\\' : '/');
const apiHtml = files
  .filter((f) => f.path.startsWith(API_PREFIX) && f.path.endsWith('.html'))
  .map((f) => f.size)
  .sort((a, b) => a - b);
const largest = files.reduce((max, f) => (f.size > max.size ? f : max), {
  path: '(none)',
  size: 0,
});

const failures = [];
if (total > budget.maxTotalBytes) {
  failures.push(`total dist ${mb(total)} exceeds budget ${mb(budget.maxTotalBytes)}`);
}
if (apiHtml.length === 0) {
  failures.push('no api/**.html pages found in the dist - build incomplete?');
} else {
  const avg = apiHtml.reduce((s, v) => s + v, 0) / apiHtml.length;
  const p95 = apiHtml[Math.min(apiHtml.length - 1, Math.floor(apiHtml.length * 0.95))];
  if (avg > budget.maxApiHtmlAvgBytes) {
    failures.push(`api html average ${kb(avg)} exceeds budget ${kb(budget.maxApiHtmlAvgBytes)}`);
  }
  if (p95 > budget.maxApiHtmlP95Bytes) {
    failures.push(`api html p95 ${kb(p95)} exceeds budget ${kb(budget.maxApiHtmlP95Bytes)}`);
  }
  console.log(
    `[check-dist-budget] total ${mb(total)} (budget ${mb(budget.maxTotalBytes)}); api html n=${apiHtml.length} avg ${kb(avg)} p95 ${kb(p95)} (budgets ${kb(budget.maxApiHtmlAvgBytes)} / ${kb(budget.maxApiHtmlP95Bytes)}).`,
  );
}
if (largest.size > budget.maxLargestAssetBytes) {
  failures.push(
    `largest asset ${relative(DIST, largest.path)} at ${mb(largest.size)} exceeds budget ${mb(budget.maxLargestAssetBytes)}`,
  );
} else {
  console.log(
    `[check-dist-budget] largest asset: ${relative(DIST, largest.path)} (${mb(largest.size)}, budget ${mb(budget.maxLargestAssetBytes)}).`,
  );
}

if (failures.length > 0) {
  for (const f of failures) console.error(`[check-dist-budget] FAIL - ${f}`);
  console.error(
    '[check-dist-budget] If the growth is legitimate content, raise the budget in documentation/docs-dist-budget.json with a justification; if a page suddenly ballooned, look for SSR amplification (sidebar/nav DOM) first.',
  );
  process.exit(1);
}
console.log('[check-dist-budget] OK - all budgets hold.');
