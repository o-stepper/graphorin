/**
 * W-097: pure converter from the `@pydantic/genai-prices` published
 * dataset into graphorin-native {@link ModelPrice} entries, so
 * `graphorin pricing refresh --url <genai-prices raw URL>` actually
 * works - previously the docs pointed operators at that dataset while
 * `refreshPricing` only accepted the native shape, leaving every
 * operator to write their own transformer.
 *
 * Supported subset (documented deliberately - the converter is
 * tolerant and SKIPS what it cannot represent, it never throws on a
 * strange model entry):
 *
 * ```jsonc
 * {
 *   "providers": [
 *     {
 *       "id": "anthropic",             // or "provider_id" / "name"
 *       "models": [
 *         {
 *           "id": "claude-sonnet-4-5", // or "model" / "name"
 *           "prices": {
 *             "input_mtok": 3,          // USD per million tokens
 *             "output_mtok": 15,
 *             "cache_read_mtok": 0.3,   // optional
 *             "cache_write_mtok": 3.75  // optional
 *           }
 *         }
 *       ]
 *     }
 *   ]
 * }
 * ```
 *
 * Per-Mtok figures divide by 1e6 into per-token USD. Model entries
 * whose `prices` is an ARRAY (conditional / time-tiered pricing) are
 * used only when the array holds exactly one usable record; everything
 * else - tiered objects, missing input/output figures - lands in the
 * `skipped` counter instead of failing the refresh. The dataset is
 * dollar-denominated; the currency guard lives in `refreshPricing`.
 *
 * @packageDocumentation
 */

import type { ModelPrice } from './types.js';

const MTOK = 1_000_000;

/** Result of {@link convertGenaiPrices}. @stable */
export interface GenaiPricesConversion {
  readonly entries: ReadonlyArray<ModelPrice>;
  /** Model entries the supported subset could not represent. */
  readonly skipped: number;
}

/**
 * Cheap structural detector: does this body look like the
 * genai-prices dataset (a `providers` array of objects carrying
 * `models` arrays)?
 *
 * @stable
 */
export function isGenaiPricesShape(body: unknown): boolean {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) return false;
  const providers = (body as { providers?: unknown }).providers;
  if (!Array.isArray(providers) || providers.length === 0) return false;
  return providers.every(
    (p) => typeof p === 'object' && p !== null && Array.isArray((p as { models?: unknown }).models),
  );
}

/**
 * Convert a genai-prices dataset body. Tolerant: unrepresentable model
 * entries are counted in `skipped`, never thrown on.
 *
 * @stable
 */
export function convertGenaiPrices(body: unknown): GenaiPricesConversion {
  if (!isGenaiPricesShape(body)) {
    throw new Error('convertGenaiPrices: body does not match the genai-prices dataset shape');
  }
  const providers = (body as { providers: ReadonlyArray<unknown> }).providers;
  const entries: ModelPrice[] = [];
  let skipped = 0;
  for (const rawProvider of providers) {
    const provider = rawProvider as {
      id?: unknown;
      provider_id?: unknown;
      name?: unknown;
      models: ReadonlyArray<unknown>;
    };
    const providerId = firstString(provider.id, provider.provider_id, provider.name);
    if (providerId === undefined) {
      skipped += provider.models.length;
      continue;
    }
    for (const rawModel of provider.models) {
      const entry = convertModel(providerId, rawModel);
      if (entry === null) skipped += 1;
      else entries.push(entry);
    }
  }
  return Object.freeze({ entries: Object.freeze(entries), skipped });
}

function convertModel(providerId: string, rawModel: unknown): ModelPrice | null {
  if (typeof rawModel !== 'object' || rawModel === null) return null;
  const model = rawModel as {
    id?: unknown;
    model?: unknown;
    name?: unknown;
    prices?: unknown;
  };
  const modelId = firstString(model.id, model.model, model.name);
  if (modelId === undefined) return null;
  const prices = selectPriceRecord(model.prices);
  if (prices === null) return null;
  const input = perToken(prices.input_mtok);
  const output = perToken(prices.output_mtok);
  if (input === undefined || output === undefined) return null;
  const cacheRead = perToken(prices.cache_read_mtok);
  const cacheWrite = perToken(prices.cache_write_mtok);
  return Object.freeze({
    provider: providerId.toLowerCase(),
    model: modelId.toLowerCase(),
    inputUsdPerToken: input,
    outputUsdPerToken: output,
    ...(cacheRead !== undefined ? { cachedReadUsdPerToken: cacheRead } : {}),
    ...(cacheWrite !== undefined ? { cacheWriteUsdPerToken: cacheWrite } : {}),
  });
}

interface GenaiPriceRecord {
  readonly input_mtok?: unknown;
  readonly output_mtok?: unknown;
  readonly cache_read_mtok?: unknown;
  readonly cache_write_mtok?: unknown;
}

/**
 * Pick the price record to convert. A plain object is used directly;
 * an array is usable only when it holds exactly ONE record (multiple
 * records mean conditional / time-tiered pricing the flat
 * {@link ModelPrice} cannot express - skipped, per the module doc).
 */
function selectPriceRecord(prices: unknown): GenaiPriceRecord | null {
  if (Array.isArray(prices)) {
    if (prices.length !== 1) return null;
    return selectPriceRecord(prices[0]);
  }
  if (typeof prices === 'object' && prices !== null) return prices as GenaiPriceRecord;
  return null;
}

/** Per-Mtok USD figure -> per-token USD; non-finite/tiered -> undefined. */
function perToken(mtok: unknown): number | undefined {
  return typeof mtok === 'number' && Number.isFinite(mtok) && mtok >= 0 ? mtok / MTOK : undefined;
}

function firstString(...values: ReadonlyArray<unknown>): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return undefined;
}
