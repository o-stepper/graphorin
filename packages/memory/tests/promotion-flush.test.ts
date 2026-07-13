/**
 * Wave-D D4 - deterministic PromotionPolicy (pure verdicts + deep-phase
 * step through the audited validate path), the fail-closed ingest-gate
 * config checks, the W-083 guard on autoPromote supersedes, and the
 * pre-compaction memoryFlushHook.
 */

import type { Provider, ProviderRequest, ProviderResponse } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { resolvePromotionPolicy, shouldPromote } from '../src/consolidator/promotion.js';
import { memoryFlushHook } from '../src/context-engine/compaction/hooks/memory-flush.js';
import type { PreCompactionHookContext } from '../src/context-engine/compaction/types.js';
import { createContextEngine } from '../src/context-engine/engine.js';
import { createMemory, IngestGateRequiredError, verdictIngestGate } from '../src/index.js';
import { createInMemoryStore, InMemoryEmbeddingRegistry } from './fixtures/in-memory-store.js';

const SCOPE = { userId: 'user-1', sessionId: 'sess-1', agentId: 'agent-1' } as const;
const DAY_MS = 24 * 60 * 60 * 1000;

function stubProvider(reply: string | ((req: ProviderRequest) => string)): Provider & {
  readonly calls: ProviderRequest[];
} {
  const calls: ProviderRequest[] = [];
  return {
    name: 'fake',
    modelId: 'fixture-d4',
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
      return {
        text: typeof reply === 'string' ? reply : reply(req),
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
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

describe('shouldPromote (pure policy)', () => {
  const policy = resolvePromotionPolicy({});
  const now = Date.parse('2026-07-10T00:00:00.000Z');
  const base = {
    fact: {
      id: 'f1',
      kind: 'semantic' as const,
      userId: 'user-1',
      sensitivity: 'internal' as const,
      text: 'User lives in Kyiv',
      status: 'quarantined' as const,
      provenance: 'extraction' as const,
      importance: 0.6,
      createdAt: new Date(now - 2 * DAY_MS).toISOString(),
    },
    accessCount: 5,
    uniqueQueryCount: 3,
  };

  it('passes when every threshold clears; each threshold is AND-gated', () => {
    expect(shouldPromote(base, policy, now)).toBe(true);
    expect(shouldPromote({ ...base, accessCount: 2 }, policy, now)).toBe(false);
    expect(shouldPromote({ ...base, uniqueQueryCount: 1 }, policy, now)).toBe(false);
    expect(
      shouldPromote(
        { ...base, fact: { ...base.fact, createdAt: new Date(now - 60_000).toISOString() } },
        policy,
        now,
      ),
    ).toBe(false);
    expect(shouldPromote({ ...base, fact: { ...base.fact, status: 'active' } }, policy, now)).toBe(
      false,
    );
    expect(
      shouldPromote({ ...base, fact: { ...base.fact, provenance: 'imported' } }, policy, now),
    ).toBe(false);
  });

  it('minSalience gates on importance; thresholds are configurable down to zero', () => {
    const strict = resolvePromotionPolicy({ minSalience: 0.8 });
    expect(shouldPromote(base, strict, now)).toBe(false);
    const lax = resolvePromotionPolicy({ minRecalls: 0, minUniqueQueries: 0, minAgeMs: 0 });
    expect(shouldPromote({ ...base, accessCount: 0, uniqueQueryCount: 0 }, lax, now)).toBe(true);
  });
});

describe('promotion step (deep phase)', () => {
  async function setupPromotion() {
    const provider = stubProvider(JSON.stringify({ decision: 'admit', reason: 'n/a' }));
    const store = createInMemoryStore({ withConflictStore: true, withConsolidatorStore: true });
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      ingestGate: verdictIngestGate,
      consolidator: {
        tier: 'full',
        provider,
        defaultScope: SCOPE,
        reflection: false,
        promotion: { minRecalls: 2, minUniqueQueries: 2, minAgeMs: 0 },
      },
    });
    await memory.consolidator.start();
    return { memory, store };
  }

  it('promotes a quarantined fact whose recall evidence clears the thresholds (audited validate)', async () => {
    const { memory } = await setupPromotion();
    const fact = await memory.semantic.remember(SCOPE, {
      text: 'User prefers evening workouts',
      provenance: 'extraction',
    });
    expect(fact.status).toBe('quarantined');
    // Recall evidence: two DISTINCT queries through the quarantine-
    // inclusive search surface (both must lexically hit the fact).
    await memory.semantic.search(SCOPE, 'evening workouts', { includeQuarantined: true });
    await memory.semantic.search(SCOPE, 'prefers evening', { includeQuarantined: true });

    const outcome = await memory.consolidator.fireNow('deep', SCOPE);
    expect(outcome?.factsPromoted).toBe(1);
    const promoted = await memory.semantic.get(SCOPE, fact.id);
    expect(promoted?.status).toBe('active');
  });

  it('leaves under-evidenced facts quarantined and stays inert without config', async () => {
    const { memory } = await setupPromotion();
    const fact = await memory.semantic.remember(SCOPE, {
      text: 'User maybe likes opera',
      provenance: 'extraction',
    });
    // Only ONE distinct query - below minUniqueQueries: 2.
    await memory.semantic.search(SCOPE, 'opera', { includeQuarantined: true });
    const outcome = await memory.consolidator.fireNow('deep', SCOPE);
    expect(outcome?.factsPromoted).toBe(0);
    expect((await memory.semantic.get(SCOPE, fact.id))?.status).toBe('quarantined');

    // No promotion config => the outcome does not even carry the field.
    const provider = stubProvider(JSON.stringify({ decision: 'admit' }));
    const inert = createMemory({
      store: createInMemoryStore({ withConflictStore: true, withConsolidatorStore: true }),
      embeddings: new InMemoryEmbeddingRegistry(),
      consolidator: { tier: 'full', provider, defaultScope: SCOPE, reflection: false },
    });
    await inert.consolidator.start();
    const inertOutcome = await inert.consolidator.fireNow('deep', SCOPE);
    expect(inertOutcome?.factsPromoted).toBeUndefined();
  });
});

describe('fail-closed ingest-gate config checks (wave-D D4)', () => {
  const base = () => ({
    store: createInMemoryStore({}),
    embeddings: new InMemoryEmbeddingRegistry(),
  });

  it('promotion without an ingest gate throws IngestGateRequiredError', () => {
    expect(() =>
      createMemory({
        ...base(),
        consolidator: { tier: 'standard', promotion: {} },
      }),
    ).toThrow(IngestGateRequiredError);
  });

  it('autoPromoteExtraction without an ingest gate throws (documented precondition enforced)', () => {
    expect(() =>
      createMemory({
        ...base(),
        consolidator: { tier: 'standard', autoPromoteExtraction: true },
      }),
    ).toThrow(IngestGateRequiredError);
    // With the gate, both construct fine.
    expect(() =>
      createMemory({
        ...base(),
        ingestGate: verdictIngestGate,
        consolidator: { tier: 'standard', autoPromoteExtraction: true, promotion: {} },
      }),
    ).not.toThrow();
  });
});

describe('memoryFlushHook (pre-compaction flush)', () => {
  function makeMemory(withGate: boolean) {
    const store = createInMemoryStore({});
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      ...(withGate
        ? {
            ingestGate: (record: { readonly message: { readonly role: string } }) =>
              record.message.role === 'user',
          }
        : {}),
    });
    return memory;
  }

  const ctx: PreCompactionHookContext = {
    scope: SCOPE,
    runId: 'run-1',
    sessionId: 'sess-1',
    agentId: 'agent-1',
    source: 'auto-trigger',
    messages: [
      { role: 'user', content: [{ type: 'text' as const, text: 'I moved to Kyiv last month.' }] },
      { role: 'assistant', content: [{ type: 'text' as const, text: 'Noted, Kyiv it is.' }] },
      { role: 'system', content: 'internal scaffolding' },
    ],
  };

  it('flushes extracted facts as QUARANTINED and consults the ingest gate', async () => {
    const memory = makeMemory(true);
    const provider = stubProvider(JSON.stringify({ facts: [{ text: 'User lives in Kyiv' }] }));
    const hook = memoryFlushHook({ provider });
    await hook.run({ memory, scope: SCOPE }, ctx);

    const flushed = await memory.semantic.search(SCOPE, 'Kyiv', { includeQuarantined: true });
    expect(flushed).toHaveLength(1);
    expect(flushed[0]?.record.status).toBe('quarantined');
    expect(flushed[0]?.record.provenance).toBe('extraction');
    // The gate admitted only user turns - the assistant line never
    // reached the provider prompt.
    const prompt = String(
      (provider.calls[0]?.messages[0]?.content as ReadonlyArray<{ text?: string }>)[0]?.text ?? '',
    );
    expect(prompt).toContain('user: I moved to Kyiv');
    expect(prompt).not.toContain('assistant: Noted');
    expect(prompt).not.toContain('scaffolding'); // system turns never flush
  });

  it('a provider failure WARNs and flushes nothing - compaction is never blocked', async () => {
    const memory = makeMemory(false);
    const warnings: string[] = [];
    const failing: Provider = {
      ...stubProvider(''),
      async generate(): Promise<ProviderResponse> {
        throw new Error('provider down');
      },
    };
    const hook = memoryFlushHook({ provider: failing, warn: (m) => warnings.push(m) });
    await expect(hook.run({ memory, scope: SCOPE }, ctx)).resolves.toBeUndefined();
    expect(warnings.some((w) => w.includes('flush skipped'))).toBe(true);
    expect(await memory.semantic.search(SCOPE, 'Kyiv', { includeQuarantined: true })).toHaveLength(
      0,
    );
  });

  it('fires through ContextEngine.compactNow BEFORE the summarizer, folding failures into hookFailures', async () => {
    const memory = makeMemory(false);
    const order: string[] = [];
    const provider = stubProvider(() => {
      order.push('flush');
      return JSON.stringify({ facts: [] });
    });
    const engine = createContextEngine({
      compaction: {
        preCompactionHooks: [
          memoryFlushHook({ provider }),
          async () => {
            order.push('custom');
            throw new Error('boom');
          },
        ],
        postCompactionHooks: [],
      },
      providerContextWindow: 100_000,
      summarizer: {
        async summarize() {
          order.push('summarize');
          return { text: 'summary text' };
        },
      },
    });
    // A long enough buffer that the summarize strategy genuinely drops
    // old turns (preserve-recent default keeps the tail).
    const longBuffer = Array.from({ length: 12 }, (_, i) => ({
      role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      content: [{ type: 'text' as const, text: `turn ${i}: ${'filler '.repeat(30)}` }],
    }));
    const outcome = await engine.compactNow({
      scope: SCOPE,
      runId: 'run-1',
      sessionId: 'sess-1',
      agentId: 'agent-1',
      source: 'manual',
      messages: longBuffer,
      memory,
    });
    expect(order[0]).toBe('flush');
    expect(order).toContain('custom');
    expect(order.indexOf('summarize')).toBeGreaterThan(order.indexOf('flush'));
    expect(outcome.hookFailures.some((f) => f.hookName === 'customPreHook_1')).toBe(true);
  });
});
