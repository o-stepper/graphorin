/**
 * C5: trust-aware retrieval ranking (pairs memory-retrieval-01's ranking
 * leg / security-04). The provenance + quarantine discounts that the
 * eviction-time `salience()` composite already applies now also apply at
 * search SCORING time, so a poisoned or foreign-origin memory cannot
 * outrank the user's own words purely on lexical/vector similarity - the
 * direct defense against MINJA-class memory poisoning (query-only
 * injection >95% ASR without rank-time trust).
 *
 * The factor reuses the {@link SalienceWeights} semantics verbatim:
 * quarantined -> `1 - weights.quarantine` (default 0.3x), foreign
 * provenance -> `1 - weights.foreignProvenance` (default 0.8x), first
 * party -> `1` (neutral: default rankings of ordinary user/extraction
 * facts are byte-identical).
 *
 * @packageDocumentation
 */

import { DEFAULT_SALIENCE_WEIGHTS, type SalienceWeights } from '../consolidator/decay.js';

/**
 * `true` for provenance that did not originate first-party (P1-4) -
 * mirrors the eviction-path classification: `null` (legacy / direct
 * write), `'user'`, and `'extraction'` (the consolidator distilling the
 * user's own session) are first-party; `'tool'`, `'imported'`,
 * `'reflection'`, and `'induction'` are foreign.
 *
 * @stable
 */
export function isForeignProvenance(provenance: string | null | undefined): boolean {
  return (
    provenance !== null &&
    provenance !== undefined &&
    provenance !== 'user' &&
    provenance !== 'extraction'
  );
}

/**
 * Rank-time trust multiplier for one record. `1` for first-party active
 * facts (the common case - zero ranking change), `1 - quarantine` for
 * quarantined-but-included rows, `1 - foreignProvenance` for foreign
 * origin. Quarantine wins when both apply (same branch order as
 * `salience()`).
 *
 * @stable
 */
export function trustDiscount(
  record: { readonly status?: string; readonly provenance?: string | null },
  weights: SalienceWeights = DEFAULT_SALIENCE_WEIGHTS,
): number {
  if (record.status === 'quarantined') return Math.max(0, 1 - weights.quarantine);
  if (isForeignProvenance(record.provenance)) return Math.max(0, 1 - weights.foreignProvenance);
  return 1;
}
