/**
 * `diffPricing(...)` - produce a row-by-row delta between two pricing
 * snapshots. Used by the upcoming `graphorin pricing diff` CLI to
 * surface upstream changes after a `refresh`.
 *
 * @packageDocumentation
 */

import type { ModelPrice, PricingDiffEntry, PricingSnapshot } from './types.js';

const COMPARED_FIELDS: ReadonlyArray<keyof ModelPrice> = [
  'inputUsdPerToken',
  'outputUsdPerToken',
  'cachedReadUsdPerToken',
  'cacheWriteUsdPerToken',
  'reasoningUsdPerToken',
  'region',
  'notes',
];

/**
 * Compare two snapshots and return one entry per (provider, model)
 * pair that has been added, removed, or changed. The result is sorted
 * by `(provider, model, kind)` for deterministic output.
 *
 * @stable
 */
export function diffPricing(
  before: PricingSnapshot,
  after: PricingSnapshot,
): ReadonlyArray<PricingDiffEntry> {
  const beforeMap = indexBy(before.entries);
  const afterMap = indexBy(after.entries);
  const out: PricingDiffEntry[] = [];

  for (const [key, entry] of beforeMap) {
    const next = afterMap.get(key);
    if (next === undefined) {
      out.push({ provider: entry.provider, model: entry.model, kind: 'removed', before: entry });
      continue;
    }
    const changedFields = COMPARED_FIELDS.filter((field) => entry[field] !== next[field]);
    if (changedFields.length > 0) {
      out.push({
        provider: entry.provider,
        model: entry.model,
        kind: 'changed',
        before: entry,
        after: next,
        changedFields,
      });
    }
  }

  for (const [key, entry] of afterMap) {
    if (beforeMap.has(key)) continue;
    out.push({ provider: entry.provider, model: entry.model, kind: 'added', after: entry });
  }

  return out.sort((a, b) => {
    if (a.provider !== b.provider) return a.provider < b.provider ? -1 : 1;
    if (a.model !== b.model) return a.model < b.model ? -1 : 1;
    return a.kind < b.kind ? -1 : a.kind > b.kind ? 1 : 0;
  });
}

function indexBy(entries: ReadonlyArray<ModelPrice>): Map<string, ModelPrice> {
  const out = new Map<string, ModelPrice>();
  for (const entry of entries) {
    out.set(`${entry.provider}/${entry.model}/${entry.region ?? ''}`, entry);
  }
  return out;
}
