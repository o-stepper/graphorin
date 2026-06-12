import { afterEach, describe, expect, it } from 'vitest';

import {
  _resetWithSecretListenersForTesting,
  computeEffectiveAllowlist,
  enforceSecretAcl,
  getActiveToolSecretsContext,
  MemorySecretsStore,
  onWithSecretAudit,
  SecretAccessDeniedError,
  SecretValue,
  withChildToolSecretsContext,
  withSecret,
  withToolSecretsContext,
} from '../../src/secrets/index.js';

afterEach(() => {
  _resetWithSecretListenersForTesting();
});

describe('per-tool ACL', () => {
  it('returns undefined outside a context', () => {
    expect(getActiveToolSecretsContext()).toBeUndefined();
  });

  it('exposes the active context inside a scope', () => {
    withToolSecretsContext({ toolName: 'sendEmail', secretsAllowed: ['email_api_key'] }, () => {
      const ctx = getActiveToolSecretsContext();
      expect(ctx?.toolName).toBe('sendEmail');
      expect(ctx?.secretsAllowed).toEqual(['email_api_key']);
    });
  });

  it('enforceSecretAcl throws when the key is not allowed', () => {
    withToolSecretsContext({ toolName: 'sendEmail', secretsAllowed: ['email_api_key'] }, () => {
      expect(() => enforceSecretAcl('openai_api_key')).toThrow(SecretAccessDeniedError);
      expect(() => enforceSecretAcl('email_api_key')).not.toThrow();
    });
  });

  it('SecretsStore.require honours the active ACL', async () => {
    const store = new MemorySecretsStore();
    await store.set('email_api_key', 'sk-email');
    await store.set('openai_api_key', 'sk-openai');
    await withToolSecretsContext(
      { toolName: 'sendEmail', secretsAllowed: ['email_api_key'] },
      async () => {
        await expect(store.require('openai_api_key')).rejects.toBeInstanceOf(
          SecretAccessDeniedError,
        );
        const value = await store.require('email_api_key');
        expect(value.reveal()).toBe('sk-email');
      },
    );
  });

  it('AsyncLocalStorage scope nests across awaits', async () => {
    await withToolSecretsContext({ toolName: 'parent', secretsAllowed: ['k1', 'k2'] }, async () => {
      await Promise.resolve();
      const ctx = getActiveToolSecretsContext();
      expect(ctx?.secretsAllowed).toEqual(['k1', 'k2']);
    });
  });

  it('child context intersects with parent (deny-by-default)', () => {
    withToolSecretsContext({ toolName: 'parent', secretsAllowed: ['k1', 'k2'] }, () => {
      withChildToolSecretsContext({ toolName: 'child', secretsAllowed: ['k2', 'k3'] }, () => {
        const ctx = getActiveToolSecretsContext();
        expect(ctx?.toolName).toBe('child');
        expect(ctx?.secretsAllowed).toEqual(['k2']);
        expect(ctx?.parent?.toolName).toBe('parent');
      });
    });
  });

  it('computeEffectiveAllowlist intersects parent + declared', () => {
    expect(
      computeEffectiveAllowlist({ toolName: 't', secretsAllowed: ['a', 'b'] }, ['b', 'c']),
    ).toEqual(['b']);
  });

  it('computeEffectiveAllowlist returns the declared set when no parent', () => {
    expect(computeEffectiveAllowlist(undefined, ['a', 'a', 'b'])).toEqual(['a', 'b']);
  });
});

describe('withSecret(...)', () => {
  it('calls fn with the unwrapped string', async () => {
    const out = await withSecret('hello', (raw) => raw.toUpperCase());
    expect(out).toBe('HELLO');
  });

  it('accepts an existing SecretValue without re-wrapping', async () => {
    const s = SecretValue.fromString('abc');
    const out = await withSecret(s, (raw) => raw);
    expect(out).toBe('abc');
  });

  it('records a single audit event per scope', async () => {
    const events: number[] = [];
    onWithSecretAudit((e) => events.push(e.durationMs));
    await withSecret('hi', () => null);
    expect(events).toHaveLength(1);
  });

  it('audit listeners do not break the access path', async () => {
    onWithSecretAudit(() => {
      throw new Error('boom');
    });
    await expect(withSecret('hi', (raw) => raw)).resolves.toBe('hi');
  });

  it('disposes auto-wrapped secrets after the scope ends', async () => {
    const wrappers: SecretValue[] = [];
    await withSecret('one-shot', (raw) => {
      wrappers.push(SecretValue.fromString(raw));
    });
    expect(wrappers.length).toBe(1);
  });
});

// --- SPL-14 — get() honours the per-tool ACL too -------------------------------

describe('SPL-14 — get() inside a tool scope honours the allowlist', () => {
  it('a denied key reads as null from get() instead of bypassing the ACL', async () => {
    const store = new MemorySecretsStore();
    await store.set('email_api_key', 'k-email');
    await store.set('db_password', 'k-db');
    await withToolSecretsContext(
      { toolName: 'sendEmail', secretsAllowed: ['email_api_key'] },
      async () => {
        const allowed = await store.get('email_api_key');
        expect(allowed).not.toBeNull();
        // The old behaviour: get() skipped enforceSecretAcl entirely —
        // any code holding the raw store read ANY key inside the scope.
        const denied = await store.get('db_password');
        expect(denied).toBeNull();
      },
    );
    // Outside a scope get() is the un-gated host-level read.
    expect(await store.get('db_password')).not.toBeNull();
  });
});
