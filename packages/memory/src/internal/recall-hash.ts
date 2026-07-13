/**
 * Wave-D D4 - stable hash for the persistent recall ledger. The
 * ledger counts DISTINCT queries per fact, so the hash must be stable
 * across processes (no seeds) and normalise trivial variance
 * (case / whitespace) without pretending to be semantic dedup.
 * FNV-1a 32-bit in hex - collision risk is acceptable for a
 * promotion-evidence counter.
 *
 * @packageDocumentation
 */

/** Normalise + hash a recall query for the ledger. */
export function hashRecallQuery(query: string): string {
  const normalized = query.toLowerCase().replace(/\s+/g, ' ').trim();
  let hash = 0x811c9dc5;
  for (let i = 0; i < normalized.length; i++) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
