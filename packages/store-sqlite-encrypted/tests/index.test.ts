import { describe, expect, it } from 'vitest';

import * as encrypted from '../src/index.js';

describe('@graphorin/store-sqlite-encrypted public surface', () => {
  it('declares VERSION matching the package.json release', () => {
    expect(encrypted.VERSION).toBe('0.5.0');
  });

  it('re-exports the cipher selection helpers', () => {
    expect(encrypted.DEFAULT_CIPHER).toBe('sqlcipher');
    expect(typeof encrypted.encodePassphraseForPragma).toBe('function');
    expect(typeof encrypted.pragmaSequenceForCipher).toBe('function');
  });

  it('re-exports the runners + connection helpers + integrity check', () => {
    expect(typeof encrypted.encryptDatabase).toBe('function');
    expect(typeof encrypted.rekeyDatabase).toBe('function');
    expect(typeof encrypted.cipherIntegrityCheck).toBe('function');
    expect(typeof encrypted.createEncryptedConnection).toBe('function');
    expect(typeof encrypted.loadCipherPeer).toBe('function');
  });

  it('re-exports the typed peer-missing error', () => {
    const err = new encrypted.EncryptedStorePeerMissingError('boom');
    expect(err.name).toBe('EncryptedStorePeerMissingError');
  });
});
