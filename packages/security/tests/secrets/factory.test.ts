import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  _resetSecretsFactoryForTesting,
  composeChain,
  createSecretsStore,
  detectHeadless,
  EncryptedFileSecretsStore,
  EnvSecretsStore,
  getActiveSecretsStore,
  getSecretsStoreStatus,
  MemorySecretsStore,
  resolveSecret,
  SecretValue,
  StrictSecretsUnavailableError,
} from '../../src/secrets/index.js';

afterEach(() => {
  _resetSecretsFactoryForTesting();
});

describe('detectHeadless', () => {
  it('returns headless: true when GRAPHORIN_HEADLESS=1', () => {
    const prev = process.env.GRAPHORIN_HEADLESS;
    process.env.GRAPHORIN_HEADLESS = '1';
    try {
      const result = detectHeadless();
      expect(result.headless).toBe(true);
      expect(result.reasons).toContain('GRAPHORIN_HEADLESS=1');
    } finally {
      if (prev === undefined) delete process.env.GRAPHORIN_HEADLESS;
      else process.env.GRAPHORIN_HEADLESS = prev;
    }
  });

  it('reports CI / Kubernetes context when present', () => {
    const prevCi = process.env.CI;
    const prevK8s = process.env.KUBERNETES_SERVICE_HOST;
    process.env.CI = 'true';
    process.env.KUBERNETES_SERVICE_HOST = '10.0.0.1';
    try {
      const result = detectHeadless();
      expect(result.headless).toBe(true);
      expect(result.reasons.some((r) => r.startsWith('CI env'))).toBe(true);
      expect(result.reasons).toContain('Kubernetes context');
    } finally {
      if (prevCi === undefined) delete process.env.CI;
      else process.env.CI = prevCi;
      if (prevK8s === undefined) delete process.env.KUBERNETES_SERVICE_HOST;
      else process.env.KUBERNETES_SERVICE_HOST = prevK8s;
    }
  });
});

describe('composeChain', () => {
  it('returns the only store when length === 1', () => {
    const memory = new MemorySecretsStore();
    const chain = composeChain([memory]);
    expect(chain).toBe(memory);
  });

  it('falls through stores until the first non-null hit', async () => {
    const a = new MemorySecretsStore();
    const b = new MemorySecretsStore();
    await b.set('foo', 'from-b');
    const chain = composeChain([a, b]);
    const value = await chain.get('foo');
    expect(value?.reveal()).toBe('from-b');
  });

  it('writes go to the first store', async () => {
    const a = new MemorySecretsStore();
    const b = new MemorySecretsStore();
    const chain = composeChain([a, b]);
    await chain.set('foo', 'value');
    expect((await a.get('foo'))?.reveal()).toBe('value');
    expect(await b.get('foo')).toBeNull();
  });

  it('list dedupes by key across stores', async () => {
    const a = new MemorySecretsStore();
    const b = new MemorySecretsStore();
    await a.set('foo', '1');
    await b.set('foo', '2');
    await b.set('bar', '3');
    const chain = composeChain([a, b]);
    const meta = await chain.list();
    expect(meta.map((m) => m.key).sort()).toEqual(['bar', 'foo']);
  });
});

describe('createSecretsStore({ kind: ... })', () => {
  it('activates an EnvSecretsStore when explicit', async () => {
    const store = await createSecretsStore({ kind: 'env' });
    expect(store).toBeInstanceOf(EnvSecretsStore);
    const status = getSecretsStoreStatus();
    expect(status?.active).toBe('env');
    expect(getActiveSecretsStore()).toBe(store);
  });

  it('activates a MemorySecretsStore on demand', async () => {
    const store = await createSecretsStore({ kind: 'memory' });
    expect(store).toBeInstanceOf(MemorySecretsStore);
  });

  it('wires the ref: resolver through the active store', async () => {
    const store = await createSecretsStore({ kind: 'memory' });
    await store.set('openai_api_key', 'sk-from-store');
    const value = await resolveSecret('ref:openai_api_key');
    expect(value.reveal()).toBe('sk-from-store');
  });

  it('falls back to env when the chain prefers it', async () => {
    process.env.GRAPHORIN_HEADLESS = '1';
    try {
      const store = await createSecretsStore({
        kind: 'auto',
        fallbackChain: ['encrypted-file', 'env'],
      });
      // encrypted-file requires explicit options → fails first;
      // factory falls through to env.
      expect(store).toBeInstanceOf(EnvSecretsStore);
      const status = getSecretsStoreStatus();
      expect(status?.active).toBe('env');
      expect(status?.downgradedFrom).toBe('encrypted-file');
    } finally {
      delete process.env.GRAPHORIN_HEADLESS;
    }
  });

  it('strict mode throws StrictSecretsUnavailableError when primary unavailable', async () => {
    let workDir: string | undefined;
    try {
      workDir = mkdtempSync(join(tmpdir(), 'graphorin-strict-'));
      await expect(
        createSecretsStore({
          kind: 'encrypted-file',
          strict: true,
          // Intentionally omit `encryptedFile` opts.
        }),
      ).rejects.toThrow(StrictSecretsUnavailableError);
    } finally {
      if (workDir) rmSync(workDir, { recursive: true, force: true });
    }
  });

  it('records the downgrade reason in status', async () => {
    process.env.GRAPHORIN_HEADLESS = '1';
    try {
      await createSecretsStore({
        kind: 'auto',
        fallbackChain: ['encrypted-file', 'env'],
        warn: () => {},
      });
      const status = getSecretsStoreStatus();
      expect(status?.downgradeReason?.length ?? 0).toBeGreaterThan(0);
    } finally {
      delete process.env.GRAPHORIN_HEADLESS;
    }
  });

  it('honours an explicit encrypted-file activation', async () => {
    const workDir = mkdtempSync(join(tmpdir(), 'graphorin-factory-'));
    try {
      const store = await createSecretsStore({
        kind: 'encrypted-file',
        encryptedFile: {
          path: join(workDir, 'secrets.kse'),
          passphrase: SecretValue.fromString('test-passphrase'),
        },
      });
      expect(store).toBeInstanceOf(EncryptedFileSecretsStore);
      await store.set('foo', 'bar');
      expect((await store.get('foo'))?.reveal()).toBe('bar');
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });

  it('strict auto chain throws when nothing is available', async () => {
    process.env.GRAPHORIN_HEADLESS = '1';
    try {
      await expect(
        createSecretsStore({
          kind: 'auto',
          fallbackChain: ['encrypted-file'],
          strict: true,
          warn: () => {},
        }),
      ).rejects.toThrow(StrictSecretsUnavailableError);
    } finally {
      delete process.env.GRAPHORIN_HEADLESS;
    }
  });

  it('throws MissingPeerDependencyError when every chain entry fails (non-strict)', async () => {
    await expect(
      createSecretsStore({
        kind: 'auto',
        fallbackChain: ['encrypted-file'],
        warn: () => {},
      }),
    ).rejects.toThrow(/createSecretsStore\(\{ kind: "auto" \}\)/);
  });

  it('uses the default console.warn when no warn override is supplied', async () => {
    process.env.GRAPHORIN_HEADLESS = '1';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      await createSecretsStore({
        kind: 'auto',
        fallbackChain: ['encrypted-file', 'env'],
      });
      expect(warn).toHaveBeenCalled();
    } finally {
      warn.mockRestore();
      delete process.env.GRAPHORIN_HEADLESS;
    }
  });
});

describe('ChainSecretsStore', () => {
  it('require throws SecretRequiredError when missing', async () => {
    const a = new MemorySecretsStore();
    const b = new MemorySecretsStore();
    const chain = composeChain([a, b]);
    await expect(chain.require('missing')).rejects.toThrow(/Required secret/);
  });

  it('require returns the first hit', async () => {
    const a = new MemorySecretsStore();
    const b = new MemorySecretsStore();
    await b.set('foo', 'value');
    const chain = composeChain([a, b]);
    const value = await chain.require('foo');
    expect(value.reveal()).toBe('value');
  });

  it('delete propagates to every store', async () => {
    const a = new MemorySecretsStore();
    const b = new MemorySecretsStore();
    await a.set('foo', 'x');
    await b.set('foo', 'y');
    const chain = composeChain([a, b]);
    await chain.delete('foo');
    expect(await a.get('foo')).toBeNull();
    expect(await b.get('foo')).toBeNull();
  });
});
