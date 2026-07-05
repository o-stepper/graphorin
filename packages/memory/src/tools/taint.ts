/**
 * C6: taint override for memory-recall tool results. The recall tools are
 * first-party (`sideEffectClass: 'read-only'`), so the data-flow ledger
 * would derive their outputs as trusted - but the CONTENT they return can
 * be quarantined or foreign-provenance memory written in an earlier
 * session (the cross-session poisoning leg). This helper computes the
 * `ToolReturn.taint` override that re-arms the ledger at recall: recalled
 * poisoned content is recorded as untrusted spans, so the verbatim probe
 * and the trifecta/derived gates see it exactly like fresh untrusted
 * input.
 *
 * @packageDocumentation
 */

import { isForeignProvenance } from '../search/trust.js';

/** Minimal record surface the helper inspects. */
export interface RecalledItemLike {
  readonly provenance?: string | null;
  readonly status?: string;
}

/**
 * Compute the taint override for a recalled item set: untrusted when ANY
 * item is quarantined or foreign-provenance; `undefined` when all items
 * are first-party active (the common case - zero overhead, no override).
 *
 * @stable
 */
export function recallTaint(
  items: ReadonlyArray<RecalledItemLike>,
): { readonly untrusted: true; readonly sourceKind: 'memory-recall' } | undefined {
  for (const item of items) {
    if (item.status === 'quarantined' || isForeignProvenance(item.provenance)) {
      return { untrusted: true, sourceKind: 'memory-recall' };
    }
  }
  return undefined;
}
