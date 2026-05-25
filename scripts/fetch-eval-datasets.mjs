#!/usr/bin/env node
/**
 * fetch-eval-datasets.mjs
 *
 * Dev-only downloader for the memory-eval datasets used by
 * `@graphorin/benchmark-longmemeval`. Fetches LongMemEval_S, the real
 * LOCOMO set, and DMR into the git-ignored `benchmarks/.datasets/`
 * directory, skipping any file already present.
 *
 * This script lives under `scripts/` — intentionally NOT under
 * `packages/*\/src` — because it is the one place a networked dataset
 * download is allowed. That keeps the default install offline and the
 * `check-no-network` guard green (DEC-154 / ADR-041; the guard only
 * scans `packages/*\/src`).
 *
 * Usage:
 *   node scripts/fetch-eval-datasets.mjs                 # all datasets
 *   node scripts/fetch-eval-datasets.mjs --only locomo   # one dataset
 *   node scripts/fetch-eval-datasets.mjs --force         # re-download
 *
 * Some sources are gated (HuggingFace token / Google Drive). Override
 * any URL with an env var, e.g.:
 *   GRAPHORIN_LONGMEMEVAL_S_URL=https://... node scripts/fetch-eval-datasets.mjs
 */

import { mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'benchmarks', '.datasets');

/** Best-known sources. Gated sources expose an env override + a manual note. */
const DATASETS = [
  {
    id: 'longmemeval',
    file: 'longmemeval_s.json',
    url:
      process.env.GRAPHORIN_LONGMEMEVAL_S_URL ??
      'https://huggingface.co/datasets/xiaowu0162/LongMemEval/resolve/main/longmemeval_s.json',
    note: 'LongMemEval_S (arXiv:2410.10813). If gated, set GRAPHORIN_LONGMEMEVAL_S_URL or download manually from https://github.com/xiaowu0162/LongMemEval.',
  },
  {
    id: 'locomo',
    file: 'locomo10.json',
    url:
      process.env.GRAPHORIN_LOCOMO_URL ??
      'https://raw.githubusercontent.com/snap-research/locomo/main/data/locomo10.json',
    note: 'Real LOCOMO (arXiv:2402.17753) from https://github.com/snap-research/locomo.',
  },
  {
    id: 'dmr',
    file: 'dmr.json',
    url: process.env.GRAPHORIN_DMR_URL ?? '',
    note: 'DMR (MemGPT/Letta, arXiv:2310.08560). No stable public direct URL — set GRAPHORIN_DMR_URL to your copy.',
  },
];

function parseArgs(argv) {
  let force = false;
  let only;
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--force') force = true;
    else if (a === '--only' && argv[i + 1] !== undefined) only = argv[++i];
  }
  return { force, only };
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function download(ds) {
  if (ds.url === '') {
    console.warn(`[fetch-eval-datasets] ${ds.id}: no URL configured. ${ds.note}`);
    return 'skipped';
  }
  let res;
  try {
    res = await fetch(ds.url, { redirect: 'follow' });
  } catch (err) {
    console.error(
      `[fetch-eval-datasets] ${ds.id}: network error — ${err.message}. Are you offline? ${ds.note}`,
    );
    return 'error';
  }
  if (!res.ok) {
    console.error(`[fetch-eval-datasets] ${ds.id}: HTTP ${res.status} from ${ds.url}. ${ds.note}`);
    return 'error';
  }
  const dest = join(OUT_DIR, ds.file);
  const body = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, body);
  console.log(`[fetch-eval-datasets] ${ds.id}: wrote ${dest} (${body.length} bytes).`);
  return 'ok';
}

async function main() {
  const { force, only } = parseArgs(process.argv);
  await mkdir(OUT_DIR, { recursive: true });
  let ok = 0;
  let skipped = 0;
  let errored = 0;
  for (const ds of DATASETS) {
    if (only !== undefined && ds.id !== only) continue;
    const dest = join(OUT_DIR, ds.file);
    if (!force && (await exists(dest))) {
      console.log(
        `[fetch-eval-datasets] ${ds.id}: already present at ${dest} (use --force to re-download).`,
      );
      skipped++;
      continue;
    }
    const result = await download(ds);
    if (result === 'ok') ok++;
    else if (result === 'error') errored++;
    else skipped++;
  }
  console.log(
    `[fetch-eval-datasets] done: ${ok} downloaded, ${skipped} skipped, ${errored} failed → ${OUT_DIR}`,
  );
  if (errored > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error('[fetch-eval-datasets] ERROR');
  console.error(err);
  process.exit(2);
});
