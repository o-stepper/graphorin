import type {
  EmbedderProvider,
  Provider,
  ProviderRequest,
  ProviderResponse,
  SessionScope,
} from '@graphorin/core';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { type CreateMemoryOptions, createMemory, type FactSearchOptions } from '../src/index.js';
import {
  createInMemoryStore,
  createStubEmbedder,
  InMemoryEmbeddingRegistry,
} from './fixtures/in-memory-store.js';

const scope: SessionScope = { userId: 'alex' };

/**
 * Provider stub. An *expansion* request (which sets a structured
 * `outputType`) returns the configured variants as a JSON array; a HyDE
 * request (no `outputType`) returns the configured hypothetical passage.
 */
function spyProvider(
  opts: { variants?: ReadonlyArray<string>; hypothetical?: string } = {},
): Provider & { readonly calls: ProviderRequest[] } {
  const calls: ProviderRequest[] = [];
  return {
    name: 'spy',
    modelId: 'spy:test',
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
    async generate(req: ProviderRequest): Promise<ProviderResponse> {
      calls.push(req);
      const isExpansion = req.outputType !== undefined;
      const text = isExpansion ? JSON.stringify(opts.variants ?? []) : (opts.hypothetical ?? '');
      return {
        text,
        usage: { promptTokens: 5, completionTokens: 5, totalTokens: 10 },
        finishReason: 'stop',
      };
    },
    stream() {
      throw new Error('not implemented');
    },
  };
}

/** Wraps the deterministic stub embedder, recording every embedded text. */
function spyEmbedder(): EmbedderProvider & { readonly embedded: string[] } {
  const embedded: string[] = [];
  const base = createStubEmbedder();
  return {
    embedded,
    id: () => base.id(),
    dim: () => base.dim(),
    configHash: () => base.configHash(),
    async embed(texts, embedOpts) {
      for (const t of texts) embedded.push(t);
      return base.embed(texts, embedOpts);
    },
  };
}

const PIPELINE_OFF = { pipeline: 'off' } as const;

describe('multi-query / RAG-Fusion (P2-3)', () => {
  it('makes no provider call on the default single-shot path', async () => {
    const provider = spyProvider({ variants: ['beta thing'] });
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
      queryTransform: { provider },
    });
    await memory.semantic.remember(scope, { text: 'alpha gizmo' }, PIPELINE_OFF);
    await memory.semantic.remember(scope, { text: 'beta thing' }, PIPELINE_OFF);

    const hits = await memory.semantic.search(scope, 'alpha');

    expect(provider.calls).toHaveLength(0); // offline default - single-shot
    expect(hits.map((h) => h.record.text)).toEqual(['alpha gizmo']);
  });

  it('fans into variants and fuses the variant-only match', async () => {
    const provider = spyProvider({ variants: ['beta thing'] });
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
      queryTransform: { provider },
    });
    await memory.semantic.remember(scope, { text: 'alpha gizmo' }, PIPELINE_OFF);
    await memory.semantic.remember(scope, { text: 'beta thing' }, PIPELINE_OFF);

    const hits = await memory.semantic.search(scope, 'alpha', { multiQuery: 2 });
    const texts = hits.map((h) => h.record.text);

    expect(provider.calls).toHaveLength(1); // one expansion call
    expect(provider.calls[0]?.messages[0]?.content).toContain('up to 1'); // multiQuery - 1
    expect(texts).toContain('alpha gizmo'); // original query list
    expect(texts).toContain('beta thing'); // recovered only via the fused variant list
  });

  it('is a silent no-op (single-shot) when no transformer is configured', async () => {
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
    });
    await memory.semantic.remember(scope, { text: 'alpha gizmo' }, PIPELINE_OFF);
    await memory.semantic.remember(scope, { text: 'beta thing' }, PIPELINE_OFF);

    const hits = await memory.semantic.search(scope, 'alpha', { multiQuery: 3 });

    expect(hits.map((h) => h.record.text)).toEqual(['alpha gizmo']); // beta never retrieved
  });
});

describe('HyDE (P2-3)', () => {
  it('generates + embeds a hypothetical passage only when hyde is on', async () => {
    const pseudo = 'recalled: the runbook lives in confluence';
    const provider = spyProvider({ hypothetical: pseudo });
    const embedder = spyEmbedder();
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
      embedder,
      queryTransform: { provider },
    });
    await memory.semantic.remember(
      scope,
      { text: 'the deploy runbook lives in confluence' },
      PIPELINE_OFF,
    );

    // Control: hyde off ⇒ no hypothetical call, pseudo-doc never embedded.
    embedder.embedded.length = 0;
    provider.calls.length = 0;
    await memory.semantic.search(scope, 'where are the docs', { hyde: false });
    expect(provider.calls).toHaveLength(0);
    expect(embedder.embedded).not.toContain(pseudo);

    // HyDE on ⇒ one (non-structured) hypothetical call; pseudo-doc embedded.
    embedder.embedded.length = 0;
    provider.calls.length = 0;
    await memory.semantic.search(scope, 'where are the docs', { hyde: true });
    expect(provider.calls).toHaveLength(1);
    expect(provider.calls[0]?.outputType).toBeUndefined(); // a HyDE request, not expansion
    expect(embedder.embedded).toContain(pseudo);
  });

  it('W-144: the HyDE leg carries includeSuperseded and owner like the direct vector leg', async () => {
    const provider = spyProvider({ hypothetical: 'recalled: the runbook lives in confluence' });
    const store = createInMemoryStore();
    type SearchVectorFn = NonNullable<typeof store.semantic.searchVector>;
    const original = store.semantic.searchVector;
    if (original === undefined) throw new Error('fixture must expose searchVector');
    const captured: Array<Parameters<SearchVectorFn>> = [];
    (store.semantic as { searchVector: SearchVectorFn }).searchVector = async (...args) => {
      captured.push(args);
      return original.call(store.semantic, ...args);
    };
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      embedder: spyEmbedder(),
      queryTransform: { provider },
    });
    await memory.semantic.remember(
      scope,
      { text: 'the deploy runbook lives in confluence' },
      PIPELINE_OFF,
    );

    captured.length = 0;
    await memory.semantic.search(scope, 'where are the docs', {
      hyde: true,
      includeSuperseded: true,
      owner: 'agent',
    });

    // Direct vector leg + HyDE leg - and BOTH must carry the predicates
    // in-store (the HyDE call used to drop them, so an includeSuperseded
    // audit search silently evaluated that leg validity-now).
    expect(captured).toHaveLength(2);
    for (const args of captured) {
      expect(args[6]).toBe(true);
      expect(args[7]).toBe('agent');
    }
  });

  it('skips the hypothetical LLM call when no embedder is configured', async () => {
    const provider = spyProvider({ hypothetical: 'x' });
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
      queryTransform: { provider }, // no embedder
    });
    await memory.semantic.remember(scope, { text: 'fact' }, PIPELINE_OFF);

    await memory.semantic.search(scope, 'q', { hyde: true });

    expect(provider.calls).toHaveLength(0); // no embedder ⇒ no point generating a passage
  });
});

describe('W-087 batched fan-out embeddings', () => {
  /** Stub embedder that records each embed CALL (not just each text). */
  function callCountingEmbedder(opts: { failBatches?: boolean } = {}): EmbedderProvider & {
    readonly calls: string[][];
  } {
    const calls: string[][] = [];
    const base = createStubEmbedder();
    return {
      calls,
      id: () => base.id(),
      dim: () => base.dim(),
      configHash: () => base.configHash(),
      async embed(texts, embedOpts) {
        calls.push([...texts]);
        if (opts.failBatches === true && texts.length > 1) {
          throw new Error('batch endpoint down');
        }
        return base.embed(texts, embedOpts);
      },
    };
  }

  async function seededMemory(embedder: EmbedderProvider) {
    const provider = spyProvider({ variants: ['beta thing'] });
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
      embedder,
      queryTransform: { provider },
    });
    await memory.semantic.remember(scope, { text: 'alpha gizmo' }, PIPELINE_OFF);
    await memory.semantic.remember(scope, { text: 'beta thing' }, PIPELINE_OFF);
    return memory;
  }

  it('multiQuery=N performs ONE embed call carrying every variant', async () => {
    const embedder = callCountingEmbedder();
    const memory = await seededMemory(embedder);

    embedder.calls.length = 0;
    const hits = await memory.semantic.search(scope, 'alpha', { multiQuery: 2 });

    expect(embedder.calls).toHaveLength(1);
    expect(embedder.calls[0]).toEqual(['alpha', 'beta thing']);
    expect(hits.map((h) => h.record.text)).toContain('beta thing');
  });

  it('the single-shot path still embeds exactly once with one element', async () => {
    const embedder = callCountingEmbedder();
    const memory = await seededMemory(embedder);

    embedder.calls.length = 0;
    await memory.semantic.search(scope, 'alpha');

    expect(embedder.calls).toEqual([['alpha']]);
  });

  it('a failing batch embed degrades to per-variant embedding with identical results', async () => {
    const batched = callCountingEmbedder();
    const flaky = callCountingEmbedder({ failBatches: true });
    const memoryBatched = await seededMemory(batched);
    const memoryFlaky = await seededMemory(flaky);

    flaky.calls.length = 0;
    const hitsBatched = await memoryBatched.semantic.search(scope, 'alpha', { multiQuery: 2 });
    const hitsFlaky = await memoryFlaky.semantic.search(scope, 'alpha', { multiQuery: 2 });

    // Fallback path: the failed batch call, then one single-text call per
    // variant - and the search still succeeds with the same results.
    expect(flaky.calls[0]).toEqual(['alpha', 'beta thing']);
    expect(flaky.calls.slice(1)).toEqual([['alpha'], ['beta thing']]);
    expect(hitsFlaky.map((h) => [h.record.text, h.score])).toEqual(
      hitsBatched.map((h) => [h.record.text, h.score]),
    );
  });
});

describe('types', () => {
  it('exposes the P2-3 search + facade options', () => {
    expectTypeOf<FactSearchOptions['multiQuery']>().toEqualTypeOf<number | undefined>();
    expectTypeOf<FactSearchOptions['hyde']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<
      NonNullable<CreateMemoryOptions['queryTransform']>['provider']
    >().toEqualTypeOf<Provider>();
  });
});
