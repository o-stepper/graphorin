import { NOOP_LOGGER, NOOP_TRACER } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { createMemory, defineBlock } from '../src/index.js';
import {
  createInMemoryStore,
  createStubEmbedder,
  InMemoryEmbeddingRegistry,
} from './fixtures/in-memory-store.js';

describe('@graphorin/memory — createMemory facade', () => {
  it('wires every six tier sub-module + ten memory tools', () => {
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
      embedder: createStubEmbedder(),
    });
    expect(memory.working).toBeDefined();
    expect(memory.session).toBeDefined();
    expect(memory.episodic).toBeDefined();
    expect(memory.semantic).toBeDefined();
    expect(memory.procedural).toBeDefined();
    expect(memory.shared).toBeDefined();
    expect(memory.tools.length).toBe(10);
    const names = memory.tools.map((t) => t.name);
    expect(names).toEqual([
      'block_append',
      'block_replace',
      'block_rethink',
      'fact_remember',
      'fact_search',
      'fact_supersede',
      'fact_forget',
      'recall_episodes',
      'conversation_search',
      'fact_history',
    ]);
  });

  it('registers the embedder with the registry', () => {
    const registry = new InMemoryEmbeddingRegistry();
    const embedder = createStubEmbedder({ id: 'stub:hash@8' });
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: registry,
      embedder,
    });
    expect(memory.embedderId()).toBe('stub:hash@8');
    const known = registry.listAll();
    expect(known.length).toBe(1);
    expect(known[0]?.id).toBe('stub:hash@8');
  });

  it('exposes a working consolidator placeholder by default', async () => {
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
    });
    const status = await memory.consolidator.status();
    expect(status.tier).toBe('free');
    expect(status.triggers).toEqual(['turn:20', 'idle:5m']);
    await memory.consolidator.start();
    const after = await memory.consolidator.status();
    expect(after.running).toBe(true);
  });

  it('compile() renders working blocks + rules + metadata', async () => {
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
      workingBlocks: [
        defineBlock({ label: 'persona', charLimit: 200, description: 'Agent persona' }),
      ],
    });
    const scope = { userId: 'alex', sessionId: 's1' };
    await memory.working.write(scope, 'persona', 'Friendly tone, succinct replies.');
    await memory.procedural.define(scope, { text: 'Always greet the user by name.' });
    const blocks = await memory.compile(scope);
    expect(blocks.workingBlocks).toContain('<memory_blocks>');
    expect(blocks.workingBlocks).toContain('Friendly tone');
    expect(blocks.rules).toContain('<memory_rules>');
    expect(blocks.metadata).toContain('Working blocks: 1');
  });

  it('metadata() reports per-tier counters', async () => {
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
    });
    const scope = { userId: 'alex' };
    await memory.semantic.remember(scope, { text: 'lives in Tbilisi' });
    await memory.episodic.record(scope, {
      summary: 'Took a hike up Mtatsminda',
      startedAt: new Date(0).toISOString(),
      endedAt: new Date(3600_000).toISOString(),
    });
    await memory.procedural.define(scope, { text: 'Reply in user language' });
    const meta = await memory.metadata(scope);
    expect(meta.factCount).toBeGreaterThan(0);
    expect(meta.episodeCount).toBeGreaterThan(0);
    expect(meta.activeRuleCount).toBeGreaterThan(0);
  });

  it('memory.tools default scope resolver throws by design', async () => {
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
    });
    const tool = memory.tools.find((t) => t.name === 'fact_remember');
    expect(tool).toBeDefined();
    const ctx = makeFakeCtx();
    await expect(tool?.execute({ text: 'hello' }, ctx) as Promise<unknown>).rejects.toThrow(
      /scope resolver/,
    );
  });

  it('replaces the active reranker via setReranker(...)', () => {
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
    });
    const initial = memory.semantic.reranker();
    expect(initial.id).toBe('rrf');
    const stub = {
      id: 'custom',
      async rerank() {
        return [];
      },
    } as const;
    const previous = memory.semantic.setReranker(stub);
    expect(previous).toBe(initial);
    expect(memory.semantic.reranker().id).toBe('custom');
  });
});

function makeFakeCtx(): import('@graphorin/core').ToolExecutionContext<unknown> {
  return {
    toolCallId: 'call_test',
    runContext: {} as never,
    signal: new AbortController().signal,
    tracer: NOOP_TRACER,
    logger: NOOP_LOGGER,
    secrets: {
      async require() {
        throw new Error('no secrets');
      },
    } as never,
    reportProgress() {},
    streamContent() {},
  };
}
