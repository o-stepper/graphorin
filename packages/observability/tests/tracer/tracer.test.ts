import { describe, expect, it, vi } from 'vitest';

import {
  createConsoleExporter,
  createOTLPHttpExporter,
  type SpanRecord,
  type TraceExporter,
  withValidation,
} from '../../src/exporters/index.js';
import { UnvalidatedExporterError } from '../../src/redaction/errors.js';
import { asGraphorinSpan, createSampler, createTracer } from '../../src/tracer/index.js';

describe('@graphorin/observability/tracer — createTracer', () => {
  it('rejects un-wrapped exporters when validation is off', () => {
    const exporter = createConsoleExporter({ sink: () => {} });
    expect(() =>
      createTracer({
        exporters: [exporter],
        validation: 'off',
        warnSink: () => {},
      }),
    ).toThrow(UnvalidatedExporterError);
  });

  it('auto-wraps exporters with the tracer-managed validator', async () => {
    const records: SpanRecord[] = [];
    const exporter = mockExporter((record) => records.push(record));
    const tracer = createTracer({ exporters: [exporter], warnSink: () => {} });
    await tracer.span({ type: 'agent.run' }, async () => undefined);
    await tracer.shutdown();
    expect(records).toHaveLength(1);
    expect(records[0]?.status).toBe('ok');
  });

  it('RP-18: a framework span with an untagged attribute reaches the exporter (stripped, not dropped)', async () => {
    const records: SpanRecord[] = [];
    const exporter = mockExporter((record) => records.push(record));
    // Default validation floor is 'public'. The untagged `memory.scope.user_id`
    // attribute defaults to the 'internal' tier — before RP-18 this made the
    // whole span vanish from every exporter (operators saw empty traces).
    const tracer = createTracer({ exporters: [exporter], warnSink: () => {} });
    await tracer.span(
      { type: 'agent.run', attrs: { 'memory.scope.user_id': 'u-1' } },
      async () => undefined,
    );
    await tracer.shutdown();
    expect(records).toHaveLength(1); // span survives end-to-end
    expect(records[0]?.attributes['memory.scope.user_id']).toBeUndefined(); // untagged → stripped
  });

  it('RP-20: flush()/shutdown() awaits in-flight exports so a span is not lost', async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((r) => {
      release = r;
    });
    const captured: SpanRecord[] = [];
    let closed = false;
    const slow = withValidation({
      id: 'slow',
      async export(r: SpanRecord) {
        await gate;
        if (closed) return; // the exporter's closed-guard (as in the JSONL exporter)
        captured.push(r);
      },
      async flush() {},
      async shutdown() {
        closed = true;
      },
    });
    const tracer = createTracer({ exporters: [slow], warnSink: () => {} });
    await tracer.span({ type: 'agent.run' }, async () => undefined); // sink fires export (pending on gate)
    const shutdownP = tracer.shutdown(); // flush() drains in-flight before closing
    release(); // let the slow export resolve
    await shutdownP;
    expect(captured).toHaveLength(1); // pre-RP-20 the closed-guard would drop it
  });

  it('records exceptions and sets the error status', async () => {
    const records: SpanRecord[] = [];
    const exporter = mockExporter((record) => records.push(record));
    // Exception event attributes (`exception.message`, `exception.stacktrace`)
    // carry internal-tier content by default; raise the floor so the
    // validator does not strip the event itself.
    const tracer = createTracer({
      exporters: [exporter],
      validation: { minTier: 'internal' },
      warnSink: () => {},
    });
    await expect(
      tracer.span({ type: 'agent.run' }, async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow(/boom/);
    await tracer.shutdown();
    expect(records).toHaveLength(1);
    expect(records[0]?.status).toBe('error');
    expect(records[0]?.events.some((e) => e.name === 'exception')).toBe(true);
  });

  it('inherits the trace id from the parent span', async () => {
    const records: SpanRecord[] = [];
    const exporter = mockExporter((r) => records.push(r));
    const tracer = createTracer({ exporters: [exporter], warnSink: () => {} });
    await tracer.span({ type: 'agent.run' }, async (parent) => {
      await tracer.span({ type: 'tool.execute', parent }, async () => undefined);
    });
    await tracer.shutdown();
    expect(records).toHaveLength(2);
    expect(records[0]?.traceId).toBe(records[1]?.traceId);
    const childParentId = records.find((r) => r.parentId !== undefined)?.parentId;
    const rootId = records.find((r) => r.parentId === undefined)?.id;
    expect(childParentId).toBe(rootId);
  });

  it('respects the per-type sampling rule (zero rate drops)', async () => {
    const records: SpanRecord[] = [];
    const exporter = mockExporter((r) => records.push(r));
    const tracer = createTracer({
      exporters: [exporter],
      warnSink: () => {},
      sampling: { rate: 1, rules: [{ type: 'memory.embed', rate: 0 }] },
    });
    await tracer.span({ type: 'memory.embed' }, async () => undefined);
    await tracer.span({ type: 'agent.run' }, async () => undefined);
    await tracer.shutdown();
    const types = records.map((r) => r.type);
    expect(types).toEqual(['agent.run']);
  });

  it('exposes redaction counters via getMetrics()', async () => {
    const exporter = mockExporter(() => {});
    const tracer = createTracer({
      exporters: [exporter],
      warnSink: () => {},
      validation: { minTier: 'public' },
    });
    await tracer.span({ type: 'agent.run' }, async (span) => {
      const gs = asGraphorinSpan(span);
      gs?.setAttribute('user.email', 'alice@example.com', { sensitivity: 'public' });
    });
    await tracer.shutdown();
    expect(tracer.getMetrics().matchesByPattern.email).toBeGreaterThan(0);
  });

  it('auto-wraps the OTLP exporter when supplied raw', () => {
    const exporter = createOTLPHttpExporter({
      url: 'http://localhost:4318/v1/traces',
      fetchImpl: async () => new Response(null, { status: 200 }),
    });
    const tracer = createTracer({ exporters: [exporter], warnSink: () => {} });
    expect(tracer.serviceName).toBe('graphorin');
  });

  it('warns and falls back when zero exporters are supplied', () => {
    const warns: string[] = [];
    const tracer = createTracer({ exporters: [], warnSink: (line) => warns.push(line) });
    expect(warns.some((w) => w.includes('zero exporters'))).toBe(true);
    expect(tracer.serviceName).toBe('graphorin');
  });

  it('accepts pre-wrapped exporters with their own policy', async () => {
    const seen: SpanRecord[] = [];
    const wrapped = withValidation(
      mockExporter((r) => seen.push(r)),
      { minTier: 'public' },
    );
    const tracer = createTracer({
      exporters: [wrapped],
      validation: 'off',
      warnSink: () => {},
    });
    await tracer.span({ type: 'agent.run' }, async () => undefined);
    await tracer.shutdown();
    expect(seen).toHaveLength(1);
  });

  it('createSampler honours always-on and probabilistic decision makers', () => {
    const always = createSampler({ rate: 0, decisionMaker: 'always-on' });
    expect(always.shouldSample('agent.run')).toBe(true);

    const seeded = createSampler({ rate: 0.5, random: () => 0.1 });
    expect(seeded.shouldSample('agent.run')).toBe(true);
    const seededLow = createSampler({ rate: 0.5, random: () => 0.99 });
    expect(seededLow.shouldSample('agent.run')).toBe(false);
  });

  it('RP-19: the rate-limit decision maker caps sampled spans per second', () => {
    let t = 1_000_000;
    const limiter = createSampler({
      decisionMaker: 'rate-limit',
      maxPerSecond: 2,
      now: () => t,
    });
    expect(limiter.shouldSample('agent.run')).toBe(true); // 1
    expect(limiter.shouldSample('agent.run')).toBe(true); // 2
    expect(limiter.shouldSample('agent.run')).toBe(false); // over the cap
    t += 1_000; // next window resets the count
    expect(limiter.shouldSample('agent.run')).toBe(true);
  });

  it('RP-19: a child of an unsampled parent is not recorded (true parent-based)', async () => {
    const records: SpanRecord[] = [];
    const exporter = mockExporter((r) => records.push(r));
    // The root `memory.embed` span is sampled out (rate 0); under real
    // parent-based sampling its child must NOT be recorded as an orphan.
    const tracer = createTracer({
      exporters: [exporter],
      sampling: {
        decisionMaker: 'parent-based',
        rate: 1,
        rules: [{ type: 'memory.embed', rate: 0 }],
      },
      warnSink: () => {},
    });
    await tracer.span({ type: 'memory.embed' }, async (parent) => {
      await tracer.span({ type: 'tool.execute', parent }, async () => undefined);
    });
    await tracer.shutdown();
    expect(records).toHaveLength(0); // neither the sampled-out root nor its child
  });

  it('RP-19: defaultAttributeSensitivity tags untagged initial attrs so they survive a matching floor', async () => {
    const records: SpanRecord[] = [];
    const exporter = mockExporter((r) => records.push(r));
    // With the default sensitivity set to 'public' against the default
    // 'public' floor, an untagged initial attribute survives instead of being
    // stripped — proving the knob is effective.
    const tracer = createTracer({
      exporters: [exporter],
      defaultAttributeSensitivity: 'public',
      warnSink: () => {},
    });
    await tracer.span(
      { type: 'agent.run', attrs: { 'memory.scope.user_id': 'u-1' } },
      async () => undefined,
    );
    await tracer.shutdown();
    expect(records).toHaveLength(1);
    expect(records[0]?.attributes['memory.scope.user_id']).toBe('u-1');
  });

  it('unsampled spans never reach the validator (only sampled spans are validated)', async () => {
    const records: SpanRecord[] = [];
    const exporter = mockExporter((r) => records.push(r));
    const tracer = createTracer({
      exporters: [exporter],
      // Per the DEC-141 perf budget, sampled-out spans never traverse
      // the validator. Drive the rate to zero on `memory.embed` to
      // prove no record reaches the exporter (and therefore no
      // validation work happens).
      sampling: { rate: 1, rules: [{ type: 'memory.embed', rate: 0 }] },
      warnSink: () => {},
    });
    for (let i = 0; i < 50; i++) {
      await tracer.span({ type: 'memory.embed' }, async () => undefined);
    }
    await tracer.span({ type: 'agent.run' }, async () => undefined);
    await tracer.shutdown();
    expect(records.map((r) => r.type)).toEqual(['agent.run']);
    expect(tracer.getMetrics().droppedTotal).toBe(0);
  });

  it('flush() proxies to every exporter', async () => {
    const flushed = vi.fn(async () => undefined);
    const exporter: TraceExporter = {
      id: 'x',
      export: async () => undefined,
      flush: flushed,
      shutdown: async () => undefined,
    };
    const tracer = createTracer({ exporters: [exporter], warnSink: () => {} });
    await tracer.flush();
    expect(flushed).toHaveBeenCalled();
  });
});

function mockExporter(onExport: (record: SpanRecord) => void): TraceExporter {
  return {
    id: 'mock',
    async export(record): Promise<void> {
      onExport(record);
    },
    async flush(): Promise<void> {},
    async shutdown(): Promise<void> {},
  };
}
