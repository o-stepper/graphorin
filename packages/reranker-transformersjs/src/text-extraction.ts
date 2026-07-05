/**
 * Heuristic text-extraction helpers. The reranker scores `(query,
 * passage)` pairs; this module turns a `MemoryRecord` of any concrete
 * tier into the best single-passage approximation.
 *
 * The defaults are conservative - text-bearing fields take precedence
 * over IDs / labels - and operators may inject a custom
 * `passageExtractor` when their schema attaches the canonical text
 * elsewhere.
 *
 * @packageDocumentation
 */

import type { MemoryRecord } from '@graphorin/core';

/**
 * Returns the best-effort passage text for a {@link MemoryRecord}. The
 * order of preference, top-down:
 *
 *   1. `text` - facts, rules, generic text-bearing tiers.
 *   2. `summary` - episodes.
 *   3. `value` - working-memory blocks.
 *   4. `id` fallback so the reranker never sees an empty passage.
 *
 * @stable
 */
export function defaultPassageExtractor(record: MemoryRecord): string {
  const obj = record as unknown as Record<string, unknown>;
  const text = obj.text;
  if (typeof text === 'string' && text.length > 0) return text;
  const summary = obj.summary;
  if (typeof summary === 'string' && summary.length > 0) return summary;
  const value = obj.value;
  if (typeof value === 'string' && value.length > 0) return value;
  const label = obj.label;
  if (typeof label === 'string' && label.length > 0) return label;
  return record.id;
}

/**
 * Caller-supplied passage extractor. Receives the record + the
 * surrounding metadata (kind, sensitivity, tags) and returns the
 * passage to feed into the cross-encoder.
 *
 * @stable
 */
export type PassageExtractor<TRecord extends MemoryRecord = MemoryRecord> = (
  record: TRecord,
) => string;
