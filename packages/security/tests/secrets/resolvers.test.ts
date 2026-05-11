import { mkdtempSync, rmSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  _resetFileResolverWarningsForTesting,
  _resetLiteralResolverForTesting,
  _resetResolversForTesting,
  _setKeyringEntryCtorForTesting,
  installBuiltinResolvers,
  isLiteralAllowed,
  LiteralSecretsForbiddenError,
  registerResolver,
  resolveSecret,
  SecretAccessDeniedError,
  SecretResolutionError,
  SecretValue,
  setLiteralAllowed,
  setRefStoreLookup,
  setVaultAdapter,
  UnknownSchemeError,
} from '../../src/secrets/index.js';

beforeEach(() => {
  _resetResolversForTesting();
  installBuiltinResolvers();
  _resetLiteralResolverForTesting();
  _resetFileResolverWarningsForTesting();
});

afterEach(() => {
  setRefStoreLookup(undefined);
  setVaultAdapter(undefined);
  delete process.env.GRAPHORIN_ALLOW_LITERAL_SECRETS;
  delete process.env.GRAPHORIN_ALLOW_LITERAL_SECRETS_IN_PRODUCTION;
});

describe('env: resolver', () => {
  it('reads from process.env', async () => {
    process.env.MY_TEST_KEY = 'sk-from-env';
    try {
      const value = await resolveSecret('env:MY_TEST_KEY');
      expect(await value.use((raw) => raw)).toBe('sk-from-env');
      expect(value.source).toEqual({ resolver: 'env', ref: 'env:MY_TEST_KEY' });
    } finally {
      delete process.env.MY_TEST_KEY;
    }
  });

  it('throws when env var missing and no default provided', async () => {
    delete process.env.NEVER_SET_KEY;
    await expect(resolveSecret('env:NEVER_SET_KEY')).rejects.toThrow(SecretResolutionError);
  });

  it('honours ?default fallback', async () => {
    delete process.env.NEVER_SET_KEY;
    const value = await resolveSecret('env:NEVER_SET_KEY?default=fallback');
    expect(value.reveal()).toBe('fallback');
  });
});

describe('file: resolver', () => {
  let workDir: string;
  beforeEach(async () => {
    workDir = mkdtempSync(join(tmpdir(), 'graphorin-file-'));
  });
  afterEach(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  it('reads a UTF-8 file and trims the trailing newline', async () => {
    const path = join(workDir, 'secret.txt');
    await writeFile(path, 'hello-world\n', { mode: 0o600 });
    const value = await resolveSecret(`file://${path}`);
    expect(value.reveal()).toBe('hello-world');
  });

  it('decodes percent-encoded paths', async () => {
    const dir = join(workDir, 'dir with space');
    await mkdir(dir);
    const path = join(dir, 'secret');
    await writeFile(path, 'pct-encoded', { mode: 0o600 });
    const ref = `file://${path.replace(/ /g, '%20')}`;
    const value = await resolveSecret(ref);
    expect(value.reveal()).toBe('pct-encoded');
  });

  it('throws SecretResolutionError when the file is missing', async () => {
    await expect(resolveSecret(`file://${workDir}/missing`)).rejects.toThrow(SecretResolutionError);
  });
});

describe('literal: resolver triple-gating', () => {
  it('refuses without any of the gates', async () => {
    await expect(resolveSecret('literal:sk-test')).rejects.toThrow(LiteralSecretsForbiddenError);
  });

  it('refuses when only the env gate is set', async () => {
    process.env.GRAPHORIN_ALLOW_LITERAL_SECRETS = '1';
    await expect(resolveSecret('literal:sk-test')).rejects.toThrow(LiteralSecretsForbiddenError);
  });

  it('refuses when only the config gate is set', async () => {
    setLiteralAllowed(true);
    await expect(resolveSecret('literal:sk-test')).rejects.toThrow(LiteralSecretsForbiddenError);
  });

  it('accepts when both env + config gates are set in non-production', async () => {
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    process.env.GRAPHORIN_ALLOW_LITERAL_SECRETS = '1';
    setLiteralAllowed(true);
    try {
      const value = await resolveSecret('literal:sk-test');
      expect(value.reveal()).toBe('sk-test');
    } finally {
      process.env.NODE_ENV = prevEnv;
    }
  });

  it('refuses in production unless GRAPHORIN_ALLOW_LITERAL_SECRETS_IN_PRODUCTION=1', async () => {
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    process.env.GRAPHORIN_ALLOW_LITERAL_SECRETS = '1';
    setLiteralAllowed(true);
    try {
      await expect(resolveSecret('literal:sk-test')).rejects.toThrow(LiteralSecretsForbiddenError);
      process.env.GRAPHORIN_ALLOW_LITERAL_SECRETS_IN_PRODUCTION = '1';
      const value = await resolveSecret('literal:sk-test');
      expect(value.reveal()).toBe('sk-test');
    } finally {
      process.env.NODE_ENV = prevEnv;
    }
  });

  it('isLiteralAllowed returns the reasons it would refuse', () => {
    delete process.env.GRAPHORIN_ALLOW_LITERAL_SECRETS;
    const status = isLiteralAllowed();
    expect(status.allowed).toBe(false);
    expect(status.reasons.length).toBeGreaterThan(0);
  });

  // Suppress the WARN-once console message during the assertion; we
  // only check that the resolver returns the expected SecretValue.
});

describe('keyring: resolver', () => {
  it('throws SecretResolutionError when the keyring has no entry', async () => {
    const fakeStore = new Map<string, string>();
    _setKeyringEntryCtorForTesting(
      class {
        constructor(
          public service: string,
          public account: string,
        ) {}
        getPassword(): string | null {
          return fakeStore.get(`${this.service}/${this.account}`) ?? null;
        }
        setPassword(value: string): void {
          fakeStore.set(`${this.service}/${this.account}`, value);
        }
        deletePassword(): boolean {
          return fakeStore.delete(`${this.service}/${this.account}`);
        }
      } as never,
    );
    try {
      await expect(resolveSecret('keyring:does-not-exist')).rejects.toThrow(SecretResolutionError);
    } finally {
      _setKeyringEntryCtorForTesting(null);
    }
  });

  it('returns a wrapped value when present', async () => {
    const fakeStore = new Map<string, string>();
    fakeStore.set('graphorin/openai_api_key', 'sk-from-keyring');
    _setKeyringEntryCtorForTesting(
      class {
        constructor(
          public service: string,
          public account: string,
        ) {}
        getPassword(): string | null {
          return fakeStore.get(`${this.service}/${this.account}`) ?? null;
        }
        setPassword(_value: string): void {}
        deletePassword(): boolean {
          return false;
        }
      } as never,
    );
    try {
      const value = await resolveSecret('keyring:openai_api_key');
      expect(value.reveal()).toBe('sk-from-keyring');
    } finally {
      _setKeyringEntryCtorForTesting(null);
    }
  });
});

describe('ref: resolver', () => {
  it('routes through the active store lookup', async () => {
    setRefStoreLookup(async (key) => {
      if (key === 'openai_api_key') {
        return SecretValue.fromString('sk-from-store');
      }
      return null;
    });
    const value = await resolveSecret('ref:openai_api_key');
    expect(value.reveal()).toBe('sk-from-store');
  });

  it('throws when no lookup is wired', async () => {
    setRefStoreLookup(undefined);
    await expect(resolveSecret('ref:openai_api_key')).rejects.toThrow(SecretResolutionError);
  });

  it('throws SecretResolutionError when the store has no value', async () => {
    setRefStoreLookup(async () => null);
    await expect(resolveSecret('ref:missing')).rejects.toThrow(SecretResolutionError);
  });
});

describe('vault: resolver', () => {
  it('routes through the active adapter when registered', async () => {
    setVaultAdapter(async () => SecretValue.fromString('vault-secret'));
    const value = await resolveSecret('vault:secret/data/myapp#api_key');
    expect(value.reveal()).toBe('vault-secret');
  });

  it('throws when no adapter is registered', async () => {
    setVaultAdapter(undefined);
    await expect(resolveSecret('vault:secret/data/myapp#api_key')).rejects.toThrow(
      SecretResolutionError,
    );
  });
});

describe('resolveSecret dispatcher', () => {
  it('throws UnknownSchemeError for unknown schemes', async () => {
    await expect(resolveSecret('unknown-scheme:foo')).rejects.toThrow(UnknownSchemeError);
  });

  it('rewraps unexpected resolver errors as SecretResolutionError', async () => {
    registerResolver({
      scheme: 'broken',
      async resolve() {
        throw new RangeError('boom');
      },
    });
    await expect(resolveSecret('broken:foo')).rejects.toBeInstanceOf(RangeError);
  });

  it('forwards typed SecretResolutionError unchanged', async () => {
    registerResolver({
      scheme: 'broken',
      async resolve() {
        throw new SecretResolutionError('broken', 'broken:foo', 'expected error');
      },
    });
    await expect(resolveSecret('broken:foo')).rejects.toThrow(SecretResolutionError);
  });

  it('forwards typed SecretAccessDeniedError', async () => {
    registerResolver({
      scheme: 'denied',
      async resolve() {
        throw new SecretAccessDeniedError('k', 'tool', []);
      },
    });
    await expect(resolveSecret('denied:foo')).rejects.toBeInstanceOf(SecretAccessDeniedError);
  });
});
