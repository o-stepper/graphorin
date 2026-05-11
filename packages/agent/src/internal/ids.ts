/**
 * Tiny id helpers used by the agent runtime. URL-safe Base32 alphabet,
 * monotonic timestamp prefix to keep ids loosely sortable.
 *
 * @packageDocumentation
 */

import { randomBytes } from 'node:crypto';

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function pad(value: string, width: number): string {
  return value.padStart(width, '0');
}

/**
 * 7-character Base32 tail backed by 35 bits of CSPRNG entropy. We read
 * 5 random bytes (40 bits) and consume 5 bits per emitted character
 * MSB-first; the leftover bits are discarded. Sourcing from
 * `randomBytes` (uniform over `[0, 256)`) guarantees a uniform
 * distribution over `ALPHABET` — no modulo bias.
 */
function randomTail(): string {
  const buf = randomBytes(5);
  let bitBuffer = 0;
  let bitCount = 0;
  let cursor = 0;
  let out = '';
  for (let i = 0; i < 7; i++) {
    while (bitCount < 5) {
      bitBuffer = (bitBuffer << 8) | (buf[cursor++] ?? 0);
      bitCount += 8;
    }
    bitCount -= 5;
    const idx = (bitBuffer >>> bitCount) & 0x1f;
    out += ALPHABET[idx];
  }
  return out;
}

/** Generate a fresh, sortable, URL-safe identifier. */
export function newId(prefix?: string): string {
  const ts = pad(Date.now().toString(32).toUpperCase(), 9);
  const id = `${ts}${randomTail()}`;
  return prefix ? `${prefix}_${id}` : id;
}
