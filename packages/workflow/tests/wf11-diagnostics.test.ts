import {
  type AISpan,
  collect,
  type SpanType,
  type StartSpanOptions,
  type Tracer,
  type WorkflowEvent,
} from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import { createNode, createWorkflow, InMemoryCheckpointStore, latestValue } from '../src/index.js';

interface RecordedSpan {
  type: SpanType;
  attrs: Record<string, unknown>;
  status: 'ok' | 'error' | 'cancelled';
  ended: boolean;
}

function recordingTracer(): { tracer: Tracer; spans: RecordedSpan[] } {
  const spans: RecordedSpan[] = [];
  const tracer: Tracer = {
    startSpan<T extends SpanType>(opts: StartSpanOptions<T>): AISpan<T> {
      const record: RecordedSpan = {
        type: opts.type,
        attrs: { ...(opts.attrs ?? {}) },
        status: 'ok',
        ended: false,
      };
      spans.push(record);
      const span: AISpan<T> = {
        type: opts.type,
        id: `s-${spans.length}`,
        traceId: 't-1',
        setAttributes(attrs) {
          Object.assign(record.attrs, attrs);
        },
        addEvent() {},
        recordException() {},
        setStatus(status) {
          record.status = status;
        },
        end() {
          record.ended = true;
        },
      };
      return span;
    },
    async span<T extends SpanType, R>(
      opts: StartSpanOptions<T>,
      fn: (span: AISpan<T>) => R | Promise<R>,
    ): Promise<R> {
      const span = this.startSpan(opts);
      try {
        return await fn(span);
      } finally {
        span.end();
      }
    },
    async shutdown() {},
  };
  return { tracer, spans };
}

describe('WF-11 - advertised diagnostics are real', () => {
  it('emits workflow.task and workflow.checkpoint spans', async () => {
    const { tracer, spans } = recordingTracer();
    const checkpointStore = new InMemoryCheckpointStore();
    const wf = createWorkflow<{ value: number }>({
      name: 'spanful',
      channels: { value: latestValue<number>({ default: 0 }) },
      nodes: {
        a: createNode<{ value: number }>({ name: 'a', run: () => ({ value: 1 }) }),
        b: createNode<{ value: number }>({ name: 'b', run: (s) => ({ value: s.value + 1 }) }),
      },
      edges: [
        { from: '__start__', to: 'a' },
        { from: 'a', to: 'b' },
        { from: 'b', to: '__end__' },
      ],
      checkpointStore,
      tracer,
    });
    await collect(wf.execute({}, { threadId: 'spanful-1' }));

    const taskSpans = spans.filter((s) => s.type === 'workflow.task');
    expect(taskSpans.length).toBeGreaterThanOrEqual(2); // one per executed node
    expect(taskSpans.map((s) => s.attrs['graphorin.workflow.node'])).toEqual(
      expect.arrayContaining(['a', 'b']),
    );
    const checkpointSpans = spans.filter((s) => s.type === 'workflow.checkpoint');
    expect(checkpointSpans.length).toBeGreaterThanOrEqual(1);
    expect(spans.every((s) => s.ended)).toBe(true);
  });

  it('a runaway loop fails with the dedicated max-steps-exceeded code, not invalid-config', async () => {
    const wf = createWorkflow<{ value: number }>({
      name: 'runaway',
      channels: { value: latestValue<number>({ default: 0 }) },
      nodes: {
        a: createNode<{ value: number }>({ name: 'a', run: (s) => ({ value: s.value + 1 }) }),
        b: createNode<{ value: number }>({ name: 'b', run: (s) => ({ value: s.value + 1 }) }),
      },
      edges: [
        { from: '__start__', to: 'a' },
        { from: 'a', to: 'b' },
        { from: 'b', to: 'a' }, // legal cycle - bounded by maxSteps
      ],
      checkpointStore: new InMemoryCheckpointStore(),
      maxSteps: 3,
    });
    const events: WorkflowEvent<{ value: number }>[] = [];
    let thrown: unknown;
    try {
      for await (const ev of wf.execute({}, { threadId: 'runaway-1' })) events.push(ev);
    } catch (err) {
      thrown = err;
    }
    const errorEvent = events.find((e) => e.type === 'workflow.error');
    const code =
      errorEvent?.type === 'workflow.error'
        ? errorEvent.error.code
        : ((thrown as { code?: string } | undefined)?.code ?? '<none>');
    expect(code).toBe('max-steps-exceeded');
  });

  it('an abort whose grace expires with unsettled tasks reports workflow-cancel-timeout', async () => {
    const ac = new AbortController();
    const wf = createWorkflow<{ value: number }>({
      name: 'stuck',
      channels: { value: latestValue<number>({ default: 0 }) },
      nodes: {
        stuck: createNode<{ value: number }>({
          name: 'stuck',
          // Ignores the signal and never settles within the grace.
          run: () => new Promise<{ value: number }>(() => {}),
        }),
      },
      edges: [
        { from: '__start__', to: 'stuck' },
        { from: 'stuck', to: '__end__' },
      ],
      checkpointStore: new InMemoryCheckpointStore(),
      cancelGraceMs: 30,
    });
    const events: WorkflowEvent<{ value: number }>[] = [];
    setTimeout(() => ac.abort('operator stop'), 10);
    try {
      for await (const ev of wf.execute({}, { threadId: 'stuck-1', signal: ac.signal })) {
        events.push(ev);
      }
    } catch {
      // the run may also throw after emitting the error event
    }
    const errorEvent = events.find((e) => e.type === 'workflow.error');
    expect(errorEvent).toBeDefined();
    if (errorEvent?.type === 'workflow.error') {
      expect(errorEvent.error.code).toBe('workflow-cancel-timeout');
    }
  });
});
