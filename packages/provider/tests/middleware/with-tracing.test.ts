/**
 * Coverage for `withTracing` — uses `NOOP_TRACER` (no-op pass-through)
 * and a custom counting tracer to assert span lifecycle invocations.
 */
import type {
  AISpan,
  ProviderRequest,
  SpanStatus,
  StartSpanOptions,
  Tracer,
} from '@graphorin/core';
import { NOOP_TRACER } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import { withTracing } from '../../src/middleware/with-tracing.js';
import { bareAdapter } from '../fixtures/bare-adapter.js';

interface SpanCalls {
  startSpan: number;
  setStatus: Array<{ status: SpanStatus; message?: string }>;
  end: number;
  recordException: number;
  spanWrapped: number;
}

function countingTracer(): { tracer: Tracer; calls: SpanCalls } {
  const calls: SpanCalls = {
    startSpan: 0,
    setStatus: [],
    end: 0,
    recordException: 0,
    spanWrapped: 0,
  };
  const tracer: Tracer = {
    startSpan<T extends import('@graphorin/core').SpanType>(opts: StartSpanOptions<T>): AISpan<T> {
      calls.startSpan++;
      const span: AISpan<T> = {
        type: opts.type,
        id: 'fake-id',
        traceId: 'fake-trace',
        setAttributes: () => {},
        addEvent: () => {},
        recordException: () => {
          calls.recordException++;
        },
        setStatus: (status, message) => {
          calls.setStatus.push({
            status,
            ...(message !== undefined ? { message } : {}),
          });
        },
        end: () => {
          calls.end++;
        },
      };
      return span;
    },
    async span<T extends import('@graphorin/core').SpanType, R>(
      opts: StartSpanOptions<T>,
      fn: (span: AISpan<T>) => R | Promise<R>,
    ): Promise<R> {
      calls.spanWrapped++;
      const span = this.startSpan(opts);
      try {
        return await fn(span);
      } finally {
        span.end();
      }
    },
    async shutdown() {},
  };
  return { tracer, calls };
}

const REQ: ProviderRequest = { messages: [{ role: 'user', content: 'hi' }] };

describe('withTracing — no tracer', () => {
  it('is a pure pass-through when no tracer is supplied', async () => {
    const wrapped = withTracing({})(bareAdapter());
    const result = await wrapped.generate(REQ);
    expect(result.text).toBe('hi');
    let textDeltas = 0;
    for await (const ev of wrapped.stream(REQ)) {
      if (ev.type === 'text-delta') textDeltas++;
    }
    expect(textDeltas).toBe(1);
  });
});

describe('withTracing — NOOP_TRACER', () => {
  it('runs without errors when the no-op tracer is supplied', async () => {
    const wrapped = withTracing({ tracer: NOOP_TRACER })(bareAdapter());
    await wrapped.generate(REQ);
    for await (const _ of wrapped.stream(REQ)) void _;
  });
});

describe('withTracing — counting tracer', () => {
  it('starts and ends a span on stream() with status ok', async () => {
    const { tracer, calls } = countingTracer();
    const wrapped = withTracing({ tracer })(bareAdapter());
    for await (const _ of wrapped.stream(REQ)) void _;
    expect(calls.startSpan).toBe(1);
    expect(calls.end).toBe(1);
    expect(calls.setStatus).toEqual([{ status: 'ok' }]);
    expect(calls.recordException).toBe(0);
  });

  it('records exception + sets error status when the inner stream throws', async () => {
    const { tracer, calls } = countingTracer();
    const broken = bareAdapter();
    const wrapped = withTracing({ tracer })({
      ...broken,
      // biome-ignore lint/correctness/useYield: deliberate error-path fixture; the throw runs before any yield.
      async *stream() {
        throw new Error('boom');
      },
    });
    await expect(
      (async () => {
        for await (const _ of wrapped.stream(REQ)) void _;
      })(),
    ).rejects.toThrow('boom');
    expect(calls.startSpan).toBe(1);
    expect(calls.end).toBe(1);
    expect(calls.recordException).toBe(1);
    expect(calls.setStatus[0]?.status).toBe('error');
  });

  it('uses the tracer.span() wrapper on generate()', async () => {
    const { tracer, calls } = countingTracer();
    const wrapped = withTracing({ tracer })(bareAdapter());
    await wrapped.generate(REQ);
    expect(calls.spanWrapped).toBe(1);
    expect(calls.startSpan).toBe(1);
    expect(calls.end).toBe(1);
  });
});
