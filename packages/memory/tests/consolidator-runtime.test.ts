import type {
  Message,
  Provider,
  ProviderRequest,
  ProviderResponse,
  SessionScope,
} from '@graphorin/core';
import { describe, expect, it, vi } from 'vitest';
import {
  BudgetExceededError,
  CustomTierMisconfiguredError,
  createConsolidator,
  createConsolidatorPlaceholder,
  ProviderNotConfiguredError,
  parseExtraction,
} from '../src/consolidator/index.js';
import { createMemory } from '../src/index.js';
import {
  createInMemoryStore,
  createStubEmbedder,
  InMemoryEmbeddingRegistry,
} from './fixtures/in-memory-store.js';

function fakeProvider(plan: ProviderResponse[]): Provider & {
  readonly calls: ReadonlyArray<ProviderRequest>;
} {
  let i = 0;
  const calls: ProviderRequest[] = [];
  const provider: Provider & { calls: ProviderRequest[] } = {
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
    async generate(req: ProviderRequest) {
      calls.push(req);
      const next = plan[Math.min(i, plan.length - 1)];
      i += 1;
      if (next === undefined) {
        return {
          text: '{"facts":[]}',
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          finishReason: 'stop' as const,
        };
      }
      return next;
    },
    stream: () => {
      throw new Error('not implemented');
    },
    calls,
  };
  return provider;
}

async function pushUserMessages(
  memory: ReturnType<typeof createMemory>,
  scope: SessionScope,
  texts: ReadonlyArray<string>,
): Promise<void> {
  for (const text of texts) {
    const message: Message = { role: 'user', content: text };
    await memory.session.push(scope, message);
  }
}

describe('consolidator/runtime - light phase', () => {
  it('runs without LLM and archives stale facts', async () => {
    const store = createInMemoryStore({ withConsolidatorStore: true });
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      embedder: createStubEmbedder(),
      consolidator: { tier: 'free', defaultScope: { userId: 'alex' } },
    });
    const scope: SessionScope = { userId: 'alex' };
    const stale = await memory.semantic.remember(scope, { text: 'I lived in Berlin in 2018.' });
    const fresh = await memory.semantic.remember(scope, {
      text: 'I will travel to Tokyo next month.',
    });
    const day = 24 * 60 * 60 * 1000;
    store.__hooks.setDecaySignals(stale.id, {
      lastAccessedAt: Date.now() - 60 * day,
      createdAt: Date.now() - 60 * day,
      strength: 1,
    });
    store.__hooks.setDecaySignals(fresh.id, {
      lastAccessedAt: Date.now() - 1 * day,
      createdAt: Date.now() - 1 * day,
      strength: 1,
    });

    await memory.consolidator.start();
    const outcome = await memory.consolidator.fireNow('light', scope);
    expect(outcome).not.toBeNull();
    expect(outcome?.phase).toBe('light');
    expect(outcome?.factsUpdated).toBeGreaterThanOrEqual(1);
    expect(outcome?.llmCostUsd).toBeNull();
  });
});

describe('consolidator/runtime - standard phase', () => {
  it('extracts facts via the provider and advances the cursor', async () => {
    const store = createInMemoryStore({
      withConflictStore: true,
      withConsolidatorStore: true,
    });
    const provider = fakeProvider([
      {
        text: '{"facts":[{"text":"User lives in Tbilisi","subject":"user","predicate":"livesIn","object":"Tbilisi"}]}',
        usage: { promptTokens: 50, completionTokens: 10, totalTokens: 60 },
        finishReason: 'stop',
      },
    ]);
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      embedder: createStubEmbedder(),
      consolidator: {
        tier: 'cheap',
        provider,
        defaultScope: { userId: 'alex', sessionId: 's1' },
      },
    });
    const scope: SessionScope = { userId: 'alex', sessionId: 's1' };
    await pushUserMessages(memory, scope, [
      'Hi there!',
      'I just moved to Tbilisi for work and I am loving the food and the mountains.',
    ]);
    await memory.consolidator.start();

    const outcome = await memory.consolidator.fireNow('standard', scope);
    expect(provider.calls.length).toBe(1);
    expect(outcome).not.toBeNull();
    expect(outcome?.factsCreated).toBe(1);
    expect(outcome?.llmTokensUsed).toBe(60);

    const status = await memory.consolidator.status();
    expect(status.budget.tokensUsedToday).toBeGreaterThanOrEqual(60);

    const second = await memory.consolidator.fireNow('standard', scope);
    expect(provider.calls.length).toBe(1);
    expect(second?.factsCreated).toBe(0);
  });

  it('throws when standard phase is requested without a provider', async () => {
    const store = createInMemoryStore({ withConsolidatorStore: true });
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      embedder: createStubEmbedder(),
      consolidator: {
        tier: 'cheap',
        provider: null,
        defaultScope: { userId: 'alex', sessionId: 's1' },
      },
    });
    await memory.consolidator.start();
    const outcome = await memory.consolidator.fireNow('standard', {
      userId: 'alex',
      sessionId: 's1',
    });
    expect(outcome?.status).toBe('failed');
    expect(outcome?.errorMessage).toMatch(/provider/);
  });

  it('parseExtraction tolerates fenced blocks and extra prose', () => {
    const cleanFacts = parseExtraction('```json\n{"facts":[{"text":"a"}]}\n```');
    expect(cleanFacts.length).toBe(1);
    const trailing = parseExtraction('Some chatter\n{"facts":[{"text":"b"}]} <end>');
    expect(trailing.length).toBe(1);
    const broken = parseExtraction('not json');
    expect(broken.length).toBe(0);
    const blank = parseExtraction(undefined);
    expect(blank.length).toBe(0);
    const arr = parseExtraction('[{"text":"c"}]');
    expect(arr.length).toBe(1);
  });
});

describe('consolidator/runtime - deep phase - dedup decision', () => {
  it('soft-forgets (NEVER purges) the candidate when the judge picks dedup', async () => {
    const store = createInMemoryStore({
      withConflictStore: true,
      withConsolidatorStore: true,
    });
    // memory-consolidation-01: a background LLM verdict must never
    // trigger the GDPR hard-delete - spy on purge to prove it stays cold.
    const semanticStore = store.semantic as {
      purge?: (id: string, reason?: string) => Promise<void>;
    };
    let purgeCalled = false;
    const origPurge = semanticStore.purge?.bind(store.semantic);
    if (origPurge !== undefined) {
      semanticStore.purge = async (id, reason) => {
        purgeCalled = true;
        await origPurge(id, reason);
      };
    }
    const provider = fakeProvider([
      {
        text: '{"decision":"dedup","reason":"identical content"}',
        usage: { promptTokens: 25, completionTokens: 5, totalTokens: 30 },
        finishReason: 'stop',
      },
    ]);
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      embedder: createStubEmbedder(),
      consolidator: {
        tier: 'standard',
        provider,
        defaultScope: { userId: 'alex' },
      },
    });
    const scope: SessionScope = { userId: 'alex' };
    const oldFact = await memory.semantic.remember(scope, { text: 'I love mountain biking' });
    const candidate = await memory.semantic.remember(scope, { text: 'I love mountain biking too' });
    if (store.conflicts !== undefined) {
      await store.conflicts.enqueuePending({
        scope,
        factId: candidate.id,
        candidateText: candidate.text,
        stage: 'defer-to-deep',
        conflictingIds: [oldFact.id],
      });
    }
    await memory.consolidator.start();
    const outcome = await memory.consolidator.fireNow('deep', scope);
    expect(outcome?.conflictsResolved).toBe(1);
    expect(outcome?.factsUpdated).toBe(1);
    // The candidate is gone from recall - but via the SOFT, replayable
    // tombstone, never the destructive purge.
    const remaining = await memory.semantic.get(scope, candidate.id);
    expect(remaining).toBeNull();
    expect(purgeCalled).toBe(false);
  });

  it('admits WITHOUT a provider call when the conflicting fact vanished before the drain', async () => {
    const store = createInMemoryStore({
      withConflictStore: true,
      withConsolidatorStore: true,
    });
    // memory-consolidation-01: a 'dedup' verdict against "(unknown)"
    // would delete the ONLY surviving copy. The judge must not rule on
    // a vanished counterpart at all.
    const provider = fakeProvider([
      {
        text: '{"decision":"dedup","reason":"should never be asked"}',
        usage: { promptTokens: 25, completionTokens: 5, totalTokens: 30 },
        finishReason: 'stop',
      },
    ]);
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      embedder: createStubEmbedder(),
      consolidator: {
        tier: 'standard',
        provider,
        defaultScope: { userId: 'alex' },
      },
    });
    const scope: SessionScope = { userId: 'alex' };
    const oldFact = await memory.semantic.remember(scope, { text: 'I love mountain biking' });
    const candidate = await memory.semantic.remember(scope, { text: 'I love mountain biking too' });
    if (store.conflicts !== undefined) {
      await store.conflicts.enqueuePending({
        scope,
        factId: candidate.id,
        candidateText: candidate.text,
        stage: 'defer-to-deep',
        conflictingIds: [oldFact.id],
      });
    }
    // The conflicting fact disappears between enqueue and drain.
    await memory.semantic.forget(scope, oldFact.id, 'user asked');
    await memory.consolidator.start();
    const outcome = await memory.consolidator.fireNow('deep', scope);
    expect(outcome?.conflictsResolved).toBe(1);
    // No judge call was spent, and the candidate SURVIVES as the only copy.
    expect(provider.calls).toHaveLength(0);
    const survivor = await memory.semantic.get(scope, candidate.id);
    expect(survivor).not.toBeNull();
  });

  it('falls through to admit when the judge response is unparseable', async () => {
    const store = createInMemoryStore({
      withConflictStore: true,
      withConsolidatorStore: true,
    });
    const provider = fakeProvider([
      {
        text: 'not json at all just chatter',
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        finishReason: 'stop',
      },
    ]);
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      embedder: createStubEmbedder(),
      consolidator: {
        tier: 'standard',
        provider,
        defaultScope: { userId: 'alex' },
      },
    });
    const scope: SessionScope = { userId: 'alex' };
    const oldFact = await memory.semantic.remember(scope, { text: 'X is true' });
    const candidate = await memory.semantic.remember(scope, { text: 'Y is true' });
    if (store.conflicts !== undefined) {
      await store.conflicts.enqueuePending({
        scope,
        factId: candidate.id,
        candidateText: candidate.text,
        stage: 'defer-to-deep',
        conflictingIds: [oldFact.id],
      });
    }
    await memory.consolidator.start();
    const outcome = await memory.consolidator.fireNow('deep', scope);
    // Unparseable response: row stays unresolved (no markResolved
    // call), conflictsResolved counter does not increment.
    expect(outcome?.conflictsResolved).toBe(0);
  });
});

describe('consolidator/runtime - deep phase', () => {
  it('drains pending conflicts via the LLM judge', async () => {
    const store = createInMemoryStore({
      withConflictStore: true,
      withConsolidatorStore: true,
    });
    const provider = fakeProvider([
      {
        text: '{"decision":"supersede","reason":"candidate replaces older fact"}',
        usage: { promptTokens: 30, completionTokens: 5, totalTokens: 35 },
        finishReason: 'stop',
      },
    ]);
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      embedder: createStubEmbedder(),
      consolidator: {
        tier: 'standard',
        provider,
        defaultScope: { userId: 'alex' },
      },
    });
    const scope: SessionScope = { userId: 'alex' };

    const oldFact = await memory.semantic.remember(scope, {
      text: 'I live in Berlin and work in tech.',
    });
    const candidate = await memory.semantic.remember(scope, {
      text: 'I now live in Tbilisi and work in tech.',
    });
    if (store.conflicts !== undefined) {
      await store.conflicts.enqueuePending({
        scope,
        factId: candidate.id,
        candidateText: candidate.text,
        stage: 'defer-to-deep',
        conflictingIds: [oldFact.id],
      });
    }

    await memory.consolidator.start();
    const outcome = await memory.consolidator.fireNow('deep', scope);
    expect(provider.calls.length).toBe(1);
    expect(outcome?.conflictsResolved).toBe(1);
    expect(outcome?.factsUpdated).toBe(1);
    // W-083: candidate and existing texts reach the judge as delimited
    // untrusted data blocks, and the system prompt declares them DATA.
    const judgeCall = provider.calls[0];
    const content = String(judgeCall?.messages[0]?.content);
    expect(content.match(/<<<untrusted_content /g) ?? []).toHaveLength(2);
    expect(content).toContain('origin="judge-candidate"');
    expect(content).toContain('origin="judge-existing"');
    expect(String(judgeCall?.systemMessage)).toContain('<<<untrusted_content>>>');
  });
});

describe('consolidator/runtime - wiring', () => {
  it('placeholder honours the public surface', async () => {
    const ph = createConsolidatorPlaceholder({ tier: 'free' });
    await ph.start();
    expect((await ph.status()).running).toBe(true);
    await ph.setTier('cheap');
    expect(ph.isFree()).toBe(false);
    await ph.pause();
    expect((await ph.status()).paused).toBe(true);
    await ph.resume();
    const drain = await ph.drainDlq({ userId: 'alex' });
    expect(drain).toBe(0);
    const trigger = await ph.trigger({ kind: 'manual' }, { userId: 'alex' });
    expect(trigger).toBeNull();
  });

  it('rejects setTier("custom")', async () => {
    const store = createInMemoryStore({ withConsolidatorStore: true });
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      embedder: createStubEmbedder(),
      consolidator: { tier: 'cheap' },
    });
    await expect(memory.consolidator.setTier('custom')).rejects.toThrow(/custom/);
  });

  it('rejects misconfigured tier=custom at construction time', () => {
    const store = createInMemoryStore({ withConsolidatorStore: true });
    expect(() =>
      createConsolidator({
        store,
        semantic: createMemory({
          store,
          embeddings: new InMemoryEmbeddingRegistry(),
          embedder: createStubEmbedder(),
        }).semantic,
        tier: 'custom',
        ceilings: {
          maxTokensPerDay: 0,
          maxCostPerDay: 0,
          maxConcurrentRuns: 1,
          maxRunDurationMs: 1000,
          cooldownMs: 1000,
        },
      }),
    ).toThrow(CustomTierMisconfiguredError);
  });

  it('budget exceeded with onExceed=throw bubbles up the error class', async () => {
    const store = createInMemoryStore({
      withConflictStore: true,
      withConsolidatorStore: true,
    });
    const provider = fakeProvider([
      {
        text: '{"facts":[]}',
        usage: { promptTokens: 9999, completionTokens: 1, totalTokens: 10000 },
        finishReason: 'stop',
      },
    ]);
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      embedder: createStubEmbedder(),
      consolidator: {
        tier: 'cheap',
        provider,
        onExceed: 'throw',
        ceilings: { maxTokensPerDay: 100, maxCostPerDay: 0.5 },
        defaultScope: { userId: 'alex', sessionId: 's1' },
      },
    });
    const scope: SessionScope = { userId: 'alex', sessionId: 's1' };
    await pushUserMessages(memory, scope, [
      'I plan to fly to Tokyo next week and stay for a month.',
    ]);
    await memory.consolidator.start();
    const outcome = await memory.consolidator.fireNow('standard', scope);
    expect(outcome?.status).toBe('failed');
    expect(outcome?.errorMessage).toMatch(/budget/i);
    const failed = store.__consolidator?.dlq ?? [];
    expect(failed.some((row) => row.errorKind === 'budget')).toBe(true);
    const _err = new BudgetExceededError({
      phase: 'standard',
      resource: 'tokens',
      actual: 1,
      budget: 0,
    });
    expect(_err.kind).toBe('budget-exceeded');
    void _err;
  });

  it('phaseFinished listeners fire with scope + trigger context', async () => {
    const store = createInMemoryStore({ withConsolidatorStore: true });
    const seen = vi.fn();
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      embedder: createStubEmbedder(),
      consolidator: {
        tier: 'free',
        defaultScope: { userId: 'alex' },
        onPhaseFinished: seen,
      },
    });
    await memory.consolidator.start();
    await memory.consolidator.fireNow('light', { userId: 'alex' });
    expect(seen).toHaveBeenCalledWith(
      expect.objectContaining({ phase: 'light', scope: { userId: 'alex' } }),
    );
  });

  it('lock contention defers competing triggers', async () => {
    const store = createInMemoryStore({ withConsolidatorStore: true });
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      embedder: createStubEmbedder(),
      consolidator: {
        tier: 'free',
        lockWaitMs: 0,
        defaultScope: { userId: 'alex' },
      },
    });
    const scope: SessionScope = { userId: 'alex' };
    if (store.consolidator !== undefined) {
      await store.consolidator.acquireLock(scope, 'other_run', Date.now(), 60_000);
    }
    await memory.consolidator.start();
    const outcome = await memory.consolidator.fireNow('light', scope);
    expect(outcome?.status).toBe('deferred');
    const status = await memory.consolidator.status();
    expect(status.deferredRuns).toBeGreaterThanOrEqual(1);
  });

  it('ProviderNotConfiguredError exposes a stable kind', () => {
    const e = new ProviderNotConfiguredError('standard');
    expect(e.kind).toBe('provider-not-configured');
    expect(e.phase).toBe('standard');
  });

  it('trigger() respects the running flag and tier-driven phase plan', async () => {
    const store = createInMemoryStore({ withConsolidatorStore: true });
    const provider = fakeProvider([
      {
        text: '{"facts":[]}',
        usage: { promptTokens: 5, completionTokens: 5, totalTokens: 10 },
        finishReason: 'stop',
      },
    ]);
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      embedder: createStubEmbedder(),
      consolidator: { tier: 'cheap', provider, defaultScope: { userId: 'alex', sessionId: 's1' } },
    });
    const scope: SessionScope = { userId: 'alex', sessionId: 's1' };
    // Stopped consolidator returns null without firing.
    const before = await memory.consolidator.trigger({ kind: 'turn', value: 20 }, scope);
    expect(before).toBeNull();
    await memory.consolidator.start();
    const out = await memory.consolidator.trigger({ kind: 'turn', value: 20 }, scope);
    expect(out).not.toBeNull();
    expect(['light', 'standard']).toContain(out?.phase);
  });

  it('pause() suppresses subsequent triggers and resume() reopens the gate', async () => {
    const store = createInMemoryStore({ withConsolidatorStore: true });
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      embedder: createStubEmbedder(),
      consolidator: { tier: 'free', defaultScope: { userId: 'alex' } },
    });
    await memory.consolidator.start();
    await memory.consolidator.pause();
    const blocked = await memory.consolidator.trigger({ kind: 'idle' }, { userId: 'alex' });
    expect(blocked).toBeNull();
    await memory.consolidator.resume();
    const fired = await memory.consolidator.trigger({ kind: 'idle' }, { userId: 'alex' });
    expect(fired).not.toBeNull();
  });

  it('drainDlq retries the failed batch and removes it on success', async () => {
    const store = createInMemoryStore({
      withConflictStore: true,
      withConsolidatorStore: true,
    });
    const provider = fakeProvider([
      {
        text: '{"facts":[]}',
        usage: { promptTokens: 10, completionTokens: 1, totalTokens: 11 },
        finishReason: 'stop',
      },
    ]);
    const scope: SessionScope = { userId: 'alex', sessionId: 's1' };
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      embedder: createStubEmbedder(),
      consolidator: { tier: 'cheap', provider, defaultScope: scope },
    });
    if (store.consolidator !== undefined) {
      await store.consolidator.enqueueFailedBatch({
        id: 'dlq_1',
        consolidatorRunId: null,
        scope,
        messageIds: [],
        errorKind: 'rate_limit',
        errorMessage: 'too fast',
        failedAt: 0,
        nextRetryAt: 0,
        retryCount: 0,
      });
    }
    await memory.consolidator.start();
    const drained = await memory.consolidator.drainDlq(scope);
    expect(drained).toBe(1);
    expect(store.__consolidator?.dlq.length ?? 0).toBe(0);
  });

  it('status() reports tier, triggers, paused, and budget snapshot', async () => {
    const store = createInMemoryStore({ withConsolidatorStore: true });
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      embedder: createStubEmbedder(),
      consolidator: {
        tier: 'cheap',
        triggers: ['turn:20', 'idle:5m'],
        defaultScope: { userId: 'alex' },
      },
    });
    const status = await memory.consolidator.status();
    expect(status.tier).toBe('cheap');
    expect(status.triggers).toEqual(['turn:20', 'idle:5m']);
    expect(status.budget.tokensRemaining).toBe(50_000);
  });

  it('placeholder fireNow returns null', async () => {
    const ph = createConsolidatorPlaceholder();
    const out = await ph.fireNow('light', { userId: 'alex' });
    expect(out).toBeNull();
  });
});

describe('consolidator/runtime - Wave B operational fixes', () => {
  it('expires stale CONFLICT-CHECK rows as admit at tiers without a deep phase (memory-consolidation-04)', async () => {
    const store = createInMemoryStore({
      withConflictStore: true,
      withConsolidatorStore: true,
    });
    const provider = fakeProvider([]);
    const scope: SessionScope = { userId: 'alex' };
    // Clock injected 8 days ahead of the (real-now) enqueue stamp, so the
    // 7-day TTL sees the row as stale.
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      embedder: createStubEmbedder(),
      consolidator: {
        tier: 'cheap',
        provider,
        defaultScope: scope,
        now: () => Date.now() + 8 * 24 * 60 * 60 * 1000,
      },
    });
    const fact = await memory.semantic.remember(scope, { text: 'stale conflict candidate' });
    if (store.conflicts === undefined) throw new Error('fixture without conflict store');
    await store.conflicts.enqueuePending({
      scope,
      factId: fact.id,
      candidateText: fact.text,
      stage: 'defer-to-deep',
      conflictingIds: [],
    });
    await memory.consolidator.start();
    await memory.consolidator.trigger({ kind: 'turn' }, scope);
    // The 'cheap' tier has no deep phase: without the TTL sweep this row
    // would sit unresolved forever. It is resolved as ADMIT (the safe
    // direction - the candidate fact stays live).
    const left = await store.conflicts.listPending(scope);
    expect(left).toHaveLength(0);
    const survivor = await memory.semantic.get(scope, fact.id);
    expect(survivor).not.toBeNull();
  });

  it('keeps fresh pending rows (and every row at deep-phase tiers)', async () => {
    const store = createInMemoryStore({
      withConflictStore: true,
      withConsolidatorStore: true,
    });
    const scope: SessionScope = { userId: 'alex' };
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      embedder: createStubEmbedder(),
      consolidator: { tier: 'cheap', provider: fakeProvider([]), defaultScope: scope },
    });
    const fact = await memory.semantic.remember(scope, { text: 'fresh conflict candidate' });
    if (store.conflicts === undefined) throw new Error('fixture without conflict store');
    await store.conflicts.enqueuePending({
      scope,
      factId: fact.id,
      candidateText: fact.text,
      stage: 'defer-to-deep',
      conflictingIds: [],
    });
    await memory.consolidator.start();
    await memory.consolidator.trigger({ kind: 'turn' }, scope);
    // Fresh row (enqueued "now", TTL 7 days): untouched.
    const left = await store.conflicts.listPending(scope);
    expect(left).toHaveLength(1);
  });

  it('extraction is temporally anchored: today-date in the prompt, timestamps per line (memory-consolidation-08)', async () => {
    const store = createInMemoryStore({
      withConflictStore: true,
      withConsolidatorStore: true,
    });
    const scope: SessionScope = { userId: 'alex', sessionId: 's1' };
    const provider = fakeProvider([
      {
        text: '{"facts":[]}',
        usage: { promptTokens: 10, completionTokens: 2, totalTokens: 12 },
        finishReason: 'stop',
      },
    ]);
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      embedder: createStubEmbedder(),
      consolidator: { tier: 'cheap', provider, defaultScope: scope },
    });
    await memory.session.push(scope, {
      role: 'user',
      content: 'I am interviewing next Friday.',
    });
    await memory.consolidator.start();
    await memory.consolidator.fireNow('standard', scope);
    const req = provider.calls[0];
    if (req === undefined) throw new Error('extraction call never made');
    expect(req.systemMessage).toContain('Today is');
    expect(req.systemMessage).toContain('resolve relative dates');
    const transcript = String(req.messages[0]?.content ?? '');
    // Each line carries its ISO timestamp in parentheses.
    expect(transcript).toMatch(/\(\d{4}-\d{2}-\d{2}T[0-9:.]+Z\)/);
  });

  it('threads priceUsage into the phases so the USD ceiling accumulates (memory-consolidation-02)', async () => {
    const store = createInMemoryStore({
      withConflictStore: true,
      withConsolidatorStore: true,
    });
    const scope: SessionScope = { userId: 'alex', sessionId: 's1' };
    const provider = fakeProvider([
      {
        text: '{"facts":[]}',
        usage: { promptTokens: 100, completionTokens: 20, totalTokens: 120 },
        finishReason: 'stop',
      },
    ]);
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      embedder: createStubEmbedder(),
      consolidator: {
        tier: 'cheap',
        provider,
        defaultScope: scope,
        priceUsage: ({ promptTokens, completionTokens }) =>
          (promptTokens * 3 + completionTokens * 15) / 1_000_000,
      },
    });
    await memory.session.push(scope, { role: 'user', content: 'note something' });
    await memory.consolidator.start();
    await memory.consolidator.fireNow('standard', scope);
    const status = await memory.consolidator.status();
    // Pre-fix priceUsage was unreachable from CreateConsolidatorOptions
    // and every phase priced its calls at $0.
    expect(status.budget.costUsedToday).toBeGreaterThan(0);
  });
});

describe('consolidator/runtime - trigger() drains the DLQ (memory-consolidation-03)', () => {
  it('a later trigger replays a failed batch without any explicit drainDlq call', async () => {
    const store = createInMemoryStore({
      withConflictStore: true,
      withConsolidatorStore: true,
    });
    const scope: SessionScope = { userId: 'alex', sessionId: 's1' };
    let clock = Date.parse('2026-04-21T00:00:00Z');
    let attempt = 0;
    const flaky: Provider = {
      name: 'flaky',
      modelId: 'flaky:test',
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
      async generate() {
        attempt += 1;
        if (attempt === 1) throw new Error('transient upstream blip');
        return {
          text: '{"facts":[]}',
          usage: { promptTokens: 5, completionTokens: 1, totalTokens: 6 },
          finishReason: 'stop' as const,
        };
      },
      stream: () => {
        throw new Error('not implemented');
      },
    };
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      embedder: createStubEmbedder(),
      consolidator: { tier: 'cheap', provider: flaky, defaultScope: scope, now: () => clock },
    });
    await memory.session.push(scope, { role: 'user', content: 'hello there' });
    await memory.consolidator.start();
    const failed = await memory.consolidator.fireNow('standard', scope);
    expect(failed?.status).toBe('failed');
    expect((await memory.consolidator.status()).dlqSize).toBeGreaterThan(0);

    // Advance past backoff + cooldown; an ordinary trigger - the loop's
    // normal heartbeat - now replays the batch. Pre-fix drainDlq had NO
    // production caller and failed batches accumulated forever.
    clock += 2 * 60 * 60 * 1000;
    await memory.consolidator.trigger({ kind: 'turn' }, scope);
    expect((await memory.consolidator.status()).dlqSize).toBe(0);
  });
});
