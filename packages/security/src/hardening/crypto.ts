/**
 * Cryptographic helpers used by the framework's startup paths.
 *
 *  - `generateBootstrapToken()` — 256-bit `crypto.randomBytes` →
 *    base62url-encoded string. Used by `graphorin init` (Phase 15)
 *    to mint the first server token.
 *  - `generateAesSalt()` — 16-byte salt for AES-GCM key derivation.
 *
 * Per DEC-135 the framework uses `crypto.randomBytes(32)` (256 bits)
 * for tokens, never `crypto.randomUUID()` (122 bits).
 *
 * @packageDocumentation
 */

import { randomBytes as rb } from 'node:crypto';

const BASE62_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * Canonical base62-url encoded width for the 32-byte (256-bit)
 * bootstrap token. `ceil(256 / log2(62)) = 43`; the encoder pads to
 * this width so every emitted token is the same length, regardless
 * of how many leading bytes happen to be small. Stable downstream
 * verifiers can reject tokens whose width drifts.
 *
 * @stable
 */
export const BOOTSTRAP_TOKEN_LENGTH = 43;

/**
 * Generate a 256-bit bootstrap token encoded with base62url. Always
 * emits `BOOTSTRAP_TOKEN_LENGTH` (43) characters. Source entropy is
 * `crypto.randomBytes(32)` per DEC-135 — never `crypto.randomUUID()`
 * (only 122 bits).
 *
 * @stable
 */
export function generateBootstrapToken(): string {
  const bytes = rb(32);
  return encodeBase62(bytes, BOOTSTRAP_TOKEN_LENGTH);
}

/**
 * Generate a 16-byte salt suitable for AES-256-GCM key derivation.
 *
 * @stable
 */
export function generateAesSalt(): Uint8Array {
  return rb(16);
}

/**
 * Encode a `Uint8Array` as base62url. The optional `padTo` argument
 * left-pads the output with the base62 zero character so every
 * emitted string has the same width — useful for fixed-width
 * downstream parsers. The zero-byte preserve rule still holds: if
 * every source byte is `0x00`, the returned string is
 * `'0'.repeat(max(padTo, bytes.length))`.
 *
 * Exposed so callers can build higher-level token formats
 * (Phase 03b's token format already uses the same encoding).
 *
 * @stable
 */
export function encodeBase62(bytes: Uint8Array, padTo?: number): string {
  const target = padTo ?? 0;
  if (bytes.length === 0) {
    return target > 0 ? BASE62_ALPHABET.charAt(0).repeat(target) : '';
  }
  let n = 0n;
  for (const byte of bytes) {
    n = (n << 8n) | BigInt(byte);
  }
  if (n === 0n) {
    const zeros = BASE62_ALPHABET.charAt(0).repeat(bytes.length);
    return target > zeros.length ? BASE62_ALPHABET.charAt(0).repeat(target) : zeros;
  }
  let out = '';
  while (n > 0n) {
    const r = Number(n % 62n);
    out = BASE62_ALPHABET.charAt(r) + out;
    n /= 62n;
  }
  let leadingZeroBytes = 0;
  for (const byte of bytes) {
    if (byte === 0) leadingZeroBytes += 1;
    else break;
  }
  for (let i = 0; i < leadingZeroBytes; i += 1) {
    out = BASE62_ALPHABET.charAt(0) + out;
  }
  while (out.length < target) {
    out = BASE62_ALPHABET.charAt(0) + out;
  }
  return out;
}
