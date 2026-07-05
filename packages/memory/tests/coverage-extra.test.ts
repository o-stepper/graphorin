import { describe, expect, it } from 'vitest';
import {
  createConsolidatorPlaceholder,
  createMemory,
  defineBlock,
  EmbedderMigrationStateError,
  EmbedderRegistrationError,
  GraphorinMemoryError,
  MemoryToolDeniedError,
  RRFReranker,
  SemanticMemory,
} from '../src/index.js';
import {
  createInMemoryStore,
  createStubEmbedder,
  InMemoryEmbeddingRegistry,
} from './fixtures/in-memory-store.js';

describe('@graphorin/memory - coverage extras', () => {
  it('Consolidator placeholder full lifecycle', async () => {
    const c = createConsolidatorPlaceholder({ tier: 'cheap', triggers: ['idle:30s'] });
    const before = await c.status();
    expect(before.tier).toBe('cheap');
    expect(before.triggers).toEqual(['idle:30s']);
    expect(before.running).toBe(false);
    await c.start();
    const after = await c.status();
    expect(after.running).toBe(true);
    await c.trigger({ kind: 'manual' }, { userId: 'alex' });
    await c.stop();
    const final = await c.status();
    expect(final.running).toBe(false);
  });

  it('SemanticMemory.fuseRrf static + fuse() with custom reranker', async () => {
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
    });
    const f1 = await memory.semantic.remember({ userId: 'alex' }, { text: 'a' });
    const fused = SemanticMemory.fuseRrf<typeof f1>(
      [[{ record: f1, score: 1, signals: { bm25: 1 } }]],
      60,
    );
    expect(fused.length).toBe(1);
    const direct = await memory.semantic.fuse('q', [[{ record: f1, score: 1 }]], { topK: 1 });
    expect(direct.length).toBe(1);
  });

  it('reranker abort via signal', async () => {
    const r = new RRFReranker(60);
    const ctrl = new AbortController();
    ctrl.abort();
    await expect(r.rerank('q', [], { signal: ctrl.signal })).rejects.toThrow(/aborted/i);
  });

  it('typed errors expose stable kind discriminators + hints', () => {
    const a = new EmbedderRegistrationError('stub:foo@1');
    expect(a.kind).toBe('embedder-registration');
    expect(a.hint).toBeDefined();
    expect(a.embedderId).toBe('stub:foo@1');
    const b = new MemoryToolDeniedError('fact_remember', 'denied');
    expect(b.kind).toBe('memory-tool-denied');
    const c = new EmbedderMigrationStateError('boom');
    expect(c.kind).toBe('embedder-migration-state');
    expect(c.hint).toBeDefined();
    expect(c).toBeInstanceOf(GraphorinMemoryError);
  });

  it('working-memory write keeps definition tags', async () => {
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
    });
    const def = defineBlock({ label: 't', charLimit: 32, tags: ['system'] });
    memory.working.define(def);
    const block = await memory.working.write({ userId: 'alex' }, 't', 'hello');
    expect(block.tags).toEqual(['system']);
  });

  it('compile() with no rules and no blocks returns minimal output', async () => {
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
    });
    const out = await memory.compile({ userId: 'alex' });
    expect(out.workingBlocks).toBeUndefined();
    expect(out.rules).toBeUndefined();
    expect(out.metadata).toContain('Working blocks: 0');
  });

  it('rejects defineBlock with non-positive charLimit', () => {
    expect(() => defineBlock({ label: 'x', charLimit: 0 })).toThrow(TypeError);
    expect(() => defineBlock({ label: '', charLimit: 10 })).toThrow(TypeError);
  });

  it('embedder is null when not configured; embedderId returns null', () => {
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
    });
    expect(memory.embedder).toBeNull();
    expect(memory.embedderId()).toBeNull();
  });

  it('embedder is exposed on the facade when configured', () => {
    const embedder = createStubEmbedder();
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
      embedder,
    });
    expect(memory.embedder).toBe(embedder);
  });
});
