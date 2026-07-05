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

describe('types', () => {
  it('exposes the P2-3 search + facade options', () => {
    expectTypeOf<FactSearchOptions['multiQuery']>().toEqualTypeOf<number | undefined>();
    expectTypeOf<FactSearchOptions['hyde']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<
      NonNullable<CreateMemoryOptions['queryTransform']>['provider']
    >().toEqualTypeOf<Provider>();
  });
});
