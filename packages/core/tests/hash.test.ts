import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { md5, xxhash } from '../src/utils/hash.js';

describe('md5', () => {
  it('matches Node crypto on UTF-8 strings', () => {
    const input = 'graphorin';
    const expected = createHash('md5').update(input, 'utf8').digest('hex');
    expect(md5(input)).toBe(expected);
  });

  it('matches Node crypto on raw bytes', () => {
    const input = new Uint8Array([0, 1, 2, 3, 255]);
    const expected = createHash('md5').update(input).digest('hex');
    expect(md5(input)).toBe(expected);
  });
});

describe('xxhash', () => {
  it('matches the canonical XXH32 empty-string vector (seed=0)', () => {
    // 0x02cc5d05 is the documented XXH32 digest of the empty string with
    // seed 0 (https://github.com/Cyan4973/xxHash/blob/dev/doc/xxhash_spec.md).
    expect(xxhash('')).toBe('02cc5d05');
  });

  it('returns a stable 8-character hex digest', () => {
    expect(xxhash('hello')).toMatch(/^[0-9a-f]{8}$/);
    expect(xxhash(new Uint8Array([1, 2, 3]))).toMatch(/^[0-9a-f]{8}$/);
    expect(xxhash('graphorin', 0xcafebabe)).toMatch(/^[0-9a-f]{8}$/);
  });

  it('is deterministic across calls', () => {
    expect(xxhash('graphorin')).toBe(xxhash('graphorin'));
    expect(xxhash('graphorin', 42)).toBe(xxhash('graphorin', 42));
  });

  it('changes with the input', () => {
    expect(xxhash('graphorin')).not.toBe(xxhash('Graphorin'));
  });

  it('changes with the seed', () => {
    expect(xxhash('graphorin', 0)).not.toBe(xxhash('graphorin', 1));
  });

  it('handles inputs that cross the 16-byte main loop', () => {
    const sixteen = '0123456789abcdef';
    const eighteen = '0123456789abcdefXY';
    expect(xxhash(sixteen)).toMatch(/^[0-9a-f]{8}$/);
    expect(xxhash(eighteen)).toMatch(/^[0-9a-f]{8}$/);
    expect(xxhash(sixteen)).not.toBe(xxhash(eighteen));
  });

  it('accepts raw byte input and matches the string equivalent', () => {
    const s = 'graphorin';
    expect(xxhash(new TextEncoder().encode(s))).toBe(xxhash(s));
  });
});
