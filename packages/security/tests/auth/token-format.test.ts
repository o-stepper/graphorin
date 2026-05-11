import { Buffer } from 'node:buffer';

import { describe, expect, it } from 'vitest';

import {
  crc32,
  DEFAULT_TOKEN_PREFIX,
  encodeBase62Bytes,
  encodeBase62Integer,
  generateRawToken,
  parseToken,
  TOKEN_CHECKSUM_LENGTH,
  TOKEN_ENTROPY_LENGTH,
  TOKEN_VERSION,
  verifyOffline,
} from '../../src/auth/token-format.js';

describe('@graphorin/security/auth — token format', () => {
  describe('crc32', () => {
    it('matches the canonical IEEE-802.3 reference vector for the empty input', () => {
      expect(crc32('')).toBe(0);
    });

    it('matches a published reference vector', () => {
      // CRC32('123456789') === 0xCBF43926.
      expect(crc32('123456789')).toBe(0xcb_f4_39_26);
    });

    it('accepts Uint8Array inputs', () => {
      const utf8 = Buffer.from('123456789', 'utf8');
      expect(crc32(utf8)).toBe(0xcb_f4_39_26);
    });
  });

  describe('encodeBase62Integer', () => {
    it('left-pads to the requested width', () => {
      expect(encodeBase62Integer(0, 6)).toBe('000000');
    });

    it('encodes 1 as the second alphabet character', () => {
      expect(encodeBase62Integer(1, 1)).toBe('1');
    });

    it('encodes 61 as the last alphabet character', () => {
      expect(encodeBase62Integer(61, 1)).toBe('z');
    });

    it('encodes 62 as 10', () => {
      expect(encodeBase62Integer(62, 2)).toBe('10');
    });

    it('throws on negative inputs', () => {
      expect(() => encodeBase62Integer(-1, 6)).toThrow(RangeError);
    });

    it('throws when the value does not fit the width', () => {
      expect(() => encodeBase62Integer(62, 1)).toThrow(RangeError);
    });
  });

  describe('encodeBase62Bytes', () => {
    it('zero buffer encodes to all zeros', () => {
      const bytes = Buffer.alloc(32);
      expect(encodeBase62Bytes(bytes, TOKEN_ENTROPY_LENGTH)).toBe('0'.repeat(TOKEN_ENTROPY_LENGTH));
    });

    it('encodes 32 random bytes to exactly 43 characters', () => {
      const bytes = Buffer.alloc(32, 0xff);
      const encoded = encodeBase62Bytes(bytes, TOKEN_ENTROPY_LENGTH);
      expect(encoded.length).toBe(TOKEN_ENTROPY_LENGTH);
    });

    it('rejects insufficient width', () => {
      const bytes = Buffer.alloc(32, 0xff);
      expect(() => encodeBase62Bytes(bytes, 5)).toThrow(RangeError);
    });
  });

  describe('generateRawToken / parseToken / verifyOffline', () => {
    it('round-trips the canonical shape for every accepted environment', () => {
      for (const env of ['live', 'test', 'local'] as const) {
        const { raw } = generateRawToken({ env });
        expect(raw.startsWith(`${DEFAULT_TOKEN_PREFIX}_${env}_${TOKEN_VERSION}_`)).toBe(true);
        const parsed = parseToken(raw);
        expect(parsed.ok).toBe(true);
        if (parsed.ok) {
          expect(parsed.env).toBe(env);
          expect(parsed.version).toBe(TOKEN_VERSION);
          expect(parsed.entropy.length).toBe(TOKEN_ENTROPY_LENGTH);
          expect(parsed.checksum.length).toBe(TOKEN_CHECKSUM_LENGTH);
        }
      }
    });

    it('verifyOffline accepts the canonical token', () => {
      const { raw } = generateRawToken({ env: 'live' });
      const result = verifyOffline(raw);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.env).toBe('live');
    });

    it('rejects a token with the wrong prefix', () => {
      const { raw } = generateRawToken({ env: 'live', prefix: 'gph' });
      const tampered = raw.replace(/^gph/, 'evil');
      const result = verifyOffline(tampered);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe('wrong-prefix');
    });

    it('rejects a token with the wrong version segment', () => {
      const { raw } = generateRawToken({ env: 'live' });
      const tampered = raw.replace('_v1_', '_v2_');
      const result = verifyOffline(tampered);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe('wrong-version');
    });

    it('rejects a token with a flipped entropy bit (checksum mismatch)', () => {
      const { raw } = generateRawToken({ env: 'live' });
      // Flip the first character of the entropy block.
      const segments = raw.split('_');
      const entropy = segments[3] ?? '';
      const flipped = (entropy[0] === 'A' ? 'B' : 'A') + entropy.slice(1);
      segments[3] = flipped;
      const tampered = segments.join('_');
      const result = verifyOffline(tampered);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe('invalid-checksum');
    });

    it('rejects a token with a non-standard environment', () => {
      const { raw } = generateRawToken({ env: 'live' });
      const tampered = raw.replace('_live_', '_xxx_');
      const result = verifyOffline(tampered);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe('invalid-environment');
    });

    it('accepts custom environment labels via the acceptEnvironments override', () => {
      const { raw } = generateRawToken({ env: 'staging' });
      const result = verifyOffline(raw, { acceptEnvironments: ['staging'] });
      expect(result.ok).toBe(true);
    });

    it('accepts any well-formed environment label when acceptEnvironments is empty', () => {
      const { raw } = generateRawToken({ env: 'staging' });
      const result = verifyOffline(raw, { acceptEnvironments: [] });
      expect(result.ok).toBe(true);
    });

    it('rejects an empty input', () => {
      const result = verifyOffline('');
      expect(result.ok).toBe(false);
    });

    it('rejects garbage input shorter than 5 segments', () => {
      const result = verifyOffline('too_short_token');
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe('wrong-length');
    });

    it('rejects an entropy block of the wrong length', () => {
      const { raw } = generateRawToken({ env: 'live' });
      const segments = raw.split('_');
      segments[3] = 'A'.repeat(20);
      const tampered = segments.join('_');
      const result = verifyOffline(tampered);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe('invalid-entropy');
    });

    it('rejects non-base62 characters in the entropy block', () => {
      const { raw } = generateRawToken({ env: 'live' });
      const segments = raw.split('_');
      const entropy = segments[3] ?? '';
      segments[3] = `!${entropy.slice(1)}`;
      const tampered = segments.join('_');
      const result = verifyOffline(tampered);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe('invalid-entropy');
    });

    it('rejects a checksum block of the wrong length', () => {
      const { raw } = generateRawToken({ env: 'live' });
      const tampered = `${raw}xx`;
      const result = verifyOffline(tampered);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe('invalid-checksum');
    });

    it('rejects a non-base62 checksum', () => {
      const { raw } = generateRawToken({ env: 'live' });
      const segments = raw.split('_');
      segments[4] = '!!____';
      const result = verifyOffline(segments.join('_'));
      expect(result.ok).toBe(false);
    });

    it('rejects an invalid prefix at generation time', () => {
      expect(() => generateRawToken({ env: 'live', prefix: 'BadPrefix' })).toThrow(RangeError);
    });

    it('rejects an invalid env label at generation time', () => {
      expect(() => generateRawToken({ env: 'BAD ENV' })).toThrow(RangeError);
    });

    it('produces unique entropy on every call', () => {
      const a = generateRawToken({ env: 'live' });
      const b = generateRawToken({ env: 'live' });
      expect(a.raw).not.toBe(b.raw);
    });
  });
});
