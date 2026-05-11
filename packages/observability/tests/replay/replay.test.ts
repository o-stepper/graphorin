import { describe, expect, it } from 'vitest';

import type { SpanRecord } from '../../src/exporters/index.js';
import { createRedactionValidator } from '../../src/redaction/index.js';
import { createReplay, type ReplayAuditEvent } from '../../src/replay/index.js';

function record(overrides: Partial<SpanRecord>): SpanRecord {
  return {
    type: 'agent.run',
    id: overrides.id ?? 'span',
    traceId: overrides.traceId ?? 'trace',
    name: 'agent.run',
    startUnixNano: 1,
    endUnixNano: 2,
    status: 'ok',
    attributes: overrides.attributes ?? {},
    events: overrides.events ?? [],
    ...(overrides.sensitivityByAttribute === undefined
      ? {}
      : { sensitivityByAttribute: overrides.sensitivityByAttribute }),
    ...(overrides.parentId === undefined ? {} : { parentId: overrides.parentId }),
  };
}

describe('@graphorin/observability/replay', () => {
  it('yields sanitized events by default', async () => {
    const validator = createRedactionValidator({ minTier: 'internal' });
    const replay = createReplay({ validator });
    const events: string[] = [];
    for await (const event of replay.run({
      source: [record({ id: 'a', attributes: { 'tool.input': 'alice@example.com' } })],
      target: 'session-test',
    })) {
      events.push(event.type);
      if (event.type === 'replay.event') {
        expect(event.sanitized).toBe(true);
        const text = String(event.span.attributes['tool.input']);
        expect(text).not.toContain('alice@example.com');
      }
    }
    expect(events).toEqual(['replay.start', 'replay.event', 'replay.end']);
  });

  it('skips records when an attribute exceeds the floor', async () => {
    const validator = createRedactionValidator({ minTier: 'public' });
    const replay = createReplay({ validator });
    const events: string[] = [];
    for await (const event of replay.run({
      source: [
        record({
          id: 'a',
          attributes: { secret: 'top secret' },
          sensitivityByAttribute: { secret: 'secret' },
        }),
      ],
      target: 'session-test',
    })) {
      events.push(event.type);
    }
    expect(events).toContain('replay.skipped');
  });

  it('denies raw mode when canReadRaw returns false', async () => {
    const replay = createReplay({ canReadRaw: () => false });
    const seen: string[] = [];
    for await (const event of replay.run({
      source: [record({ id: 'a' })],
      target: 'session-test',
      mode: 'raw',
    })) {
      seen.push(event.type);
    }
    expect(seen).toContain('replay.skipped');
    expect(seen).toContain('replay.end');
  });

  it('emits an audit event for every replay invocation', async () => {
    const audit: ReplayAuditEvent[] = [];
    const replay = createReplay({
      audit: { emit: (event) => audit.push(event) },
    });
    for await (const _ of replay.run({
      source: [record({ id: 'a' })],
      target: 'session-test',
    })) {
      // consume
    }
    expect(audit).toHaveLength(1);
    expect(audit[0]?.action).toBe('trace.replay.accessed');
    expect(audit[0]?.decision).toBe('success');
    expect(audit[0]?.metadata.eventCount).toBe(1);
  });

  it('starts emission only once fromSpanId is reached', async () => {
    const replay = createReplay();
    const ids: string[] = [];
    for await (const event of replay.run({
      source: [record({ id: 'a' }), record({ id: 'b' }), record({ id: 'c' })],
      target: 'sess',
      fromSpanId: 'b',
    })) {
      if (event.type === 'replay.event') ids.push(event.span.id);
    }
    expect(ids).toEqual(['b', 'c']);
  });

  it('passes raw records through when allowed', async () => {
    const audit: ReplayAuditEvent[] = [];
    const replay = createReplay({
      audit: { emit: (e) => audit.push(e) },
      canReadRaw: () => true,
    });
    let payload: SpanRecord | null = null;
    for await (const event of replay.run({
      source: [
        record({
          id: 'a',
          attributes: { 'tool.input': 'alice@example.com' },
        }),
      ],
      target: 'sess',
      mode: 'raw',
    })) {
      if (event.type === 'replay.event') payload = event.span;
    }
    expect(payload?.attributes['tool.input']).toBe('alice@example.com');
    expect(audit[0]?.metadata.mode).toBe('raw');
  });
});
