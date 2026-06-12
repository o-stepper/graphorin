import type {
  AISpan,
  MemoryHit,
  MemoryRecord,
  SpanType,
  StartSpanOptions,
  Tracer,
} from '@graphorin/core';
import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  createMemory,
  explainRecall,
  formatRecallExplanation,
  type RecallExplanation,
  type RecalledMemoryExplanation,
} from '../src/index.js';
import { createInMemoryStore, InMemoryEmbeddingRegistry } from './fixtures/in-memory-store.js';

function record(id: string, kind: MemoryRecord['kind'] = 'semantic'): MemoryRecord {
  return { id, kind, userId: 'u1', sensitivity: 'internal', createdAt: new Date(0).toISOString() };
}

interface RecordedSpan {
  readonly type: SpanType;
  attrs: Record<string, unknown>;
}

function recordingTracer(): { tracer: Tracer; spans: RecordedSpan[] } {
  const spans: RecordedSpan[] = [];
  const tracer: Tracer = {
    startSpan<T extends SpanType>(spec: StartSpanOptions<T>): AISpan<T> {
      const span: RecordedSpan = { type: spec.type, attrs: { ...(spec.attrs ?? {}) } };
      spans.push(span);
      return {
        type: spec.type,
        id: `span_${spans.length}`,
        traceId: 'trace_test',
        setAttributes(attrs) {
          span.attrs = { ...span.attrs, ...attrs };
        },
        addEvent() {},
        recordException() {},
        setStatus() {},
        end() {},
      };
    },
    async span(spec, fn) {
      return fn(this.startSpan(spec));
    },
    async shutdown() {},
  };
  return { tracer, spans };
}

describe('@graphorin/memory — recall explanation (X-3)', () => {
  describe('explainRecall', () => {
    it('decomposes per-signal scores in final-rank order', () => {
      const hits: ReadonlyArray<MemoryHit> = [
        { record: record('f1'), score: 0.04, signals: { bm25: 1, vector: 0.9, rrf: 0.033 } },
        { record: record('f2', 'episodic'), score: 0.016, signals: { rrf: 0.016 } },
      ];
      const ex = explainRecall(hits, { query: 'tbilisi', rerankerId: 'rrf' });

      expect(ex.query).toBe('tbilisi');
      expect(ex.rerankerId).toBe('rrf');
      expect(ex.count).toBe(2);
      expect(ex.results.map((r) => r.id)).toEqual(['f1', 'f2']);
      expect(ex.results.map((r) => r.rank)).toEqual([1, 2]);
      expect(ex.results[0]?.kind).toBe('semantic');
      expect(ex.results[1]?.kind).toBe('episodic');
      expect(ex.results[0]?.score).toBe(0.04);
      expect(ex.results[0]?.signals).toEqual({ bm25: 1, vector: 0.9, rrf: 0.033 });
    });

    it('returns an empty explanation for no hits', () => {
      const ex = explainRecall([], { query: 'q', rerankerId: 'rrf' });
      expect(ex.count).toBe(0);
      expect(ex.results).toHaveLength(0);
    });

    it('tolerates hits without a signals map', () => {
      const ex = explainRecall([{ record: record('f1'), score: 1 }], {
        query: 'q',
        rerankerId: 'rrf',
      });
      expect(ex.results[0]?.signals).toEqual({});
    });
  });

  describe('formatRecallExplanation', () => {
    it('renders a header plus one line per recalled memory with its signals', () => {
      const text = formatRecallExplanation(
        explainRecall([{ record: record('f1'), score: 0.04, signals: { bm25: 1, decay: 0.5 } }], {
          query: 'tbilisi',
          rerankerId: 'rrf',
        }),
      );
      expect(text).toContain('"tbilisi"');
      expect(text).toContain('via rrf');
      expect(text).toContain('1 result(s)');
      expect(text).toContain('#1 f1 [semantic]');
      expect(text).toContain('bm25=1.0000');
      expect(text).toContain('decay=0.5000');
    });

    it('renders just a header for an empty explanation', () => {
      const text = formatRecallExplanation(explainRecall([], { query: 'q', rerankerId: 'rrf' }));
      expect(text).toBe('recall "q" via rrf -> 0 result(s)');
      expect(text).not.toContain('\n');
    });
  });

  describe('search integration', () => {
    it('attaches a per-signal explanation (no query text) to the search span', async () => {
      const { tracer, spans } = recordingTracer();
      const memory = createMemory({
        store: createInMemoryStore(),
        embeddings: new InMemoryEmbeddingRegistry(),
        tracer,
      });
      const scope = { userId: 'alex' };
      await memory.semantic.remember(scope, { text: 'lives in Tbilisi' });
      const results = await memory.semantic.search(scope, 'Tbilisi');

      // The returned hits carry the per-signal scores the explanation surfaces.
      const ex = explainRecall(results, { query: 'Tbilisi', rerankerId: 'rrf' });
      expect(ex.count).toBe(1);
      expect(ex.results[0]?.signals.bm25).toBe(1);
      expect(ex.results[0]?.signals.rrf).toBeGreaterThan(0);

      const span = spans.find((s) => s.type === 'memory.search.semantic');
      const raw = span?.attrs['memory.search.semantic.explain'];
      expect(typeof raw).toBe('string');
      const decoded = JSON.parse(raw as string) as RecalledMemoryExplanation[];
      expect(decoded).toHaveLength(1);
      expect(decoded[0]?.kind).toBe('semantic');
      expect(decoded[0]?.signals.bm25).toBe(1);
      // The query text must never ride the span — only `query_length`.
      expect(JSON.stringify(span?.attrs)).not.toContain('Tbilisi');
    });

    it('records the decay multiplier as a `decay` signal when decay ranking runs', async () => {
      const store = createInMemoryStore();
      const memory = createMemory({ store, embeddings: new InMemoryEmbeddingRegistry() });
      const scope = { userId: 'alex' };
      await memory.semantic.remember(scope, { text: 'lives in Tbilisi' });

      const plain = await memory.semantic.search(scope, 'Tbilisi');
      const factId = plain[0]?.record.id as string;
      expect(plain[0]?.signals?.decay).toBeUndefined();

      const longAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
      store.__hooks.setDecaySignals(factId, {
        strength: 1,
        lastAccessedAt: longAgo,
        createdAt: longAgo,
      });
      const decayed = await memory.semantic.search(scope, 'Tbilisi', {
        decay: { tauDays: 1 },
      });
      const decay = decayed[0]?.signals?.decay;
      expect(decay).toBeDefined();
      expect(decay as number).toBeGreaterThan(0);
      expect(decay as number).toBeLessThan(1);
    });
  });

  describe('types', () => {
    it('exposes the documented public shapes', () => {
      expectTypeOf(explainRecall).returns.toEqualTypeOf<RecallExplanation>();
      expectTypeOf(formatRecallExplanation).returns.toBeString();
      expectTypeOf<RecallExplanation['results']>().toEqualTypeOf<
        ReadonlyArray<RecalledMemoryExplanation>
      >();
      expectTypeOf<RecalledMemoryExplanation['rank']>().toBeNumber();
      expectTypeOf<RecalledMemoryExplanation['signals']>().toEqualTypeOf<
        Readonly<Record<string, number>>
      >();
    });
  });
});
