import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  _resetResolversForTesting,
  getResolver,
  installBuiltinResolvers,
  listResolverSchemes,
  registerResolver,
  resolveSecret,
  SecretValue,
  unregisterResolver,
} from '../../src/secrets/index.js';

beforeEach(() => {
  _resetResolversForTesting();
  installBuiltinResolvers();
});

afterEach(() => {
  unregisterResolver('test-scheme');
});

describe('SecretResolver registry', () => {
  it('lists every built-in scheme', () => {
    const schemes = listResolverSchemes();
    expect(schemes).toContain('env');
    expect(schemes).toContain('keyring');
    expect(schemes).toContain('file');
    expect(schemes).toContain('encrypted-file');
    expect(schemes).toContain('literal');
    expect(schemes).toContain('ref');
    expect(schemes).toContain('vault');
  });

  it('getResolver returns the resolver for a scheme', () => {
    expect(getResolver('env')?.scheme).toBe('env');
    expect(getResolver('does-not-exist')).toBeUndefined();
  });

  it('lowercases the scheme on lookup', () => {
    expect(getResolver('ENV')?.scheme).toBe('env');
  });

  it('registerResolver replaces by default', () => {
    const original = getResolver('env');
    expect(original?.scheme).toBe('env');
    const replacement = {
      scheme: 'env',
      async resolve(): Promise<SecretValue> {
        return SecretValue.fromString('replacement');
      },
    };
    const previous = registerResolver(replacement);
    expect(previous?.scheme).toBe('env');
    // Restore so other tests do not see the replacement.
    if (original) registerResolver(original);
  });

  it('registerResolver throws when allowReplace=false and scheme exists', () => {
    expect(() =>
      registerResolver(
        {
          scheme: 'env',
          async resolve(): Promise<SecretValue> {
            return SecretValue.fromString('x');
          },
        },
        { allowReplace: false },
      ),
    ).toThrow(/already registered/);
  });

  it('rejects an empty scheme', () => {
    expect(() =>
      registerResolver({
        scheme: '',
        async resolve(): Promise<SecretValue> {
          return SecretValue.fromString('x');
        },
      }),
    ).toThrow(/non-empty/);
  });

  it('user-registered schemes route through resolveSecret', async () => {
    registerResolver({
      scheme: 'test-scheme',
      async resolve(): Promise<SecretValue> {
        return SecretValue.fromString('routed');
      },
    });
    const value = await resolveSecret('test-scheme:foo');
    expect(value.reveal()).toBe('routed');
  });

  it('resolveSecret accepts pre-parsed refs', async () => {
    registerResolver({
      scheme: 'test-scheme',
      async resolve(): Promise<SecretValue> {
        return SecretValue.fromString('parsed');
      },
    });
    const value = await resolveSecret({
      raw: 'test-scheme:bar',
      scheme: 'test-scheme',
      path: 'bar',
      query: {},
    });
    expect(value.reveal()).toBe('parsed');
  });

  it('unregisterResolver removes a scheme', () => {
    registerResolver({
      scheme: 'test-scheme',
      async resolve(): Promise<SecretValue> {
        return SecretValue.fromString('x');
      },
    });
    expect(unregisterResolver('test-scheme')).toBe(true);
    expect(unregisterResolver('test-scheme')).toBe(false);
  });
});
