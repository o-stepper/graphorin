import type { Provider, ProviderRequest, SessionScope } from '@graphorin/core';
import { NOOP_LOGGER, NOOP_TRACER } from '@graphorin/core';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { createMemory, defineBlock, type SemanticSearchDefaults } from '../src/index.js';
import {
  createInMemoryStore,
  createStubEmbedder,
  InMemoryEmbeddingRegistry,
} from './fixtures/in-memory-store.js';

describe('@graphorin/memory - createMemory facade', () => {
  it('wires every six tier sub-module + eleven memory tools', () => {
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
    expect(memory.tools.length).toBe(11);
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
      'fact_validate',
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

  it("onIncompatibleEmbedder 'fts-only' degrades instead of throwing (item 10 step 2)", async () => {
    const registry = new InMemoryEmbeddingRegistry();
    const incompatible = Object.assign(new Error('registered with a different configHash'), {
      name: 'EmbedderLockOnFirstError',
    });
    const throwingRegistry = new Proxy(registry, {
      get(target, prop, receiver) {
        if (prop === 'registerOrReturn') {
          return () => {
            throw incompatible;
          };
        }
        return Reflect.get(target, prop, receiver);
      },
    });
    const stderr: string[] = [];
    const original = process.stderr.write.bind(process.stderr);
    process.stderr.write = ((chunk: string | Uint8Array) => {
      stderr.push(String(chunk));
      return true;
    }) as typeof process.stderr.write;
    try {
      const memory = createMemory({
        store: createInMemoryStore(),
        embeddings: throwingRegistry,
        embedder: createStubEmbedder({ id: 'stub:hash@8' }),
        onIncompatibleEmbedder: 'fts-only',
      });
      // Degraded: no bound embedder id, but the facade is alive and
      // writes/reads work without vectors.
      expect(memory.embedderId()).toBeNull();
      const scope = { userId: 'u1' } as const;
      await memory.semantic.remember(scope, { text: 'fts still works' });
      const hits = await memory.semantic.search(scope, 'fts');
      expect(hits.length).toBeGreaterThan(0);
    } finally {
      process.stderr.write = original;
    }
    expect(stderr.join('')).toContain('continuing FTS-only');
  });

  it("onIncompatibleEmbedder default 'fail' rethrows the registry error", () => {
    const registry = new InMemoryEmbeddingRegistry();
    const throwingRegistry = new Proxy(registry, {
      get(target, prop, receiver) {
        if (prop === 'registerOrReturn') {
          return () => {
            throw Object.assign(new Error('incompatible'), {
              name: 'EmbedderLockOnFirstError',
            });
          };
        }
        return Reflect.get(target, prop, receiver);
      },
    });
    expect(() =>
      createMemory({
        store: createInMemoryStore(),
        embeddings: throwingRegistry,
        embedder: createStubEmbedder({ id: 'stub:hash@8' }),
      }),
    ).toThrow('incompatible');
  });

  it('exposes a working consolidator placeholder by default', async () => {
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
    });
    const status = await memory.consolidator.status();
    expect(status.tier).toBe('free');
    expect(status.triggers).toEqual(['idle:5m', 'cron:0 4 * * *']);
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

describe('W-086 searchDefaults', () => {
  function expansionProvider(variants: ReadonlyArray<string>): Provider & {
    readonly calls: ProviderRequest[];
  } {
    const calls: ProviderRequest[] = [];
    return {
      name: 'expander',
      modelId: 'expander:test',
      capabilities: {
        streaming: false,
        toolCalling: false,
        parallelToolCalls: false,
        multimodal: false,
        structuredOutput: true,
        reasoning: false,
        contextWindow: 32_000,
        maxOutput: 4_000,
      },
      calls,
      async generate(req: ProviderRequest) {
        calls.push(req);
        return {
          text: JSON.stringify(variants),
          usage: { promptTokens: 5, completionTokens: 5, totalTokens: 10 },
          finishReason: 'stop' as const,
        };
      },
      stream() {
        throw new Error('not implemented');
      },
    };
  }

  const scope: SessionScope = { userId: 'alex' };

  async function seeded(provider: Provider, searchDefaults?: SemanticSearchDefaults) {
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
      queryTransform: { provider },
      ...(searchDefaults !== undefined ? { searchDefaults } : {}),
    });
    await memory.semantic.remember(scope, { text: 'alpha gizmo' }, { pipeline: 'off' });
    await memory.semantic.remember(scope, { text: 'beta thing' }, { pipeline: 'off' });
    return memory;
  }

  it('activates the fan-out for a bare search() call', async () => {
    const provider = expansionProvider(['beta thing']);
    const memory = await seeded(provider, { multiQuery: 2 });

    const hits = await memory.semantic.search(scope, 'alpha');

    expect(provider.calls).toHaveLength(1);
    expect(hits.map((h) => h.record.text)).toContain('beta thing');
  });

  it('per-call options override the defaults key-by-key', async () => {
    const provider = expansionProvider(['beta thing']);
    const memory = await seeded(provider, { multiQuery: 2 });

    const hits = await memory.semantic.search(scope, 'alpha', { multiQuery: 1 });

    expect(provider.calls).toHaveLength(0);
    expect(hits.map((h) => h.record.text)).toEqual(['alpha gizmo']);
  });

  it('offline default stays byte-identical when searchDefaults is omitted', async () => {
    const provider = expansionProvider(['beta thing']);
    const memory = await seeded(provider);

    const hits = await memory.semantic.search(scope, 'alpha');

    expect(provider.calls).toHaveLength(0);
    expect(hits.map((h) => h.record.text)).toEqual(['alpha gizmo']);
  });

  it('the defaultable key set excludes the trust predicates', () => {
    expectTypeOf<keyof SemanticSearchDefaults>().toEqualTypeOf<
      | 'multiQuery'
      | 'hyde'
      | 'expandHops'
      | 'entityMatch'
      | 'graphScoring'
      | 'fusion'
      | 'decay'
      | 'candidateTopK'
    >();
  });
});
