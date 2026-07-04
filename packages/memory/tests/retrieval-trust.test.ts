/**
 * C5 — retrieval trust & quality:
 * - rank-time trust discount (quarantined / foreign provenance) with the
 *   `trust` signal surfaced through explainRecall
 * - pure trustDiscount factors
 * - offline fusion-weight fitting (fitFusionWeights / ndcgAtK)
 * - extraction decontextualization contract
 */
import type { Fact, MemoryHit } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import { DEFAULT_SALIENCE_WEIGHTS } from '../src/consolidator/decay.js';
import { createMemory } from '../src/facade.js';
import { fitFusionWeights, ndcgAtK } from '../src/search/fit-weights.js';
import { trustDiscount } from '../src/search/trust.js';
import { createInMemoryStore, InMemoryEmbeddingRegistry } from './fixtures/in-memory-store.js';

const scope = { userId: 'u1', sessionId: 's1', agentId: 'a1' };

function makeMemory() {
  return createMemory({
    store: createInMemoryStore(),
    embeddings: new InMemoryEmbeddingRegistry(),
    conflictPipeline: { mode: 'off' },
  });
}

describe('C5 — trustDiscount factors', () => {
  it('is neutral for first-party active facts', () => {
    expect(trustDiscount({ status: 'active', provenance: 'user' })).toBe(1);
    expect(trustDiscount({ status: 'active' })).toBe(1);
    expect(trustDiscount({ status: 'active', provenance: 'extraction' })).toBe(1);
  });

  it('discounts quarantined harder than foreign provenance (quarantine wins)', () => {
    const quarantined = trustDiscount({ status: 'quarantined', provenance: 'user' });
    const foreign = trustDiscount({ status: 'active', provenance: 'imported' });
    expect(quarantined).toBeCloseTo(1 - DEFAULT_SALIENCE_WEIGHTS.quarantine, 12);
    expect(foreign).toBeCloseTo(1 - DEFAULT_SALIENCE_WEIGHTS.foreignProvenance, 12);
    expect(quarantined).toBeLessThan(foreign);
  });
});

describe('C5 — rank-time trust discount in search', () => {
  it('ranks a first-party fact above an equally-similar foreign one and surfaces the trust signal', async () => {
    const memory = makeMemory();
    // Identical text => identical FTS scores; only trust separates them.
    await memory.semantic.remember(scope, {
      text: 'the deploy pipeline password rotation happens on tuesdays',
      provenance: 'imported',
    });
    const mine = await memory.semantic.remember(scope, {
      text: 'the deploy pipeline password rotation happens on tuesdays',
      provenance: 'user',
    });

    const hits = await memory.semantic.search(scope, 'deploy pipeline', { topK: 5 });
    expect(hits.length).toBe(2);
    expect(hits[0]?.record.id).toBe(mine.id);
    const foreignHit = hits.find((h) => h.record.provenance === 'imported');
    expect(foreignHit?.signals?.trust).toBeCloseTo(
      1 - DEFAULT_SALIENCE_WEIGHTS.foreignProvenance,
      12,
    );
    // First-party hits carry NO trust signal (factor 1 leaves them alone).
    const userHit = hits.find((h) => h.record.provenance === 'user');
    expect(userHit?.signals?.trust).toBeUndefined();
  });

  it("trustWeighting: 'off' restores pure similarity ranking", async () => {
    const memory = makeMemory();
    await memory.semantic.remember(scope, {
      text: 'quarterly report cadence is monthly now',
      provenance: 'imported',
    });
    const hits = await memory.semantic.search(scope, 'quarterly report', {
      topK: 5,
      trustWeighting: 'off',
    });
    expect(hits[0]?.signals?.trust).toBeUndefined();
  });
});

describe('C5 — fitFusionWeights', () => {
  const hit = (id: string, score: number): MemoryHit<Fact> =>
    ({ record: { id } as Fact, score }) as MemoryHit<Fact>;

  it('finds weights that beat plain RRF on a vector-favouring fixture', () => {
    // Relevant docs d1/d2 rank top on the VECTOR list and bottom on FTS —
    // up-weighting the vector leg must win.
    const cases = [
      {
        fts: [hit('noise1', 3), hit('noise2', 2), hit('d1', 1)],
        vector: [hit('d1', 0.9), hit('d2', 0.8), hit('noise1', 0.1)],
        relevantIds: ['d1', 'd2'],
      },
      {
        fts: [hit('noise3', 3), hit('d3', 1)],
        vector: [hit('d3', 0.95), hit('d4', 0.9), hit('noise3', 0.2)],
        relevantIds: ['d3', 'd4'],
      },
    ];
    const fit = fitFusionWeights(cases, { k: 3 });
    expect(fit.score).toBeGreaterThan(fit.baseline);
    expect(fit.weights.vector).toBeGreaterThan(fit.weights.fts);
  });

  it('returns unit weights when tuning cannot beat the baseline', () => {
    const cases = [
      {
        fts: [hit('d1', 2), hit('d2', 1)],
        vector: [hit('d1', 0.9), hit('d2', 0.8)],
        relevantIds: ['d1', 'd2'],
      },
    ];
    const fit = fitFusionWeights(cases, { k: 2 });
    expect(fit.weights).toEqual({ fts: 1, vector: 1 });
    expect(fit.score).toBe(fit.baseline);
  });

  it('ndcgAtK is 1 for a perfect ranking and 0 for a miss', () => {
    expect(ndcgAtK(['a', 'b'], new Set(['a', 'b']), 2)).toBe(1);
    expect(ndcgAtK(['x', 'y'], new Set(['a']), 2)).toBe(0);
  });
});

describe('C5 — extraction decontextualization contract', () => {
  it('instructs the extractor to emit self-contained propositions', async () => {
    const captured: string[] = [];
    const provider = {
      name: 'capturing',
      modelId: 'capturing:test',
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
      async generate(req: { systemMessage?: string }) {
        captured.push(req.systemMessage ?? '');
        return {
          text: '{"facts":[]}',
          usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
          finishReason: 'stop' as const,
        };
      },
      stream: () => {
        throw new Error('not implemented');
      },
    };
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
      consolidator: { tier: 'standard', provider: provider as never, defaultScope: scope },
    });
    await memory.session.push(scope, { role: 'user', content: 'She moved to Lisbon last week.' });
    await memory.consolidator.start();
    await memory.consolidator.fireNow('standard', scope);
    await memory.consolidator.stop();

    const extraction = captured.find((s) => s.includes('memory-extraction assistant'));
    expect(extraction).toBeDefined();
    expect(extraction).toContain('self-contained proposition');
    expect(extraction).toContain('resolve pronouns');
  });
});
