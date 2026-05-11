import { parseScope } from '@graphorin/security/auth';
import { describe, expect, it } from 'vitest';

import { createWsTicketStore } from '../src/ws/ticket.js';

describe('createWsTicketStore', () => {
  it('issues a ticket with the configured TTL and consumes it once', () => {
    const now = 1000;
    const store = createWsTicketStore({
      ttlMs: 5_000,
      now: () => now,
      randomBytes: (n) => new Uint8Array(n).fill(1),
    });
    const ticket = store.issue({
      tokenId: 'tok-1',
      scopes: [parseScope('agents:invoke:abc')],
    });
    expect(ticket.expiresAt).toBe(6_000);
    const consumed = store.consume(ticket.value);
    expect(consumed.ok).toBe(true);
    if (consumed.ok) expect(consumed.ticket.tokenId).toBe('tok-1');
    const reused = store.consume(ticket.value);
    expect(reused.ok).toBe(false);
    if (!reused.ok) expect(reused.reason).toBe('consumed');
  });

  it('rejects expired tickets and prunes them on consume', () => {
    let now = 0;
    const store = createWsTicketStore({
      ttlMs: 1_000,
      now: () => now,
    });
    const ticket = store.issue({ tokenId: 'tok', scopes: [parseScope('agents:read')] });
    now = 5_000;
    const result = store.consume(ticket.value);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('expired');
  });

  it('reports unknown values', () => {
    const store = createWsTicketStore();
    const result = store.consume('does-not-exist');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('unknown');
  });

  it('caps the outstanding ticket count', () => {
    const store = createWsTicketStore({ maxOutstanding: 2 });
    const t1 = store.issue({ tokenId: 'a', scopes: [] });
    store.issue({ tokenId: 'b', scopes: [] });
    store.issue({ tokenId: 'c', scopes: [] });
    expect(store.size()).toBe(2);
    expect(store.consume(t1.value).ok).toBe(false);
  });
});
