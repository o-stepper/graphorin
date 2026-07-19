/**
 * Public types for the pricing package.
 *
 * @packageDocumentation
 */

import type { Cost } from '@graphorin/core';

/**
 * Per-model pricing entry. All amounts are in **USD per token** unless
 * the snapshot declares an alternative currency. Reasoning tokens
 * (when supported) follow the same pricing as completion tokens unless
 * the entry declares an explicit `reasoningUsdPerToken`.
 *
 * @stable
 */
export interface ModelPrice {
  /** Lower-case provider id (e.g. `'anthropic'`, `'openai'`, `'ollama'`). */
  readonly provider: string;
  /** Lower-case model id, e.g. `'claude-3-5-sonnet-20241022'`. */
  readonly model: string;
  /** Price per input token, in USD. */
  readonly inputUsdPerToken: number;
  /** Price per output token, in USD. */
  readonly outputUsdPerToken: number;
  /** Optional cached-read price (Anthropic / OpenAI prompt caching). */
  readonly cachedReadUsdPerToken?: number;
  /**
   * Optional cache-write (cache-creation) price. Anthropic bills prompt
   * tokens written to the 5-minute cache at 1.25x the input rate; OpenAI
   * does not charge (or report) cache writes, so its entries omit this.
   */
  readonly cacheWriteUsdPerToken?: number;
  /** Optional reasoning-token price (OpenAI o1 / Gemini 2 thinking). */
  readonly reasoningUsdPerToken?: number;
  /** Optional region label (e.g. `'us-east-1'`). */
  readonly region?: string;
  /** Free-form notes for tooling / docs. */
  readonly notes?: string;
}

/**
 * Single bundled snapshot.
 *
 * @stable
 */
export interface PricingSnapshot {
  readonly version: string;
  readonly source: string;
  readonly snapshotDate: string;
  readonly currency: 'USD';
  readonly sha256: string;
  readonly entries: ReadonlyArray<ModelPrice>;
  /**
   * Present when `refreshPricing` converted a foreign dataset
   * (today: `@pydantic/genai-prices`) instead of consuming the native
   * shape. `skipped` counts model entries the supported subset could
   * not represent (tiered / conditional pricing).
   */
  readonly conversion?: {
    readonly format: 'genai-prices';
    readonly skipped: number;
  };
}

/**
 * Lookup criteria.
 *
 * @stable
 */
export interface LookupPriceArgs {
  readonly provider: string;
  readonly model: string;
  readonly region?: string;
}

/**
 * Result of {@link lookupPrice} when the model is known.
 *
 * @stable
 */
export interface LookupPriceResult {
  readonly inputUsdPerToken: number;
  readonly outputUsdPerToken: number;
  readonly cachedReadUsdPerToken?: number;
  readonly cacheWriteUsdPerToken?: number;
  readonly reasoningUsdPerToken?: number;
  readonly source: string;
  readonly snapshotDate: string;
}

/**
 * Result row reported by {@link diffPricing}.
 *
 * @stable
 */
export interface PricingDiffEntry {
  readonly provider: string;
  readonly model: string;
  readonly kind: 'added' | 'removed' | 'changed';
  readonly before?: ModelPrice;
  readonly after?: ModelPrice;
  readonly changedFields?: ReadonlyArray<keyof ModelPrice>;
}

/**
 * Span-shape input accepted by {@link listMissingModels}. Lightweight
 * subset of `SpanRecord` from `@graphorin/observability` so the
 * pricing package stays free of an observability dependency.
 *
 * @stable
 */
export interface PricingTraceSpanLike {
  readonly attributes: Readonly<Record<string, unknown>>;
}

/**
 * Re-export the `@graphorin/core` `Cost` shape for caller convenience.
 *
 * @stable
 */
export type { Cost };
