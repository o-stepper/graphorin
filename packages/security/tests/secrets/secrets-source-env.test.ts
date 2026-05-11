import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  _resetSecretsFactoryForTesting,
  createSecretsStore,
  EnvSecretsStore,
  getSecretsStoreStatus,
  parseSecretsSourceEnv,
} from '../../src/secrets/index.js';

afterEach(() => {
  _resetSecretsFactoryForTesting();
  delete process.env.GRAPHORIN_SECRETS_SOURCE;
  delete process.env.GRAPHORIN_HEADLESS;
});

beforeEach(() => {
  delete process.env.GRAPHORIN_SECRETS_SOURCE;
});

describe('parseSecretsSourceEnv', () => {
  it('returns undefined for unset env', () => {
    expect(parseSecretsSourceEnv(undefined)).toBeUndefined();
    expect(parseSecretsSourceEnv('')).toBeUndefined();
    expect(parseSecretsSourceEnv('  ')).toBeUndefined();
  });

  it('parses a single kind', () => {
    expect(parseSecretsSourceEnv('keyring')).toEqual({ kind: 'keyring' });
    expect(parseSecretsSourceEnv('encrypted-file')).toEqual({ kind: 'encrypted-file' });
    expect(parseSecretsSourceEnv('env')).toEqual({ kind: 'env' });
    expect(parseSecretsSourceEnv('memory')).toEqual({ kind: 'memory' });
    expect(parseSecretsSourceEnv('auto')).toEqual({ kind: 'auto' });
  });

  it('parses a comma-separated chain into auto+fallbackChain', () => {
    expect(parseSecretsSourceEnv('keyring,encrypted-file')).toEqual({
      kind: 'auto',
      fallbackChain: ['keyring', 'encrypted-file'],
    });
  });

  it('lowercases and trims tokens', () => {
    expect(parseSecretsSourceEnv(' Keyring , ENV ')).toEqual({
      kind: 'auto',
      fallbackChain: ['keyring', 'env'],
    });
  });

  it('throws on unknown kinds', () => {
    expect(() => parseSecretsSourceEnv('unknown-kind')).toThrow(/unknown kind/);
  });

  it("rejects 'auto' inside a chain", () => {
    expect(() => parseSecretsSourceEnv('auto,env')).toThrow(/cannot be combined/);
  });
});

describe('createSecretsStore honours GRAPHORIN_SECRETS_SOURCE', () => {
  it('uses the env-supplied kind when no caller override is given', async () => {
    process.env.GRAPHORIN_SECRETS_SOURCE = 'env';
    const store = await createSecretsStore();
    expect(store).toBeInstanceOf(EnvSecretsStore);
    expect(getSecretsStoreStatus()?.active).toBe('env');
  });

  it('caller-supplied opts.kind overrides the env', async () => {
    process.env.GRAPHORIN_SECRETS_SOURCE = 'env';
    const store = await createSecretsStore({ kind: 'memory' });
    expect(store.constructor.name).toBe('MemorySecretsStore');
    expect(getSecretsStoreStatus()?.active).toBe('memory');
  });

  it('uses the env-supplied chain', async () => {
    process.env.GRAPHORIN_SECRETS_SOURCE = 'encrypted-file,env';
    process.env.GRAPHORIN_HEADLESS = '1';
    try {
      const store = await createSecretsStore({ warn: () => {} });
      expect(store).toBeInstanceOf(EnvSecretsStore);
      const status = getSecretsStoreStatus();
      expect(status?.active).toBe('env');
      expect(status?.fallbackChain).toEqual(['encrypted-file', 'env']);
    } finally {
      delete process.env.GRAPHORIN_HEADLESS;
    }
  });
});
