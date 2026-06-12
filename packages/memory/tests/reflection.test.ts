/**
 * Tests for reflection / insight synthesis (P1-1) — the pure
 * parse/rank helpers, the `InsightMemory` read surface, and the
 * end-to-end deep-phase reflection flow driven through the
 * consolidator against the in-memory fixture. A branching provider
 * serves the salient-questions, insight-synthesis, and conflict-judge
 * responses on the same `generate` surface, keyed off the distinctive
 * system prompts.
 */

import type {
  Fact,
  Insight,
  MemoryHit,
  Provider,
  ProviderRequest,
  ProviderResponse,
  SessionScope,
} from '@graphorin/core';
import { NOOP_TRACER } from '@graphorin/core';
import { describe, expect, expectTypeOf, it } from 'vitest';
import type { ConsolidatorConfig, PhaseOutcome } from '../src/consolidator/index.js';
import { parseInsight, parseQuestions } from '../src/consolidator/phases/reflect.js';
import { createMemory } from '../src/index.js';
import type { InsightMemoryStoreExt } from '../src/internal/storage-adapter.js';
import { capInsightsBelowFacts, InsightMemory } from '../src/tiers/insight-memory.js';
import { createInMemoryStore, InMemoryEmbeddingRegistry } from './fixtures/in-memory-store.js';

const SCOPE: SessionScope = { userId: 'alex', sessionId: 's1' };
const T0 = '2026-05-01T00:00:00.000Z';
const T1 = '2026-05-01T01:00:00.000Z';

describe('parseQuestions — salient-questions parsing (P1-1)', () => {
  it('parses { questions: [...] } and a bare [...]', () => {
    expect(parseQuestions('{"questions":["Why cancel evenings?","Overcommitted?"]}')).toEqual([
      'Why cancel evenings?',
      'Overcommitted?',
    ]);
    expect(parseQuestions('["A?","B?"]')).toEqual(['A?', 'B?']);
  });

  it('tolerates fenced + chatty output and trims / drops empties', () => {
    const fenced = 'Sure:\n```json\n{"questions":["  Trim me  ",""," ","Keep"]}\n```\n';
    expect(parseQuestions(fenced)).toEqual(['Trim me', 'Keep']);
  });

  it('returns [] for unusable input', () => {
    expect(parseQuestions('not json')).toEqual([]);
    expect(parseQuestions('{"facts":[]}')).toEqual([]);
    expect(parseQuestions(undefined)).toEqual([]);
    expect(parseQuestions('')).toEqual([]);
  });
});

describe('parseInsight — insight-synthesis parsing (P1-1)', () => {
  it('parses { insight } and falls back to { text }', () => {
    expect(parseInsight('{"insight":"They overcommit on evenings."}')).toBe(
      'They overcommit on evenings.',
    );
    expect(parseInsight('{"text":"Fallback field."}')).toBe('Fallback field.');
  });

  it('tolerates a fenced object', () => {
    expect(parseInsight('```json\n{"insight":"Fenced."}\n```')).toBe('Fenced.');
  });

  it('returns null for empty / whitespace / unparseable / array', () => {
    expect(parseInsight('{"insight":"   "}')).toBeNull();
    expect(parseInsight('not json')).toBeNull();
    expect(parseInsight('["nope"]')).toBeNull();
    expect(parseInsight(undefined)).toBeNull();
  });
});

describe('capInsightsBelowFacts — rank ceiling (P1-1)', () => {
  const fact = (id: string, score: number): MemoryHit<Fact> => ({
    record: {
      id,
      kind: 'semantic',
      userId: SCOPE.userId,
      sensitivity: 'internal',
      text: `fact ${id}`,
      createdAt: T0,
    },
    score,
  });
  const insight = (id: string, cites: string[], score: number): MemoryHit<Insight> => ({
    record: {
      id,
      kind: 'insight',
      userId: SCOPE.userId,
      sensitivity: 'internal',
      text: `insight ${id}`,
      cites,
      salience: 2,
      provenance: 'reflection',
      status: 'quarantined',
      createdAt: T0,
    },
    score,
  });

  it('caps an insight strictly below the cited fact it would otherwise outrank', () => {
    const facts = [fact('f1', 0.9)];
    const [capped] = capInsightsBelowFacts(facts, [insight('i1', ['f1'], 0.95)]);
    expect(capped?.score).toBeLessThan(0.9);
    // Sorting the fused set never places the insight above its cited fact.
    const fused = [...facts, capped as MemoryHit].sort((a, b) => b.score - a.score);
    expect(fused[0]?.record.id).toBe('f1');
  });

  it('leaves an insight unchanged when already below, or its cited fact is absent', () => {
    const facts = [fact('f1', 0.9)];
    expect(capInsightsBelowFacts(facts, [insight('i1', ['f1'], 0.2)])[0]?.score).toBe(0.2);
    // Cites a fact not present in the fused fact set ⇒ untouched.
    expect(capInsightsBelowFacts(facts, [insight('i2', ['f-absent'], 0.99)])[0]?.score).toBe(0.99);
    // No facts at all ⇒ untouched.
    expect(capInsightsBelowFacts([], [insight('i3', ['f1'], 0.99)])[0]?.score).toBe(0.99);
  });
});

describe('InsightMemory read surface (P1-1)', () => {
  it('returns empty when the adapter exposes no insight surface', async () => {
    const store = createInMemoryStore(); // no withInsightStore
    const tier = new InsightMemory({ store, tracer: NOOP_TRACER });
    expect(await tier.search(SCOPE, 'anything')).toEqual([]);
    expect(await tier.list(SCOPE)).toEqual([]);
    expect(await tier.get('ins_x')).toBeNull();
  });
});

/** Branching provider keyed on the distinctive reflection prompts. */
function reflectionProvider(
  over: { questions?: string[]; insight?: string } = {},
): Provider & { readonly calls: ReadonlyArray<ProviderRequest> } {
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
      if (sys.includes('salient-questions')) {
        return {
          text: JSON.stringify({ questions: over.questions ?? ['marathon'] }),
          usage: { promptTokens: 8, completionTokens: 4, totalTokens: 12 },
          finishReason: 'stop',
        };
      }
      if (sys.includes('insight-synthesis')) {
        return {
          text: JSON.stringify({
            insight: over.insight ?? 'The user is deeply committed to marathon training.',
          }),
          usage: { promptTokens: 10, completionTokens: 6, totalTokens: 16 },
          finishReason: 'stop',
        };
      }
      // Deep-phase conflict judge (unused here — no pending conflicts).
      return {
        text: JSON.stringify({ decision: 'admit', reason: 'n/a' }),
        usage: { promptTokens: 5, completionTokens: 2, totalTokens: 7 },
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

async function setup(opts: {
  provider: Provider;
  consolidatorExtra?: Record<string, unknown>;
}): Promise<{
  memory: ReturnType<typeof createMemory>;
  store: ReturnType<typeof createInMemoryStore>;
}> {
  const store = createInMemoryStore({
    withConflictStore: true,
    withConsolidatorStore: true,
    withInsightStore: true,
  });
  const memory = createMemory({
    store,
    embeddings: new InMemoryEmbeddingRegistry(),
    consolidator: {
      tier: 'full',
      provider: opts.provider,
      defaultScope: SCOPE,
      ...(opts.consolidatorExtra ?? {}),
    },
  });
  await memory.consolidator.start();
  return { memory, store };
}

/** Seed two importance-bearing quarantined episodes (P1-2 shape). */
async function seedEpisodes(memory: ReturnType<typeof createMemory>): Promise<string[]> {
  const a = await memory.episodic.record(SCOPE, {
    summary: 'Long run: marathon training block, week 3.',
    startedAt: T0,
    endedAt: T1,
    importance: 0.9,
    provenance: 'extraction',
    status: 'quarantined',
  });
  const b = await memory.episodic.record(SCOPE, {
    summary: 'Marathon training: tempo intervals and recovery day.',
    startedAt: T0,
    endedAt: T1,
    importance: 0.9,
    provenance: 'extraction',
    status: 'quarantined',
  });
  return [a.id, b.id];
}

describe('consolidator deep phase — reflection (P1-1)', () => {
  it('synthesizes a quarantined, cited insight when accumulated importance crosses the threshold', async () => {
    const provider = reflectionProvider();
    const { memory } = await setup({
      provider,
      consolidatorExtra: { importanceThreshold: 1.0, reflectionMaxQuestions: 2 },
    });
    const episodeIds = await seedEpisodes(memory);

    const outcome = await memory.consolidator.fireNow('deep', SCOPE);
    expect(outcome?.insightsCreated).toBe(1);
    // Two LLM calls: salient-questions + one insight synthesis. No
    // pending conflicts ⇒ no judge call.
    expect(provider.calls.length).toBe(2);

    // Quarantined (P1-4): excluded from default recall...
    expect((await memory.insights.search(SCOPE, 'marathon')).length).toBe(0);
    // ...surfaced on the inspector path.
    const surfaced = await memory.insights.list(SCOPE, { includeQuarantined: true });
    expect(surfaced).toHaveLength(1);
    const insight = surfaced[0];
    expect(insight?.provenance).toBe('reflection');
    expect(insight?.status).toBe('quarantined');
    expect(insight?.salience).toBe(2);
    // Citations are mandatory + reference the real retrieved episodes.
    expect(insight?.cites.length).toBeGreaterThanOrEqual(1);
    expect(insight?.cites.some((id) => episodeIds.includes(id))).toBe(true);
  });

  it('prunes salience-0 insights during the pass while the fresh insight survives', async () => {
    const provider = reflectionProvider();
    const { memory, store } = await setup({
      provider,
      consolidatorExtra: { importanceThreshold: 1.0 },
    });
    await seedEpisodes(memory);

    // Pre-seed a decayed (salience 0) insight directly through the store.
    const insightStore = store.insights;
    if (insightStore === undefined) throw new Error('expected an insight store');
    await insightStore.insert({
      id: 'ins_dead',
      kind: 'insight',
      userId: SCOPE.userId,
      text: 'A stale, decayed observation.',
      cites: ['ep_old'],
      salience: 0,
      provenance: 'reflection',
      status: 'quarantined',
      sensitivity: 'internal',
      createdAt: T0,
    });

    await memory.consolidator.fireNow('deep', SCOPE);

    const remaining = await memory.insights.list(SCOPE, { includeQuarantined: true });
    // The salience-0 insight was pruned; only the freshly-synthesized one remains.
    expect(remaining.map((i) => i.id)).not.toContain('ins_dead');
    expect(remaining.length).toBe(1);
  });

  it('makes no insight + no LLM call below the importance threshold', async () => {
    const provider = reflectionProvider();
    const { memory } = await setup({ provider, consolidatorExtra: { importanceThreshold: 100 } });
    await seedEpisodes(memory); // sum 1.8 ≪ 100 ⇒ gate fails

    const outcome = await memory.consolidator.fireNow('deep', SCOPE);
    expect(outcome?.insightsCreated).toBe(0);
    expect(provider.calls.length).toBe(0);
    expect((await memory.insights.list(SCOPE, { includeQuarantined: true })).length).toBe(0);
  });

  it('does not reflect when reflection is off for the tier (standard)', async () => {
    const provider = reflectionProvider();
    const { memory } = await setup({
      provider,
      consolidatorExtra: { tier: 'standard', importanceThreshold: 1.0 },
    });
    await seedEpisodes(memory);

    const outcome = await memory.consolidator.fireNow('deep', SCOPE);
    expect(outcome?.insightsCreated).toBe(0);
    expect(provider.calls.length).toBe(0);
  });
});

describe('reflection types (P1-1)', () => {
  it('exposes the expected public type shapes', () => {
    expectTypeOf<Insight['kind']>().toEqualTypeOf<'insight'>();
    expectTypeOf<Insight['cites']>().toEqualTypeOf<ReadonlyArray<string>>();
    expectTypeOf<Insight['salience']>().toEqualTypeOf<number>();
    expectTypeOf<ConsolidatorConfig['reflection']>().toEqualTypeOf<boolean>();
    expectTypeOf<ConsolidatorConfig['importanceThreshold']>().toEqualTypeOf<number>();
    expectTypeOf<PhaseOutcome['insightsCreated']>().toEqualTypeOf<number>();
    expectTypeOf<InsightMemoryStoreExt['prune']>().toBeFunction();
    expectTypeOf(capInsightsBelowFacts).toBeFunction();
  });
});
