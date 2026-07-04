/**
 * `listMissingModels(...)` — scan a sequence of trace spans and return
 * the unique (provider, model) pairs that the snapshot does not
 * recognise.
 *
 * The function reads `gen_ai.system` + `gen_ai.request.model` (the
 * canonical OpenTelemetry GenAI attributes) and falls back to the
 * Graphorin-prefixed `graphorin.provider.id` /
 * `graphorin.provider.model` pair when `gen_ai.*` is absent.
 *
 * @packageDocumentation
 */

import { lookupPrice } from './lookup.js';
import { BUNDLED_SNAPSHOT } from './snapshot/bundled.js';
import type { PricingSnapshot, PricingTraceSpanLike } from './types.js';

/**
 * Single missing-model row.
 *
 * @stable
 */
export interface MissingModelEntry {
  readonly provider: string;
  readonly model: string;
  readonly count: number;
}

/**
 * Return one entry per (provider, model) pair that the snapshot does
 * not recognise, sorted by descending occurrence count.
 *
 * @stable
 */
export function listMissingModels(
  spans: Iterable<PricingTraceSpanLike>,
  snapshot: PricingSnapshot = BUNDLED_SNAPSHOT,
): ReadonlyArray<MissingModelEntry> {
  const seen = new Map<string, MissingModelEntry & { count: number }>();
  for (const span of spans) {
    // E8: `gen_ai.provider.name` is the current OTel GenAI attribute (what
    // withTracing emits); `gen_ai.system` is its deprecated predecessor kept
    // for older recorded traces.
    const provider = stringAttr(span, [
      'gen_ai.provider.name',
      'gen_ai.system',
      'graphorin.provider.id',
    ]);
    const model = stringAttr(span, [
      'gen_ai.request.model',
      'gen_ai.response.model',
      'graphorin.provider.model',
    ]);
    if (provider === null || model === null) continue;
    if (lookupPrice({ provider, model }, snapshot) !== null) continue;
    const key = `${provider}/${model}`;
    const existing = seen.get(key);
    if (existing === undefined) {
      seen.set(key, { provider, model, count: 1 });
    } else {
      seen.set(key, { provider, model, count: existing.count + 1 });
    }
  }
  return [...seen.values()].sort((a, b) => b.count - a.count);
}

function stringAttr(span: PricingTraceSpanLike, keys: ReadonlyArray<string>): string | null {
  for (const key of keys) {
    const value = span.attributes[key];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return null;
}
