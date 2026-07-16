import type {
  Message,
  Provider,
  ProviderRequest,
  ProviderResponse,
  SessionScope,
} from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import type { ConsolidatorTriggerSpec } from '../src/consolidator/types.js';
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

/**
 * Item 7 (A2) - the `buffer:N` trigger: `notifyActivity(...)` measures
 * the unconsolidated transcript tail from the standard-phase cursor
 * (chars/4 proxy over the same rendering the extraction consumes) and
 * fires the light+standard chain once the configured token threshold
 * is reached. Contract: "buffer:N OR idle:T", whichever first.
 */

const SCOPE: SessionScope = { userId: 'alex', sessionId: 's1' };

const LONG_LINE =
  'I just moved to Tbilisi for work and I am loving the food, the mountains, and the long walks.';

async function push(memory: ReturnType<typeof createMemory>, texts: readonly string[]) {
  for (const text of texts) {
    const message: Message = { role: 'user', content: text };
    await memory.session.push(SCOPE, message);
  }
}

function build(triggers: ReadonlyArray<ConsolidatorTriggerSpec> | undefined) {
  const store = createInMemoryStore({ withConflictStore: true, withConsolidatorStore: true });
  const provider = fakeProvider([
    {
      text: '{"facts":[]}',
      usage: { promptTokens: 20, completionTokens: 5, totalTokens: 25 },
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
      defaultScope: SCOPE,
      ...(triggers !== undefined ? { triggers } : {}),
      ceilings: { cooldownMs: 0 },
    },
  });
  return { memory, provider };
}

describe('consolidator notifyActivity - buffer:N trigger (item 7)', () => {
  it('stays quiet below the threshold', async () => {
    const { memory, provider } = build(['buffer:200']);
    await push(memory, ['hi']);
    await memory.consolidator.start();
    const outcome = await memory.consolidator.notifyActivity(SCOPE);
    expect(outcome).toBeNull();
    expect(provider.calls.length).toBe(0);
  });

  it('fires the light+standard chain with reason buffer once the tail clears the threshold', async () => {
    const { memory, provider } = build(['buffer:30']);
    const reasons: string[] = [];
    memory.consolidator.onPhaseFinished((info) => {
      reasons.push(info.trigger.kind);
    });
    await push(memory, [LONG_LINE, LONG_LINE]);
    await memory.consolidator.start();
    const outcome = await memory.consolidator.notifyActivity(SCOPE);
    expect(outcome).not.toBeNull();
    expect(provider.calls.length).toBe(1);
    expect(reasons).toContain('buffer');
  });

  it('uses the defaultScope when called without one', async () => {
    const { memory, provider } = build(['buffer:30']);
    await push(memory, [LONG_LINE, LONG_LINE]);
    await memory.consolidator.start();
    const outcome = await memory.consolidator.notifyActivity();
    expect(outcome).not.toBeNull();
    expect(provider.calls.length).toBe(1);
  });

  it('is a no-op when no buffer trigger is configured', async () => {
    const { memory, provider } = build(undefined); // per-tier default triggers: idle + cron
    await push(memory, [LONG_LINE, LONG_LINE, LONG_LINE]);
    await memory.consolidator.start();
    const outcome = await memory.consolidator.notifyActivity(SCOPE);
    expect(outcome).toBeNull();
    expect(provider.calls.length).toBe(0);
  });

  it('is a no-op before start()', async () => {
    const { memory, provider } = build(['buffer:30']);
    await push(memory, [LONG_LINE, LONG_LINE]);
    const outcome = await memory.consolidator.notifyActivity(SCOPE);
    expect(outcome).toBeNull();
    expect(provider.calls.length).toBe(0);
  });

  it('goes quiet again after the standard phase advances the cursor', async () => {
    const { memory, provider } = build(['buffer:30']);
    await push(memory, [LONG_LINE, LONG_LINE]);
    await memory.consolidator.start();
    expect(await memory.consolidator.notifyActivity(SCOPE)).not.toBeNull();
    expect(provider.calls.length).toBe(1);
    // The tail was consumed - the next activity signal finds nothing.
    expect(await memory.consolidator.notifyActivity(SCOPE)).toBeNull();
    expect(provider.calls.length).toBe(1);
  });

  // BUFFER-N-01: a buffer-only library deployment never calls
  // registerConsolidatorTriggers (where a malformed spec throws), so an invalid
  // spec like 'buffer:0' must not vanish silently at construction.
  it('warns at construction for an invalid buffer spec instead of silently ignoring it', async () => {
    const chunks: string[] = [];
    const orig = process.stderr.write.bind(process.stderr);
    process.stderr.write = ((chunk: unknown) => {
      chunks.push(String(chunk));
      return true;
    }) as typeof process.stderr.write;
    try {
      // Must not throw - createMemory does not reject the spec, it warns.
      const { memory } = build(['buffer:0']);
      // The invalid spec leaves the buffer loop inert (no threshold parsed).
      expect(await memory.consolidator.notifyActivity(SCOPE)).toBeNull();
    } finally {
      process.stderr.write = orig;
    }
    expect(chunks.some((c) => /invalid buffer trigger 'buffer:0'/.test(c))).toBe(true);
    expect(chunks.some((c) => /never fires/i.test(c))).toBe(true);
  });
});
