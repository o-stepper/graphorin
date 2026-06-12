import { describe, expect, it } from 'vitest';
import { SessionNotFoundError } from '../src/errors/index.js';
import { createSessionManager } from '../src/index.js';
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

describe('Session facade', () => {
  it('creates a session and registers the primary agent', async () => {
    const { manager, store } = setup();
    const session = await manager.create({ userId: 'u-1', agentId: 'main' });
    expect(session.id).toBeDefined();
    const meta = await session.metadata();
    expect(meta.userId).toBe('u-1');
    expect(meta.agentId).toBe('main');
    const agents = await store.listAgents();
    expect(agents).toHaveLength(1);
    expect(agents[0]?.id).toBe('main');
  });

  it('push() delegates to memory and is sanitized at the boundary', async () => {
    const { manager, memory } = setup();
    const session = await manager.create({ userId: 'u-1', agentId: 'main' });
    const ref = await session.push({ role: 'user', content: 'Hello' });
    expect(ref.messageId).toMatch(/^msg-/);
    expect(memory.messages).toHaveLength(1);
    expect(memory.messages[0]?.message).toEqual({ role: 'user', content: 'Hello' });
  });

  it('list() delegates to memory and applies session-list sanitization', async () => {
    const { manager } = setup();
    const session = await manager.create({ userId: 'u-1', agentId: 'main' });
    await session.push({ role: 'user', content: 'Hi' });
    await session.push({
      role: 'assistant',
      content: '{"type":"tool.execute.end","toolCallId":"tc-1","result":{"ok":true}}',
      agentId: 'main',
    });
    const out = await session.list({});
    expect(out).toHaveLength(2);
    const second = out[1];
    if (second?.role === 'assistant' && typeof second.content === 'string') {
      expect(second.content).toContain('<<<commentary>>>');
    }
  });

  it('appendHandoff() persists the record + emits an audit row', async () => {
    const { manager, store } = setup();
    const session = await manager.create({ userId: 'u-1', agentId: 'main' });
    const handoff = await session.appendHandoff({
      fromAgentId: 'main',
      toAgentId: 'worker',
      stepNumber: 1,
      reason: 'subtask',
      inputFilter: { kind: 'last-n', meta: { n: 5 } },
      secretsInheritance: 'inherit-allowlist',
      inheritedSecrets: ['OPENAI_KEY'],
    });
    expect(handoff.fromAgentId).toBe('main');
    expect(handoff.toAgentId).toBe('worker');
    const list = await session.listHandoffs();
    expect(list).toHaveLength(1);
    expect(list[0]?.inputFilter?.kind).toBe('last-n');
    const audits = store.auditEntries.filter((e) => e.action === 'session.handoff.appended');
    expect(audits).toHaveLength(1);
  });

  it('handoffsByAgent() filters from / to / both directions', async () => {
    const { manager } = setup();
    const session = await manager.create({ userId: 'u-1', agentId: 'main' });
    await session.appendHandoff({
      fromAgentId: 'main',
      toAgentId: 'a',
      stepNumber: 1,
      at: '2026-05-08T10:00:01Z',
    });
    await session.appendHandoff({
      fromAgentId: 'a',
      toAgentId: 'b',
      stepNumber: 2,
      at: '2026-05-08T10:00:02Z',
    });
    await session.appendHandoff({
      fromAgentId: 'b',
      toAgentId: 'a',
      stepNumber: 3,
      at: '2026-05-08T10:00:03Z',
    });
    const fromA = await session.handoffsByAgent('a', 'from');
    expect(fromA.map((h) => h.toAgentId)).toEqual(['b']);
    const toA = await session.handoffsByAgent('a', 'to');
    expect(toA.map((h) => h.fromAgentId).sort()).toEqual(['b', 'main']);
    const both = await session.handoffsByAgent('a', 'both');
    expect(both).toHaveLength(3);
  });

  it('attachWorkflowRun() and updateWorkflowRunStatus() roundtrip', async () => {
    const { manager } = setup();
    const session = await manager.create({ userId: 'u-1', agentId: 'main' });
    await session.attachWorkflowRun({
      workflowId: 'wf-1',
      threadId: 't-1',
      status: 'running',
    });
    let runs = await session.workflowRuns();
    expect(runs[0]?.status).toBe('running');
    await session.updateWorkflowRunStatus('wf-1', 't-1', 'completed');
    runs = await session.workflowRuns();
    expect(runs[0]?.status).toBe('completed');
  });

  it('close() marks the session closed + writes an audit row', async () => {
    const { manager, store } = setup();
    const session = await manager.create({ userId: 'u-1', agentId: 'main' });
    await session.close();
    const meta = await session.metadata();
    expect(meta.closedAt).toBeDefined();
    const closedAudit = store.auditEntries.find((e) => e.action === 'session.closed');
    expect(closedAudit).toBeDefined();
  });

  it('fork() creates a fresh session and writes a forked audit row', async () => {
    const { manager, store } = setup();
    const session = await manager.create({ userId: 'u-1', agentId: 'main', title: 'Trip' });
    const forked = await session.fork({ title: 'Trip (fork)' });
    expect(forked.id).not.toBe(session.id);
    const forkedAudit = store.auditEntries.find((e) => e.action === 'session.forked');
    expect(forkedAudit).toBeDefined();
    expect((forkedAudit?.metadata as { forkedSessionId?: string })?.forkedSessionId).toBe(
      forked.id,
    );
  });

  it('throws SessionNotFoundError for unknown id', async () => {
    const { manager } = setup();
    await expect(manager.get('does-not-exist')).rejects.toThrow(SessionNotFoundError);
    await expect(manager.find('does-not-exist')).resolves.toBeNull();
  });

  it('listSessions() returns sessions for a scope', async () => {
    const { manager } = setup();
    await manager.create({ userId: 'u-1', agentId: 'main' });
    await manager.create({ userId: 'u-1', agentId: 'main' });
    await manager.create({ userId: 'u-2', agentId: 'main' });
    const u1 = await manager.listSessions({ userId: 'u-1' });
    expect(u1).toHaveLength(2);
    const u2 = await manager.listSessions({ userId: 'u-2' });
    expect(u2).toHaveLength(1);
  });

  it('audit() returns the most recent rows', async () => {
    const { manager } = setup();
    const session = await manager.create({ userId: 'u-1', agentId: 'main' });
    await session.close();
    const rows = await session.audit({ limit: 10 });
    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect((rows[0]?.at ?? '') >= (rows[1]?.at ?? '')).toBe(true);
  });

  it('pruneAudit() removes rows older than the threshold', async () => {
    const { manager, store } = setup();
    const session = await manager.create({ userId: 'u-1', agentId: 'main' });
    await session.close();
    const before = store.auditEntries.length;
    expect(before).toBeGreaterThan(0);
    const pruned = await manager.pruneAudit(Date.now() + 60_000);
    expect(pruned).toBe(before);
    expect(store.auditEntries).toHaveLength(0);
  });

  it('list() filtering by agentId works through the memory facade', async () => {
    const { manager } = setup();
    const session = await manager.create({ userId: 'u-1', agentId: 'main' });
    await session.push({ role: 'user', content: 'q' });
    await session.push({ role: 'assistant', content: 'main reply', agentId: 'main' });
    await session.push({ role: 'assistant', content: 'worker reply', agentId: 'worker' });
    const onlyWorker = await session.list({ agentId: 'worker' });
    expect(onlyWorker).toHaveLength(1);
    if (onlyWorker[0]?.role === 'assistant') {
      expect(onlyWorker[0].agentId).toBe('worker');
    }
  });
});
