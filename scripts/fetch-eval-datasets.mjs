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
 * Supply-chain integrity (audit 2026-07-04, E5): every dataset is
 * pinned in `scripts/datasets.lock.json` (sha256 + byte size + an
 * immutable-revision source URL). Downloads are verified BEFORE the
 * file is written, and already-present files are re-verified instead
 * of trusted blindly — benchmark baselines depend on these bytes, so a
 * changed upstream must fail loudly, not silently shift scores. A
 * `GRAPHORIN_*_URL` env override changes where the bytes come from but
 * NOT what they must hash to; overriding the pin itself requires an
 * explicit `--update-lock`.
 *
 * Usage:
 *   node scripts/fetch-eval-datasets.mjs                 # all datasets
 *   node scripts/fetch-eval-datasets.mjs --only locomo   # one dataset
 *   node scripts/fetch-eval-datasets.mjs --force         # re-download
 *   node scripts/fetch-eval-datasets.mjs --force --update-lock
 *                                # deliberately re-pin to new content
 *
 * Some sources are gated (HuggingFace token / Google Drive). Override
 * any URL with an env var, e.g.:
 *   GRAPHORIN_LONGMEMEVAL_S_URL=https://... node scripts/fetch-eval-datasets.mjs
 */

import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'benchmarks', '.datasets');
const LOCK_PATH = join(ROOT, 'scripts', 'datasets.lock.json');

/**
 * Best-known sources. Defaults are the immutable-revision URLs recorded in
 * datasets.lock.json; gated sources expose an env override + a manual note.
 * (The pre-E5 LongMemEval default — `.../resolve/main/longmemeval_s.json` —
 * 404s: the file in the upstream HF repo is named `longmemeval_s`, extension-
 * less, and `main` is a moving ref anyway.)
 */
const DATASETS = [
  {
    id: 'longmemeval',
    file: 'longmemeval_s.json',
    url:
      process.env.GRAPHORIN_LONGMEMEVAL_S_URL ??
      'https://huggingface.co/datasets/xiaowu0162/longmemeval/resolve/2ec2a557f339b6c0369619b1ed5793734cc87533/longmemeval_s',
    overridden: process.env.GRAPHORIN_LONGMEMEVAL_S_URL !== undefined,
    note: 'LongMemEval_S (arXiv:2410.10813). If gated, set GRAPHORIN_LONGMEMEVAL_S_URL or download manually from https://github.com/xiaowu0162/LongMemEval.',
  },
  {
    id: 'locomo',
    file: 'locomo10.json',
    url:
      process.env.GRAPHORIN_LOCOMO_URL ??
      'https://raw.githubusercontent.com/snap-research/locomo/cbfbc1dba6bc53d00625212a0f22d55ffee7c1fc/data/locomo10.json',
    overridden: process.env.GRAPHORIN_LOCOMO_URL !== undefined,
    note: 'Real LOCOMO (arXiv:2402.17753) from https://github.com/snap-research/locomo.',
  },
  {
    id: 'dmr',
    file: 'dmr.json',
    url: process.env.GRAPHORIN_DMR_URL ?? '',
    overridden: process.env.GRAPHORIN_DMR_URL !== undefined,
    note: 'DMR (MemGPT/Letta, arXiv:2310.08560). No stable public direct URL — set GRAPHORIN_DMR_URL to your copy.',
  },
];

function parseArgs(argv) {
  let force = false;
  let updateLock = false;
  let only;
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--force') force = true;
    else if (a === '--update-lock') updateLock = true;
    else if (a === '--only' && argv[i + 1] !== undefined) only = argv[++i];
  }
  return { force, only, updateLock };
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function sha256Hex(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

async function loadLock() {
  let raw;
  try {
    raw = await readFile(LOCK_PATH, 'utf8');
  } catch (err) {
    console.error(
      `[fetch-eval-datasets] cannot read ${LOCK_PATH} — the pin file is required (${err.message}).`,
    );
    process.exit(2);
  }
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || typeof parsed.datasets !== 'object') {
      throw new Error('missing top-level "datasets" object');
    }
    return parsed;
  } catch (err) {
    console.error(`[fetch-eval-datasets] ${LOCK_PATH} is not valid: ${err.message}`);
    process.exit(2);
  }
}

async function saveLock(lock) {
  await writeFile(LOCK_PATH, `${JSON.stringify(lock, null, 2)}\n`);
}

/**
 * Verify `buf` against the lock entry. Returns `'ok'`, `'unpinned'`, or
 * `'mismatch'` (after logging the loud error).
 */
function verifyAgainstPin(ds, entry, buf, { where }) {
  if (entry === undefined || entry.sha256 === null || entry.sha256 === undefined) {
    console.warn(
      `[fetch-eval-datasets] ${ds.id}: WARNING — content is UNPINNED (no sha256 in datasets.lock.json). ` +
        `Benchmark results based on it are not reproducible; record a pin with --update-lock.`,
    );
    return 'unpinned';
  }
  const actual = sha256Hex(buf);
  if (actual === entry.sha256) {
    if (ds.overridden) {
      console.warn(
        `[fetch-eval-datasets] ${ds.id}: env URL override in use — content still matches the pinned sha256.`,
      );
    }
    return 'ok';
  }
  console.error(
    `[fetch-eval-datasets] ${ds.id}: SHA-256 MISMATCH ${where}.\n` +
      `  expected ${entry.sha256} (pinned ${entry.pinnedAt ?? 'unknown'})\n` +
      `  actual   ${actual} (${buf.length} bytes)` +
      (ds.overridden
        ? `\n  NOTE: a GRAPHORIN_*_URL env override supplied this content — the override changes the source, NOT the pin.`
        : '') +
      `\n  If the upstream change is intentional, re-run with --force --update-lock to re-pin;` +
      `\n  otherwise treat this as a supply-chain red flag and do NOT use the file.`,
  );
  return 'mismatch';
}

function updateLockEntry(lock, ds, buf) {
  const today = new Date().toISOString().slice(0, 10);
  const prev = lock.datasets[ds.id] ?? {};
  lock.datasets[ds.id] = {
    ...prev,
    file: ds.file,
    sha256: sha256Hex(buf),
    bytes: buf.length,
    source: ds.url === '' ? (prev.source ?? null) : ds.url,
    pinnedAt: today,
    note: prev.note ?? ds.note,
  };
  if (ds.overridden) {
    console.warn(
      `[fetch-eval-datasets] ${ds.id}: re-pinning from an env-override URL — make sure that source is trusted.`,
    );
  }
  console.log(`[fetch-eval-datasets] ${ds.id}: lock updated (sha256 ${lock.datasets[ds.id].sha256}).`);
}

async function download(ds) {
  if (ds.url === '') {
    console.warn(`[fetch-eval-datasets] ${ds.id}: no URL configured. ${ds.note}`);
    return { result: 'skipped' };
  }
  let res;
  try {
    res = await fetch(ds.url, { redirect: 'follow' });
  } catch (err) {
    console.error(
      `[fetch-eval-datasets] ${ds.id}: network error — ${err.message}. Are you offline? ${ds.note}`,
    );
    return { result: 'error' };
  }
  if (!res.ok) {
    console.error(`[fetch-eval-datasets] ${ds.id}: HTTP ${res.status} from ${ds.url}. ${ds.note}`);
    return { result: 'error' };
  }
  const body = Buffer.from(await res.arrayBuffer());
  return { result: 'ok', body };
}

async function main() {
  const { force, only, updateLock } = parseArgs(process.argv);
  const lock = await loadLock();
  await mkdir(OUT_DIR, { recursive: true });
  let ok = 0;
  let skipped = 0;
  let errored = 0;
  let lockDirty = false;
  for (const ds of DATASETS) {
    if (only !== undefined && ds.id !== only) continue;
    const entry = lock.datasets[ds.id];
    const dest = join(OUT_DIR, ds.file);

    if (!force && (await exists(dest))) {
      // Verify-if-exists, not trust-if-exists: a stale or substituted local
      // copy must not silently feed the benchmarks.
      const existing = await readFile(dest);
      const verdict = verifyAgainstPin(ds, entry, existing, { where: `for existing ${dest}` });
      if (verdict === 'mismatch') {
        errored++;
        continue;
      }
      if (verdict === 'unpinned' && updateLock) {
        updateLockEntry(lock, ds, existing);
        lockDirty = true;
      }
      console.log(
        `[fetch-eval-datasets] ${ds.id}: already present at ${dest}` +
          `${verdict === 'ok' ? ' (sha256 verified)' : ''} (use --force to re-download).`,
      );
      skipped++;
      continue;
    }

    const dl = await download(ds);
    if (dl.result === 'skipped') {
      skipped++;
      continue;
    }
    if (dl.result === 'error') {
      errored++;
      continue;
    }
    if (updateLock) {
      updateLockEntry(lock, ds, dl.body);
      lockDirty = true;
    } else {
      const verdict = verifyAgainstPin(ds, entry, dl.body, { where: `after download from ${ds.url}` });
      if (verdict === 'mismatch') {
        // Refuse to write a poisoned file where the benchmarks would read it.
        errored++;
        continue;
      }
    }
    await writeFile(dest, dl.body);
    console.log(`[fetch-eval-datasets] ${ds.id}: wrote ${dest} (${dl.body.length} bytes).`);
    ok++;
  }
  if (lockDirty) await saveLock(lock);
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
