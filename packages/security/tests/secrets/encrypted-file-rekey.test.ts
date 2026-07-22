import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { EncryptedFileSecretsStore, SecretValue } from '../../src/secrets/index.js';

// Argon2id (m=64MiB, t=3) is slow on shared CI runners - match stores.test.ts.
const KDF_TEST_TIMEOUT_MS = 30_000;

// Bundle layout: [magic(4) | salt(16) | nonce(12) | ciphertext | tag(16)].
const SALT_OFFSET = 4;
const SALT_BYTES = 16;

describe('EncryptedFileSecretsStore.rekey', () => {
  let workDir: string;
  beforeEach(() => {
    workDir = mkdtempSync(join(tmpdir(), 'graphorin-encfile-rekey-'));
  });
  afterEach(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  it(
    'rekeys the bundle: values survive, the KDF salt rotates, the old passphrase stops working, the instance keeps working',
    async () => {
      const path = join(workDir, 'secrets.kse');
      const store = new EncryptedFileSecretsStore({
        path,
        passphrase: SecretValue.fromString('old-passphrase'),
      });
      await store.set('alpha', 'one');
      const saltBefore = readFileSync(path).subarray(SALT_OFFSET, SALT_OFFSET + SALT_BYTES);

      await store.rekey(SecretValue.fromString('new-passphrase'));

      // Fresh salt per write: a rekey never reuses the old KDF salt.
      const saltAfter = readFileSync(path).subarray(SALT_OFFSET, SALT_OFFSET + SALT_BYTES);
      expect(saltAfter.equals(saltBefore)).toBe(false);

      // The same instance switched to the new passphrase transparently.
      const sameInstance = await store.get('alpha');
      expect(sameInstance?.reveal()).toBe('one');
      await store.set('beta', 'two');

      // A fresh instance with the NEW passphrase reads everything.
      const reopened = new EncryptedFileSecretsStore({
        path,
        passphrase: SecretValue.fromString('new-passphrase'),
      });
      expect((await reopened.get('alpha'))?.reveal()).toBe('one');
      expect((await reopened.get('beta'))?.reveal()).toBe('two');

      // The OLD passphrase now fails the GCM auth check.
      const stale = new EncryptedFileSecretsStore({
        path,
        passphrase: SecretValue.fromString('old-passphrase'),
      });
      await expect(stale.require('alpha')).rejects.toThrow(/Authentication tag mismatch/);
    },
    KDF_TEST_TIMEOUT_MS,
  );

  it(
    'rekey of a missing bundle propagates ENOENT instead of minting an empty bundle',
    async () => {
      const store = new EncryptedFileSecretsStore({
        path: join(workDir, 'never-created.kse'),
        passphrase: SecretValue.fromString('irrelevant'),
      });
      await expect(store.rekey(SecretValue.fromString('next'))).rejects.toMatchObject({
        code: 'ENOENT',
      });
    },
    KDF_TEST_TIMEOUT_MS,
  );

  it(
    'rekey with a wrong current passphrase fails loud and leaves the bundle untouched',
    async () => {
      const path = join(workDir, 'secrets.kse');
      const writer = new EncryptedFileSecretsStore({
        path,
        passphrase: SecretValue.fromString('correct'),
      });
      await writer.set('foo', 'bar');
      const onDiskBefore = readFileSync(path);

      const wrong = new EncryptedFileSecretsStore({
        path,
        passphrase: SecretValue.fromString('wrong'),
      });
      await expect(wrong.rekey(SecretValue.fromString('next'))).rejects.toThrow(
        /Authentication tag mismatch/,
      );
      expect(readFileSync(path).equals(onDiskBefore)).toBe(true);
    },
    KDF_TEST_TIMEOUT_MS,
  );
});
