/**
 * `lookupPrice(...)` — resolve a per-token price for a given
 * (provider, model) pair against a snapshot. Returns `null` when the
 * model is unknown and emits one WARN per process-lifetime per
 * unknown (provider, model) pair.
 *
 * @packageDocumentation
 */

import { BUNDLED_SNAPSHOT } from './snapshot/bundled.js';
import type { LookupPriceArgs, LookupPriceResult, ModelPrice, PricingSnapshot } from './types.js';

const WARNED = new Set<string>();

/**
 * Optional sink for the deduplicated WARN emitted on unknown models.
 * Defaults to `console.warn`. Override in tests.
 *
 * @internal
 */
export function setLookupWarnSink(sink: (line: string) => void): void {
  WARN_SINK = sink;
}

let WARN_SINK: (line: string) => void = (line) => console.warn(line);

/**
 * @internal — exposed for tests so the WARN-once cache can be reset.
 */
export function _resetLookupWarningsForTesting(): void {
  WARNED.clear();
}

/**
 * Resolve a per-token price for the (provider, model) pair. Returns
 * `null` when the snapshot does not contain an entry for the model.
 *
 * The function emits one WARN per process per unknown (provider, model)
 * pair so cost dashboards surface drift without spamming the log.
 *
 * @stable
 */
export function lookupPrice(
  args: LookupPriceArgs,
  snapshot: PricingSnapshot = BUNDLED_SNAPSHOT,
): LookupPriceResult | null {
  const exact = snapshot.entries.find(
    (entry) =>
      entry.provider === args.provider &&
      entry.model === args.model &&
      (args.region === undefined || entry.region === undefined || entry.region === args.region),
  );

  if (exact !== undefined) return entryToResult(exact, snapshot);

  // Wildcard fallback — used by local providers (`provider: 'ollama', model: '*'`).
  const wildcard = snapshot.entries.find(
    (entry) => entry.provider === args.provider && entry.model === '*',
  );
  if (wildcard !== undefined) return entryToResult(wildcard, snapshot);

  warnOnce(args);
  return null;
}

function entryToResult(entry: ModelPrice, snapshot: PricingSnapshot): LookupPriceResult {
  return {
    inputUsdPerToken: entry.inputUsdPerToken,
    outputUsdPerToken: entry.outputUsdPerToken,
    ...(entry.cachedReadUsdPerToken === undefined
      ? {}
      : { cachedReadUsdPerToken: entry.cachedReadUsdPerToken }),
    ...(entry.reasoningUsdPerToken === undefined
      ? {}
      : { reasoningUsdPerToken: entry.reasoningUsdPerToken }),
    source: snapshot.source,
    snapshotDate: snapshot.snapshotDate,
  };
}

function warnOnce(args: LookupPriceArgs): void {
  const key = `${args.provider}/${args.model}`;
  if (WARNED.has(key)) return;
  WARNED.add(key);
  WARN_SINK(
    `[graphorin/pricing] WARN: no pricing entry for ${args.provider}/${args.model}; ` +
      'cost is null. Consider running `graphorin pricing refresh` or contributing the ' +
      'entry upstream.',
  );
}

/**
 * Multiply a per-token price by an integer token count. Returns `null`
 * when the price is unknown. Useful when caller wants to compute cost
 * for a single LLM call without instantiating the cost tracker.
 *
 * Token-count contract (PS-19):
 * - `inputTokens` **excludes** `cachedReadTokens` — cached reads are billed
 *   separately at the cheaper cached rate, so pass the non-cached prompt count
 *   to avoid double-billing.
 * - `reasoningTokens` are billed at `outputUsdPerToken` unless the model entry
 *   declares an explicit `reasoningUsdPerToken`.
 *
 * @stable
 */
export function calculateCost(
  args: LookupPriceArgs & {
    /** Non-cached prompt tokens (excludes `cachedReadTokens`). */
    readonly inputTokens: number;
    readonly outputTokens: number;
    readonly cachedReadTokens?: number;
    readonly reasoningTokens?: number;
  },
  snapshot: PricingSnapshot = BUNDLED_SNAPSHOT,
): { readonly amount: number; readonly currency: 'USD' } | null {
  const price = lookupPrice(args, snapshot);
  if (price === null) return null;
  let amount = 0;
  // `inputTokens` is the NON-cached prompt; cached reads are billed separately
  // at their own (cheaper) rate, so they must be excluded from `inputTokens` to
  // avoid double-counting (PS-19).
  amount += price.inputUsdPerToken * args.inputTokens;
  amount += price.outputUsdPerToken * args.outputTokens;
  if (args.cachedReadTokens !== undefined && price.cachedReadUsdPerToken !== undefined) {
    amount += price.cachedReadUsdPerToken * args.cachedReadTokens;
  }
  if (args.reasoningTokens !== undefined) {
    // PS-19: reasoning tokens follow completion (output) pricing unless the
    // entry declares an explicit `reasoningUsdPerToken` — the documented
    // contract that was previously billed at $0 for every bundled entry.
    amount += (price.reasoningUsdPerToken ?? price.outputUsdPerToken) * args.reasoningTokens;
  }
  return { amount, currency: 'USD' };
}
