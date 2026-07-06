/**
 * W-051: tools/MCP audit-bus events must land in the audit chain. Covers
 * the translate, the 'security' allowlist, the 'all' / 'off' policies,
 * and the unsubscribe teardown (the bus is process-global).
 */

import type { AuditDb, StoredAuditEntry } from '@graphorin/security/audit';
import { emitToolAudit, type ToolAuditEvent } from '@graphorin/tools/audit';
import { describe, expect, it } from 'vitest';

import { bridgeToolAuditToAudit, toolAuditEventToAuditInput } from '../src/tools-audit-bridge.js';

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

function flaggedEvent(): ToolAuditEvent {
  return {
    action: 'tool:dataflow:flagged',
    actor: { kind: 'system', id: 'tool-executor' },
    target: 'send_email',
    decision: 'denied',
    ts: 1_720_000_000_000,
    context: { runId: 'run-1', sessionId: 's-1', toolCallId: 'tc-1', stepNumber: 2 },
    metadata: { flow: 'untrusted-to-sink' },
  };
}

describe('W-051 - tools audit bridge', () => {
  it('translates a tool audit event (context split between AuditContext and metadata)', () => {
    const input = toolAuditEventToAuditInput(flaggedEvent());
    expect(input.action).toBe('tool:dataflow:flagged');
    expect(input.target).toBe('send_email');
    expect(input.decision).toBe('denied');
    expect(input.ts).toBe(1_720_000_000_000);
    expect(input.context).toEqual({ runId: 'run-1', sessionId: 's-1' });
    expect(input.metadata).toMatchObject({
      flow: 'untrusted-to-sink',
      toolCallId: 'tc-1',
      stepNumber: 2,
    });
  });

  it("'security' policy writes a dataflow flag but filters execute chatter", async () => {
    const db = new InMemoryAuditDb();
    const bridge = bridgeToolAuditToAudit(db);
    try {
      emitToolAudit(flaggedEvent());
      emitToolAudit({
        action: 'tool:execute:start',
        actor: { kind: 'system', id: 'tool-executor' },
        target: 'web_fetch',
        decision: 'success',
        ts: 1,
      });
      await bridge.drain();
      expect(db.entries).toHaveLength(1);
      expect(db.entries[0]?.action).toBe('tool:dataflow:flagged');
    } finally {
      bridge.stop();
    }
  });

  it("'all' policy also writes execute events; 'off' writes nothing", async () => {
    const all = new InMemoryAuditDb();
    const bridgeAll = bridgeToolAuditToAudit(all, { policy: 'all' });
    try {
      emitToolAudit({
        action: 'tool:execute:end',
        actor: { kind: 'tool', id: 'web_fetch' },
        target: 'web_fetch',
        decision: 'success',
        ts: 2,
      });
      await bridgeAll.drain();
      expect(all.entries).toHaveLength(1);
    } finally {
      bridgeAll.stop();
    }

    const off = new InMemoryAuditDb();
    const bridgeOff = bridgeToolAuditToAudit(off, { policy: 'off' });
    try {
      emitToolAudit(flaggedEvent());
      await bridgeOff.drain();
      expect(off.entries).toHaveLength(0);
    } finally {
      bridgeOff.stop();
    }
  });

  it('stop() unsubscribes - later events never reach the chain', async () => {
    const db = new InMemoryAuditDb();
    const bridge = bridgeToolAuditToAudit(db);
    bridge.stop();
    emitToolAudit(flaggedEvent());
    await bridge.drain();
    expect(db.entries).toHaveLength(0);
  });

  it('chains seq/hash through appendAudit (tamper-evident, not raw inserts)', async () => {
    const db = new InMemoryAuditDb();
    const bridge = bridgeToolAuditToAudit(db);
    try {
      emitToolAudit(flaggedEvent());
      emitToolAudit({ ...flaggedEvent(), target: 'post_webhook' });
      await bridge.drain();
      expect(db.entries).toHaveLength(2);
      expect(db.entries[0]?.seq).toBe(1);
      expect(db.entries[1]?.seq).toBe(2);
      expect(db.entries[1]?.prevHash).toBe(db.entries[0]?.hash);
    } finally {
      bridge.stop();
    }
  });
});
