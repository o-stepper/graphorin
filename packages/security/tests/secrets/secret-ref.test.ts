import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { SecretRefParseError } from '../../src/secrets/errors.js';
import {
  assertNotNakedString,
  BUILTIN_SCHEMES,
  describeParseErrorKind,
  getQueryParam,
  getQueryParamAll,
  getQueryParamRequired,
  parseAuthority,
  parseOrAssert,
  parseSecretRef,
  validateSecretRefs,
} from '../../src/secrets/secret-ref.js';

describe('parseSecretRef — accepted forms', () => {
  it('parses env: refs', () => {
    const ref = parseSecretRef('env:OPENAI_API_KEY');
    expect(ref.scheme).toBe('env');
    expect(ref.path).toBe('OPENAI_API_KEY');
    expect(ref.authority).toBeUndefined();
    expect(ref.fragment).toBeUndefined();
  });

  it('parses env: refs with default fallback', () => {
    const ref = parseSecretRef('env:KEY?default=fallback');
    expect(ref.query.default).toBe('fallback');
  });

  it('parses keyring: refs with optional service', () => {
    const ref = parseSecretRef('keyring:openai_api_key?service=graphorin-prod');
    expect(ref.scheme).toBe('keyring');
    expect(ref.path).toBe('openai_api_key');
    expect(getQueryParam(ref, 'service')).toBe('graphorin-prod');
  });

  it('parses opaque file: refs', () => {
    const ref = parseSecretRef('file:./relative/from/cwd');
    expect(ref.scheme).toBe('file');
    expect(ref.authority).toBeUndefined();
    expect(ref.path).toBe('./relative/from/cwd');
  });

  it('parses canonical file:// refs', () => {
    const ref = parseSecretRef('file:///abs/path/secret');
    expect(ref.scheme).toBe('file');
    expect(ref.authority).toBe('');
    expect(ref.path).toBe('/abs/path/secret');
  });

  it('parses tilde-prefixed file: refs', () => {
    const ref = parseSecretRef('file:~/.graphorin/secrets/openai');
    expect(ref.path).toBe('~/.graphorin/secrets/openai');
  });

  it('parses encrypted-file: refs with field fragment', () => {
    const ref = parseSecretRef('encrypted-file:/abs/path/secrets.kse#openai_api_key');
    expect(ref.scheme).toBe('encrypted-file');
    expect(ref.path).toBe('/abs/path/secrets.kse');
    expect(ref.fragment).toBe('openai_api_key');
  });

  it('parses encrypted-file: refs with JSON pointer fragment', () => {
    const ref = parseSecretRef('encrypted-file:~/aws.kse#/credentials/access_key_id');
    expect(ref.fragment).toBe('/credentials/access_key_id');
  });

  it('parses literal: refs', () => {
    const ref = parseSecretRef('literal:test-token-123');
    expect(ref.scheme).toBe('literal');
    expect(ref.path).toBe('test-token-123');
  });

  it('parses ref: refs', () => {
    const ref = parseSecretRef('ref:openai_api_key');
    expect(ref.scheme).toBe('ref');
    expect(ref.path).toBe('openai_api_key');
  });

  it('parses opaque vault: refs', () => {
    const ref = parseSecretRef('vault:secret/data/myapp#api_key');
    expect(ref.scheme).toBe('vault');
    expect(ref.authority).toBeUndefined();
    expect(ref.path).toBe('secret/data/myapp');
    expect(ref.fragment).toBe('api_key');
  });

  it('parses vault://host:port refs', () => {
    const ref = parseSecretRef('vault://prod-vault.example.com:8200/secret/data/myapp#api_key');
    expect(ref.scheme).toBe('vault');
    expect(ref.authority).toBe('prod-vault.example.com:8200');
    expect(ref.path).toBe('/secret/data/myapp');
    expect(ref.fragment).toBe('api_key');
  });

  it('parses query parameters with multi-value support', () => {
    const ref = parseSecretRef('vault:secret/data/myapp?version=3&kv=v2&kv=v1#field');
    expect(getQueryParam(ref, 'kv')).toBe('v1');
    expect(getQueryParamAll(ref, 'kv')).toEqual(['v2', 'v1']);
    expect(getQueryParam(ref, 'version')).toBe('3');
  });

  it('percent-decodes path / query / fragment', () => {
    const ref = parseSecretRef('keyring:my%20account?service=graphorin%20prod');
    expect(ref.path).toBe('my account');
    expect(ref.query.service).toBe('graphorin prod');
  });

  it('treats schemes as case-insensitive', () => {
    const ref = parseSecretRef('ENV:OPENAI_KEY');
    expect(ref.scheme).toBe('env');
  });
});

describe('parseSecretRef — rejected forms', () => {
  it.each([
    ['', 'empty-input'],
    ['no-colon', 'malformed-uri'],
    [':missing-scheme', 'invalid-scheme'],
    ['1invalid:scheme', 'invalid-scheme'],
    ['env://has-authority', 'unexpected-authority'],
    ['keyring://has-authority', 'unexpected-authority'],
    ['literal://no-authority-allowed', 'unexpected-authority'],
    ['ref://has-authority', 'unexpected-authority'],
    ['env:%g0bad', 'invalid-percent-encoding'],
    ['keyring:?only-query', 'empty-path'],
  ] as const)('rejects %s as %s', (input, kind) => {
    let err: SecretRefParseError | undefined;
    try {
      parseSecretRef(input);
    } catch (e) {
      err = e as SecretRefParseError;
    }
    expect(err).toBeInstanceOf(SecretRefParseError);
    expect(err?.kind).toBe(kind);
    expect(err?.input).toBe(input);
  });

  it('rejects naked strings via assertNotNakedString', () => {
    expect(() => assertNotNakedString('plain-value')).toThrow(SecretRefParseError);
    expect(() => assertNotNakedString(':abc')).toThrow(SecretRefParseError);
  });

  it('parseOrAssert succeeds on URIs', () => {
    expect(() => parseOrAssert('env:OPENAI')).not.toThrow();
  });

  it('parseSecretRef rejects non-string input', () => {
    expect(() => parseSecretRef(42 as unknown as string)).toThrow(SecretRefParseError);
  });
});

describe('parseAuthority', () => {
  it('returns undefined for empty authority', () => {
    expect(parseAuthority('')).toBeUndefined();
  });

  it('parses host', () => {
    expect(parseAuthority('example.com')).toEqual({ host: 'example.com' });
  });

  it('parses host:port', () => {
    expect(parseAuthority('example.com:8200')).toEqual({ host: 'example.com', port: 8200 });
  });

  it('parses userinfo@host:port', () => {
    expect(parseAuthority('alice:secret@example.com:8200')).toEqual({
      userinfo: 'alice:secret',
      host: 'example.com',
      port: 8200,
    });
  });

  it('parses IPv6 host', () => {
    expect(parseAuthority('[::1]:8200')).toEqual({ host: '[::1]', port: 8200 });
  });

  it('rejects invalid port', () => {
    expect(() => parseAuthority('host:abc')).toThrow(SecretRefParseError);
    expect(() => parseAuthority('host:99999')).toThrow(SecretRefParseError);
  });

  it('rejects unterminated IPv6 host', () => {
    expect(() => parseAuthority('[::1')).toThrow(SecretRefParseError);
  });
});

describe('getQueryParamRequired', () => {
  it('returns the value when present', () => {
    const ref = parseSecretRef('keyring:foo?service=bar');
    expect(getQueryParamRequired(ref, 'service')).toBe('bar');
  });

  it('throws when the parameter is missing', () => {
    const ref = parseSecretRef('keyring:foo');
    expect(() => getQueryParamRequired(ref, 'service')).toThrow(SecretRefParseError);
  });
});

describe('validateSecretRefs', () => {
  it('reports OK when every Ref field parses against a known scheme', () => {
    const cfg = {
      providers: {
        openai: { apiKeyRef: 'keyring:openai_api_key' },
        anthropic: { apiKeyRef: 'env:ANTHROPIC_API_KEY' },
      },
    };
    const result = validateSecretRefs(cfg);
    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('flags unknown schemes', () => {
    const cfg = { providers: { openai: { apiKeyRef: 'vualt://typo' } } };
    const result = validateSecretRefs(cfg);
    expect(result.ok).toBe(false);
    expect(result.issues[0]?.error.kind).toBe('unknown-scheme');
  });

  it('refuses literal: by default', () => {
    const cfg = { apiKeyRef: 'literal:sk-shhh' };
    const result = validateSecretRefs(cfg);
    expect(result.ok).toBe(false);
    expect(result.issues).toHaveLength(1);
  });

  it('accepts literal: when allowLiteral=true', () => {
    const cfg = { apiKeyRef: 'literal:sk-shhh' };
    const result = validateSecretRefs(cfg, { allowLiteral: true });
    expect(result.ok).toBe(true);
  });

  it('walks deeply nested objects and arrays', () => {
    const cfg = {
      tools: [{ secretsAllowed: ['k1'], apiKeyRef: 'env:K1' }, { apiKeyRef: 'keyring:k2' }],
    };
    const result = validateSecretRefs(cfg);
    expect(result.ok).toBe(true);
  });

  it('reports the path of every offending field', () => {
    const cfg = {
      tools: [{ tokenRef: 'env:K1' }, { tokenRef: 'invalid' }],
    };
    const result = validateSecretRefs(cfg);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]?.path).toEqual(['tools', 1, 'tokenRef']);
  });

  it('handles cyclic objects without infinite recursion', () => {
    const cfg: Record<string, unknown> = { apiKeyRef: 'env:K' };
    cfg.self = cfg;
    expect(() => validateSecretRefs(cfg)).not.toThrow();
  });

  it('respects custom field matchers', () => {
    const cfg = { secretToken: 'env:KEY' };
    const result = validateSecretRefs(cfg, {
      fieldNameMatcher: (k) => k === 'secretToken',
    });
    expect(result.ok).toBe(true);
  });
});

describe('describeParseErrorKind', () => {
  it.each([
    'empty-input',
    'malformed-uri',
    'invalid-scheme',
    'unknown-scheme',
    'missing-authority',
    'unexpected-authority',
    'empty-path',
    'invalid-percent-encoding',
    'naked-string',
  ] as const)('produces a non-empty description for %s', (kind) => {
    expect(describeParseErrorKind(kind).length).toBeGreaterThan(0);
  });
});

describe('property: parseSecretRef round-trips', () => {
  it('parses every {scheme:path} combination', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          ...BUILTIN_SCHEMES.filter((s) => s !== 'vault' && s !== 'file' && s !== 'encrypted-file'),
        ),
        fc.stringMatching(/^[A-Za-z0-9_~][A-Za-z0-9_.~-]{0,32}$/),
        (scheme, path) => {
          const ref = parseSecretRef(`${scheme}:${path}`);
          expect(ref.scheme).toBe(scheme);
          expect(ref.path).toBe(path);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// --- SPL-15 — registered resolver schemes are known schemes --------------------

describe('SPL-15 — validateSecretRefs consults the live resolver registry', () => {
  it('does not flag a scheme registered via registerResolver as unknown', async () => {
    const { registerResolver, unregisterResolver } = await import(
      '../../src/secrets/resolvers/index.js'
    );
    registerResolver({
      scheme: 'op',
      resolve: async () => null,
    } as never);
    try {
      // Negative control: an UNregistered scheme on the same key shape is
      // flagged — proving the matcher sees the field at all.
      const control = validateSecretRefs({ apiKeyRef: 'nope://vault/item' });
      expect(control.ok).toBe(false);
      const result = validateSecretRefs({ apiKeyRef: 'op://vault/item/field' });
      expect(result.ok).toBe(true); // documented: BUILTIN + registered schemes
      expect(result.issues).toHaveLength(0);
    } finally {
      unregisterResolver('op');
    }
  });
});
