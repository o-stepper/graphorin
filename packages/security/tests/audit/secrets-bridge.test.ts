import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { bridgeSecretsToAudit } from '../../src/audit/secrets-bridge.js';
import { verifyAuditChain } from '../../src/audit/verify-chain.js';
import {
  _resetSecretsAuditListenersForTesting,
  emitSecretsAudit,
} from '../../src/secrets/audit-emitter.js';

import { createMemoryAuditDb } from './_helpers.js';

describe('@graphorin/security/audit - secrets-bridge', () => {
  beforeEach(() => {
    _resetSecretsAuditListenersForTesting();
  });

  afterEach(() => {
    _resetSecretsAuditListenersForTesting();
  });

  it('translates a secrets event into an audit-log entry', async () => {
    const db = createMemoryAuditDb();
    const teardown = bridgeSecretsToAudit({ db });
    emitSecretsAudit({
      action: 'secret:get',
      decision: 'success',
      ts: 1_700_000_000_000,
      source: 'KeyringSecretsStore',
      target: 'OPENAI_KEY',
      actor: { kind: 'tool', toolName: 'http.fetch', runId: 'run-7' },
    });
    // The bridge writes asynchronously - wait for the queue to flush.
    await new Promise((resolve) => setImmediate(resolve));
    expect(await db.count()).toBe(1);
    const verify = await verifyAuditChain(db);
    expect(verify.ok).toBe(true);
    teardown();
  });

  it('falls back to a system actor when the event omits one', async () => {
    const db = createMemoryAuditDb();
    bridgeSecretsToAudit({ db });
    emitSecretsAudit({
      action: 'secrets:downgrade',
      decision: 'success',
      ts: 1_700_000_000_000,
      source: 'createSecretsStore',
      target: 'env',
    });
    await new Promise((resolve) => setImmediate(resolve));
    expect(await db.count()).toBe(1);
    let captured = '';
    for await (const entry of db.iterate()) {
      captured = entry.actor.kind;
    }
    expect(captured).toBe('system');
  });

  it('isolates write failures via the onWriteError callback', async () => {
    const failingDb = {
      ...createMemoryAuditDb(),
      async insert(): Promise<never> {
        throw new Error('disk full');
      },
    };
    const errors: unknown[] = [];
    bridgeSecretsToAudit({
      db: failingDb,
      onWriteError: (_event, error) => errors.push(error),
    });
    emitSecretsAudit({
      action: 'secret:get',
      decision: 'success',
      ts: 1,
      source: 'memory',
      target: 'X',
    });
    await new Promise((resolve) => setImmediate(resolve));
    expect(errors.length).toBe(1);
  });

  it('logs a visible warning when a write fails and no onWriteError is configured (SPL-4)', async () => {
    const failingDb = {
      ...createMemoryAuditDb(),
      async insert(): Promise<never> {
        throw new Error('disk full');
      },
    };
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      // No onWriteError - the failure must not be swallowed silently.
      bridgeSecretsToAudit({ db: failingDb });
      emitSecretsAudit({
        action: 'secret:get',
        decision: 'success',
        ts: 1,
        source: 'memory',
        target: 'X',
      });
      await new Promise((resolve) => setImmediate(resolve));
      expect(warn).toHaveBeenCalledTimes(1);
      expect(String(warn.mock.calls[0]?.[0])).toMatch(/audit secrets write failed; entry dropped/);
    } finally {
      warn.mockRestore();
    }
  });

  it('tearing down stops further writes', async () => {
    const db = createMemoryAuditDb();
    const teardown = bridgeSecretsToAudit({ db });
    teardown();
    emitSecretsAudit({
      action: 'secret:get',
      decision: 'success',
      ts: 1,
      source: 'memory',
      target: 'X',
    });
    await new Promise((resolve) => setImmediate(resolve));
    expect(await db.count()).toBe(0);
  });
});
