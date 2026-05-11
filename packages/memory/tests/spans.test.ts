import type { AISpan, SpanType, StartSpanOptions, Tracer } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { createMemory } from '../src/index.js';
import { createInMemoryStore, InMemoryEmbeddingRegistry } from './fixtures/in-memory-store.js';

interface RecordedSpan {
  readonly type: SpanType;
  attrs: Record<string, unknown>;
  status: 'ok' | 'error' | 'cancelled' | null;
  ended: boolean;
}

function recordingTracer(): { tracer: Tracer; spans: RecordedSpan[] } {
  const spans: RecordedSpan[] = [];
  const tracer: Tracer = {
    startSpan<T extends SpanType>(spec: StartSpanOptions<T>): AISpan<T> {
      const span: RecordedSpan = {
        type: spec.type,
        attrs: { ...(spec.attrs ?? {}) },
        status: null,
        ended: false,
      };
      spans.push(span);
      const out: AISpan<T> = {
        type: spec.type,
        id: `span_${spans.length}`,
        traceId: 'trace_test',
        setAttributes(attrs) {
          span.attrs = { ...span.attrs, ...attrs };
        },
        addEvent() {},
        recordException() {},
        setStatus(status) {
          span.status = status;
        },
        end() {
          span.ended = true;
        },
      };
      return out;
    },
    async span(spec, fn) {
      const s = this.startSpan(spec);
      try {
        const out = await fn(s);
        s.setStatus('ok');
        return out;
      } catch (err) {
        s.setStatus('error');
        throw err;
      } finally {
        s.end();
      }
    },
    async shutdown() {},
  };
  return { tracer, spans };
}

describe('@graphorin/memory — AISpan emission', () => {
  it('every memory operation emits a span with scope attributes', async () => {
    const { tracer, spans } = recordingTracer();
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
      tracer,
    });
    const scope = { userId: 'alex', sessionId: 's1' };
    await memory.semantic.remember(scope, { text: 'lives in Tbilisi' });
    await memory.semantic.search(scope, 'Tbilisi');
    await memory.episodic.record(scope, {
      summary: 'walked the city wall',
      startedAt: new Date(0).toISOString(),
      endedAt: new Date(60_000).toISOString(),
    });
    await memory.session.push(scope, { role: 'user', content: 'hi' });
    await memory.procedural.define(scope, { text: 'reply briefly' });
    expect(spans.find((s) => s.type === 'memory.write.semantic')).toBeDefined();
    expect(spans.find((s) => s.type === 'memory.search.semantic')).toBeDefined();
    expect(spans.find((s) => s.type === 'memory.write.episodic')).toBeDefined();
    expect(spans.find((s) => s.type === 'memory.write.session')).toBeDefined();
    expect(spans.find((s) => s.type === 'memory.write.procedural')).toBeDefined();
    for (const span of spans) {
      expect(span.attrs['memory.scope.user_id']).toBe('alex');
      expect(span.ended).toBe(true);
      expect(span.status).toBe('ok');
    }
  });
});
