/**
 * `graphorin pricing` - operate on the bundled LLM pricing snapshot.
 *
 * Surface (per Phase 15 § Pricing):
 *
 *  - `graphorin pricing status` - bundled snapshot version + entry
 *    count + canonical digest.
 *  - `graphorin pricing refresh --url <url>` - opt-in network call
 *    that fetches a fresh snapshot. Honours `GRAPHORIN_OFFLINE=1`.
 *  - `graphorin pricing diff` - row-by-row delta vs the bundled
 *    snapshot.
 *  - `graphorin pricing lookup --provider <name> --model <id>` - print
 *    the per-token price for a single (provider, model) pair.
 *  - `graphorin pricing missing` - read trace spans from a JSON file
 *    and report unknown (provider, model) pairs.
 *
 * @packageDocumentation
 */

import { readFile, writeFile } from 'node:fs/promises';
import process from 'node:process';

import {
  BUNDLED_SNAPSHOT,
  computeEntriesDigest,
  diffPricing,
  listMissingModels,
  lookupPrice,
  type PricingDiffEntry,
  type PricingSnapshot,
  refreshPricing,
  SNAPSHOT_DATE,
} from '@graphorin/pricing';

import { EXIT_CODES } from '../internal/exit.js';
import { checkOfflineModeBlocked } from '../internal/offline.js';
import {
  brand,
  type CommonOutputOptions,
  defaultPrintSink,
  emitReport,
  statusMarker,
} from '../internal/output.js';

/** @stable */
export interface PricingCommonOptions extends CommonOutputOptions {}

/** @stable */
export interface PricingStatusResult {
  readonly version: string;
  readonly snapshotDate: string;
  readonly entries: number;
  readonly digest: string;
}

/** @stable */
export function runPricingStatus(options: PricingCommonOptions = {}): PricingStatusResult {
  const out: PricingStatusResult = Object.freeze({
    version: BUNDLED_SNAPSHOT.version,
    snapshotDate: SNAPSHOT_DATE,
    entries: BUNDLED_SNAPSHOT.entries.length,
    digest: computeEntriesDigest(BUNDLED_SNAPSHOT.entries),
  });
  emitReport(options, out, () => {
    const print = options.print ?? defaultPrintSink;
    print(brand(`pricing snapshot v${out.version} (${out.snapshotDate})`));
    print(`  entries: ${out.entries}`);
    print(`  digest:  ${out.digest}`);
  });
  return out;
}

/** @stable */
export interface PricingRefreshOptions extends PricingCommonOptions {
  readonly url: string;
  /**
   * Optional path to write the refreshed snapshot to. When omitted the
   * CLI prints a status summary only; `--out` triggers a JSON write.
   */
  readonly out?: string;
  /**
   * W-097: accepted body format - `auto` (default) tries the native
   * shape then auto-detects the `@pydantic/genai-prices` dataset.
   */
  readonly format?: 'auto' | 'graphorin' | 'genai-prices';
  /** Test seam - inject a fetch implementation. */
  readonly fetchImpl?: typeof fetch;
}

/** @stable */
export async function runPricingRefresh(options: PricingRefreshOptions): Promise<{
  readonly entries: number;
  readonly version: string;
  readonly out?: string;
  readonly skipped?: number;
}> {
  if (
    !checkOfflineModeBlocked('pricing refresh', {
      ...(options.print !== undefined ? { print: options.print } : {}),
    })
  ) {
    process.exit(EXIT_CODES.RECOVERABLE_FAILURE);
  }
  const refreshed = await refreshPricing({
    url: options.url,
    ...(options.format !== undefined ? { format: options.format } : {}),
    ...(options.fetchImpl !== undefined ? { fetchImpl: options.fetchImpl } : {}),
  });
  if (options.out !== undefined) {
    await writeFile(options.out, JSON.stringify(refreshed, null, 2), { mode: 0o600 });
  }
  const result: { entries: number; version: string; out?: string; skipped?: number } = {
    entries: refreshed.entries.length,
    version: refreshed.version,
    ...(options.out !== undefined ? { out: options.out } : {}),
    ...(refreshed.conversion !== undefined ? { skipped: refreshed.conversion.skipped } : {}),
  };
  emitReport(options, result, () => {
    const print = options.print ?? defaultPrintSink;
    print(brand(`refreshed pricing snapshot v${result.version} (${result.entries} entries).`));
    if (result.skipped !== undefined) {
      print(
        brand(
          `converted from genai-prices; ${result.skipped} entr${result.skipped === 1 ? 'y' : 'ies'} skipped (tiered/conditional pricing).`,
        ),
      );
    }
    if (result.out !== undefined) print(brand(`written to ${result.out} (mode 0600).`));
  });
  return result;
}

/** @stable */
export interface PricingDiffOptions extends PricingCommonOptions {
  /**
   * Path to a JSON file containing a `PricingSnapshot`. The CLI diffs
   * this against the bundled snapshot.
   */
  readonly snapshot: string;
}

/** @stable */
export async function runPricingDiff(
  options: PricingDiffOptions,
): Promise<ReadonlyArray<PricingDiffEntry>> {
  const right = await readSnapshot(options.snapshot);
  const diff = diffPricing(BUNDLED_SNAPSHOT, right);
  emitReport(options, diff, () => {
    const print = options.print ?? defaultPrintSink;
    if (diff.length === 0) {
      print(brand('no diff between bundled snapshot and supplied snapshot.'));
      return;
    }
    print(brand(`${diff.length} pricing diff row(s):`));
    for (const row of diff) {
      print(`  ${statusMarker('warn')} ${row.kind} ${row.provider}/${row.model}`);
    }
  });
  return diff;
}

/** @stable */
export interface PricingLookupOptions extends PricingCommonOptions {
  readonly provider: string;
  readonly model: string;
  readonly region?: string;
}

/** @stable */
export function runPricingLookup(options: PricingLookupOptions) {
  const result = lookupPrice({
    provider: options.provider,
    model: options.model,
    ...(options.region !== undefined ? { region: options.region } : {}),
  });
  emitReport(options, result, () => {
    const print = options.print ?? defaultPrintSink;
    if (result === null) {
      print(brand(`no pricing entry for ${options.provider}/${options.model}.`));
      return;
    }
    print(
      brand(
        `${options.provider}/${options.model}: input=${result.inputUsdPerToken} / output=${result.outputUsdPerToken} USD per token (source=${result.source}, snapshot=${result.snapshotDate})`,
      ),
    );
  });
  // W-002: exit code independent of --json (see runAuditVerify).
  if (result === null) process.exitCode = EXIT_CODES.RECOVERABLE_FAILURE;
  return result;
}

/** @stable */
export interface PricingMissingOptions extends PricingCommonOptions {
  /**
   * Path to a JSON file containing an array of trace spans (each with
   * an `attributes` map). Output of `graphorin traces export` (Phase
   * 15) is the canonical source.
   */
  readonly spans: string;
}

/** @stable */
export async function runPricingMissing(options: PricingMissingOptions) {
  const raw = await readFile(options.spans, 'utf8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `[graphorin/cli] '${options.spans}' is not valid JSON: ${(err as Error).message}`,
    );
  }
  if (!Array.isArray(parsed)) {
    throw new Error(`[graphorin/cli] '${options.spans}' must contain an array of trace spans.`);
  }
  // The pricing helper trusts the shape; we cast through unknown.
  const missing = listMissingModels(
    parsed as ReadonlyArray<{ readonly attributes: Record<string, unknown> }>,
  );
  emitReport(options, missing, () => {
    const print = options.print ?? defaultPrintSink;
    if (missing.length === 0) {
      print(brand('every (provider, model) pair in the spans is present in the bundled snapshot.'));
      return;
    }
    print(brand(`${missing.length} unknown (provider, model) pair(s):`));
    for (const m of missing) {
      print(`  ${statusMarker('warn')} ${m.provider}/${m.model} (${m.count} span(s))`);
    }
  });
  return missing;
}

async function readSnapshot(path: string): Promise<PricingSnapshot> {
  const raw = await readFile(path, 'utf8');
  try {
    return JSON.parse(raw) as PricingSnapshot;
  } catch (err) {
    throw new Error(
      `[graphorin/cli] '${path}' is not a valid pricing snapshot JSON: ${(err as Error).message}`,
    );
  }
}
