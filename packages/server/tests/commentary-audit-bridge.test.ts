/**
 * IP-21: the delivery-commentary sanitizer's audit decisions must land in the
 * audit chain. Covers the translate, the late-bound forwarding sink, and the
 * end-to-end path where a WS dispatcher sanitizes a frame and the decision is
 * written through the audit-bridge sink.
 */

import type { ServerMessage } from '@graphorin/protocol';
import type { AuditDb, StoredAuditEntry } from '@graphorin/security/audit';
import { parseScope } from '@graphorin/security/auth';
import { describe, expect, it } from 'vitest';

import {
  bridgeCommentaryToAudit,
  COMMENTARY_AUDIT_ACTION,
  commentaryDecisionToAuditInput,
  createLateBoundCommentarySink,
  type DeliveryCommentaryDecision,
  type DeliveryCommentarySink,
} from '../src/commentary/index.js';
import { createWsDispatcher } from '../src/ws/dispatcher.js';

class InMemoryAuditDb implements AuditDb {
  readonly binding = 'in-memory' as const;
  readonly path = ':memory:';
  readonly entries: StoredAuditEntry[] = [];
  async insert(entry: StoredAuditEntry): Promise<StoredAuditEntry> {
    this.entries.push(entry);
    return entry;
  }
  async latest(): Promise<StoredAuditEntry | undefined> {
    return this.entries.at(-1);
  }
  async *iterate(): AsyncIterable<StoredAuditEntry> {
    for (const e of this.entries) yield e;
  }
  async count(): Promise<number> {
    return this.entries.length;
  }
  async deleteUpTo(threshold: number): Promise<number> {
    const before = this.entries.length;
    while (this.entries.length > 0 && (this.entries[0]?.seq ?? 0) <= threshold) {
      this.entries.shift();
    }
    return before - this.entries.length;
  }
  async replaceEntry(entry: StoredAuditEntry): Promise<void> {
    const idx = this.entries.findIndex((e) => e.seq === entry.seq);
    if (idx >= 0) this.entries[idx] = entry;
  }
  async close(): Promise<void> {}
}

function sampleDecision(): DeliveryCommentaryDecision {
  return {
    transport: 'ws',
    boundary: 'event-emission',
    policy: 'wrap',
    applied: true,
    reasons: ['tool.execute.end-payload-signature'],
    matchedPattern: 'tool.execute.end-payload-signature',
    sha256OfBefore: 'a'.repeat(64),
    sha256OfAfter: 'b'.repeat(64),
    eventType: 'tool.execute.end',
  };
}

const LEAK_TEXT =
  'Done {"type":"tool.execute.end","toolCallId":"x","result":{"webhook_url":"https://hooks.slack.com/secret"}}';

describe('IP-21 — commentary audit bridge', () => {
  it('translates a sanitization decision into an audit entry input', () => {
    const input = commentaryDecisionToAuditInput(sampleDecision());
    expect(input.action).toBe(COMMENTARY_AUDIT_ACTION);
    expect(input.target).toBe('ws:tool.execute.end');
    expect(input.decision).toBe('success');
    expect(input.actor).toEqual({ kind: 'system', id: 'graphorin/server' });
    const meta = input.metadata as Record<string, unknown>;
    expect(meta.policy).toBe('wrap');
    expect(meta.sha256OfBefore).toBe('a'.repeat(64));
    expect(meta.sha256OfAfter).toBe('b'.repeat(64));
  });

  it('the late-bound sink forwards decisions only after bind()', () => {
    const recorded: DeliveryCommentaryDecision[] = [];
    const target: DeliveryCommentarySink = { onDecision: (d) => recorded.push(d) };
    const late = createLateBoundCommentarySink();

    late.onDecision(sampleDecision()); // unbound ⇒ dropped, never throws
    expect(recorded).toHaveLength(0);

    late.bind(target);
    late.onDecision(sampleDecision()); // bound ⇒ forwarded
    expect(recorded).toHaveLength(1);
  });

  it('writes a real WS sanitization decision into the audit log', async () => {
    const db = new InMemoryAuditDb();
    const sink = bridgeCommentaryToAudit(db);
    const dispatcher = createWsDispatcher({ commentary: { sink } });

    const received: ServerMessage[] = [];
    dispatcher.registerSubscriber({
      id: 'rec-1',
      tokenId: 'tok-1',
      grantedScopes: [parseScope('sessions:read:*')],
      send: (frame) => {
        received.push(frame);
      },
      close: () => {},
    });
    dispatcher.subscribe({
      subscriberId: 'rec-1',
      subject: 'session:abc/events',
      subscriptionId: 'sub-1',
    });
    dispatcher.emit('session:abc/events', {
      type: 'tool.execute.end',
      payload: { toolCallId: 'call-1', durationMs: 4, result: { text: LEAK_TEXT } },
    });

    await sink.drain();

    expect(db.entries).toHaveLength(1);
    const entry = db.entries[0];
    expect(entry?.action).toBe(COMMENTARY_AUDIT_ACTION);
    expect(entry?.target).toBe('ws:tool.execute.end');
    expect(entry?.decision).toBe('success');
    const meta = (entry?.metadata ?? {}) as Record<string, unknown>;
    expect(meta.policy).toBe('wrap');
    expect(typeof meta.sha256OfBefore).toBe('string');
    expect(meta.sha256OfBefore).not.toBe(meta.sha256OfAfter);
  });
});
