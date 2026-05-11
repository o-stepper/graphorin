/**
 * Idempotency cursor helpers. The runtime reads the persisted state
 * row directly via {@link ConsolidatorMemoryStoreExt.getState}; this
 * file centralises the pure helpers around the cursor advance.
 *
 * @packageDocumentation
 */

import type { SessionMessageRecord } from '../internal/storage-adapter.js';

/**
 * Advance the cursor to the highest sequence number observed in the
 * batch. Returns `null` when the batch is empty.
 *
 * @stable
 */
export function tipMessageId(batch: ReadonlyArray<SessionMessageRecord>): string | null {
  if (batch.length === 0) return null;
  let bestIdx = 0;
  for (let i = 1; i < batch.length; i++) {
    const candidate = batch[i];
    const champion = batch[bestIdx];
    if (candidate === undefined || champion === undefined) continue;
    if (candidate.sequence > champion.sequence) bestIdx = i;
  }
  return batch[bestIdx]?.id ?? null;
}
