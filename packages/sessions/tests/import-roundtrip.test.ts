import { describe, expect, it } from 'vitest';
import { createBufferSink, createSessionManager, readSessionExport } from '../src/index.js';
import { InMemoryMemorySessionFacade, InMemorySessionStore } from './fixtures/in-memory-stores.js';

const fixedNow = (): number => Date.parse('2026-05-08T10:00:00Z');
let __id = 0;
const idFactory = (prefix: string): string => {
  __id += 1;
  return `${prefix}-${String(__id).padStart(4, '0')}`;
};

function setup() {
  __id = 0;
  const store = new InMemorySessionStore();
  const memory = new InMemoryMemorySessionFacade(fixedNow);
  const manager = createSessionManager({ store, memory, now: fixedNow, newId: idFactory });
  return { store, memory, manager };
}

describe('Session export / import round-trip', () => {
  it('exports a session with messages + handoffs and re-imports them into a fresh manager', async () => {
    const sourceA = setup();
    const session = await sourceA.manager.create({
      userId: 'u-1',
      agentId: 'main',
      title: 'Trip planning',
    });
    await session.push({ role: 'user', content: 'Hello' });
    await session.push({
      role: 'assistant',
      content: [{ type: 'text', text: 'Hi back!', causalityChain: ['tool:greet'] }],
      agentId: 'main',
    });
    await session.appendHandoff({
      fromAgentId: 'main',
      toAgentId: 'worker',
      stepNumber: 2,
      reason: 'subtask',
    });
    await sourceA.manager.agents.register('worker', { displayName: 'Worker' });
    const buffer = createBufferSink();
    const footer = await session.export({
      sink: buffer.sink,
      hash: true,
      includeAuditEntries: true,
    });
    expect(footer.messageCount).toBe(2);
    expect(footer.handoffCount).toBe(1);
    expect(footer.checksum).toMatch(/^sha256:[a-f0-9]{64}$/);

    const sourceB = setup();
    const result = await sourceB.manager.importFromString(buffer.toString());
    expect(result.session).not.toBeNull();
    if (result.session !== null) {
      const meta = await result.session.metadata();
      expect(meta.title).toBe('Trip planning');
      const handoffs = await result.session.listHandoffs();
      expect(handoffs).toHaveLength(1);
      const agents = await sourceB.manager.agents.list();
      expect(agents.some((a) => a.id === 'worker')).toBe(true);
    }
  });

  it('preserves stored message id/createdAt and excludes unreferenced agents (RP-5)', async () => {
    let clock = Date.parse('2026-05-08T10:00:00Z');
    const now = (): number => clock;
    const store = new InMemorySessionStore();
    const memory = new InMemoryMemorySessionFacade(now);
    let seq = 0;
    const idf = (p: string): string => `${p}-${String((seq += 1)).padStart(4, '0')}`;
    const manager = createSessionManager({ store, memory, now, newId: idf });
    const session = await manager.create({ userId: 'u-1', agentId: 'main' });
    await session.push({ role: 'user', content: 'hello' });
    await session.push({ role: 'assistant', content: 'hi', agentId: 'main' });
    // An agent registered but never referenced by a message or handoff.
    await manager.agents.register('ghost', { displayName: 'Ghost' });
    // Export happens LATER than the messages were stored.
    clock = Date.parse('2026-06-01T00:00:00.000Z');

    const buffer = createBufferSink();
    await session.export({ sink: buffer.sink });
    const parsed = readSessionExport(buffer.toString());

    const msgs = parsed.records.filter(
      (r): r is typeof r & { messageId: string; createdAt: string } => r.kind === 'message',
    );
    // Stored ids/timestamps survive — not fresh ids or the export wall-clock.
    expect(msgs.map((m) => m.messageId)).toEqual(['msg-1', 'msg-2']);
    expect(msgs[0]?.createdAt).toBe('2026-05-08T10:00:00.000Z');

    const agentIds = parsed.records
      .filter((r): r is typeof r & { id: string } => r.kind === 'agent')
      .map((a) => a.id);
    expect(agentIds).toContain('main'); // referenced by the assistant message
    expect(agentIds).not.toContain('ghost'); // unrelated to this session
  });

  it('preserves causalityChain on MessageContent through export / import', async () => {
    const { manager: managerA } = setup();
    const session = await managerA.create({ userId: 'u-1', agentId: 'main' });
    await session.push({
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: 'Result is here',
          causalityChain: ['tool:slack-notify', 'subagent:research-east'],
        },
      ],
      agentId: 'main',
    });
    const buffer = createBufferSink();
    await session.export({ sink: buffer.sink });

    const { manager: managerB, memory: memoryB } = setup();
    await managerB.importFromString(buffer.toString());
    const stored = memoryB.messages[0]?.message;
    expect(stored?.role).toBe('assistant');
    if (stored?.role === 'assistant' && Array.isArray(stored.content)) {
      const first = stored.content[0];
      if (first?.type === 'text') {
        expect(first.causalityChain).toEqual(['tool:slack-notify', 'subagent:research-east']);
      }
    }
  });
});
