/**
 * Proof Key for Code Exchange (RFC 7636) primitives. Implemented
 * directly on Node's `crypto` module so the OAuth subsystem can
 * generate verifiers / challenges without loading the optional
 * `openid-client` peer dependency.
 *
 * @packageDocumentation
 */

import { Buffer } from 'node:buffer';
import { createHash, randomBytes } from 'node:crypto';

/** Default verifier length in bytes (the spec allows 43-128 chars). */
const DEFAULT_VERIFIER_BYTES = 32;

/**
 * Encode `data` as URL-safe base64 without padding.
 *
 * @internal
 */
export function base64Url(data: Buffer | Uint8Array | string): string {
  const buf = typeof data === 'string' ? Buffer.from(data, 'utf8') : Buffer.from(data);
  return buf.toString('base64').replace(/=+$/u, '').replace(/\+/g, '-').replace(/\//g, '_');
}

/**
 * Generate a cryptographically random PKCE code verifier. The output
 * is URL-safe base64 (43-128 chars per the spec).
 *
 * @stable
 */
export function generatePkceVerifier(byteLength: number = DEFAULT_VERIFIER_BYTES): string {
  if (byteLength < 32 || byteLength > 96) {
    throw new RangeError(
      `PKCE verifier byte length ${byteLength} is outside the safe range [32, 96].`,
    );
  }
  return base64Url(randomBytes(byteLength));
}

/**
 * Compute the SHA-256 challenge for a verifier (S256 method).
 *
 * @stable
 */
export function computePkceChallenge(verifier: string): string {
  return base64Url(createHash('sha256').update(verifier, 'ascii').digest());
}

/**
 * Generate a cryptographically random `state` parameter.
 *
 * @stable
 */
export function generateState(byteLength = 16): string {
  return base64Url(randomBytes(byteLength));
}
