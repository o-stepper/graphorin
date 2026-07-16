import type { EmbedderProvider, Fact, MemoryHit, SessionScope, Tracer } from '@graphorin/core';
import { NOOP_TRACER } from '@graphorin/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  _resetBypassWarningForTesting,
  createConflictPipeline,
  DEFAULT_CONFLICT_THRESHOLDS,
  defineLocalePack,
  enLocalePack,
  runConflictPipeline,
} from '../src/conflict/index.js';
import type { ConflictPipelineDeps } from '../src/conflict/types.js';
import { createMemory } from '../src/index.js';
import type {
  ConflictAuditInputLike,
  ConflictMemoryStoreExt,
  PendingConflictInputLike,
  PendingConflictRowLike,
} from '../src/internal/storage-adapter.js';
import {
  createInMemoryStore,
  createStubEmbedder,
  InMemoryEmbeddingRegistry,
} from './fixtures/in-memory-store.js';

const SCOPE: SessionScope = { userId: 'alex', sessionId: 's1' };

const NOW = '2026-05-07T12:00:00.000Z';

function fact(text: string, overrides: Partial<Fact> = {}): Fact {
  return {
    id: overrides.id ?? `f-${Math.random().toString(36).slice(2, 8)}`,
    kind: 'semantic',
    userId: SCOPE.userId,
    sessionId: SCOPE.sessionId,
    sensitivity: 'internal',
    text,
    createdAt: NOW,
    updatedAt: NOW,
    validFrom: NOW,
  } as Fact;
}

function fakeStore(
  vectors: ReadonlyArray<MemoryHit<Fact>>,
  conflictStore?: ConflictMemoryStoreExt,
): ConflictPipelineDeps {
  return {
    store: {
      async init() {},
      async close() {},
      working: {
        async list() {
          return [];
        },
        async get() {
          return null;
        },
        async upsert() {},
        async delete() {},
      },
      session: {
        async push() {
          throw new Error('not used');
        },
        async list() {
          return [];
        },
        async search() {
          return [];
        },
      },
      episodic: {
        async put() {},
        async get() {
          return null;
        },
        async search() {
          return [];
        },
      },
      semantic: {
        async remember() {},
        async search() {
          return [];
        },
        async supersede() {},
        async forget() {},
        async searchVector() {
          return vectors;
        },
        async get(id: string) {
          const found = vectors.find((h) => h.record.id === id);
          return found?.record ?? null;
        },
      },
      procedural: {
        async add() {},
        async list() {
          return [];
        },
        async remove() {},
      },
      shared: {
        async attach() {},
        async detach() {},
        async listFor() {
          return [];
        },
      },
      ...(conflictStore !== undefined ? { conflicts: conflictStore } : {}),
    },
    tracer: NOOP_TRACER,
    embedder: createStubEmbedder(),
    embedderId: 'stub:hash@32',
  };
}

function recordingConflictStore(): ConflictMemoryStoreExt & {
  readonly audit: ConflictAuditInputLike[];
  readonly pending: PendingConflictInputLike[];
} {
  const audit: ConflictAuditInputLike[] = [];
  const pending: PendingConflictInputLike[] = [];
  return {
    audit,
    pending,
    async recordDecision(input) {
      audit.push(input);
      return { id: audit.length, detectedAt: Date.now() };
    },
    async enqueuePending(input) {
      pending.push(input);
      return { id: pending.length };
    },
    async listPending(): Promise<ReadonlyArray<PendingConflictRowLike>> {
      return [];
    },
    async markResolved() {},
  };
}

beforeEach(() => {
  _resetBypassWarningForTesting();
});

describe('createConflictPipeline - defaults', () => {
  it('exposes the bundled English locale pack and default thresholds', () => {
    const pipeline = createConflictPipeline();
    expect(pipeline.localePack.id).toBe('en');
    expect(pipeline.thresholds).toEqual(DEFAULT_CONFLICT_THRESHOLDS);
    expect(pipeline.mode).toBe('on');
  });

  it('rejects threshold combinations that violate the cold ≤ nearDup ≤ hot invariant', () => {
    expect(() =>
      createConflictPipeline({ thresholds: { hot: 0.5, nearDup: 0.7, cold: 0.4 } }),
    ).toThrow(/invalid conflict thresholds/);
  });

  it('allows a custom locale pack', () => {
    const pack = defineLocalePack({
      id: 'fr',
      supersedeMarkers: [{ regex: /\bdéménagé\b/i, kind: 'location' }],
      negationMarkers: [{ regex: /\bjamais\b/i }],
      predicateNormalisers: ['est', 'suis'],
      subjectStopWords: ['le', 'la'],
    });
    const pipeline = createConflictPipeline({ localePack: pack });
    expect(pipeline.localePack.id).toBe('fr');
  });
});

describe('runConflictPipeline - outcomes', () => {
  it('admits when there are no existing facts (fresh user)', async () => {
    const pipeline = createConflictPipeline();
    const conflicts = recordingConflictStore();
    const deps = fakeStore([], conflicts);
    const decision = await pipeline.run(deps, fact('I live in Tbilisi.'));
    expect(decision.kind).toBe('admit');
    expect(conflicts.audit).toHaveLength(1);
    expect(conflicts.audit[0]?.decision).toBe('admit');
  });

  it('MEMORY-C-02: dedupes an exact-text duplicate without an embedder (FTS fallback)', async () => {
    const pipeline = createConflictPipeline();
    const conflicts = recordingConflictStore();
    const existing = fact('Alex drinks oat milk.', { id: 'old-oat' });
    const candidate = fact('Alex drinks oat milk.', { id: 'dup-oat' });
    // No embedder + no vector candidates: the exact-text fallback must
    // surface the existing fact via the store's FTS search.
    const base = fakeStore([], conflicts);
    const deps: ConflictPipelineDeps = {
      ...base,
      embedder: null,
      embedderId: null,
      store: {
        ...base.store,
        semantic: {
          ...base.store.semantic,
          async search(_scope, opts) {
            return opts.query.toLowerCase().includes('oat milk')
              ? [{ record: existing, score: 1, signals: { bm25: 1 } }]
              : [];
          },
        },
      },
    };
    const decision = await pipeline.run(deps, candidate);
    expect(decision.kind).toBe('dedup');
    if (decision.kind === 'dedup') {
      expect(decision.existingId).toBe('old-oat');
      expect(decision.stage).toBe('exact-dedup');
    }
  });

  it('dedupes when the embedding similarity sits in the HOT zone', async () => {
    const pipeline = createConflictPipeline();
    const conflicts = recordingConflictStore();
    const candidate = fact('Lives in Boston.', { id: 'cand' });
    const deps = fakeStore(
      [
        {
          record: fact('Lives in Boston.', { id: 'old' }),
          score: 0.96,
        },
      ],
      conflicts,
    );
    const decision = await pipeline.run(deps, candidate);
    expect(decision.kind).toBe('dedup');
    if (decision.kind === 'dedup') {
      expect(decision.existingId).toBe('old');
      expect(decision.stage).toBe('exact-dedup');
    }
    expect(conflicts.audit).toHaveLength(1);
    expect(conflicts.audit[0]?.detectionZone).toBe('exact');
  });

  it('marks supersede when the heuristic regex matches in the conflict-check zone', async () => {
    const pipeline = createConflictPipeline();
    const conflicts = recordingConflictStore();
    const candidate = fact('I just moved to Tbilisi for work.', { id: 'new-loc' });
    const deps = fakeStore(
      [{ record: fact('Lives in Boston.', { id: 'old-loc' }), score: 0.775 }],
      conflicts,
    );
    const decision = await pipeline.run(deps, candidate);
    expect(decision.kind).toBe('supersede');
    if (decision.kind === 'supersede') {
      expect(decision.existingId).toBe('old-loc');
      expect(decision.reason).toContain('regex-supersede-marker');
      expect(decision.stage).toBe('heuristic-regex');
    }
    expect(conflicts.audit[0]?.decision).toBe('supersede');
    expect(conflicts.audit[0]?.detectionZone).toBe('heuristic');
  });

  it('marks supersede when the subject + predicate match but the object differs', async () => {
    const pipeline = createConflictPipeline();
    const conflicts = recordingConflictStore();
    const candidate = fact('Atlas lives in Tbilisi.', { id: 'cand' });
    const deps = fakeStore(
      [{ record: fact('Atlas lives in Boston.', { id: 'old' }), score: 0.775 }],
      conflicts,
    );
    const decision = await pipeline.run(deps, candidate);
    expect(decision.kind).toBe('supersede');
    if (decision.kind === 'supersede') {
      expect(decision.stage).toBe('subject-predicate');
    }
  });

  it('defers to deep phase when no other stage fires', async () => {
    const pipeline = createConflictPipeline();
    const conflicts = recordingConflictStore();
    const candidate = fact('I have been thinking about a sabbatical.', { id: 'cand' });
    // Store scores 0.825 / 0.775 => raw cosines 0.65 / 0.55 (mid-zone).
    const deps = fakeStore(
      [
        { record: fact('Considering a long break.', { id: 'old-1' }), score: 0.825 },
        { record: fact('Maybe a year off would help.', { id: 'old-2' }), score: 0.775 },
      ],
      conflicts,
    );
    const decision = await pipeline.run(deps, candidate);
    expect(decision.kind).toBe('pending');
    if (decision.kind === 'pending') {
      expect(decision.candidateId).toBe('cand');
      expect([...decision.conflictingIds]).toEqual(['old-1', 'old-2']);
      expect(decision.stage).toBe('defer-to-deep');
    }
    expect(conflicts.pending).toHaveLength(1);
    expect(conflicts.pending[0]?.factId).toBe('cand');
    expect([...(conflicts.pending[0]?.conflictingIds ?? [])]).toEqual(['old-1', 'old-2']);
  });

  it('admits when no conflict store is wired (graceful degradation)', async () => {
    const pipeline = createConflictPipeline();
    const deps = fakeStore([]);
    const decision = await pipeline.run(deps, fact('A fresh fact.'));
    expect(decision.kind).toBe('admit');
  });

  it('mode "off" short-circuits and warns once per process', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const pipeline = createConflictPipeline({ mode: 'off' });
    const deps = fakeStore([{ record: fact('hello world', { id: 'old' }), score: 0.99 }]);
    const a = await pipeline.run(deps, fact('hello world'));
    const b = await pipeline.run(deps, fact('another fact'));
    expect(a.kind).toBe('admit');
    expect(b.kind).toBe('admit');
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});

describe('SemanticMemory.remember - pipeline integration', () => {
  it('regression: "lives in Boston" → "moved to Seattle" produces supersede', async () => {
    const memory = createMemory({
      store: createInMemoryStore({ withConflictStore: true }),
      embeddings: new InMemoryEmbeddingRegistry(),
      embedder: createStubEmbedder(),
    });
    const a = await memory.semantic.rememberWithDecision(SCOPE, {
      text: 'Lives in Boston.',
    });
    expect(a.decision.kind).toBe('admit');
    const b = await memory.semantic.rememberWithDecision(SCOPE, {
      text: 'Just moved to Seattle for the new job.',
    });
    // Stage 3 (heuristic regex) should fire on `moved to`.
    expect(b.decision.kind === 'supersede' || b.decision.kind === 'pending').toBe(true);
  });

  it('flags the audit row + pending queue when a fact is deferred to the deep phase', async () => {
    const store = createInMemoryStore({ withConflictStore: true });
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      embedder: createStubEmbedder(),
    });
    await memory.semantic.remember(SCOPE, { text: 'I prefer dark roast coffee.' });
    const probable = await memory.semantic.rememberWithDecision(SCOPE, {
      text: 'I prefer light roast coffee.',
    });
    expect(probable.decision.kind === 'supersede' || probable.decision.kind === 'pending').toBe(
      true,
    );
    const audit = store.__conflicts?.audit ?? [];
    expect(audit.length).toBeGreaterThanOrEqual(2);
  });

  it('never bypasses the pipeline when no embedder is configured (still admits)', async () => {
    const memory = createMemory({
      store: createInMemoryStore({ withConflictStore: true }),
      embeddings: new InMemoryEmbeddingRegistry(),
    });
    const result = await memory.semantic.rememberWithDecision(SCOPE, {
      text: 'I love mountain hiking.',
    });
    expect(result.decision.kind).toBe('admit');
  });

  it('honours createMemory({ conflictPipeline: { mode: "off" } })', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const memory = createMemory({
      store: createInMemoryStore({ withConflictStore: true }),
      embeddings: new InMemoryEmbeddingRegistry(),
      embedder: createStubEmbedder(),
      conflictPipeline: { mode: 'off' },
    });
    const result = await memory.semantic.rememberWithDecision(SCOPE, {
      text: 'hello world',
    });
    expect(result.decision.kind).toBe('admit');
    expect(result.decision.reason).toBe('pipeline-mode-off');
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('per-call pipeline: "off" still works alongside the global on mode', async () => {
    const memory = createMemory({
      store: createInMemoryStore({ withConflictStore: true }),
      embeddings: new InMemoryEmbeddingRegistry(),
      embedder: createStubEmbedder(),
    });
    await memory.semantic.remember(SCOPE, { text: 'lives in Boston' });
    const result = await memory.semantic.rememberWithDecision(
      SCOPE,
      { text: 'lives in Boston' },
      { pipeline: 'off' },
    );
    expect(result.decision.kind).toBe('admit');
    expect(result.decision.reason).toBe('pipeline-skipped');
  });
});

describe('runConflictPipeline - free-function helper', () => {
  it('mirrors createConflictPipeline behaviour for one-shot calls', async () => {
    const conflicts = recordingConflictStore();
    const candidate = fact('lives in Boston', { id: 'cand-once' });
    const deps = fakeStore(
      [{ record: fact('lives in Boston', { id: 'old-once' }), score: 0.97 }],
      conflicts,
    );
    const decision = await runConflictPipeline({ candidate, deps });
    expect(decision.kind).toBe('dedup');
    expect(conflicts.audit).toHaveLength(1);
  });

  it('forwards options.thresholds to the underlying pipeline', async () => {
    const conflicts = recordingConflictStore();
    // Distinct texts so Stage 1 (exact-dedup) does not short-circuit.
    const candidate = fact('Mochi enjoys long evening walks.', { id: 'cand-thresh' });
    const deps = fakeStore(
      [
        {
          record: fact('Mochi prefers short morning runs.', { id: 'old' }),
          score: 0.65,
        },
      ],
      conflicts,
    );
    // Lower the COLD threshold so a 0.65 store-scale hit (raw cosine
    // 0.3) registers as CONFLICT-CHECK.
    const decision = await runConflictPipeline({
      candidate,
      deps,
      options: { thresholds: { cold: 0.1, nearDup: 0.6, hot: 0.9 } },
    });
    // No regex marker, subject/predicate "Mochi prefers" vs "Mochi enjoys" -
    // different predicates, so Stage 4 continues; conflict-check zone → defer.
    expect(decision.kind).toBe('pending');
  });
});

describe('runConflictPipeline - cancellation', () => {
  it('throws AbortError when the supplied signal is already aborted', async () => {
    const pipeline = createConflictPipeline();
    const conflicts = recordingConflictStore();
    const candidate = fact('lives in Boston', { id: 'cand-cancel' });
    const deps: ConflictPipelineDeps = {
      ...fakeStore([{ record: fact('lives in Boston', { id: 'old' }), score: 0.97 }], conflicts),
      signal: AbortSignal.abort(),
    };
    await expect(pipeline.run(deps, candidate)).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('throws AbortError mid-flight when the signal is aborted between embed + search', async () => {
    const pipeline = createConflictPipeline();
    const conflicts = recordingConflictStore();
    const candidate = fact('lives in Boston', { id: 'cand-mid' });
    const controller = new AbortController();
    const slowEmbedder = {
      id: () => 'slow:hash@8',
      dim: () => 8,
      configHash: () => 'cfg',
      async embed(texts: ReadonlyArray<string>) {
        controller.abort();
        return texts.map(() => new Float32Array([0, 1, 0, 0, 0, 0, 0, 0]));
      },
    };
    const deps: ConflictPipelineDeps = {
      ...fakeStore([{ record: fact('lives in Boston', { id: 'old' }), score: 0.97 }], conflicts),
      embedder: slowEmbedder,
      embedderId: 'slow:hash@8',
      signal: controller.signal,
    };
    await expect(pipeline.run(deps, candidate)).rejects.toMatchObject({ name: 'AbortError' });
  });
});

describe('runConflictPipeline - vector candidate filtering', () => {
  it('excludes the candidate fact from its own search hits (no self-dedup)', async () => {
    const pipeline = createConflictPipeline();
    const conflicts = recordingConflictStore();
    const candidate = fact('hello world', { id: 'self-id' });
    // The fake store returns the candidate itself among the vector
    // hits - the orchestrator must filter it out so the pipeline does
    // not "dedup against self".
    const deps = fakeStore(
      [{ record: fact('hello world', { id: 'self-id' }), score: 0.99 }],
      conflicts,
    );
    const decision = await pipeline.run(deps, candidate);
    expect(decision.kind).toBe('admit');
    expect(conflicts.audit[0]?.decision).toBe('admit');
  });
});

describe('runConflictPipeline - performance', () => {
  it('full pipeline median ≤ 50 ms per call on a 50-fact corpus (smoke benchmark)', async () => {
    // RB-02 §8 / Phase 10b spec target ≤ 5 ms per remember excluding
    // the embedder roundtrip. This smoke benchmark uses a 50ms budget
    // because the in-memory store fixture + stub embedder + vitest's
    // V8 coverage instrumentation noise can each add ~10-20ms in
    // shared CI runners. The strict 5ms bound is enforced by the CI
    // bench harness owned by RB-29 (Phase 04 follow-up).
    const memory = createMemory({
      store: createInMemoryStore({ withConflictStore: true }),
      embeddings: new InMemoryEmbeddingRegistry(),
      embedder: createStubEmbedder(),
    });
    for (let i = 0; i < 50; i++) {
      await memory.semantic.remember(SCOPE, {
        text: `Fact number ${i} about something distinct.`,
      });
    }
    // Warm-up to avoid JIT noise.
    await memory.semantic.rememberWithDecision(SCOPE, { text: 'warm-up fact' });
    const samples: number[] = [];
    for (let i = 0; i < 11; i++) {
      const start = performance.now();
      await memory.semantic.rememberWithDecision(SCOPE, {
        text: `Sample fact ${i} about something distinct.`,
      });
      samples.push(performance.now() - start);
    }
    samples.sort((a, b) => a - b);
    const median = samples[Math.floor(samples.length / 2)] ?? 0;
    expect(median).toBeLessThan(50);
  });
});

describe('runConflictPipeline - span emission', () => {
  it('emits a memory.conflict span per remember(...) with stage + decision attrs', async () => {
    const attrs: Record<string, unknown> = {};
    const recordingTracer: Tracer = {
      startSpan(opts) {
        if (opts.attrs !== undefined) Object.assign(attrs, opts.attrs);
        return {
          type: opts.type,
          id: 'span',
          traceId: 'trace',
          setAttributes(a: Record<string, unknown>) {
            Object.assign(attrs, a);
          },
          addEvent() {},
          recordException() {},
          setStatus() {},
          end() {},
          // The recorder is type-erased; per-call generic narrowing is irrelevant.
        } as never;
      },
      async span(opts, fn) {
        const span = this.startSpan(opts);
        try {
          return await fn(span);
        } finally {
          span.end();
        }
      },
      async shutdown() {},
    };
    const pipeline = createConflictPipeline();
    const deps: ConflictPipelineDeps = {
      ...fakeStore([{ record: fact('lives in Boston', { id: 'old' }), score: 0.97 }]),
      tracer: recordingTracer,
    };
    await pipeline.run(deps, fact('lives in Boston', { id: 'cand' }));
    expect(attrs['memory.conflict.stage']).toBe('exact-dedup');
    expect(attrs['memory.conflict.decision']).toBe('dedup');
    expect(attrs['memory.conflict.locale_pack']).toBe(enLocalePack.id);
  });
});

afterEach(() => {
  _resetBypassWarningForTesting();
});

// Ensure `EmbedderProvider` symbol stays alive for the type narrowing
// guard above without producing an unused-import warning.
void (null as unknown as EmbedderProvider | null);
