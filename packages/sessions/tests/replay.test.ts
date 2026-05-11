import type { SpanRecord } from '@graphorin/observability/exporters';
import { describe, expect, it } from 'vitest';
import type { ToolCallRecord } from '../src/cassette/types.js';
import { ReplayAccessDeniedError } from '../src/errors/index.js';
import { createSessionManager } from '../src/index.js';
import { createSessionReplayer } from '../src/replay/index.js';
import { InMemoryMemorySessionFacade, InMemorySessionStore } from './fixtures/in-memory-stores.js';

function makeSpan(id: string, sensitivity: 'public' | 'internal' = 'public'): SpanRecord {
  return {
    id,
    traceId: 'trace-1',
    name: 'agent.run',
    type: 'agent.run',
    startUnixNano: 0,
    endUnixNano: 1,
    status: { code: 'OK' as const },
    attributes: {},
    events: [],
    sensitivityByAttribute:
      sensitivity === 'public' ? { 'gen_ai.prompt': 'public' } : { 'gen_ai.prompt': 'internal' },
  } as unknown as SpanRecord;
}

describe('Session replayer', () => {
  it('emits replay.start / replay.end markers via observability', async () => {
    const replayer = createSessionReplayer();
    const events = [];
    for await (const event of replayer.run({
      target: 'session:s-1',
      traceSource: [makeSpan('span-1')],
    })) {
      events.push(event);
    }
    expect(events[0]?.type).toBe('replay.start');
    expect(events[events.length - 1]?.type).toBe('replay.end');
  });

  it('throws ReplayAccessDeniedError when raw access is denied', async () => {
    const replayer = createSessionReplayer({
      canReadRaw: () => false,
    });
    const iter = replayer.run({
      target: 'session:s-1',
      traceSource: [makeSpan('span-1')],
      raw: true,
    });
    await expect(
      (async () => {
        for await (const _e of iter) void _e;
      })(),
    ).rejects.toThrow(ReplayAccessDeniedError);
  });

  it('Session.replay({...}) writes audit rows for requested + completed', async () => {
    let __id = 0;
    const idFactory = (prefix: string): string => {
      __id += 1;
      return `${prefix}-${String(__id).padStart(4, '0')}`;
    };
    const fixedNow = (): number => Date.parse('2026-05-08T10:00:00Z');
    const store = new InMemorySessionStore();
    const memory = new InMemoryMemorySessionFacade(fixedNow);
    const manager = createSessionManager({ store, memory, now: fixedNow, newId: idFactory });
    const session = await manager.create({ userId: 'u-1', agentId: 'main' });
    const events: { type: string }[] = [];
    for await (const event of session.replay({ traceSource: [makeSpan('span-1')] })) {
      events.push(event);
    }
    const replayAudit = store.auditEntries.filter((e) => e.action.startsWith('session.replay.'));
    expect(replayAudit.some((e) => e.action === 'session.replay.requested')).toBe(true);
    expect(replayAudit.some((e) => e.action === 'session.replay.completed')).toBe(true);
  });

  it('drops secret-tagged content under sanitized replay', async () => {
    const replayer = createSessionReplayer();
    const events: { type: string }[] = [];
    for await (const event of replayer.run({
      target: 'session:s-1',
      traceSource: [makeSpan('span-secret', 'internal')],
      minSensitivity: 'public',
    })) {
      events.push(event);
    }
    // The internal-sensitivity span is dropped under minSensitivity='public'.
    expect(events.some((e) => e.type === 'replay.skipped')).toBe(true);
  });

  it('emits cassette substitution events after the trace replay completes', async () => {
    const replayer = createSessionReplayer();
    const cassetteRecord: ToolCallRecord = {
      kind: 'tool-call',
      stepNumber: 1,
      toolCallId: 'tc-1',
      toolName: 'pure',
      sideEffectClass: 'pure',
      args: { q: 'a' },
      output: { ok: true },
      status: 'completed',
      durationMs: 1,
      agentId: 'main',
      timestampIso: '2026-05-08T10:00:00Z',
    };
    const events: { type: string }[] = [];
    for await (const event of replayer.run({
      target: 'session:s-1',
      traceSource: [],
      cassette: { kind: 'inline', records: [cassetteRecord] },
      toolReplayMode: 'recorded',
    })) {
      events.push(event);
    }
    const types = events.map((e) => e.type);
    expect(types).toContain('replay.start');
    expect(types).toContain('replay.end');
    expect(types).toContain('tool.cassette.replay.substituted');
    // Order property: cassette events are after replay.end.
    const replayEndIdx = types.indexOf('replay.end');
    const cassetteIdx = types.indexOf('tool.cassette.replay.substituted');
    expect(cassetteIdx).toBeGreaterThan(replayEndIdx);
  });
});
