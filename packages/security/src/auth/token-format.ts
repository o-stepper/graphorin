/**
 * Server token format primitives. The framework issues opaque random
 * tokens of the canonical shape:
 *
 * ```
 * <prefix>_<env>_v1_<43-char base62 entropy>_<6-char base62 crc32>
 * ```
 *
 * - `prefix` — short string identifying the token issuer (`gph` for
 *   the framework default; configurable per deployment).
 * - `env` — short environment label (`live`, `test`, `local`, …).
 * - `v1` — explicit version segment so future formats can coexist by
 *   prefix dispatch.
 * - 43-char base62 entropy block — encodes 256 bits from
 *   `crypto.randomBytes(32)` (≈ `Math.log2(62) * 43 ≈ 256` bits).
 * - 6-char base62 CRC32 checksum of the entropy block — enables an
 *   offline malformed-token reject without a database round-trip.
 *
 * The format is intentionally project-specific (the prefix and version
 * segment differ from any third-party API token format the framework
 * does not depend on). Secret scanners can register the prefix and
 * mirror the same format upstream once published.
 *
 * @packageDocumentation
 */

import { Buffer } from 'node:buffer';
import { randomBytes } from 'node:crypto';

import { TokenFormatError } from './errors.js';

const BASE62_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const BASE62_INDEX = (() => {
  const map = new Int8Array(128).fill(-1);
  for (let i = 0; i < BASE62_ALPHABET.length; i += 1) {
    map[BASE62_ALPHABET.charCodeAt(i)] = i;
  }
  return map;
})();

/** Default token prefix. Aligned with the framework name. */
export const DEFAULT_TOKEN_PREFIX = 'gph';

/** Canonical entropy length in bytes. 32 bytes = 256 bits. */
export const TOKEN_ENTROPY_BYTES = 32;

/** Canonical entropy block length in characters when base62-encoded. */
export const TOKEN_ENTROPY_LENGTH = 43;

/** Canonical CRC32 checksum length in characters when base62-encoded. */
export const TOKEN_CHECKSUM_LENGTH = 6;

/** Version segment used by every token issued by this version of the framework. */
export const TOKEN_VERSION = 'v1' as const;

/**
 * Set of accepted environment labels. The library keeps a small,
 * fixed set so deployments can rely on the label being a stable
 * routing signal. Operators can extend this by passing a custom
 * `acceptEnvironments` allowlist into `parseToken(...)`.
 *
 * @stable
 */
export type TokenEnvironment = 'live' | 'test' | 'local';

/** Canonical accepted environments. Frozen so callers cannot mutate it. */
export const TOKEN_ENVIRONMENTS: ReadonlyArray<TokenEnvironment> = Object.freeze([
  'live',
  'test',
  'local',
]);

/**
 * Result of `parseToken(...)`. Splitting the parsed shape lets the
 * caller branch on the discriminated `ok` field without exception
 * plumbing on the verify hot path.
 *
 * @stable
 */
export type ParsedToken =
  | {
      readonly ok: true;
      readonly prefix: string;
      readonly env: string;
      readonly version: typeof TOKEN_VERSION;
      readonly entropy: string;
      readonly checksum: string;
      readonly raw: string;
    }
  | { readonly ok: false; readonly reason: TokenFormatError };

/**
 * Options for `parseToken(...)`.
 *
 * @stable
 */
export interface ParseTokenOptions {
  /** Override the accepted prefix. Defaults to `DEFAULT_TOKEN_PREFIX`. */
  readonly acceptPrefix?: string;
  /**
   * Override the accepted environments. Defaults to
   * `TOKEN_ENVIRONMENTS`. An empty array is treated as "accept any
   * non-empty lowercase ASCII label".
   */
  readonly acceptEnvironments?: ReadonlyArray<string>;
}

/**
 * Options for `generateRawToken(...)`.
 *
 * @stable
 */
export interface GenerateRawTokenOptions {
  /** Token prefix. Defaults to `DEFAULT_TOKEN_PREFIX`. */
  readonly prefix?: string;
  /** Environment label. */
  readonly env: TokenEnvironment | string;
}

const ENV_LABEL_RE = /^[a-z][a-z0-9-]{0,15}$/;

/**
 * CRC32/IEEE 802.3 implementation. Pure JS, branchless inner loop —
 * matches the polynomial used by GZIP / PNG / Ethernet (`0xEDB88320`).
 * Returns an unsigned 32-bit integer so it can be base62-encoded
 * without further bit-fiddling.
 *
 * @stable
 */
export function crc32(input: Uint8Array | string): number {
  const bytes = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  let crc = 0xff_ff_ff_ff;
  const table = CRC32_TABLE;
  for (let i = 0; i < bytes.length; i += 1) {
    const byte = bytes[i] ?? 0;
    const idx = (crc ^ byte) & 0xff;
    const next = table[idx] ?? 0;
    crc = (crc >>> 8) ^ next;
  }
  return (crc ^ 0xff_ff_ff_ff) >>> 0;
}

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xed_b8_83_20 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

/**
 * Encode a non-negative integer (≤ 2^53 - 1) as base62. The output is
 * left-padded with `'0'` to the requested width. Throws on negative,
 * non-finite, or width-exceeding inputs to avoid silent truncation.
 *
 * @stable
 */
export function encodeBase62Integer(value: number, width: number): string {
  if (!Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
    throw new RangeError(`encodeBase62Integer expected a non-negative integer; got ${value}.`);
  }
  if (width <= 0) {
    throw new RangeError(`encodeBase62Integer expected a positive width; got ${width}.`);
  }
  let n = value;
  let out = '';
  while (n > 0) {
    out = BASE62_ALPHABET.charAt(n % 62) + out;
    n = Math.floor(n / 62);
  }
  if (out.length > width) {
    throw new RangeError(
      `encodeBase62Integer: value ${value} requires ${out.length} chars but width is ${width}.`,
    );
  }
  return out.padStart(width, '0');
}

/**
 * Encode a byte buffer as base62 with a fixed-length output. The
 * routine treats the bytes as a big-endian unbounded integer and
 * left-pads to `width` so that any 32-byte input yields exactly 43
 * base62 characters.
 *
 * Bias note (CodeQL `js/biased-cryptographic-random`): this is **not** a
 * `byte % 62` reduction over CSPRNG bytes — that would indeed bias the
 * output. Instead we perform full big-integer long division, so each
 * emitted base62 character represents a distinct "digit" of the input
 * integer in base 62. As long as the input is uniform over `[0, 256^n)`
 * (which is what `crypto.randomBytes(n)` guarantees), the resulting
 * base62 string is uniform over `[0, 62^width)` for the leading
 * positions; only the most-significant position can carry a small bias
 * when `256^n` is not an exact power of 62, and that position is what
 * `width` left-pads to a constant length for. Callers that need
 * fixed-entropy tokens should pick `n` such that `256^n >= 62^width` —
 * the existing `encodeRandomToken` helpers do.
 *
 * @stable
 */
export function encodeBase62Bytes(bytes: Uint8Array, width: number): string {
  if (width <= 0) {
    throw new RangeError(`encodeBase62Bytes expected a positive width; got ${width}.`);
  }
  if (bytes.length === 0) return '0'.repeat(width);
  let value = Array.from(bytes);
  const out: string[] = [];
  while (value.length > 0) {
    const next: number[] = [];
    let remainder = 0;
    let leadingZero = true;
    for (let i = 0; i < value.length; i += 1) {
      const byte = value[i] ?? 0;
      const acc = remainder * 256 + byte;
      // codeql[js/biased-cryptographic-random] -- digit-by-digit long
      // division of a CSPRNG-uniform big integer; not a modulo of one
      // CSPRNG byte. See block comment above for the bias analysis.
      const quotient = Math.floor(acc / 62);
      remainder = acc - quotient * 62;
      if (!leadingZero || quotient > 0) {
        next.push(quotient);
        leadingZero = false;
      }
    }
    out.push(BASE62_ALPHABET.charAt(remainder));
    value = next;
  }
  if (out.length > width) {
    throw new RangeError(
      `encodeBase62Bytes: ${bytes.length} bytes encode to ${out.length} chars but width is ${width}.`,
    );
  }
  while (out.length < width) {
    out.push('0');
  }
  return out.reverse().join('');
}

/** Generate a `crypto.randomBytes`-backed entropy block. */
function generateEntropy(): Buffer {
  return randomBytes(TOKEN_ENTROPY_BYTES);
}

/**
 * Generate a brand-new raw token. The result is the only place the
 * plaintext value exists; callers MUST hand it to the user immediately
 * and persist only the HMAC hash via the `AuthTokenStore` contract.
 *
 * @stable
 */
export function generateRawToken(opts: GenerateRawTokenOptions): {
  readonly raw: string;
  readonly entropyBytes: Buffer;
} {
  const prefix = opts.prefix ?? DEFAULT_TOKEN_PREFIX;
  validatePrefix(prefix);
  validateEnvLabel(opts.env);
  const entropyBytes = generateEntropy();
  const entropy = encodeBase62Bytes(entropyBytes, TOKEN_ENTROPY_LENGTH);
  const checksum = encodeBase62Integer(crc32(entropy), TOKEN_CHECKSUM_LENGTH);
  const raw = `${prefix}_${opts.env}_${TOKEN_VERSION}_${entropy}_${checksum}`;
  return Object.freeze({ raw, entropyBytes });
}

/**
 * Strict structural parser. Returns a discriminated union so callers
 * can branch on `ok` without throwing on the hot path. The function
 * never logs the raw input; the error class only carries the input
 * length.
 *
 * @stable
 */
export function parseToken(input: string, opts: ParseTokenOptions = {}): ParsedToken {
  if (typeof input !== 'string' || input.length === 0) {
    return {
      ok: false,
      reason: new TokenFormatError(
        'empty-input',
        'Token input is empty.',
        typeof input === 'string' ? input.length : 0,
      ),
    };
  }

  const segments = input.split('_');
  if (segments.length !== 5) {
    return {
      ok: false,
      reason: new TokenFormatError(
        'wrong-length',
        `Token expected 5 underscore-separated segments; got ${segments.length}.`,
        input.length,
      ),
    };
  }

  const [prefix, env, version, entropy, checksum] = segments as [
    string,
    string,
    string,
    string,
    string,
  ];

  const acceptPrefix = opts.acceptPrefix ?? DEFAULT_TOKEN_PREFIX;
  if (prefix !== acceptPrefix) {
    return {
      ok: false,
      reason: new TokenFormatError(
        'wrong-prefix',
        `Token prefix '${prefix}' does not match expected '${acceptPrefix}'.`,
        input.length,
      ),
    };
  }

  if (!isAcceptedEnvironment(env, opts.acceptEnvironments)) {
    return {
      ok: false,
      reason: new TokenFormatError(
        'invalid-environment',
        `Token environment label '${env}' is not in the accepted set.`,
        input.length,
      ),
    };
  }

  if (version !== TOKEN_VERSION) {
    return {
      ok: false,
      reason: new TokenFormatError(
        'wrong-version',
        `Token version '${version}' does not match supported '${TOKEN_VERSION}'.`,
        input.length,
      ),
    };
  }

  if (entropy.length !== TOKEN_ENTROPY_LENGTH || !isBase62(entropy)) {
    return {
      ok: false,
      reason: new TokenFormatError(
        'invalid-entropy',
        `Token entropy block must be ${TOKEN_ENTROPY_LENGTH} base62 characters.`,
        input.length,
      ),
    };
  }
  if (checksum.length !== TOKEN_CHECKSUM_LENGTH || !isBase62(checksum)) {
    return {
      ok: false,
      reason: new TokenFormatError(
        'invalid-checksum',
        `Token checksum must be ${TOKEN_CHECKSUM_LENGTH} base62 characters.`,
        input.length,
      ),
    };
  }

  const expected = encodeBase62Integer(crc32(entropy), TOKEN_CHECKSUM_LENGTH);
  if (expected !== checksum) {
    return {
      ok: false,
      reason: new TokenFormatError(
        'invalid-checksum',
        'Token checksum does not match its entropy block.',
        input.length,
      ),
    };
  }

  return Object.freeze({
    ok: true,
    prefix,
    env,
    version: TOKEN_VERSION,
    entropy,
    checksum,
    raw: input,
  });
}

/**
 * Cheap structural pre-filter used before doing any HMAC or DB work.
 * Identical to `parseToken` but returns the boolean shape that the
 * verify pipeline expects.
 *
 * @stable
 */
export function verifyOffline(
  input: string,
  opts: ParseTokenOptions = {},
): { readonly ok: true; readonly env: string } | { readonly ok: false; readonly reason: string } {
  const parsed = parseToken(input, opts);
  if (parsed.ok) return Object.freeze({ ok: true, env: parsed.env });
  return Object.freeze({ ok: false, reason: parsed.reason.kind });
}

function validatePrefix(prefix: string): void {
  if (!ENV_LABEL_RE.test(prefix)) {
    throw new RangeError(
      `Invalid token prefix '${prefix}': must be lowercase ASCII letters/digits/dashes (1-16 chars, leading letter).`,
    );
  }
}

function validateEnvLabel(env: string): void {
  if (!ENV_LABEL_RE.test(env)) {
    throw new RangeError(
      `Invalid token environment label '${env}': must be lowercase ASCII letters/digits/dashes (1-16 chars, leading letter).`,
    );
  }
}

function isAcceptedEnvironment(env: string, accept?: ReadonlyArray<string>): boolean {
  if (env.length === 0 || env.length > 16) return false;
  if (accept !== undefined) {
    if (accept.length === 0) return ENV_LABEL_RE.test(env);
    return accept.includes(env);
  }
  return TOKEN_ENVIRONMENTS.includes(env as TokenEnvironment);
}

function isBase62(input: string): boolean {
  for (let i = 0; i < input.length; i += 1) {
    const ch = input.charCodeAt(i);
    if (ch < 0 || ch >= 128 || BASE62_INDEX[ch] === -1) return false;
  }
  return true;
}
