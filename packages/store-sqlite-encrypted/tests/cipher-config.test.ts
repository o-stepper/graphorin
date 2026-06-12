import { describe, expect, it } from 'vitest';

import {
  DEFAULT_CIPHER,
  encodePassphraseForPragma,
  pragmaSequenceForCipher,
} from '../src/cipher-config.js';

describe('cipher-config', () => {
  it('exposes sqlcipher as the default cipher', () => {
    expect(DEFAULT_CIPHER).toBe('sqlcipher');
  });

  it('returns the canonical PRAGMA sequence for sqlcipher', () => {
    expect(pragmaSequenceForCipher('sqlcipher')).toEqual(["cipher = 'sqlcipher'", 'legacy = 4']);
  });

  it('returns the canonical PRAGMA sequence for chacha20 (the peer default; wxsqlite3 is NOT a cipher — CS-13)', () => {
    expect(pragmaSequenceForCipher('chacha20')).toEqual(["cipher = 'chacha20'"]);
  });

  it('returns the canonical PRAGMA sequence for aes256cbc', () => {
    expect(pragmaSequenceForCipher('aes256cbc')).toEqual(["cipher = 'aes256cbc'"]);
  });

  it('throws on an unknown cipher', () => {
    expect(() => pragmaSequenceForCipher('not-a-cipher' as never)).toThrow(/unknown cipher/);
  });

  it('encodes a string passphrase as a SQL literal with single quotes', () => {
    expect(encodePassphraseForPragma('topsecret')).toBe("'topsecret'");
  });

  it('escapes embedded single quotes in string passphrases', () => {
    expect(encodePassphraseForPragma("a'b'c")).toBe("'a''b''c'");
  });

  it('encodes a Buffer passphrase as a hex blob literal', () => {
    expect(encodePassphraseForPragma(Buffer.from([0xab, 0xcd, 0xef]))).toBe("x'abcdef'");
  });

  it('rejects an empty string passphrase', () => {
    expect(() => encodePassphraseForPragma('')).toThrow(/empty/);
  });

  it('rejects an empty Buffer passphrase', () => {
    expect(() => encodePassphraseForPragma(Buffer.alloc(0))).toThrow(/empty/);
  });
});
