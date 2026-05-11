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
