import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  _resetResolversForTesting,
  _resetSecretsFactoryForTesting,
  createSecretsStore,
  installBuiltinResolvers,
} from '@graphorin/security';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  runSecretsDelete,
  runSecretsGet,
  runSecretsList,
  runSecretsRef,
  runSecretsRotate,
  runSecretsSet,
} from '../src/commands/secrets.js';

describe('graphorin secrets', () => {
  beforeEach(async () => {
    _resetResolversForTesting();
    _resetSecretsFactoryForTesting();
    installBuiltinResolvers({});
    // Bootstrap the singleton via memory so the per-call helpers reuse
    // the same backing store. Tests pass no `secretsSource` after this
    // so the helpers fall through to `getActiveSecretsStore()`.
    await createSecretsStore({ kind: 'memory' });
  });

  afterEach(() => {
    _resetResolversForTesting();
    _resetSecretsFactoryForTesting();
  });

  it('round-trips a secret through the in-memory store', async () => {
    const lines: string[] = [];
    const print = (line: string) => lines.push(line);

    await runSecretsSet({
      key: 'graphorin_test_secret',
      value: 'hunter2',
      print,
    });
    const list = await runSecretsList({ print });
    expect(list.some((m) => m.key === 'graphorin_test_secret')).toBe(true);
    const got = await runSecretsGet({
      key: 'graphorin_test_secret',
      reveal: true,
      print,
    });
    expect(got.found).toBe(true);
    expect(got.value).toBe('hunter2');
    await runSecretsDelete({
      key: 'graphorin_test_secret',
      print,
    });
    const after = await runSecretsList({ print });
    expect(after.some((m) => m.key === 'graphorin_test_secret')).toBe(false);
  });

  it('SECRETS-S-02: activates the encrypted-file store from GRAPHORIN_MASTER_PASSPHRASE', async () => {
    // Requires the @node-rs/argon2 peer; skip cleanly when it is absent so
    // this does not fail on hosts without the optional native dependency.
    let hasArgon2 = true;
    // Non-literal specifier so tsc does not require the optional peer's types.
    const argon2Module = '@node-rs/argon2';
    try {
      await import(argon2Module);
    } catch {
      hasArgon2 = false;
    }
    if (!hasArgon2) return;

    const dir = await mkdtemp(join(tmpdir(), 'graphorin-cli-encfile-'));
    const prevPass = process.env.GRAPHORIN_MASTER_PASSPHRASE;
    const prevFile = process.env.GRAPHORIN_SECRETS_FILE;
    process.env.GRAPHORIN_MASTER_PASSPHRASE = 'test-passphrase-for-secrets-s-02';
    process.env.GRAPHORIN_SECRETS_FILE = join(dir, 'secrets.enc');
    try {
      const print = (): void => {};
      await runSecretsSet({
        key: 'enc_key',
        value: 'enc_value',
        secretsSource: 'encrypted-file',
        print,
      });
      const got = await runSecretsGet({
        key: 'enc_key',
        reveal: true,
        secretsSource: 'encrypted-file',
        print,
      });
      expect(got.found).toBe(true);
      expect(got.value).toBe('enc_value');
    } finally {
      if (prevPass === undefined) delete process.env.GRAPHORIN_MASTER_PASSPHRASE;
      else process.env.GRAPHORIN_MASTER_PASSPHRASE = prevPass;
      if (prevFile === undefined) delete process.env.GRAPHORIN_SECRETS_FILE;
      else process.env.GRAPHORIN_SECRETS_FILE = prevFile;
    }
  });

  it('secrets ref reports a structural failure on an unknown scheme', async () => {
    const result = await runSecretsRef({
      uri: 'bogus-scheme://example',
      print: () => undefined,
    });
    expect(result.resolved).toBe(false);
  });

  it('rotate refuses to operate on a non-existent key', async () => {
    await expect(
      runSecretsRotate({
        key: 'missing',
        newValue: 'whatever',
        print: () => undefined,
      }),
    ).rejects.toThrow(/cannot rotate/);
  });

  it('set requires either --value or --from-stdin', async () => {
    await expect(
      runSecretsSet({
        key: 'k',
        print: () => undefined,
      }),
    ).rejects.toThrow(/--value/);
  });
});
