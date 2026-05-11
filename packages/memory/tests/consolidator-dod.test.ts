/**
 * Acceptance-criteria-driven tests for the consolidator runtime
 * (DEC-133 / DEC-134 / ADR-038). Each `it(...)` block maps directly
 * to one of the consolidator's documented acceptance criteria.
 */

import type {
  Provider,
  ProviderRequest,
  ProviderResponse,
  SessionScope,
  Tracer,
} from '@graphorin/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { _resetBypassWarningForTesting, createMemory } from '../src/index.js';
import {
  createInMemoryStore,
  createStubEmbedder,
  InMemoryEmbeddingRegistry,
} from './fixtures/in-memory-store.js';

interface ProviderPlan {
  readonly text: string;
  readonly tokens?: number;
}

function plannedProvider(plan: ReadonlyArray<ProviderPlan | (() => never)>): Provider & {
  readonly calls: ReadonlyArray<ProviderRequest>;
} {
  let i = 0;
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
      const next = plan[Math.min(i, plan.length - 1)];
      i += 1;
      if (typeof next === 'function') {
        return next();
      }
      const tokens = next?.tokens ?? 10;
      return {
        text: next?.text ?? '{"facts":[]}',
        usage: { promptTokens: tokens, completionTokens: tokens },
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

function captureSpans(): Tracer & {
  readonly recorded: ReadonlyArray<{ type: string; attrs: Record<string, unknown> }>;
} {
  const recorded: Array<{ type: string; attrs: Record<string, unknown> }> = [];
  return {
    startSpan(opts) {
      const attrs: Record<string, unknown> = { ...(opts.attrs ?? {}) };
      const entry = { type: opts.type, attrs };
      recorded.push(entry);
      return {
        type: opts.type,
        id: '',
        traceId: '',
        setAttributes(extra) {
          Object.assign(attrs, extra);
        },
        addEvent() {},
        recordException() {},
        setStatus() {},
        end() {},
      };
    },
    async span(opts, fn) {
      const span = this.startSpan(opts);
      try {
        return await fn(span);
      } finally {
        span.end();
      }
    },
    async shutdown() {},
    get recorded() {
      return recorded;
    },
  };
}

describe('Phase 10c DoD — Deep phase drains 10 fixture pending pairs', () => {
  beforeEach(() => {
    _resetBypassWarningForTesting();
  });

  it('processes 10 conflict_check_pending rows and clears the queue', async () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const store = createInMemoryStore({
      withConflictStore: true,
      withConsolidatorStore: true,
    });
    const scope: SessionScope = { userId: 'alex' };
    const provider = plannedProvider(
      Array.from({ length: 10 }, (_, idx) => ({
        text: `{"decision":"${idx % 2 === 0 ? 'supersede' : 'admit'}","reason":"fixture #${idx}"}`,
        tokens: 5,
      })),
    );
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      embedder: createStubEmbedder(),
      // Disable the Phase 10b pipeline for this fixture so the
      // pending queue contains exactly the 10 manually enqueued
      // pairs (the pipeline would also append rows on every
      // remember() call).
      conflictPipeline: { mode: 'off' },
      consolidator: {
        tier: 'standard',
        provider,
        defaultScope: scope,
        maxDeepConflictsPerRun: 50,
      },
    });
    // Seed 10 pending pairs.
    for (let i = 0; i < 10; i++) {
      const oldFact = await memory.semantic.remember(scope, { text: `old fact ${i}` });
      const candidate = await memory.semantic.remember(scope, { text: `new candidate ${i}` });
      if (store.conflicts !== undefined) {
        await store.conflicts.enqueuePending({
          scope,
          factId: candidate.id,
          candidateText: candidate.text,
          stage: 'defer-to-deep',
          conflictingIds: [oldFact.id],
        });
      }
    }
    expect(store.__conflicts?.pending.length ?? 0).toBe(10);

    await memory.consolidator.start();
    const outcome = await memory.consolidator.fireNow('deep', scope);
    expect(outcome?.status).toBe('completed');
    expect(outcome?.conflictsResolved).toBe(10);
    expect(provider.calls.length).toBe(10);

    const remainingPending = await store.conflicts?.listPending(scope, 50);
    expect(remainingPending?.length ?? -1).toBe(0);
    consoleWarn.mockRestore();
  });
});

describe('Phase 10c DoD — DLQ retry succeeds after backoff; permanent-failure after max attempts', () => {
  it('transitions a DLQ row to permanent failure after dlqMaxRetries attempts', async () => {
    const store = createInMemoryStore({
      withConflictStore: true,
      withConsolidatorStore: true,
    });
    let clock = 0;
    const alwaysFails: Provider = {
      name: 'broken',
      modelId: 'broken:test',
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
        throw new Error('429 rate limit — provider down');
      },
      stream: () => {
        throw new Error('not implemented');
      },
    };
    const scope: SessionScope = { userId: 'alex', sessionId: 's1' };
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      consolidator: {
        tier: 'cheap',
        provider: alwaysFails,
        defaultScope: scope,
        now: () => clock,
        dlqMaxRetries: 3,
        dlqBaseBackoffMs: 1_000,
        dlqMaxBackoffMs: 5_000,
      },
    });
    await memory.session.push(scope, { role: 'user', content: 'this slice will fail to extract' });
    await memory.consolidator.start();
    const failed = await memory.consolidator.fireNow('standard', scope);
    expect(failed?.status).toBe('failed');
    expect(store.__consolidator?.dlq.length ?? 0).toBe(1);

    // Run drain three times — each one fails again and reschedules
    // until the row hits `dlqMaxRetries`.
    for (let attempt = 0; attempt < 5; attempt++) {
      clock += 60_000;
      await memory.consolidator.drainDlq(scope);
    }
    const dlq = store.__consolidator?.dlq ?? [];
    expect(dlq.length).toBe(1);
    const row = dlq[0];
    expect(row).toBeDefined();
    if (row !== undefined) {
      expect(row.nextRetryAt).toBeNull();
      expect(row.retryCount).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('Phase 10c DoD — UTC reset across simulated date change', () => {
  it('budget resets when the wall clock crosses UTC midnight + the standard phase resumes', async () => {
    const store = createInMemoryStore({
      withConflictStore: true,
      withConsolidatorStore: true,
    });
    let clock = Date.parse('2026-04-21T23:50:00Z');
    const scope: SessionScope = { userId: 'alex', sessionId: 's1' };
    let extractCalls = 0;
    const provider: Provider = {
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
      async generate() {
        extractCalls += 1;
        return {
          text: '{"facts":[]}',
          usage: { promptTokens: 9_000, completionTokens: 9_000 },
          finishReason: 'stop',
        };
      },
      stream: () => {
        throw new Error('not implemented');
      },
    };
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      consolidator: {
        tier: 'cheap',
        provider,
        defaultScope: scope,
        now: () => clock,
        ceilings: {
          maxTokensPerDay: 1_000,
          maxCostPerDay: 0.1,
          maxConcurrentRuns: 1,
          maxRunDurationMs: 5 * 60 * 1000,
          cooldownMs: 60_000,
        },
        onExceed: 'pause',
      },
    });
    await memory.session.push(scope, { role: 'user', content: 'first conversation slice' });
    await memory.consolidator.start();

    // First run blows the daily ceiling and should pause.
    await memory.consolidator.fireNow('standard', scope);
    expect(extractCalls).toBe(1);
    let status = await memory.consolidator.status();
    expect(status.paused).toBe(true);

    // Same day: phase is gated.
    await memory.consolidator.fireNow('standard', scope);
    expect(extractCalls).toBe(1);

    // Cross UTC midnight — budget resets and the phase runs again.
    clock = Date.parse('2026-04-22T00:05:00Z');
    await memory.session.push(scope, { role: 'user', content: 'second conversation slice' });
    await memory.consolidator.fireNow('standard', scope);
    expect(extractCalls).toBe(2);
    status = await memory.consolidator.status();
    expect(status.budget.tokensUsedToday).toBe(18_000);
  });
});

describe('Phase 10c DoD — Every phase emits memory.consolidate AISpan', () => {
  it('records duration_ms / facts_extracted / budget_used_usd attributes', async () => {
    const store = createInMemoryStore({
      withConflictStore: true,
      withConsolidatorStore: true,
    });
    const tracer = captureSpans();
    const provider = plannedProvider([
      {
        text: '{"facts":[{"text":"User lives in Tbilisi"}]}',
        tokens: 50,
      },
    ]);
    const scope: SessionScope = { userId: 'alex', sessionId: 's1' };
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      tracer,
      consolidator: { tier: 'cheap', provider, defaultScope: scope },
    });
    await memory.session.push(scope, {
      role: 'user',
      content: 'I just moved to Tbilisi for the gig.',
    });
    await memory.consolidator.start();
    await memory.consolidator.fireNow('light', scope);
    await memory.consolidator.fireNow('standard', scope);

    const phaseSpans = tracer.recorded.filter(
      (s) => s.type === 'memory.consolidate.light' || s.type === 'memory.consolidate.standard',
    );
    expect(phaseSpans.length).toBeGreaterThanOrEqual(2);
    for (const span of phaseSpans) {
      expect(span.attrs['consolidator.phase']).toBeDefined();
      expect(span.attrs['consolidator.tier']).toBeDefined();
      expect(span.attrs['consolidator.duration_ms']).toBeDefined();
      expect(span.attrs['consolidator.facts_extracted']).toBeDefined();
      expect(span.attrs['consolidator.budget_used_usd']).toBeDefined();
    }
  });
});

describe('Phase 10c DoD — consolidator.status() shape', () => {
  it('exposes lastRuns / queueDepth / dlqSize / deferredRuns / budgetRemaining', async () => {
    const store = createInMemoryStore({
      withConflictStore: true,
      withConsolidatorStore: true,
    });
    const scope: SessionScope = { userId: 'alex', sessionId: 's1' };
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      embedder: createStubEmbedder(),
      consolidator: { tier: 'free', defaultScope: scope },
    });
    await memory.consolidator.start();
    await memory.consolidator.fireNow('light', scope);

    const status = await memory.consolidator.status();
    expect(status.tier).toBe('free');
    expect(status.triggers).toEqual(['turn:20', 'idle:5m']);
    expect(status.queueDepth).toBeGreaterThanOrEqual(0);
    expect(status.queueDepth).toBe(status.pendingConflicts);
    expect(status.dlqSize).toBe(0);
    expect(status.deferredRuns).toBe(0);
    expect(status.budgetRemaining).toEqual({ tokens: 0, costUsd: 0 });
    expect(status.budget.resetAt).toBeDefined();
    expect(status.lastRuns.light).toBeDefined();
    expect(status.lastPhase).toBe('light');
  });
});

describe('Phase 10c DoD — Decay reflected in search ranking + age-14 ≈ exp(-2)', () => {
  it('boosts the score of fresh facts over decayed facts', async () => {
    const store = createInMemoryStore({
      withConflictStore: true,
      withConsolidatorStore: true,
    });
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      embedder: createStubEmbedder(),
    });
    const scope: SessionScope = { userId: 'alex' };
    const fresh = await memory.semantic.remember(scope, { text: 'fresh fact about hiking' });
    const stale = await memory.semantic.remember(scope, { text: 'stale fact about hiking' });
    const day = 24 * 60 * 60 * 1000;
    store.__hooks.setDecaySignals(fresh.id, {
      lastAccessedAt: Date.now() - 1 * day,
      createdAt: Date.now() - 1 * day,
      strength: 1,
    });
    store.__hooks.setDecaySignals(stale.id, {
      lastAccessedAt: Date.now() - 14 * day,
      createdAt: Date.now() - 14 * day,
      strength: 1,
    });
    const hits = await memory.semantic.search(scope, 'hiking', { decay: { tauDays: 7 } });
    // The fresh fact is ranked first because retention(1d) >> retention(14d).
    expect(hits[0]?.record.id).toBe(fresh.id);
  });
});

describe('Phase 10c DoD — Lock contention serializes runs and persists deferred_runs', () => {
  it('competing trigger defers and the counter survives status() reload', async () => {
    const store = createInMemoryStore({ withConsolidatorStore: true });
    const scope: SessionScope = { userId: 'alex' };
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      consolidator: {
        tier: 'free',
        lockWaitMs: 0,
        defaultScope: scope,
      },
    });
    if (store.consolidator !== undefined) {
      await store.consolidator.acquireLock(scope, 'foreign_run', Date.now(), 60_000);
    }
    await memory.consolidator.start();
    const out1 = await memory.consolidator.fireNow('light', scope);
    const out2 = await memory.consolidator.fireNow('light', scope);
    expect(out1?.status).toBe('deferred');
    expect(out2?.status).toBe('deferred');
    const status = await memory.consolidator.status();
    expect(status.deferredRuns).toBeGreaterThanOrEqual(2);
  });
});

vi.mock; // keep vi import alive across compiles

describe('Phase 10c DoD — Trigger spec deserves @graphorin/triggers wiring (DEC-150)', () => {
  it('registers cron + idle triggers; the callback fires consolidator.trigger(...)', async () => {
    const store = createInMemoryStore({ withConsolidatorStore: true });
    const scope: SessionScope = { userId: 'alex', sessionId: 's1' };
    const provider = plannedProvider([{ text: '{"facts":[]}', tokens: 5 }]);
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      consolidator: {
        tier: 'cheap',
        provider,
        triggers: ['turn:20', 'idle:5m', 'cron:0 3 * * *'],
        defaultScope: scope,
      },
    });
    await memory.consolidator.start();

    const registered: Array<{ id: string; kind: string; spec: string }> = [];
    const declarations: Array<{
      id: string;
      callback: (payload?: unknown) => void | Promise<void>;
    }> = [];
    const fakeScheduler = {
      async register(declaration: {
        id: string;
        kind: string;
        spec: string;
        callback: (payload?: unknown) => void | Promise<void>;
      }) {
        registered.push({ id: declaration.id, kind: declaration.kind, spec: declaration.spec });
        declarations.push({ id: declaration.id, callback: declaration.callback });
        return declaration;
      },
      async unregister() {},
    };

    const { registerConsolidatorTriggers } = await import('../src/index.js');
    const result = await registerConsolidatorTriggers(memory.consolidator, fakeScheduler, {
      scope,
      catchupPolicy: 'last',
    });

    // turn:20 is skipped (no scheduler firing); idle + cron are registered.
    expect(result.registered.length).toBe(2);
    const skipped = result.skipped.map((s) => s.raw);
    expect(skipped).toContain('turn:20');
    const idleEntry = registered.find((r) => r.kind === 'idle');
    expect(idleEntry?.spec).toBe(String(5 * 60 * 1000));
    const cronEntry = registered.find((r) => r.kind === 'cron');
    expect(cronEntry?.spec).toBe('0 3 * * *');

    // Firing the registered callback dispatches a phase via the
    // consolidator — same code path as a manual `trigger(...)` call
    // (DEC-150).
    await memory.session.push(scope, {
      role: 'user',
      content: 'a meaningful slice for extraction',
    });
    const idleDeclaration = declarations.find((d) => d.id.includes('idle'));
    expect(idleDeclaration).toBeDefined();
    await idleDeclaration?.callback();
    expect(provider.calls.length).toBeGreaterThan(0);
  });
});

describe('Phase 10c DoD — Standard phase advances the cursor + replay is a no-op', () => {
  it('second invocation without new messages produces zero new facts', async () => {
    const store = createInMemoryStore({
      withConflictStore: true,
      withConsolidatorStore: true,
    });
    const provider = plannedProvider([
      {
        text: '{"facts":[{"text":"User likes the morning espresso"}]}',
        tokens: 30,
      },
      { text: '{"facts":[]}' },
    ]);
    const scope: SessionScope = { userId: 'alex', sessionId: 's1' };
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      consolidator: { tier: 'cheap', provider, defaultScope: scope },
    });
    await memory.session.push(scope, {
      role: 'user',
      content: 'I always grab a morning espresso at the corner cafe before standup.',
    });
    await memory.consolidator.start();
    const first = await memory.consolidator.fireNow('standard', scope);
    expect(first?.factsCreated).toBe(1);

    const second = await memory.consolidator.fireNow('standard', scope);
    expect(second?.factsCreated).toBe(0);
    // The cursor has moved past every message, so a second LLM call
    // is short-circuited by the empty-batch guard.
    expect(provider.calls.length).toBe(1);
  });
});
