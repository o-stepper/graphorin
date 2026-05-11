import { parseSecretRef, SecretResolutionError } from '@graphorin/security';
import { describe, expect, it } from 'vitest';

import type { OpCli, OpCliReadOptions, OpCliReadResult } from '../src/op-cli.js';
import { OpCliError } from '../src/op-cli.js';
import { createOnePasswordResolver, normalizeOpUri, onePasswordResolver } from '../src/resolver.js';

interface StubInvocation {
  readonly uri: string;
  readonly options: OpCliReadOptions;
}

function buildStubCli(
  reader: (uri: string, options: OpCliReadOptions) => Promise<OpCliReadResult>,
): { cli: OpCli; calls: StubInvocation[] } {
  const calls: StubInvocation[] = [];
  return {
    calls,
    cli: {
      async read(uri: string, options: OpCliReadOptions = {}): Promise<OpCliReadResult> {
        calls.push({ uri, options });
        return reader(uri, options);
      },
    },
  };
}

describe('createOnePasswordResolver', () => {
  it('forwards a normalized URI to the CLI and wraps the value in a SecretValue', async () => {
    const { cli, calls } = buildStubCli(async () => ({
      value: 'sk-test-1234',
      exitCode: 0,
      durationMs: 10,
    }));
    const resolver = createOnePasswordResolver({ cli });
    const ref = parseSecretRef('op://Personal/OpenAI/api-key');
    const value = await resolver.resolve(ref, undefined);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.uri).toBe('op://personal/openai/api-key');
    const raw = await value.use((s) => s);
    expect(raw).toBe('sk-test-1234');
  });

  it('honours preserveCase: true by forwarding the URI verbatim', async () => {
    const { cli, calls } = buildStubCli(async () => ({
      value: 'val',
      exitCode: 0,
      durationMs: 1,
    }));
    const resolver = createOnePasswordResolver({ cli, preserveCase: true });
    const ref = parseSecretRef('op://Production/Stripe/Live-Secret-Key');
    await resolver.resolve(ref, undefined);
    expect(calls[0]?.uri).toBe('op://Production/Stripe/Live-Secret-Key');
  });

  it('forwards account / serviceAccountToken / connect / timeoutMs / binary overrides to the CLI', async () => {
    const { cli, calls } = buildStubCli(async () => ({
      value: 'val',
      exitCode: 0,
      durationMs: 1,
    }));
    const resolver = createOnePasswordResolver({
      cli,
      account: 'team-graphorin.1password.com',
      serviceAccountToken: 'svc-token',
      connect: { host: 'https://op-connect:8080', token: 'connect-token' },
      timeoutMs: 7777,
      binary: '/usr/local/bin/op',
    });
    const ref = parseSecretRef('op://Personal/OpenAI/api-key');
    await resolver.resolve(ref, undefined);
    expect(calls[0]?.options).toMatchObject({
      account: 'team-graphorin.1password.com',
      serviceAccountToken: 'svc-token',
      connect: { host: 'https://op-connect:8080', token: 'connect-token' },
      timeoutMs: 7777,
      binary: '/usr/local/bin/op',
    });
  });

  it('rejects refs whose scheme is not op:', async () => {
    const resolver = createOnePasswordResolver({
      cli: {
        async read() {
          throw new Error('should not be called');
        },
      },
    });
    const ref = parseSecretRef('env:OPENAI_API_KEY');
    await expect(resolver.resolve(ref, undefined)).rejects.toThrow(SecretResolutionError);
  });

  it('rejects op:// refs without a vault authority', async () => {
    const resolver = createOnePasswordResolver({
      cli: {
        async read() {
          return { value: 'never', exitCode: 0, durationMs: 0 };
        },
      },
    });
    const ref = parseSecretRef('op:///OpenAI/api-key');
    await expect(resolver.resolve(ref, undefined)).rejects.toThrow(/vault authority/);
  });

  it('rejects op:// refs without an item + field path', async () => {
    const resolver = createOnePasswordResolver({
      cli: {
        async read() {
          return { value: 'never', exitCode: 0, durationMs: 0 };
        },
      },
    });
    const ref = parseSecretRef('op://Personal/OpenAI');
    await expect(resolver.resolve(ref, undefined)).rejects.toThrow(/item \+ field/);
  });

  it('rejects empty values returned by the CLI', async () => {
    const { cli } = buildStubCli(async () => ({ value: '', exitCode: 0, durationMs: 0 }));
    const resolver = createOnePasswordResolver({ cli });
    const ref = parseSecretRef('op://Personal/OpenAI/api-key');
    await expect(resolver.resolve(ref, undefined)).rejects.toThrow(/empty value/);
  });

  it('wraps OpCliError in SecretResolutionError with the cause attached', async () => {
    const cause = new OpCliError('signed-out', 'not signed in', { hint: 'op signin' });
    const cli: OpCli = {
      async read() {
        throw cause;
      },
    };
    const resolver = createOnePasswordResolver({ cli });
    const ref = parseSecretRef('op://Personal/OpenAI/api-key');
    let caught: unknown;
    try {
      await resolver.resolve(ref, undefined);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(SecretResolutionError);
    expect((caught as Error).message).toMatch(/op signin/);
    expect((caught as { cause?: unknown }).cause).toBe(cause);
  });

  it('rethrows non-OpCliError errors verbatim', async () => {
    const sentinel = new Error('not even an OpCliError');
    const cli: OpCli = {
      async read() {
        throw sentinel;
      },
    };
    const resolver = createOnePasswordResolver({ cli });
    const ref = parseSecretRef('op://Personal/OpenAI/api-key');
    await expect(resolver.resolve(ref, undefined)).rejects.toBe(sentinel);
  });
});

describe('onePasswordResolver (default-options instance)', () => {
  it('exposes the op scheme', () => {
    expect(onePasswordResolver.scheme).toBe('op');
  });
});

describe('normalizeOpUri', () => {
  it('lowercases the head and preserves query / fragment case', () => {
    expect(normalizeOpUri('op://Vault/Item/Field')).toBe('op://vault/item/field');
    expect(normalizeOpUri('op://Vault/Item/Field?Account=Team')).toBe(
      'op://vault/item/field?Account=Team',
    );
    expect(normalizeOpUri('op://Vault/Item/Field#Section/SubField')).toBe(
      'op://vault/item/field#Section/SubField',
    );
  });
});
