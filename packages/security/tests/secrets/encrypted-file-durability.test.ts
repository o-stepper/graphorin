import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { rename as realRename, writeFile as realWriteFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EncryptedFileSecretsStore, SecretValue } from '../../src/secrets/index.js';

// Partial-mock node:fs/promises so we can prove the atomic temp+rename write
// path while delegating every call to the real implementation. The mock is
// file-scoped (this test file only), so the broader secrets suite is untouched.
vi.mock('node:fs/promises', async (importActual) => {
  const actual = await importActual<typeof import('node:fs/promises')>();
  return {
    ...actual,
    writeFile: vi.fn((...args: Parameters<typeof actual.writeFile>) => actual.writeFile(...args)),
    rename: vi.fn((...args: Parameters<typeof actual.rename>) => actual.rename(...args)),
  };
});

// Argon2id (m=64MiB, t=3) is slow on shared CI runners — match stores.test.ts.
const KDF_TEST_TIMEOUT_MS = 30_000;

describe('EncryptedFileSecretsStore — durability (SPL-3)', () => {
  let workDir: string;
  beforeEach(() => {
    workDir = mkdtempSync(join(tmpdir(), 'graphorin-encfile-dura-'));
    vi.mocked(realWriteFile).mockClear();
    vi.mocked(realRename).mockClear();
  });
  afterEach(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  it(
    'a write with the wrong passphrase against a non-empty bundle throws and preserves existing secrets',
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
      // BUG (pre-fix): #readOrInitPlaintext swallows the auth-tag mismatch and
      // returns a fresh empty bundle, so set() overwrites the file and destroys
      // 'foo' while reporting success. FIX: the read fails loud, so set() throws.
      await expect(wrong.set('baz', 'qux')).rejects.toThrow(/Authentication tag mismatch/);

      // The original bundle must be byte-identical — nothing was overwritten.
      expect(readFileSync(path).equals(onDiskBefore)).toBe(true);

      // The correct passphrase still reads the original secret.
      const reader = new EncryptedFileSecretsStore({
        path,
        passphrase: SecretValue.fromString('correct'),
      });
      expect((await reader.get('foo'))?.reveal()).toBe('bar');
    },
    KDF_TEST_TIMEOUT_MS,
  );

  it(
    'initialises an empty bundle when the file does not exist (ENOENT is the only init path)',
    async () => {
      const path = join(workDir, 'fresh.kse');
      const store = new EncryptedFileSecretsStore({
        path,
        passphrase: SecretValue.fromString('correct'),
      });
      // Must NOT throw — a missing file is the legitimate first-write case.
      await store.set('foo', 'bar');
      expect((await store.get('foo'))?.reveal()).toBe('bar');
    },
    KDF_TEST_TIMEOUT_MS,
  );

  it(
    'writes atomically via a temp file + rename, leaving no .tmp behind',
    async () => {
      const path = join(workDir, 'secrets.kse');
      const store = new EncryptedFileSecretsStore({
        path,
        passphrase: SecretValue.fromString('correct'),
      });
      await store.set('foo', 'bar');

      // The bundle is written to a temp sibling, then renamed onto the target.
      const writeCalls = vi.mocked(realWriteFile).mock.calls;
      const wroteTemp = writeCalls.some(([target]) => String(target) === `${path}.tmp`);
      expect(wroteTemp).toBe(true);
      const renameCalls = vi.mocked(realRename).mock.calls;
      const renamedIntoPlace = renameCalls.some(
        ([from, to]) => String(from) === `${path}.tmp` && String(to) === path,
      );
      expect(renamedIntoPlace).toBe(true);

      // No leftover temp file after a successful write.
      expect(existsSync(`${path}.tmp`)).toBe(false);
      expect(existsSync(path)).toBe(true);
    },
    KDF_TEST_TIMEOUT_MS,
  );
});
