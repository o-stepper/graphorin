/**
 * @graphorin/pricing — bundled LLM pricing snapshot for the Graphorin
 * framework.
 *
 * Highlights:
 *
 * - {@link BUNDLED_SNAPSHOT} — bundled snapshot covering Anthropic,
 *   OpenAI, Google, Mistral, Cohere + the local providers
 *   (Ollama / llama.cpp). Each entry carries a per-token price and
 *   the canonical SHA-256 digest of the `entries` array.
 * - {@link lookupPrice} — resolve a `(provider, model)` pair against a
 *   snapshot. Returns `null` for unknown entries plus emits one WARN
 *   per process-lifetime per unknown pair.
 * - {@link calculateCost} — multiply a price by token counts for a
 *   single LLM call.
 * - {@link diffPricing} — row-by-row delta between two snapshots.
 * - {@link refreshPricing} — opt-in network call. Never automatic.
 * - {@link listMissingModels} — scan trace spans for unknown models;
 *   used by `graphorin pricing missing` (Phase 15).
 *
 * The bundled snapshot is intentionally small — operators wanting the
 * full upstream catalogue should run `refreshPricing(...)` and
 * persist the result to disk.
 *
 * @packageDocumentation
 */

/** Canonical version constant. Mirrors the `package.json` version. */
export const VERSION = '0.1.0';

export {
  DEFAULT_PRICING_AUTO_REFRESH,
  type PricingAutoRefreshConfig,
  type PricingConfig,
} from './config.js';
export { diffPricing } from './diff.js';
export {
  _resetLookupWarningsForTesting,
  calculateCost,
  lookupPrice,
  setLookupWarnSink,
} from './lookup.js';
export { listMissingModels, type MissingModelEntry } from './missing.js';
export { type RefreshPricingOptions, refreshPricing } from './refresh.js';
export { BUNDLED_SNAPSHOT, computeEntriesDigest, SNAPSHOT_DATE } from './snapshot/index.js';
export type {
  Cost,
  LookupPriceArgs,
  LookupPriceResult,
  ModelPrice,
  PricingDiffEntry,
  PricingSnapshot,
  PricingTraceSpanLike,
} from './types.js';
