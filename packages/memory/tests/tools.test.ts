import type { Tool, ToolExecutionContext } from '@graphorin/core';
import { NOOP_LOGGER, NOOP_TRACER } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { createMemory, defineBlock } from '../src/index.js';
import {
  createInMemoryStore,
  createStubEmbedder,
  InMemoryEmbeddingRegistry,
} from './fixtures/in-memory-store.js';

const SCOPE = { userId: 'alex', sessionId: 's1' };

describe('@graphorin/memory/tools — block tools', () => {
  it('block_append + block_replace + block_rethink', async () => {
    const memory = createMemoryWithScope();
    memory.working.define(defineBlock({ label: 'notes', charLimit: 200 }));
    const append = findTool(memory.tools, 'block_append');
    const replace = findTool(memory.tools, 'block_replace');
    const rethink = findTool(memory.tools, 'block_rethink');
    const ctx = makeCtx();
    await append.execute({ label: 'notes', content: 'first' }, ctx);
    await append.execute({ label: 'notes', content: 'second' }, ctx);
    expect(await memory.working.read(SCOPE, 'notes')).toBe('first\nsecond');
    await replace.execute({ label: 'notes', oldUnique: 'first', newText: 'one' }, ctx);
    expect(await memory.working.read(SCOPE, 'notes')).toBe('one\nsecond');
    await rethink.execute({ label: 'notes', newValue: 'fresh' }, ctx);
    expect(await memory.working.read(SCOPE, 'notes')).toBe('fresh');
  });
});

describe('@graphorin/memory/tools — fact tools', () => {
  it('fact_remember + fact_search round-trip', async () => {
    const memory = createMemoryWithScope({ embedder: createStubEmbedder() });
    const remember = findTool(memory.tools, 'fact_remember');
    const search = findTool(memory.tools, 'fact_search');
    const ctx = makeCtx();
    const out = (await remember.execute({ text: 'lives in Tbilisi' }, ctx)) as {
      factId: string;
    };
    expect(out.factId).toBeDefined();
    const result = (await search.execute({ query: 'Tbilisi' }, ctx)) as {
      hits: Array<{ factId: string }>;
    };
    expect(result.hits.length).toBeGreaterThan(0);
  });

  it('fact_supersede chains the new fact and stores the link', async () => {
    const memory = createMemoryWithScope();
    const remember = findTool(memory.tools, 'fact_remember');
    const supersede = findTool(memory.tools, 'fact_supersede');
    const ctx = makeCtx();
    const first = (await remember.execute({ text: 'lives in Moscow' }, ctx)) as {
      factId: string;
    };
    const next = (await supersede.execute(
      { oldId: first.factId, newText: 'lives in Tbilisi' },
      ctx,
    )) as { oldId: string; newId: string };
    expect(next.oldId).toBe(first.factId);
    expect(next.newId).not.toBe(first.factId);
  });

  it('fact_search honours asOf (point-in-time)', async () => {
    const memory = createMemoryWithScope();
    const remember = findTool(memory.tools, 'fact_remember');
    const search = findTool(memory.tools, 'fact_search');
    const ctx = makeCtx();
    await remember.execute(
      {
        text: 'residence is Berlin',
        validFrom: '2024-01-01T00:00:00.000Z',
        validTo: '2024-06-01T00:00:00.000Z',
      },
      ctx,
    );
    await remember.execute(
      { text: 'residence is Munich', validFrom: '2024-06-01T00:00:00.000Z' },
      ctx,
    );
    const before = (await search.execute(
      { query: 'residence', asOf: '2024-03-01T00:00:00.000Z' },
      ctx,
    )) as { hits: Array<{ text: string }> };
    expect(before.hits.map((h) => h.text)).toEqual(['residence is Berlin']);
  });

  it('fact_history returns the ordered supersede chain', async () => {
    const memory = createMemoryWithScope();
    const remember = findTool(memory.tools, 'fact_remember');
    const supersede = findTool(memory.tools, 'fact_supersede');
    const history = findTool(memory.tools, 'fact_history');
    const ctx = makeCtx();
    const first = (await remember.execute(
      { text: 'residence is Moscow', validFrom: '2024-01-01T00:00:00.000Z' },
      ctx,
    )) as { factId: string };
    const next = (await supersede.execute(
      { oldId: first.factId, newText: 'residence is Tbilisi' },
      ctx,
    )) as { oldId: string; newId: string };
    const out = (await history.execute({ factId: next.newId }, ctx)) as {
      chain: Array<{ factId: string; text: string }>;
    };
    expect(out.chain.map((c) => c.factId)).toEqual([first.factId, next.newId]);
    expect(out.chain.map((c) => c.text)).toEqual(['residence is Moscow', 'residence is Tbilisi']);
  });

  it('fact_validate promotes a quarantined fact into recall (and fact_search surfaces provenance)', async () => {
    const memory = createMemoryWithScope();
    const search = findTool(memory.tools, 'fact_search');
    const validate = findTool(memory.tools, 'fact_validate');
    const ctx = makeCtx();
    // A synthesized (extraction) write lands quarantined — hidden from default recall.
    const quarantined = await memory.semantic.remember(SCOPE, {
      text: 'synthesized claim about the user',
      provenance: 'extraction',
    });
    const before = (await search.execute({ query: 'synthesized' }, ctx)) as { hits: unknown[] };
    expect(before.hits.length).toBe(0);

    const out = (await validate.execute({ factId: quarantined.id }, ctx)) as {
      factId: string;
      validated: boolean;
    };
    expect(out.validated).toBe(true);

    const after = (await search.execute({ query: 'synthesized' }, ctx)) as {
      hits: Array<{ factId: string; provenance?: string }>;
    };
    expect(after.hits.map((h) => h.factId)).toEqual([quarantined.id]);
    expect(after.hits[0]?.provenance).toBe('extraction');
  });

  it('fact_forget soft-deletes the fact', async () => {
    const memory = createMemoryWithScope();
    const remember = findTool(memory.tools, 'fact_remember');
    const forget = findTool(memory.tools, 'fact_forget');
    const ctx = makeCtx();
    const stored = (await remember.execute({ text: 'a transient detail' }, ctx)) as {
      factId: string;
    };
    const result = (await forget.execute({ factId: stored.factId }, ctx)) as {
      factId: string;
      forgotten: boolean;
    };
    expect(result.forgotten).toBe(true);
    const search = findTool(memory.tools, 'fact_search');
    const out = (await search.execute({ query: 'transient' }, ctx)) as {
      hits: Array<{ factId: string }>;
    };
    expect(out.hits.find((h) => h.factId === stored.factId)).toBeUndefined();
  });
});

describe('@graphorin/memory/tools — recall tools', () => {
  it('recall_episodes returns matched episodes', async () => {
    const memory = createMemoryWithScope();
    const recall = findTool(memory.tools, 'recall_episodes');
    await memory.episodic.record(SCOPE, {
      summary: 'Met with the city architect about Mtatsminda renovations.',
      startedAt: new Date(0).toISOString(),
      endedAt: new Date(60_000).toISOString(),
    });
    const ctx = makeCtx();
    const result = (await recall.execute({ query: 'architect' }, ctx)) as {
      episodes: Array<{ summary: string }>;
    };
    expect(result.episodes.length).toBe(1);
    expect(result.episodes[0]?.summary).toContain('architect');
  });

  it('conversation_search returns matched session messages', async () => {
    const memory = createMemoryWithScope();
    const search = findTool(memory.tools, 'conversation_search');
    await memory.session.push(SCOPE, { role: 'user', content: 'I want to plan a trip.' });
    const ctx = makeCtx();
    const result = (await search.execute({ query: 'trip' }, ctx)) as {
      matches: Array<{ messageId: string }>;
    };
    expect(result.matches.length).toBe(1);
  });
});

describe('@graphorin/memory/tools — guard wiring', () => {
  it('memoryGuardTier is set on every memory-mutating tool', () => {
    const memory = createMemoryWithScope();
    const tools = Object.fromEntries(memory.tools.map((t) => [t.name, t]));
    expect(tools.block_append?.memoryGuardTier).toBe('memory-aware');
    expect(tools.block_replace?.memoryGuardTier).toBe('memory-aware');
    expect(tools.block_rethink?.memoryGuardTier).toBe('memory-aware');
    expect(tools.fact_remember?.memoryGuardTier).toBe('memory-aware');
    expect(tools.fact_supersede?.memoryGuardTier).toBe('memory-aware');
    expect(tools.fact_forget?.memoryGuardTier).toBe('memory-aware');
    expect(tools.fact_validate?.memoryGuardTier).toBe('memory-aware');
    expect(tools.fact_search?.memoryGuardTier).toBe('pure');
    expect(tools.fact_history?.memoryGuardTier).toBe('pure');
    expect(tools.recall_episodes?.memoryGuardTier).toBe('pure');
    expect(tools.conversation_search?.memoryGuardTier).toBe('pure');
  });

  it('sideEffectClass is set on every memory tool', () => {
    const memory = createMemoryWithScope();
    for (const t of memory.tools) {
      expect(t.sideEffectClass).toBeDefined();
    }
  });
});

function findTool(tools: ReadonlyArray<Tool>, name: string): Tool {
  const t = tools.find((t) => t.name === name);
  if (t === undefined) throw new Error(`tool '${name}' not found`);
  return t;
}

function createMemoryWithScope(
  opts: { embedder?: ReturnType<typeof createStubEmbedder> } = {},
): ReturnType<typeof createMemory> {
  return createMemory({
    store: createInMemoryStore(),
    embeddings: new InMemoryEmbeddingRegistry(),
    resolveScope: () => SCOPE,
    ...(opts.embedder !== undefined ? { embedder: opts.embedder } : {}),
  });
}

function makeCtx(): ToolExecutionContext<unknown> {
  return {
    toolCallId: 'call_test',
    runContext: {} as never,
    signal: new AbortController().signal,
    tracer: NOOP_TRACER,
    logger: NOOP_LOGGER,
    secrets: {
      async require() {
        throw new Error('no secrets');
      },
    } as never,
    reportProgress() {},
    streamContent() {},
  };
}
