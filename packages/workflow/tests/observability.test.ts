import {
  type AISpan,
  collect,
  type SpanType,
  type StartSpanOptions,
  type Tracer,
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

describe('observability spans', () => {
  it('records workflow.run and workflow.step spans across an execute()', async () => {
    const { tracer, spans } = recordingTracer();
    const checkpointStore = new InMemoryCheckpointStore();
    const wf = createWorkflow<{ value: number }>({
      name: 'observed',
      channels: { value: latestValue<number>({ default: 0 }) },
      nodes: {
        a: createNode<{ value: number }>({
          name: 'a',
          run: () => ({ value: 1 }),
        }),
        b: createNode<{ value: number }>({
          name: 'b',
          run: (state) => ({ value: state.value + 1 }),
        }),
      },
      edges: [
        { from: '__start__', to: 'a' },
        { from: 'a', to: 'b' },
        { from: 'b', to: '__end__' },
      ],
      checkpointStore,
      tracer,
    });
    await collect(wf.execute({}, { threadId: 'observed-1' }));
    const types = spans.map((s) => s.type);
    expect(types).toContain('workflow.run');
    expect(types).toContain('workflow.step');
    expect(spans.every((s) => s.ended)).toBe(true);
  });
});
