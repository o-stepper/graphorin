import { createHash } from 'node:crypto';

/**
 * MD5 hex digest. Used by the memory layer for content deduplication
 * (`MD5(content)` is the dedup key for incoming facts / messages).
 *
 * MD5 is **not** a cryptographic primitive in this codebase — it's used
 * exclusively for collision-resistant content addressing where
 * collision-resistance is the desired property, not pre-image resistance.
 * Do not use this helper for password hashing, MAC, or any other
 * security-sensitive use case (use `@graphorin/security` for those).
 *
 * @stable
 */
export function md5(content: string | Uint8Array): string {
  const h = createHash('md5');
  if (typeof content === 'string') {
    h.update(content, 'utf8');
  } else {
    h.update(content);
  }
  return h.digest('hex');
}

/**
 * Pure-JS XXH32 implementation. Used by the memory-modification guard
 * — fast, non-cryptographic content fingerprinting (`xxhash(content)`
 * tracks whether a tool's view of memory has shifted while the LLM was
 * thinking).
 *
 * Not security-sensitive — never use for tampering detection of an
 * untrusted attacker; for that the audit log uses SHA-256 (in
 * `@graphorin/security`).
 *
 * @stable
 */
export function xxhash(input: string | Uint8Array, seed = 0): string {
  const bytes = typeof input === 'string' ? utf8Encode(input) : input;
  const h = xxh32(bytes, seed >>> 0);
  return h.toString(16).padStart(8, '0');
}

const PRIME32_1 = 0x9e3779b1 >>> 0;
const PRIME32_2 = 0x85ebca77 >>> 0;
const PRIME32_3 = 0xc2b2ae3d >>> 0;
const PRIME32_4 = 0x27d4eb2f >>> 0;
const PRIME32_5 = 0x165667b1 >>> 0;

const utf8 = new TextEncoder();
function utf8Encode(s: string): Uint8Array {
  return utf8.encode(s);
}

function rotl32(x: number, r: number): number {
  return ((x << r) | (x >>> (32 - r))) >>> 0;
}

function mul32(a: number, b: number): number {
  // Multiply two 32-bit unsigned ints with overflow truncation.
  const aLo = a & 0xffff;
  const aHi = a >>> 16;
  const bLo = b & 0xffff;
  const bHi = b >>> 16;
  return (aLo * bLo + (((aLo * bHi + aHi * bLo) << 16) >>> 0)) >>> 0;
}

function read32LE(buf: Uint8Array, offset: number): number {
  const b0 = buf[offset] ?? 0;
  const b1 = buf[offset + 1] ?? 0;
  const b2 = buf[offset + 2] ?? 0;
  const b3 = buf[offset + 3] ?? 0;
  return (b0 | (b1 << 8) | (b2 << 16) | (b3 << 24)) >>> 0;
}

function xxh32(input: Uint8Array, seed: number): number {
  const len = input.length;
  let h32: number;
  let i = 0;

  if (len >= 16) {
    let v1 = (seed + PRIME32_1 + PRIME32_2) >>> 0;
    let v2 = (seed + PRIME32_2) >>> 0;
    let v3 = seed >>> 0;
    let v4 = (seed - PRIME32_1) >>> 0;

    while (i + 16 <= len) {
      v1 = mul32(rotl32((v1 + mul32(read32LE(input, i), PRIME32_2)) >>> 0, 13), PRIME32_1);
      i += 4;
      v2 = mul32(rotl32((v2 + mul32(read32LE(input, i), PRIME32_2)) >>> 0, 13), PRIME32_1);
      i += 4;
      v3 = mul32(rotl32((v3 + mul32(read32LE(input, i), PRIME32_2)) >>> 0, 13), PRIME32_1);
      i += 4;
      v4 = mul32(rotl32((v4 + mul32(read32LE(input, i), PRIME32_2)) >>> 0, 13), PRIME32_1);
      i += 4;
    }

    h32 = (rotl32(v1, 1) + rotl32(v2, 7) + rotl32(v3, 12) + rotl32(v4, 18)) >>> 0;
  } else {
    h32 = (seed + PRIME32_5) >>> 0;
  }

  h32 = (h32 + len) >>> 0;

  while (i + 4 <= len) {
    h32 = mul32(rotl32((h32 + mul32(read32LE(input, i), PRIME32_3)) >>> 0, 17), PRIME32_4);
    i += 4;
  }

  while (i < len) {
    const byte = input[i] ?? 0;
    h32 = mul32(rotl32((h32 + mul32(byte >>> 0, PRIME32_5)) >>> 0, 11), PRIME32_1);
    i++;
  }

  h32 = mul32(h32 ^ (h32 >>> 15), PRIME32_2);
  h32 = mul32(h32 ^ (h32 >>> 13), PRIME32_3);
  h32 = (h32 ^ (h32 >>> 16)) >>> 0;

  return h32;
}
