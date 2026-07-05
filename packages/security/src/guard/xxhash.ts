/**
 * xxhash-32 integrity helpers for the memory-modification guard.
 *
 * The implementation is re-exported verbatim from
 * `@graphorin/core`'s pure-JS XXH32 helper. xxhash is **not**
 * collision-resistant - it is the integrity hash for the guard, not
 * for the audit log. The audit log uses SHA-256 (subsystem 03b).
 *
 * @packageDocumentation
 */

import { xxhash as coreXxhash } from '@graphorin/core/utils';

/**
 * Hash a buffer or a string, returning the 32-bit digest as an
 * 8-character lowercase hex string.
 *
 * @stable
 */
export function xxhash32(input: string | Uint8Array, seed = 0): string {
  return coreXxhash(input, seed);
}

/**
 * Convenience: hash a snapshot region asynchronously. The wrapper
 * exists so callers can micro-benchmark the helper without rewriting
 * the surrounding loop.
 *
 * @stable
 */
export async function hashRegion(input: string | Uint8Array, seed = 0): Promise<string> {
  return xxhash32(input, seed);
}
