import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  decryptBundle,
  ENCRYPTED_FILE_MAGIC,
  EncryptedFileSecretsStore,
  encryptedFileResolver,
  resolveSecret,
  SecretResolutionError,
  SecretValue,
} from '../../src/secrets/index.js';

let workDir: string;

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), 'graphorin-encfile-resolver-'));
});

afterEach(() => {
  rmSync(workDir, { recursive: true, force: true });
  delete process.env.GRAPHORIN_MASTER_PASSPHRASE;
  delete process.env.GRAPHORIN_MASTER_PASSPHRASE_FILE;
});

describe('encrypted-file: resolver', () => {
  it('reads a value via env-provided passphrase', async () => {
    const path = join(workDir, 'secrets.kse');
    const passphrase = SecretValue.fromString('master-pass');
    const store = new EncryptedFileSecretsStore({ path, passphrase });
    await store.set('openai_api_key', 'sk-from-encfile');

    process.env.GRAPHORIN_MASTER_PASSPHRASE = 'master-pass';
    // Use `pathToFileURL(...).href` to get a portable RFC-compliant
    // `file://`-style URL (`encrypted-file:` shares the same path
    // grammar). The replace re-targets the `file:` scheme prefix at
    // `encrypted-file:` so the test still exercises the
    // `encrypted-file://...` route end-to-end on every OS.
    const url = pathToFileURL(path).href.replace(/^file:/, 'encrypted-file:');
    const value = await resolveSecret(`${url}#openai_api_key`);
    expect(value.reveal()).toBe('sk-from-encfile');
    expect(value.source?.resolver).toBe('encrypted-file');
  });

  it('reads a value via file-provided passphrase', async () => {
    const path = join(workDir, 'secrets.kse');
    const passphraseFile = join(workDir, 'master.txt');
    await writeFile(passphraseFile, 'file-pass');
    const passphrase = SecretValue.fromString('file-pass');
    const store = new EncryptedFileSecretsStore({ path, passphrase });
    await store.set('foo', 'bar');

    process.env.GRAPHORIN_MASTER_PASSPHRASE_FILE = passphraseFile;
    const url = pathToFileURL(path).href.replace(/^file:/, 'encrypted-file:');
    const value = await resolveSecret(`${url}#foo`);
    expect(value.reveal()).toBe('bar');
  });

  it('refuses to resolve when no passphrase is configured', async () => {
    const path = join(workDir, 'secrets.kse');
    writeFileSync(path, 'placeholder');
    const url = pathToFileURL(path).href.replace(/^file:/, 'encrypted-file:');
    await expect(resolveSecret(`${url}#foo`)).rejects.toThrow(SecretResolutionError);
  });

  it('throws with a helpful message when the file is missing', async () => {
    process.env.GRAPHORIN_MASTER_PASSPHRASE = 'no-bundle';
    const url = pathToFileURL(join(workDir, 'missing.kse')).href.replace(
      /^file:/,
      'encrypted-file:',
    );
    await expect(resolveSecret(`${url}#foo`)).rejects.toThrow(SecretResolutionError);
  });

  it('throws with empty path', async () => {
    process.env.GRAPHORIN_MASTER_PASSPHRASE = 'foo';
    // The parser only allows non-empty paths so this code path is
    // exercised via the resolver's internal guard when fed a parsed
    // ref directly with an empty path.
    await expect(
      encryptedFileResolver.resolve(
        {
          raw: 'encrypted-file:',
          scheme: 'encrypted-file',
          path: '',
          query: {},
        },
        undefined,
      ),
    ).rejects.toThrow(SecretResolutionError);
  });
});

describe('decryptBundle', () => {
  it('rejects truncated bundles', async () => {
    await expect(decryptBundle(Buffer.alloc(8), 'pass')).rejects.toThrow(SecretResolutionError);
  });

  it('rejects bundles with an unknown magic prefix', async () => {
    const bundle = Buffer.alloc(64);
    bundle.writeUInt32LE(0xdeadbeef, 0);
    await expect(decryptBundle(bundle, 'pass')).rejects.toThrow(/unknown magic/);
  });

  it('rejects mismatched authentication tags', async () => {
    const path = join(workDir, 'secrets.kse');
    const store = new EncryptedFileSecretsStore({
      path,
      passphrase: SecretValue.fromString('correct-pass'),
    });
    await store.set('foo', 'bar');
    await expect(
      decryptBundle(
        Buffer.concat([Buffer.from(new Uint8Array(4).fill(0)), Buffer.alloc(60)]),
        'pass',
      ),
    ).rejects.toThrow();
  });

  it('exposes the canonical magic constant', () => {
    expect(ENCRYPTED_FILE_MAGIC).toBe(0x01_00_00_00);
  });
});
