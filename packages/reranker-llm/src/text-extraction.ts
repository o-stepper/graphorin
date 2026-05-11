/**
 * Default passage extractor. Mirrors the heuristic in
 * `@graphorin/reranker-transformersjs` so the two rerankers behave the
 * same way out of the box.
 *
 * @packageDocumentation
 */

import type { MemoryRecord } from '@graphorin/core';

/** @stable */
export type PassageExtractor<TRecord extends MemoryRecord = MemoryRecord> = (
  record: TRecord,
) => string;

/**
 * Walks `text → summary → value → label → id` to find the best
 * passage representation of a memory record.
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
