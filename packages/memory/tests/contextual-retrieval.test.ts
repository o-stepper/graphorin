/**
 * Tests for contextual retrieval (P1-3): the pure late-chunk builder,
 * the LLM-context enrichment (with its resilient fallbacks), the
 * write-path modes wired through `createMemory` against the in-memory
 * fixture (offline default vs `'off'`), a deterministic token-overlap
 * embedder showing the contextual embedding lands closer to a
 * vaguely-worded query than the bare text, and the consolidator-only
 * `'llm'` mode driven through the standard phase. A branching provider
 * serves the extraction + situating-context responses on one `generate`
 * surface, keyed off the distinctive system prompts.
 */

import type {
  EmbedderProvider,
  Provider,
  ProviderRequest,
  ProviderResponse,
  SessionScope,
} from '@graphorin/core';
import { describe, expect, expectTypeOf, it } from 'vitest';
import type { ContextualRetrievalMode, CreateMemoryOptions } from '../src/index.js';
import { createMemory } from '../src/index.js';
import {
  buildSituatingContext,
  contextualize,
  contextualizeWithLlm,
} from '../src/internal/contextualize.js';
import { createInMemoryStore, InMemoryEmbeddingRegistry } from './fixtures/in-memory-store.js';

const SCOPE: SessionScope = { userId: 'alex', sessionId: 's1' };

// ---------------------------------------------------------------------------
// buildSituatingContext — deterministic, signals-only
// ---------------------------------------------------------------------------

describe('buildSituatingContext (P1-3)', () => {
  it('is empty when no structured signals are present', () => {
    expect(buildSituatingContext({ text: 'moved there in March' })).toBe('');
  });

  it('renders a subject/predicate/object relation as one phrase', () => {
    expect(
      buildSituatingContext({
        text: 'x',
        subject: 'Anna',
        predicate: 'lives in',
        object: 'Berlin',
      }),
    ).toBe('[Context: Anna lives in Berlin]');
  });

  it('includes whichever of subject / object exist when the triple is incomplete', () => {
    expect(buildSituatingContext({ text: 'x', subject: 'Anna' })).toBe('[Context: Anna]');
    expect(buildSituatingContext({ text: 'x', object: 'Berlin' })).toBe('[Context: Berlin]');
  });

  it('adds a date-only timeframe and topics, entities first', () => {
    expect(
      buildSituatingContext({
        text: 'x',
        subject: 'Anna',
        tags: ['relocation', 'travel'],
        validFrom: '2024-03-15T08:00:00.000Z',
      }),
    ).toBe('[Context: Anna; as of 2024-03-15; topics: relocation, travel]');
  });

  it('ignores whitespace-only / empty fields', () => {
    expect(buildSituatingContext({ text: 'x', subject: '  ', tags: ['', '  '] })).toBe('');
  });
});

describe('contextualize — late-chunk (P1-3)', () => {
  it('returns the canonical text unchanged when there is no context', () => {
    expect(contextualize({ text: 'moved there in March' })).toBe('moved there in March');
  });

  it('prepends the situating context on its own line', () => {
    expect(contextualize({ text: 'moved there in March', subject: 'Anna' })).toBe(
      '[Context: Anna]\nmoved there in March',
    );
  });
});

// ---------------------------------------------------------------------------
// contextualizeWithLlm — opt-in enrichment with resilient fallbacks
// ---------------------------------------------------------------------------

function fixedProvider(over: {
  text?: string;
  throws?: boolean;
}): Provider & { calls: ProviderRequest[] } {
  const calls: ProviderRequest[] = [];
  return {
    name: 'fake',
    modelId: 'fake:test',
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
    async generate(req: ProviderRequest): Promise<ProviderResponse> {
      calls.push(req);
      if (over.throws === true) throw new Error('boom');
      return {
        text: over.text ?? '',
        usage: { promptTokens: 7, completionTokens: 3, totalTokens: 10 },
        finishReason: 'stop',
      };
    },
    stream: () => {
      throw new Error('not implemented');
    },
    get calls() {
      return calls;
    },
  };
}

describe('contextualizeWithLlm — opt-in enrichment (P1-3)', () => {
  it('prepends the model prefix and keeps the canonical text; returns usage', async () => {
    const provider = fixedProvider({ text: 'Anna relocated to Berlin.' });
    const res = await contextualizeWithLlm(
      {
        text: 'moved there in March',
        subject: 'Anna',
        predicate: 'relocated to',
        object: 'Berlin',
        tags: ['relocation'],
        validFrom: '2024-03-15T08:00:00.000Z',
      },
      provider,
    );
    expect(res.indexText).toBe('Anna relocated to Berlin.\nmoved there in March');
    expect(res.usage.totalTokens).toBe(10);
    expect(provider.calls).toHaveLength(1);
    expect(provider.calls[0]?.systemMessage).toContain('situating-context');
    // The user prompt carries the structured hints alongside the verbatim
    // memory, never overwriting it.
    const userContent = provider.calls[0]?.messages[0]?.content;
    expect(userContent).toContain('moved there in March');
    expect(userContent).toContain('subject=Anna');
    expect(userContent).toContain('predicate=relocated to');
    expect(userContent).toContain('object=Berlin');
    expect(userContent).toContain('tags=relocation');
    expect(userContent).toContain('validFrom=2024-03-15T08:00:00.000Z');
  });

  it('falls back to deterministic late-chunk on an empty completion (usage still recorded)', async () => {
    const provider = fixedProvider({ text: '   ' });
    const res = await contextualizeWithLlm(
      { text: 'moved there in March', subject: 'Anna' },
      provider,
    );
    expect(res.indexText).toBe('[Context: Anna]\nmoved there in March');
    expect(res.usage.totalTokens).toBe(10);
  });

  it('falls back to late-chunk at zero cost on a provider error (never wedges the write)', async () => {
    const provider = fixedProvider({ throws: true });
    const res = await contextualizeWithLlm(
      { text: 'moved there in March', subject: 'Anna' },
      provider,
    );
    expect(res.indexText).toBe('[Context: Anna]\nmoved there in March');
    expect(res.usage.totalTokens).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Write-path modes through createMemory (lexical surface)
// ---------------------------------------------------------------------------

describe('SemanticMemory write-path contextualization (P1-3)', () => {
  it('late-chunk (default) makes a structured fact findable by its context token', async () => {
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
    });
    const fact = await memory.semantic.remember(SCOPE, {
      text: 'moved there in March',
      subject: 'Anna',
    });
    // "Anna" appears only in the situating context, yet the fact is found…
    const hits = await memory.semantic.search(SCOPE, 'Anna');
    expect(hits.map((h) => h.record.id)).toContain(fact.id);
    // …and the persisted / returned text is the canonical one.
    expect(hits[0]?.record.text).toBe('moved there in March');
    const got = await memory.semantic.get(SCOPE, fact.id);
    expect(got?.text).toBe('moved there in March');
  });

  it("'off' indexes the bare text — the context token misses, the text token hits", async () => {
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
      contextualRetrieval: 'off',
    });
    const fact = await memory.semantic.remember(SCOPE, {
      text: 'moved there in March',
      subject: 'Anna',
    });
    expect((await memory.semantic.search(SCOPE, 'Anna')).map((h) => h.record.id)).not.toContain(
      fact.id,
    );
    expect((await memory.semantic.search(SCOPE, 'March')).map((h) => h.record.id)).toContain(
      fact.id,
    );
  });

  it('late-chunk is a no-op for a plain-text fact (no structured signals)', async () => {
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
    });
    const fact = await memory.semantic.remember(SCOPE, { text: 'enjoys hiking on weekends' });
    // No signals ⇒ index text equals canonical text ⇒ nothing extra is matchable.
    expect((await memory.semantic.search(SCOPE, 'Context')).map((h) => h.record.id)).not.toContain(
      fact.id,
    );
    expect((await memory.semantic.search(SCOPE, 'hiking')).map((h) => h.record.id)).toContain(
      fact.id,
    );
  });
});

// ---------------------------------------------------------------------------
// Vector surface — contextual embedding is closer to a vague query
// ---------------------------------------------------------------------------

/** Deterministic bag-of-words embedder: shared tokens ⇒ positive cosine. */
function bagOfWordsEmbedder(dim = 64): EmbedderProvider {
  const embed = (text: string): Float32Array => {
    const out = new Float32Array(dim);
    for (const tok of text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 0)) {
      let h = 2166136261;
      for (let i = 0; i < tok.length; i++) {
        h ^= tok.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      const idx = (h >>> 0) % dim;
      out[idx] = (out[idx] ?? 0) + 1;
    }
    let norm = 0;
    for (let i = 0; i < dim; i++) norm += (out[i] ?? 0) ** 2;
    norm = Math.sqrt(norm) || 1;
    for (let i = 0; i < dim; i++) out[i] = (out[i] ?? 0) / norm;
    return out;
  };
  return {
    id: () => 'bow:test@64',
    dim: () => dim,
    configHash: () => 'bow',
    async embed(texts) {
      return texts.map(embed);
    },
  };
}

function cosine(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += (a[i] ?? 0) * (b[i] ?? 0);
  return dot;
}

describe('contextual embedding vs bare embedding (P1-3)', () => {
  it('the contextualized text is closer to a vague query than the bare text', async () => {
    const embedder = bagOfWordsEmbedder();
    const input = { text: 'moved there in March', subject: 'Anna', tags: ['relocation'] };
    const [query] = await embedder.embed(['anna relocation']);
    const [bare] = await embedder.embed([input.text]);
    const [ctx] = await embedder.embed([contextualize(input)]);
    const bareSim = cosine(query as Float32Array, bare as Float32Array);
    const ctxSim = cosine(query as Float32Array, ctx as Float32Array);
    expect(bareSim).toBe(0); // bare text shares no tokens with the query
    expect(ctxSim).toBeGreaterThan(bareSim); // the context tokens close the gap
  });

  it('search surfaces a contextualized fact through the vector path', async () => {
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
      embedder: bagOfWordsEmbedder(),
    });
    const fact = await memory.semantic.remember(SCOPE, {
      text: 'moved there in March',
      subject: 'Anna',
      tags: ['relocation'],
    });
    const hits = await memory.semantic.search(SCOPE, 'anna relocation');
    expect(hits.map((h) => h.record.id)).toContain(fact.id);
  });
});

// ---------------------------------------------------------------------------
// Consolidator-only `'llm'` mode through the standard phase
// ---------------------------------------------------------------------------

/** Branching provider: extraction + situating-context on one surface. */
function standardProvider(): Provider & { ctxCalls: () => number } {
  const calls: ProviderRequest[] = [];
  return {
    name: 'fake',
    modelId: 'fake:test',
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
    async generate(req: ProviderRequest): Promise<ProviderResponse> {
      calls.push(req);
      const sys = req.systemMessage ?? '';
      if (sys.includes('situating-context')) {
        return {
          text: 'Anna relocated to Berlin.',
          usage: { promptTokens: 7, completionTokens: 3, totalTokens: 10 },
          finishReason: 'stop',
        };
      }
      if (sys.includes('memory-extraction')) {
        return {
          text: JSON.stringify({ facts: [{ text: 'moved there in March', subject: 'Anna' }] }),
          usage: { promptTokens: 12, completionTokens: 8, totalTokens: 20 },
          finishReason: 'stop',
        };
      }
      // Episode summary (formEpisodes off here) / anything else.
      return {
        text: JSON.stringify({ summary: '' }),
        usage: { promptTokens: 3, completionTokens: 1, totalTokens: 4 },
        finishReason: 'stop',
      };
    },
    stream: () => {
      throw new Error('not implemented');
    },
    ctxCalls: () =>
      calls.filter((c) => (c.systemMessage ?? '').includes('situating-context')).length,
  };
}

describe('consolidator `llm` contextual retrieval (P1-3)', () => {
  it('enriches a standard-phase write with one LLM-context call; canonical text preserved', async () => {
    const provider = standardProvider();
    const memory = createMemory({
      store: createInMemoryStore({ withConsolidatorStore: true }),
      embeddings: new InMemoryEmbeddingRegistry(),
      consolidator: {
        tier: 'standard',
        provider,
        defaultScope: SCOPE,
        contextualRetrieval: 'llm',
        formEpisodes: false,
      },
    });
    await memory.consolidator.start();
    await memory.session.push(SCOPE, { role: 'user', content: 'Anna moved to Berlin in March.' });

    const outcome = await memory.consolidator.fireNow('standard', SCOPE);
    expect(outcome?.factsCreated).toBe(1);
    expect(provider.ctxCalls()).toBe(1);

    // "Berlin" appears only in the LLM-authored situating prefix.
    const byPrefix = await memory.semantic.search(SCOPE, 'Berlin', { includeQuarantined: true });
    expect(byPrefix).toHaveLength(1);
    expect(byPrefix[0]?.record.text).toBe('moved there in March'); // canonical preserved
  });

  it('late-chunk (default) makes no situating-context call; uses deterministic context', async () => {
    const provider = standardProvider();
    const memory = createMemory({
      store: createInMemoryStore({ withConsolidatorStore: true }),
      embeddings: new InMemoryEmbeddingRegistry(),
      consolidator: {
        tier: 'standard',
        provider,
        defaultScope: SCOPE,
        formEpisodes: false,
      },
    });
    await memory.consolidator.start();
    await memory.session.push(SCOPE, { role: 'user', content: 'Anna moved to Berlin in March.' });

    const outcome = await memory.consolidator.fireNow('standard', SCOPE);
    expect(outcome?.factsCreated).toBe(1);
    expect(provider.ctxCalls()).toBe(0); // no LLM contextualization on late-chunk

    // The extraction subject ("Anna") rides the deterministic late-chunk
    // context; the LLM-only "Berlin" does not.
    expect((await memory.semantic.search(SCOPE, 'Anna', { includeQuarantined: true })).length).toBe(
      1,
    );
    expect(
      (await memory.semantic.search(SCOPE, 'Berlin', { includeQuarantined: true })).length,
    ).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Type-level
// ---------------------------------------------------------------------------

describe('contextual retrieval — types (P1-3)', () => {
  it('exposes the mode union and config knobs', () => {
    expectTypeOf<ContextualRetrievalMode>().toEqualTypeOf<'off' | 'late-chunk' | 'llm'>();
    expectTypeOf<CreateMemoryOptions['contextualRetrieval']>().toEqualTypeOf<
      'off' | 'late-chunk' | undefined
    >();
    expectTypeOf<
      NonNullable<CreateMemoryOptions['consolidator']>['contextualRetrieval']
    >().toEqualTypeOf<ContextualRetrievalMode | undefined>();
  });
});
