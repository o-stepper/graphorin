/**
 * Tiny id helpers used by the agent runtime. URL-safe Base32 alphabet,
 * monotonic timestamp prefix to keep ids loosely sortable.
 *
 * @packageDocumentation
 */

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function pad(value: string, width: number): string {
  return value.padStart(width, '0');
}

function randomTail(): string {
  const u32 = (Math.random() * 0x100000000) >>> 0;
  let out = '';
  let n = u32;
  for (let i = 0; i < 7; i++) {
    out = ALPHABET[n & 0x1f] + out;
    n >>>= 5;
  }
  return out;
}

/** Generate a fresh, sortable, URL-safe identifier. */
export function newId(prefix?: string): string {
  const ts = pad(Date.now().toString(32).toUpperCase(), 9);
  const id = `${ts}${randomTail()}`;
  return prefix ? `${prefix}_${id}` : id;
}
