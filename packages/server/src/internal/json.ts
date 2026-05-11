/**
 * Helpers for the strict JSON contract every REST endpoint speaks.
 *
 * @internal
 */

import { createHash } from 'node:crypto';

/**
 * Stable, recursive JSON canonicalisation: object keys sorted
 * lexicographically, arrays preserved as-is. Used by the idempotency
 * middleware so two semantically-identical bodies produce the same
 * fingerprint.
 */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value: unknown): unknown {
  if (value === null) return null;
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(canonicalize);
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
    a < b ? -1 : a > b ? 1 : 0,
  );
  const out: Record<string, unknown> = {};
  for (const [key, val] of entries) out[key] = canonicalize(val);
  return out;
}

/**
 * SHA-256 hex digest of the supplied bytes. Returns the lowercase
 * hex string so it can be compared against the persisted fingerprint
 * without further normalisation.
 */
export function sha256Hex(input: string | Uint8Array): string {
  return createHash('sha256').update(input).digest('hex');
}

/**
 * SHA-256 fingerprint of a (method, path, body) tuple. The body is
 * canonicalised before hashing so trivial whitespace differences do
 * not register as a payload mismatch.
 */
export function fingerprintRequest(method: string, path: string, body: unknown): string {
  return sha256Hex(`${method.toUpperCase()} ${path}\n${canonicalJson(body)}`);
}
