/**
 * Integration tests for the neighbour-aware write reconciliation loop
 * (P0-3) driven end-to-end through the consolidator standard phase
 * against the in-memory fixture. A bespoke embedder pins each
 * candidate into a chosen conflict zone; a branching provider serves
 * the extraction response and the reconcile response on the same
 * `generate` surface (distinguished by the system prompt).
 */

import type {
  EmbedderProvider,
  Provider,
  ProviderRequest,
  ProviderResponse,
  SessionScope,
} from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { createMemory } from '../src/index.js';
import { createInMemoryStore, InMemoryEmbeddingRegistry } from './fixtures/in-memory-store.js';

const SCOPE: SessionScope = { userId: 'alex', sessionId: 's1' };

function unit(v: ReadonlyArray<number>): Float32Array {
  const n = Math.hypot(...v) || 1;
  return new Float32Array(v.map((x) => x / n));
}

/**
 * Embedder that maps a text to a unit vector by the first matching
 * substring, so tests can pin cosine similarity into a chosen zone.
 */
function zoneEmbedder(
  map: ReadonlyArray<readonly [string, ReadonlyArray<number>]>,
  fallback: ReadonlyArray<number>,
): EmbedderProvider {
  const dim = fallback.length;
  return {
    id: () => `test:zone@${dim}`,
    dim: () => dim,
    configHash: () => 'zone-cfg',
    async embed(texts) {
      return texts.map((t) => {
        const lower = t.toLowerCase();
        for (const [key, vec] of map) {
          if (lower.includes(key)) return unit(vec);
        }
        return unit(fallback);
      });
    },
  };
}

/**
 * Provider that returns the extraction payload on the extraction prompt
 * and a reconcile decision on the reconcile prompt, counting reconcile
 * calls so the pre-filter short-circuit can be asserted.
 */
function reconcileProvider(opts: {
  facts: ReadonlyArray<Record<string, unknown>>;
  reconcile?: (promptContent: string) => Record<string, unknown>;
}): Provider & { readonly reconcileCalls: number } {
  let reconcileCalls = 0;
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
      const sys = req.systemMessage ?? '';
      if (sys.includes('reconcile')) {
        reconcileCalls += 1;
        const content = String(req.messages[0]?.content ?? '');
        const decision = opts.reconcile?.(content) ?? { action: 'add', reason: 'test-default' };
        return {
          text: JSON.stringify(decision),
          usage: { promptTokens: 5, completionTokens: 2, totalTokens: 7 },
          finishReason: 'stop',
        };
      }
      return {
        text: JSON.stringify({ facts: opts.facts }),
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        finishReason: 'stop',
      };
    },
    stream: () => {
      throw new Error('not implemented');
    },
    get reconcileCalls() {
      return reconcileCalls;
    },
  };
}

function firstNeighborId(promptContent: string): string {
  return /\[id: (fact_[a-z0-9]+)\]/.exec(promptContent)?.[1] ?? '';
}

async function setup(opts: { embedder: EmbedderProvider; provider: Provider }): Promise<{
  memory: ReturnType<typeof createMemory>;
  audit: () => ReadonlyArray<{ decision: string; existingId?: string; stage: string }>;
}> {
  const store = createInMemoryStore({ withConflictStore: true, withConsolidatorStore: true });
  const memory = createMemory({
    store,
    embeddings: new InMemoryEmbeddingRegistry(),
    embedder: opts.embedder,
    consolidator: { tier: 'standard', provider: opts.provider, defaultScope: SCOPE },
  });
  await memory.consolidator.start();
  return {
    memory,
    audit: () => store.__conflicts?.audit ?? [],
  };
}

describe('consolidator standard phase — neighbour-aware reconcile (P0-3)', () => {
  it('update: a changed fact supersedes its neighbour (bi-temporal, no delete)', async () => {
    const provider = reconcileProvider({
      facts: [{ text: 'The user now uses Rust as their main language' }],
      reconcile: (content) => ({
        action: 'update',
        targetId: firstNeighborId(content),
        reason: 'switched to Rust',
      }),
    });
    const { memory, audit } = await setup({
      embedder: zoneEmbedder(
        [
          ['python', [1, 0, 0]],
          ['rust', [0.6, 0.8, 0]],
        ],
        [0, 0, 1],
      ),
      provider,
    });
    // Pre-seed the existing (first-party, active) fact.
    const python = await memory.semantic.remember(SCOPE, {
      text: 'Primary programming language is Python',
    });
    await memory.session.push(SCOPE, { role: 'user', content: 'I switched to Rust this year.' });

    const outcome = await memory.consolidator.fireNow('standard', SCOPE);
    expect(outcome?.factsUpdated).toBe(1);
    expect(outcome?.factsCreated).toBe(0);
    expect(provider.reconcileCalls).toBe(1);

    // Bi-temporal supersede chain: old fact closed + linked, new fact
    // quarantined (P1-4) and pointing back at the old one.
    const chain = await memory.semantic.history(SCOPE, python.id);
    expect(chain.map((f) => f.id)).toEqual([python.id, chain[1]?.id]);
    expect(chain).toHaveLength(2);
    const newFact = chain[1];
    expect(newFact?.supersedes).toBe(python.id);
    expect(newFact?.status).toBe('quarantined');
    expect(newFact?.provenance).toBe('extraction');
    expect(chain[0]?.supersededBy).toBe(newFact?.id);
    expect(chain[0]?.validTo).toBeDefined(); // old interval closed

    // The supersede is auditable in fact_conflicts.
    const supersede = audit().find((a) => a.decision === 'supersede');
    expect(supersede?.existingId).toBe(python.id);
  });

  it('noop: a near-duplicate is deduped without an LLM call and writes no new fact', async () => {
    const provider = reconcileProvider({
      facts: [{ text: 'The user really loves espresso' }],
    });
    const { memory, audit } = await setup({
      embedder: zoneEmbedder(
        [
          ['really', [0.9, 0.436, 0]], // cosine 0.9 with the existing fact → near-dup
          ['espresso', [1, 0, 0]],
        ],
        [0, 0, 1],
      ),
      provider,
    });
    await memory.semantic.remember(SCOPE, { text: 'Loves espresso' });
    await memory.session.push(SCOPE, { role: 'user', content: 'I really love espresso.' });

    const outcome = await memory.consolidator.fireNow('standard', SCOPE);
    expect(outcome?.factsCreated).toBe(0);
    expect(outcome?.factsUpdated).toBe(0);
    expect(provider.reconcileCalls).toBe(0); // pre-filter short-circuited the dedup

    // No new fact landed — only the pre-seeded one exists.
    const all = await memory.semantic.search(SCOPE, 'espresso', { includeQuarantined: true });
    expect(all).toHaveLength(1);
    expect(audit().some((a) => a.decision === 'dedup')).toBe(true);
  });

  it('add: an independent candidate is added (quarantined per P1-4), no LLM call', async () => {
    const provider = reconcileProvider({
      facts: [{ text: 'The user has a golden retriever named Soda' }],
    });
    const { memory } = await setup({
      embedder: zoneEmbedder([], [0, 0, 1]),
      provider,
    });
    await memory.session.push(SCOPE, {
      role: 'user',
      content: 'My dog Soda is a golden retriever.',
    });

    const outcome = await memory.consolidator.fireNow('standard', SCOPE);
    expect(outcome?.factsCreated).toBe(1);
    expect(provider.reconcileCalls).toBe(0); // no neighbours → cold → add

    expect((await memory.semantic.search(SCOPE, 'Soda')).length).toBe(0); // quarantined
    const surfaced = await memory.semantic.search(SCOPE, 'Soda', { includeQuarantined: true });
    expect(surfaced[0]?.record.status).toBe('quarantined');
    expect(surfaced[0]?.record.provenance).toBe('extraction');
  });

  it('pre-filter spends an LLM call only on the mid-zone candidate', async () => {
    const provider = reconcileProvider({
      facts: [
        { text: 'The user enjoys rock climbing' }, // cold → add (no LLM)
        { text: 'The user now codes in Rust mostly' }, // mid vs Python → reconcile (LLM)
      ],
      reconcile: () => ({ action: 'add', reason: 'independent after all' }),
    });
    const { memory } = await setup({
      embedder: zoneEmbedder(
        [
          ['python', [1, 0, 0]],
          ['rust', [0.6, 0.8, 0]],
        ],
        [0, 0, 1], // fallback (rock climbing) is orthogonal to both
      ),
      provider,
    });
    await memory.semantic.remember(SCOPE, { text: 'Primary language is Python' });
    await memory.session.push(SCOPE, { role: 'user', content: 'Climbing + Rust update.' });

    const outcome = await memory.consolidator.fireNow('standard', SCOPE);
    // Exactly one reconcile call — for the single mid-zone candidate.
    expect(provider.reconcileCalls).toBe(1);
    // Both candidates ended up added (cold directly, mid via reconcile→add).
    expect(outcome?.factsCreated).toBe(2);
  });
});
