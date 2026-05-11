import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  _getSecretsAuditListenerCountForTesting,
  _resetSecretsAuditListenersForTesting,
  _resetSecretsFactoryForTesting,
  composeChain,
  createSecretsStore,
  EnvSecretsStore,
  emitSecretsAudit,
  MemorySecretsStore,
  onSecretsAudit,
  SecretAccessDeniedError,
  SecretRequiredError,
  type SecretsAuditEvent,
  withToolSecretsContext,
} from '../../src/secrets/index.js';

let events: SecretsAuditEvent[] = [];

beforeEach(() => {
  _resetSecretsAuditListenersForTesting();
  events = [];
  onSecretsAudit((e) => events.push(e));
});

afterEach(() => {
  _resetSecretsAuditListenersForTesting();
  _resetSecretsFactoryForTesting();
  delete process.env.GRAPHORIN_HEADLESS;
});

describe('secretsAuditEmitter', () => {
  it('reports the active listener count', () => {
    expect(_getSecretsAuditListenerCountForTesting()).toBe(1);
    const off = onSecretsAudit(() => {});
    expect(_getSecretsAuditListenerCountForTesting()).toBe(2);
    off();
    expect(_getSecretsAuditListenerCountForTesting()).toBe(1);
  });

  it('isolates faulty listeners', () => {
    onSecretsAudit(() => {
      throw new Error('boom');
    });
    expect(() =>
      emitSecretsAudit({
        action: 'secret:get',
        decision: 'success',
        ts: Date.now(),
        source: 'memory',
        target: 'foo',
      }),
    ).not.toThrow();
  });

  it('is a no-op when no listeners are attached', () => {
    _resetSecretsAuditListenersForTesting();
    expect(_getSecretsAuditListenerCountForTesting()).toBe(0);
    expect(() =>
      emitSecretsAudit({
        action: 'secret:get',
        decision: 'success',
        ts: Date.now(),
        source: 'memory',
        target: 'foo',
      }),
    ).not.toThrow();
  });
});

describe('store-level audit events', () => {
  it('MemorySecretsStore.set / get / delete emit events', async () => {
    const store = new MemorySecretsStore();
    await store.set('foo', 'bar');
    await store.get('foo');
    await store.delete('foo');
    expect(events.map((e) => e.action)).toEqual(['secret:set', 'secret:get', 'secret:delete']);
    expect(events.every((e) => e.source === 'memory' && e.target === 'foo')).toBe(true);
    expect(events.every((e) => e.decision === 'success')).toBe(true);
  });

  it('emits not-found for missing keys', async () => {
    const store = new MemorySecretsStore();
    expect(await store.get('missing')).toBeNull();
    expect(events).toHaveLength(1);
    expect(events[0]?.decision).toBe('not-found');
  });

  it('emits error decision for SecretRequiredError', async () => {
    const store = new MemorySecretsStore();
    await expect(store.require('missing')).rejects.toBeInstanceOf(SecretRequiredError);
    expect(events).toHaveLength(1);
    expect(events[0]?.decision).toBe('not-found');
    expect(events[0]?.action).toBe('secret:require');
  });

  it('emits denied decision for ACL violations and includes actor', async () => {
    const store = new MemorySecretsStore();
    await store.set('email_api_key', 'sk-1');
    events = []; // reset after the set
    await withToolSecretsContext(
      { toolName: 'send_email', secretsAllowed: ['email_api_key'] },
      async () => {
        await expect(store.require('openai_api_key')).rejects.toBeInstanceOf(
          SecretAccessDeniedError,
        );
      },
    );
    expect(events).toHaveLength(1);
    expect(events[0]?.decision).toBe('denied');
    expect(events[0]?.actor).toEqual({ kind: 'tool', toolName: 'send_email' });
  });

  it('EnvSecretsStore emits events with source=env', async () => {
    process.env.MY_TEST_KEY = 'sk-from-env';
    try {
      const store = new EnvSecretsStore();
      await store.get('my_test_key');
    } finally {
      delete process.env.MY_TEST_KEY;
    }
    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events[0]?.source).toBe('env');
    expect(events[0]?.target).toBe('my_test_key');
  });

  it('ChainSecretsStore emits its own audit event with source=chain', async () => {
    const a = new MemorySecretsStore();
    const b = new MemorySecretsStore();
    await b.set('foo', 'bar');
    events = []; // reset after the set
    const chain = composeChain([a, b]);
    await chain.get('foo');
    const chainEvents = events.filter((e) => e.source === 'chain');
    expect(chainEvents).toHaveLength(1);
    expect(chainEvents[0]?.decision).toBe('success');
  });
});

describe('factory downgrade audit', () => {
  it('emits a secrets:downgrade event when the factory falls back', async () => {
    process.env.GRAPHORIN_HEADLESS = '1';
    try {
      await createSecretsStore({
        kind: 'auto',
        fallbackChain: ['encrypted-file', 'env'],
        warn: () => {},
      });
    } finally {
      delete process.env.GRAPHORIN_HEADLESS;
    }
    const downgrade = events.find((e) => e.action === 'secrets:downgrade');
    expect(downgrade).toBeDefined();
    expect(downgrade?.target).toBe('env');
    expect(downgrade?.metadata?.downgradedFrom).toBe('encrypted-file');
    expect(Array.isArray(downgrade?.metadata?.reasons)).toBe(true);
  });

  it('does not emit secrets:downgrade when the primary store activates', async () => {
    await createSecretsStore({ kind: 'env' });
    expect(events.some((e) => e.action === 'secrets:downgrade')).toBe(false);
  });
});
