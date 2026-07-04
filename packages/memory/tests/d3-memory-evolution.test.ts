/**
 * D3 memory-architecture tests: retrieval-frequency reinforcement in
 * salience (pure), the learned-context digest pass (pure helpers +
 * deep-phase e2e against the in-memory fixture), the owner
 * principal filter at the tier level, and runbook search (fallback
 * path + gated tool registration).
 */

import type { Provider, ProviderRequest, ProviderResponse, SessionScope } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import {
  ACCESS_REINFORCEMENT_SATURATION,
  DEFAULT_SALIENCE_WEIGHTS,
  salience,
} from '../src/consolidator/decay.js';
import {
  buildLearnedContextRequest,
  LEARNED_CONTEXT_BLOCK_LABEL,
  normalizeLearnedContext,
} from '../src/consolidator/phases/learned-context.js';
import { createMemory } from '../src/index.js';
import { createInMemoryStore, InMemoryEmbeddingRegistry } from './fixtures/in-memory-store.js';

const SCOPE: SessionScope = { userId: 'alex', sessionId: 's1' };
const T0 = '2026-05-01T00:00:00.000Z';
const T1 = '2026-05-01T01:00:00.000Z';

describe('salience access reinforcement (D3)', () => {
  const base = {
    now: Date.parse(T1),
    lastAccessedAt: null,
    createdAt: Date.parse(T0),
    strength: 1,
    tauDays: 7,
    importance: null,
    quarantined: false,
    foreignProvenance: false,
  };

  it('is byte-identical at the default weight 0 regardless of count', () => {
    const before = salience(base);
    expect(salience({ ...base, accessCount: 0 })).toBe(before);
    expect(salience({ ...base, accessCount: 500 })).toBe(before);
    expect(salience({ ...base, accessCount: 500, weights: DEFAULT_SALIENCE_WEIGHTS })).toBe(before);
  });

  it('stretches retention by up to the configured weight, saturating', () => {
    const weights = { ...DEFAULT_SALIENCE_WEIGHTS, accessReinforcement: 0.3 };
    const cold = salience({ ...base, accessCount: 0, weights });
    const warm = salience({ ...base, accessCount: 4, weights });
    const saturated = salience({
      ...base,
      accessCount: ACCESS_REINFORCEMENT_SATURATION,
      weights,
    });
    const past = salience({ ...base, accessCount: 100_000, weights });
    expect(cold).toBe(salience(base));
    expect(warm).toBeGreaterThan(cold);
    expect(saturated).toBeCloseTo(salience(base) * 1.3, 10);
    // log1p-saturating: everything past the saturation count is capped.
    expect(past).toBe(saturated);
  });
});

describe('learned-context pure helpers (D3)', () => {
  it('normalizeLearnedContext strips fences, clamps, and rejects empties', () => {
    expect(normalizeLearnedContext('```text\nDigest body.\n```', 100)).toBe('Digest body.');
    expect(normalizeLearnedContext('   \n ', 100)).toBeNull();
    expect(normalizeLearnedContext('```\n\n```', 100)).toBeNull();
    const clamped = normalizeLearnedContext('x'.repeat(50), 10);
    expect(clamped).toBe('x'.repeat(10));
  });

  it('buildLearnedContextRequest carries budget, previous digest, and evidence', () => {
    const req = buildLearnedContextRequest({
      previous: 'Old digest.',
      episodes: ['ran a marathon block'],
      insights: ['user prefers mornings'],
      procedures: ['Deploy the docs site'],
      maxChars: 800,
    });
    expect(req.systemMessage).toContain('learned-context block');
    const user = req.messages[0];
    expect(user?.role).toBe('user');
    const content = typeof user?.content === 'string' ? user.content : '';
    expect(content).toContain('Character budget: 800');
    expect(content).toContain('Old digest.');
    expect(content).toContain('ran a marathon block');
    expect(content).toContain('user prefers mornings');
    expect(content).toContain('Deploy the docs site');
  });
});

function learnedContextProvider(): Provider & { readonly calls: ProviderRequest[] } {
  const calls: ProviderRequest[] = [];
  return {
    id: () => 'fixture-learned-context',
    capabilities: () => ({ streaming: false, tools: false }),
    async generate(req: ProviderRequest): Promise<ProviderResponse> {
      calls.push(req);
      const sys = req.systemMessage ?? '';
      if (sys.includes('learned-context block')) {
        return {
          text: 'Alex is in a marathon training block; prefers evening sessions.',
          usage: { promptTokens: 20, completionTokens: 12, totalTokens: 32 },
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

async function setupDeep(consolidatorExtra: Record<string, unknown>): Promise<{
  memory: ReturnType<typeof createMemory>;
  provider: ReturnType<typeof learnedContextProvider>;
}> {
  const provider = learnedContextProvider();
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
      provider,
      defaultScope: SCOPE,
      // Isolate the pass under test: reflection off.
      reflection: false,
      ...consolidatorExtra,
    },
  });
  await memory.consolidator.start();
  return { memory, provider };
}

describe('consolidator deep phase — learned-context digest (D3)', () => {
  it('rewrites the learned_context block from evidence when enabled', async () => {
    const { memory, provider } = await setupDeep({ learnedContext: true });
    await memory.episodic.record(SCOPE, {
      summary: 'Long run: marathon training block, week 3.',
      startedAt: T0,
      endedAt: T1,
      importance: 0.9,
      provenance: 'extraction',
      status: 'quarantined',
    });

    const outcome = await memory.consolidator.fireNow('deep', SCOPE);
    expect(outcome?.learnedContextUpdated).toBe(true);
    const digest = await memory.working.read(SCOPE, LEARNED_CONTEXT_BLOCK_LABEL);
    expect(digest).toContain('marathon training block');
    // Exactly one learned-context call (no conflicts, reflection off).
    const lcCalls = provider.calls.filter((r) =>
      (r.systemMessage ?? '').includes('learned-context block'),
    );
    expect(lcCalls.length).toBe(1);
  });

  it('stays inert by default and skips the paid call with no evidence', async () => {
    const inert = await setupDeep({});
    await inert.memory.episodic.record(SCOPE, {
      summary: 'Some episode.',
      startedAt: T0,
      endedAt: T1,
      importance: 0.5,
    });
    const outcome = await inert.memory.consolidator.fireNow('deep', SCOPE);
    expect(outcome?.learnedContextUpdated).toBeUndefined();
    expect(await inert.memory.working.read(SCOPE, LEARNED_CONTEXT_BLOCK_LABEL)).toBeNull();
    expect(inert.provider.calls.length).toBe(0);

    // Enabled but zero evidence ⇒ pass runs, makes no LLM call.
    const empty = await setupDeep({ learnedContext: true });
    const emptyOutcome = await empty.memory.consolidator.fireNow('deep', SCOPE);
    expect(emptyOutcome?.learnedContextUpdated).toBe(false);
    expect(empty.provider.calls.length).toBe(0);
  });
});

describe('owner principal filter at the tier level (D3)', () => {
  it('post-filters fused results by owner, treating absent as user', async () => {
    const store = createInMemoryStore();
    const memory = createMemory({ store, embeddings: new InMemoryEmbeddingRegistry() });
    await memory.semantic.remember(SCOPE, { text: 'project deadline is friday' });
    await memory.semantic.remember(SCOPE, {
      text: 'project deadline pressure is rising',
      owner: 'agent',
    });

    const all = await memory.semantic.search(SCOPE, 'project deadline');
    expect(all.length).toBe(2);

    const agentOnly = await memory.semantic.search(SCOPE, 'project deadline', {
      owner: 'agent',
    });
    expect(agentOnly.length).toBe(1);
    expect(agentOnly[0]?.record.owner).toBe('agent');

    const userOnly = await memory.semantic.search(SCOPE, 'project deadline', { owner: 'user' });
    expect(userOnly.length).toBe(1);
    expect(userOnly[0]?.record.owner).toBeUndefined();
  });
});

describe('runbook search (D3)', () => {
  it('falls back to an offline lexical scan on adapters without rules FTS', async () => {
    const store = createInMemoryStore();
    const memory = createMemory({ store, embeddings: new InMemoryEmbeddingRegistry() });
    await memory.procedural.define(SCOPE, {
      text: 'Deploy the docs site\n1. build the site\n2. push to pages',
      steps: ['build the site', 'push to pages'],
    });
    await memory.procedural.define(SCOPE, { text: 'Rotate the signing key quarterly' });

    const hits = await memory.procedural.search(SCOPE, 'deploy docs site');
    expect(hits.length).toBe(1);
    expect(hits[0]?.record.steps).toEqual(['build the site', 'push to pages']);
    expect(hits[0]?.signals?.['lexical']).toBeGreaterThan(0);

    const none = await memory.procedural.search(SCOPE, 'unrelated query zebra');
    expect(none.length).toBe(0);
  });

  it('registers the runbook_search tool only on opt-in', async () => {
    const store = createInMemoryStore();
    const base = createMemory({ store, embeddings: new InMemoryEmbeddingRegistry() });
    expect(base.tools.map((t) => t.name)).not.toContain('runbook_search');
    expect(base.tools.length).toBe(11);

    const opted = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
      runbookSearch: true,
    });
    expect(opted.tools.map((t) => t.name)).toContain('runbook_search');
    expect(opted.tools.length).toBe(12);
  });
});
