import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  _setKeyringEntryCtorForTesting,
  EncryptedFileSecretsStore,
  EnvSecretsStore,
  KeyringSecretsStore,
  MemorySecretsStore,
  MemoryStoreInProductionError,
  SecretRequiredError,
  SecretValue,
} from '../../src/secrets/index.js';

describe('MemorySecretsStore', () => {
  it('round-trips a string value', async () => {
    const store = new MemorySecretsStore();
    await store.set('openai_api_key', 'sk-test');
    const value = await store.get('openai_api_key');
    expect(value).not.toBeNull();
    expect(await value?.use((raw) => raw)).toBe('sk-test');
  });

  it('preserves createdAt across set updates', async () => {
    const store = new MemorySecretsStore();
    await store.set('foo', 'first');
    const [first] = await store.list();
    await new Promise((r) => setTimeout(r, 5));
    await store.set('foo', 'second');
    const [second] = await store.list();
    expect(first?.createdAt).toBe(second?.createdAt);
    expect(first?.updatedAt).not.toBe(second?.updatedAt);
  });

  it('require() throws when the key is missing', async () => {
    const store = new MemorySecretsStore();
    await expect(store.require('missing')).rejects.toBeInstanceOf(SecretRequiredError);
  });

  it('refuses to start in NODE_ENV=production', () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      expect(() => new MemorySecretsStore()).toThrow(MemoryStoreInProductionError);
    } finally {
      process.env.NODE_ENV = prev;
    }
  });

  it('forceProduction:true overrides the production gate', () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      expect(() => new MemorySecretsStore({ forceProduction: true })).not.toThrow();
    } finally {
      process.env.NODE_ENV = prev;
    }
  });

  it('isolates entries by SessionScope', async () => {
    const store = new MemorySecretsStore();
    await store.set('foo', 'global');
    await store.set('foo', 'alice', { scope: { userId: 'alice' } });
    expect((await store.get('foo'))?.reveal()).toBe('global');
    expect((await store.get('foo', { userId: 'alice' }))?.reveal()).toBe('alice');
  });

  it('list scoped returns only entries inside that scope', async () => {
    const store = new MemorySecretsStore();
    await store.set('a', '1');
    await store.set('b', '2', { scope: { userId: 'alice' } });
    const scoped = await store.list({ userId: 'alice' });
    expect(scoped.map((m) => m.key)).toEqual(['b']);
  });

  it('delete removes the entry', async () => {
    const store = new MemorySecretsStore();
    await store.set('foo', 'bar');
    await store.delete('foo');
    expect(await store.get('foo')).toBeNull();
  });
});

describe('EnvSecretsStore', () => {
  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  it('reads from process.env after uppercasing keys', async () => {
    process.env.OPENAI_API_KEY = 'sk-from-env';
    const store = new EnvSecretsStore();
    const value = await store.get('openai_api_key');
    expect(value?.reveal()).toBe('sk-from-env');
  });

  it('require() throws when missing', async () => {
    const store = new EnvSecretsStore();
    await expect(store.require('openai_api_key')).rejects.toBeInstanceOf(SecretRequiredError);
  });

  it('set is a no-op (with warning) by default', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const store = new EnvSecretsStore();
    await store.set('openai_api_key', 'sk-test');
    expect(process.env.OPENAI_API_KEY).toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('set mutates env when allowMutation:true', async () => {
    const store = new EnvSecretsStore({ allowMutation: true });
    await store.set('openai_api_key', 'sk-test');
    expect(process.env.OPENAI_API_KEY).toBe('sk-test');
    await store.delete('openai_api_key');
    expect(process.env.OPENAI_API_KEY).toBeUndefined();
  });

  it('list returns observed keys with stable shape', async () => {
    const store = new EnvSecretsStore({ allowMutation: true });
    await store.set('foo', 'bar');
    const meta = await store.list();
    expect(meta.map((m) => m.key)).toEqual(['foo']);
  });
});

describe('KeyringSecretsStore', () => {
  it('round-trips through the injected entry constructor', async () => {
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
      const store = new KeyringSecretsStore({ service: 'graphorin' });
      await store.set('openai_api_key', 'sk-from-keyring');
      const value = await store.get('openai_api_key');
      expect(value?.reveal()).toBe('sk-from-keyring');
      const list = await store.list();
      expect(list.map((m) => m.key)).toEqual(['openai_api_key']);
      await store.delete('openai_api_key');
      expect(await store.get('openai_api_key')).toBeNull();
    } finally {
      _setKeyringEntryCtorForTesting(null);
    }
  });
});

describe('EncryptedFileSecretsStore', () => {
  let workDir: string;
  beforeEach(() => {
    workDir = mkdtempSync(join(tmpdir(), 'graphorin-encfile-'));
  });
  afterEach(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  it('round-trips secrets through the AES-256-GCM bundle', async () => {
    const passphrase = SecretValue.fromString('strong-master-passphrase');
    const store = new EncryptedFileSecretsStore({
      path: join(workDir, 'secrets.kse'),
      passphrase,
    });
    await store.set('openai_api_key', 'sk-test');
    expect((await store.get('openai_api_key'))?.reveal()).toBe('sk-test');
    const list = await store.list();
    expect(list.map((m) => m.key)).toEqual(['openai_api_key']);
  });

  it('throws SecretRequiredError on require() when missing', async () => {
    const passphrase = SecretValue.fromString('strong-master-passphrase');
    const store = new EncryptedFileSecretsStore({
      path: join(workDir, 'secrets.kse'),
      passphrase,
    });
    await store.set('foo', 'bar');
    await expect(store.require('missing')).rejects.toBeInstanceOf(SecretRequiredError);
  });

  it('list returns an empty array before the bundle exists', async () => {
    const passphrase = SecretValue.fromString('strong-master-passphrase');
    const store = new EncryptedFileSecretsStore({
      path: join(workDir, 'secrets.kse'),
      passphrase,
    });
    expect(await store.list()).toEqual([]);
  });

  it('rejects a bundle decrypted with the wrong passphrase', async () => {
    const writer = new EncryptedFileSecretsStore({
      path: join(workDir, 'secrets.kse'),
      passphrase: SecretValue.fromString('correct'),
    });
    await writer.set('foo', 'bar');
    const reader = new EncryptedFileSecretsStore({
      path: join(workDir, 'secrets.kse'),
      passphrase: SecretValue.fromString('wrong'),
    });
    await expect(reader.get('foo')).rejects.toThrow(/Authentication tag mismatch/);
  });
});
