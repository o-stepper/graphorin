/**
 * `priceLookupByModel(...)` - vendor-agnostic, model-id-keyed price
 * lookup over the bundled snapshot, in the per-Mtok shape the
 * `@graphorin/provider` cost-tracking middleware consumes.
 *
 * Real eval runs address cloud models through the generic
 * OpenAI-compatible adapter, so the provider name carries no pricing
 * vendor; this helper resolves by model id alone (with the
 * dateless-alias fallback) across the whole snapshot. Extracted from
 * the LongMemEval bench runner (deep-retest-0.13.6 P2-4) so every
 * harness enforces `--max-cost-usd` with the same lookup instead of
 * shipping weaker local twins.
 *
 * @packageDocumentation
 */

import { lookupPrice } from './lookup.js';
import { BUNDLED_SNAPSHOT } from './snapshot/bundled.js';

/**
 * Per-Mtok USD rates for one model, shaped for the `priceLookup`
 * option of `@graphorin/provider`'s `withCostTracking` middleware.
 *
 * @stable
 */
export interface ModelPriceRates {
  readonly inputPerMtok?: number;
  readonly outputPerMtok?: number;
  readonly cachedReadPerMtok?: number;
  readonly cacheWritePerMtok?: number;
}

/**
 * Resolve per-Mtok USD rates for a model id against the bundled
 * snapshot, ignoring the provider dimension. Dated ids fall back to
 * their dateless alias (the `lookupPrice` contract). Returns `null`
 * for unknown models so cost accumulators keep reporting zero instead
 * of guessing.
 *
 * Drop-in for `withCostTracking({ priceLookup })`: the extra
 * `providerName` the middleware passes is simply ignored.
 *
 * @stable
 */
export function priceLookupByModel(info: { readonly modelId: string }): ModelPriceRates | null {
  const dateless = info.modelId.replace(/-\d{8}$/, '');
  const entry =
    BUNDLED_SNAPSHOT.entries.find((e) => e.model === info.modelId) ??
    BUNDLED_SNAPSHOT.entries.find((e) => e.model === dateless);
  if (entry === undefined) return null;
  const price = lookupPrice({ provider: entry.provider, model: entry.model });
  if (price === null) return null;
  return {
    inputPerMtok: price.inputUsdPerToken * 1_000_000,
    outputPerMtok: price.outputUsdPerToken * 1_000_000,
    ...(price.cachedReadUsdPerToken !== undefined
      ? { cachedReadPerMtok: price.cachedReadUsdPerToken * 1_000_000 }
      : {}),
    ...(price.cacheWriteUsdPerToken !== undefined
      ? { cacheWritePerMtok: price.cacheWriteUsdPerToken * 1_000_000 }
      : {}),
  };
}
