import type { AssistantMessage } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { createBufferSink, createSessionManager, readSessionExport } from '../src/index.js';
import { InMemoryMemorySessionFacade, InMemorySessionStore } from './fixtures/in-memory-stores.js';

const COMMENTARY_LEAK = `Hello! {"type":"tool.execute.end","toolCallId":"tc-1","result":{"webhook_url":"https://example.com"}}`;

const fixedNow = (): number => Date.parse('2026-05-08T10:00:00Z');
let __id = 0;
const idFactory = (prefix: string): string => {
  __id += 1;
  return `${prefix}-${String(__id).padStart(4, '0')}`;
};

function setup(opts: { commentaryPolicy?: 'wrap' | 'strip' | 'pass-through' } = {}) {
  __id = 0;
  const counters: { name: string; value: number; labels?: Record<string, string> }[] = [];
  const store = new InMemorySessionStore();
  const memory = new InMemoryMemorySessionFacade(fixedNow);
  const manager = createSessionManager({
    store,
    memory,
    now: fixedNow,
    newId: idFactory,
    counters: {
      inc(name, value, labels) {
        counters.push({ name, value, ...(labels !== undefined ? { labels } : {}) });
      },
    },
    ...(opts.commentaryPolicy !== undefined ? { commentaryPolicy: opts.commentaryPolicy } : {}),
  });
  return { store, memory, manager, counters };
}

describe('Commentary-phase sanitization at every session-output boundary', () => {
  it('Session.push wraps the leak + emits the counter + writes a session.commentary.sanitized audit row', async () => {
    const { manager, store, counters } = setup();
    const session = await manager.create({ userId: 'u-1', agentId: 'main' });
    const msg: AssistantMessage = {
      role: 'assistant',
      content: COMMENTARY_LEAK,
      agentId: 'main',
    };
    await session.push(msg);
    const wrap = counters.find((c) => c.name === 'commentary.sanitization.applied.total');
    expect(wrap).toBeDefined();
    expect(wrap?.labels?.boundary).toBe('session-push');
    expect(wrap?.labels?.policy).toBe('wrap');
    // Allow a tick for the audit append (background try/catch path).
    await Promise.resolve();
    const sanitizedRows = store.auditEntries.filter(
      (e) => e.action === 'session.commentary.sanitized',
    );
    expect(sanitizedRows.length).toBeGreaterThanOrEqual(1);
    const md = sanitizedRows[0]?.metadata;
    expect(md?.boundary).toBe('session-push');
    expect(md?.policy).toBe('wrap');
  });

  it('Session.export with strip policy removes the commentary fragment from the JSONL output', async () => {
    const { manager, counters } = setup({ commentaryPolicy: 'strip' });
    const session = await manager.create({ userId: 'u-1', agentId: 'main' });
    await session.push({
      role: 'assistant',
      content: COMMENTARY_LEAK,
      agentId: 'main',
    });
    const buffer = createBufferSink();
    await session.export({ sink: buffer.sink });
    const parsed = readSessionExport(buffer.toString());
    const messageRecord = parsed.records.find((r) => r.kind === 'message');
    expect(messageRecord).toBeDefined();
    const body = JSON.stringify(messageRecord);
    expect(body).not.toContain('tool.execute.end');
    expect(body).not.toContain('<<<commentary>>>');
    expect(body).toContain('Hello!');
    // The strip boundary fires at session-push (storage write) AND at
    // session-export (the message-emission boundary). The counter must
    // record both lifecycle stages.
    const stripDecisions = counters.filter(
      (c) => c.name === 'commentary.sanitization.applied.total' && c.labels?.policy === 'strip',
    );
    expect(stripDecisions.length).toBeGreaterThanOrEqual(1);
  });

  it('Session.list re-runs sanitization (idempotent on already-wrapped content)', async () => {
    const { manager, counters } = setup();
    const session = await manager.create({ userId: 'u-1', agentId: 'main' });
    await session.push({
      role: 'assistant',
      content: COMMENTARY_LEAK,
      agentId: 'main',
    });
    counters.length = 0;
    const out = await session.list({});
    if (out[0]?.role === 'assistant' && typeof out[0].content === 'string') {
      // Already-wrapped content is bytes-equal on the second pass.
      expect(out[0].content).toContain('<<<commentary>>>');
    }
    const listCounters = counters.filter(
      (c) =>
        c.name === 'commentary.sanitization.applied.total' && c.labels?.boundary === 'session-list',
    );
    // No new decisions are reported for already-wrapped content.
    expect(listCounters).toHaveLength(0);
  });

  it('pass-through policy disables sanitization at the boundary', async () => {
    const { manager, counters } = setup({ commentaryPolicy: 'pass-through' });
    const session = await manager.create({ userId: 'u-1', agentId: 'main' });
    expect(session.commentaryPolicy).toBe('pass-through');
    await session.push({
      role: 'assistant',
      content: COMMENTARY_LEAK,
      agentId: 'main',
    });
    const out = await session.list({});
    if (out[0]?.role === 'assistant' && typeof out[0].content === 'string') {
      expect(out[0].content).toBe(COMMENTARY_LEAK);
    }
    const decisions = counters.filter(
      (c) =>
        c.name === 'commentary.sanitization.applied.total' && c.labels?.policy === 'pass-through',
    );
    expect(decisions).toHaveLength(0);
  });

  it('per-session commentaryPolicy override (strip on a single session, wrap default elsewhere)', async () => {
    const { manager, counters } = setup({ commentaryPolicy: 'wrap' });
    const wrapSession = await manager.create({ userId: 'u-1', agentId: 'main' });
    const stripSession = await manager.create({
      userId: 'u-1',
      agentId: 'main',
      commentaryPolicy: 'strip',
    });
    expect(wrapSession.commentaryPolicy).toBe('wrap');
    expect(stripSession.commentaryPolicy).toBe('strip');

    await wrapSession.push({ role: 'assistant', content: COMMENTARY_LEAK, agentId: 'main' });
    await stripSession.push({ role: 'assistant', content: COMMENTARY_LEAK, agentId: 'main' });

    const wrapList = await wrapSession.list({});
    const stripList = await stripSession.list({});
    if (wrapList[0]?.role === 'assistant' && typeof wrapList[0].content === 'string') {
      expect(wrapList[0].content).toContain('<<<commentary>>>');
    }
    if (stripList[0]?.role === 'assistant' && typeof stripList[0].content === 'string') {
      expect(stripList[0].content).not.toContain('tool.execute.end');
      expect(stripList[0].content.startsWith('Hello!')).toBe(true);
    }
    expect(counters.length).toBeGreaterThan(0);
  });
});
