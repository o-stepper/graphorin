/**
 * Integration tests for the Phase 10c consolidator runtime against
 * the real `@graphorin/store-sqlite` adapter. These exercise the
 * SQL-backed `consolidator_state` / `consolidator_runs` /
 * `consolidator_failed_batches` tables + `listMessagesSince` /
 * `listForDecay` / `archiveFact` extensions.
 */

import { mkdtemp } from 'node:fs/promises';
import type { Provider, ProviderRequest, ProviderResponse, SessionScope } from '@graphorin/core';
import {
  createSqliteStore,
  type GraphorinSqliteStore,
  type SqliteConsolidatorStateStore,
  type SqliteMemoryStore,
} from '@graphorin/store-sqlite';
import { describe, expect, it } from 'vitest';
import { createMemory } from '../src/index.js';

async function makeStore(): Promise<GraphorinSqliteStore> {
  const dir = await mkdtemp('/tmp/graphorin-consolidator-int-');
  const store = await createSqliteStore({
    path: `${dir}/db.sqlite`,
    skipSqliteVec: true,
  });
  await store.init();
  return store;
}

function fakeProvider(plan: ProviderResponse[]): Provider {
  let i = 0;
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
    async generate(_req: ProviderRequest) {
      const next = plan[Math.min(i, plan.length - 1)];
      i += 1;
      if (next === undefined) {
        return {
          text: '{"facts":[]}',
          usage: { promptTokens: 0, completionTokens: 0 },
          finishReason: 'stop' as const,
        };
      }
      return next;
    },
    stream: () => {
      throw new Error('not implemented');
    },
  };
}

describe('@graphorin/memory consolidator <> @graphorin/store-sqlite — integration', () => {
  it('drives standard phase end-to-end against real sqlite', async () => {
    const sqlite = await makeStore();
    try {
      const provider = fakeProvider([
        {
          text: '{"facts":[{"text":"User lives in Lisbon and works remotely","subject":"user","predicate":"livesIn","object":"Lisbon"}]}',
          usage: { promptTokens: 80, completionTokens: 12 },
          finishReason: 'stop',
        },
      ]);
      // No embedder configured: the fixture exercises the FTS5 path
      // without requiring the native `sqlite-vec` build. The
      // conflict pipeline still runs but degrades gracefully when the
      // embedder is absent.
      const memory = createMemory({
        store: sqlite.memory,
        embeddings: sqlite.embeddings,
        consolidator: {
          tier: 'cheap',
          provider,
          defaultScope: { userId: 'alex', sessionId: 's1' },
        },
      });
      const scope: SessionScope = { userId: 'alex', sessionId: 's1' };
      await memory.session.push(scope, {
        role: 'user',
        content: 'I just moved from Madrid to Lisbon and I am working remotely now.',
      });
      await memory.consolidator.start();
      const outcome = await memory.consolidator.fireNow('standard', scope);
      expect(outcome?.factsCreated).toBe(1);
      const status = await memory.consolidator.status();
      expect(status.budget.tokensUsedToday).toBe(92);

      const facts = await memory.semantic.search(scope, 'Lisbon');
      expect(facts.length).toBeGreaterThan(0);
    } finally {
      await sqlite.close();
    }
  });

  it('persists DLQ rows on phase failure and replays via drainDlq', async () => {
    const sqlite = await makeStore();
    try {
      let clock = 0;
      let attempt = 0;
      // First call: provider raises a transient error → DLQ row.
      // Replay during drainDlq: provider returns success.
      const flakyProvider: Provider = {
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
          if (attempt === 1) {
            throw new Error('429 rate limit hit on first attempt');
          }
          return {
            text: '{"facts":[]}',
            usage: { promptTokens: 5, completionTokens: 1 },
            finishReason: 'stop',
          };
        },
        stream: () => {
          throw new Error('not implemented');
        },
      };
      const memory = createMemory({
        store: sqlite.memory,
        embeddings: sqlite.embeddings,
        consolidator: {
          tier: 'cheap',
          provider: flakyProvider,
          defaultScope: { userId: 'alex', sessionId: 's1' },
          now: () => clock,
        },
      });
      const scope: SessionScope = { userId: 'alex', sessionId: 's1' };
      await memory.session.push(scope, { role: 'user', content: 'hello there' });
      await memory.consolidator.start();
      const failed = await memory.consolidator.fireNow('standard', scope);
      expect(failed?.status).toBe('failed');

      const dlqStatus = await memory.consolidator.status();
      expect(dlqStatus.dlqSize).toBeGreaterThan(0);

      clock += 2 * 60 * 60 * 1000;
      const drained = await memory.consolidator.drainDlq(scope);
      expect(drained).toBeGreaterThan(0);
      const after = await memory.consolidator.status();
      expect(after.dlqSize).toBe(0);
    } finally {
      await sqlite.close();
    }
  });

  it('survives process-restart: cursor persists across createConsolidator instances', async () => {
    const sqlite = await makeStore();
    try {
      const provider = fakeProvider([
        {
          text: '{"facts":[]}',
          usage: { promptTokens: 5, completionTokens: 1 },
          finishReason: 'stop',
        },
      ]);
      const scope: SessionScope = { userId: 'alex', sessionId: 's1' };
      const memory1 = createMemory({
        store: sqlite.memory,
        embeddings: sqlite.embeddings,
        consolidator: { tier: 'cheap', provider, defaultScope: scope },
      });
      await memory1.session.push(scope, { role: 'user', content: 'breakfast at the cafe' });
      await memory1.session.push(scope, { role: 'user', content: 'just biked along the river' });
      await memory1.consolidator.start();
      await memory1.consolidator.fireNow('standard', scope);
      const consolidatorStore: SqliteConsolidatorStateStore = (sqlite.memory as SqliteMemoryStore)
        .consolidator;
      const cursor1 = await consolidatorStore.getState(scope);
      expect(cursor1?.lastProcessedMessageId).not.toBeNull();

      // Simulate a fresh process by constructing a brand-new memory facade.
      const memory2 = createMemory({
        store: sqlite.memory,
        embeddings: sqlite.embeddings,
        consolidator: { tier: 'cheap', provider, defaultScope: scope },
      });
      await memory2.consolidator.start();
      const second = await memory2.consolidator.fireNow('standard', scope);
      expect(second?.factsCreated).toBe(0);
    } finally {
      await sqlite.close();
    }
  });
});
