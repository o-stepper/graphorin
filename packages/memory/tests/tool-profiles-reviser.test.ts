/**
 * Wave-D D3 - memory tool profiles (interactive / reviser / full) +
 * curated-block generalisation of the learned-context pass + the
 * reviser consolidator preset.
 */

import type { Provider, ProviderRequest, ProviderResponse } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import { CuratedBlocksMisconfiguredError } from '../src/consolidator/errors.js';
import { reviserConsolidatorPreset } from '../src/consolidator/presets.js';
import { createMemory } from '../src/index.js';
import { buildMemoryTools } from '../src/tools/index.js';
import type { MemoryToolDeps } from '../src/tools/types.js';
import { createInMemoryStore, InMemoryEmbeddingRegistry } from './fixtures/in-memory-store.js';

const SCOPE = { userId: 'user-1', sessionId: 'sess-1', agentId: 'agent-1' } as const;

/** Names of the write-capable ('memory-aware' guard tier) tools. */
const WRITE_TOOL_NAMES = [
  'block_append',
  'block_replace',
  'block_rethink',
  'fact_remember',
  'fact_supersede',
  'fact_forget',
  'fact_validate',
];

const CANONICAL_FULL_ORDER = [
  'block_append',
  'block_replace',
  'block_rethink',
  'fact_remember',
  'fact_search',
  'fact_supersede',
  'fact_forget',
  'recall_episodes',
  'conversation_search',
  'fact_history',
  'fact_validate',
];

function toolDeps(): MemoryToolDeps {
  const store = createInMemoryStore({});
  const memory = createMemory({ store, embeddings: new InMemoryEmbeddingRegistry() });
  return {
    working: memory.working,
    session: memory.session,
    episodic: memory.episodic,
    semantic: memory.semantic,
    procedural: memory.procedural,
    shared: memory.shared,
    resolveScope: () => SCOPE,
  };
}

describe('buildMemoryTools profiles (wave-D D3)', () => {
  it("'full' (default) keeps the canonical stable order", () => {
    const deps = toolDeps();
    expect(buildMemoryTools(deps).map((t) => t.name)).toEqual(CANONICAL_FULL_ORDER);
    expect(buildMemoryTools(deps, { profile: 'full' }).map((t) => t.name)).toEqual(
      CANONICAL_FULL_ORDER,
    );
  });

  it("'interactive' contains ONLY read tools - non-overlap with the write set by construction", () => {
    const names = buildMemoryTools(toolDeps(), { profile: 'interactive' }).map((t) => t.name);
    expect(names).toEqual([
      'fact_search',
      'recall_episodes',
      'conversation_search',
      'fact_history',
    ]);
    for (const writeName of WRITE_TOOL_NAMES) {
      expect(names).not.toContain(writeName);
    }
  });

  it("'reviser' carries the full read+write surface; gated read appendices ride every profile", () => {
    const deps = toolDeps();
    expect(buildMemoryTools(deps, { profile: 'reviser' }).map((t) => t.name)).toEqual(
      CANONICAL_FULL_ORDER,
    );
    const interactivePlus = buildMemoryTools(deps, {
      profile: 'interactive',
      includeDeepRecall: true,
      includeRunbookSearch: true,
    }).map((t) => t.name);
    expect(interactivePlus).toEqual([
      'fact_search',
      'recall_episodes',
      'conversation_search',
      'fact_history',
      'deep_recall',
      'runbook_search',
    ]);
  });

  it('rejects an unknown profile value', () => {
    expect(() => buildMemoryTools(toolDeps(), { profile: 'admin' as never })).toThrow(
      /unknown memory tool profile 'admin'/,
    );
  });

  it('createMemory({ toolProfile }) threads the profile into memory.tools', () => {
    const store = createInMemoryStore({});
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      toolProfile: 'interactive',
    });
    const names = memory.tools.map((t) => t.name);
    expect(names).toEqual([
      'fact_search',
      'recall_episodes',
      'conversation_search',
      'fact_history',
    ]);
  });
});

function curatedProvider(): Provider & { readonly calls: ProviderRequest[] } {
  const calls: ProviderRequest[] = [];
  return {
    name: 'fake',
    modelId: 'fixture-curated',
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
      if (sys.includes('learned-context block')) {
        return {
          text: 'Digest: marathon training block.',
          usage: { promptTokens: 20, completionTokens: 10, totalTokens: 30 },
          finishReason: 'stop',
        };
      }
      const label = /'([^']+)' working block/.exec(sys)?.[1];
      if (label !== undefined) {
        return {
          text: `Curated content for ${label}.`,
          usage: { promptTokens: 20, completionTokens: 10, totalTokens: 30 },
          finishReason: 'stop',
        };
      }
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

async function setupCurated(consolidatorExtra: Record<string, unknown>): Promise<{
  memory: ReturnType<typeof createMemory>;
  provider: ReturnType<typeof curatedProvider>;
}> {
  const provider = curatedProvider();
  const store = createInMemoryStore({ withConflictStore: true, withConsolidatorStore: true });
  const memory = createMemory({
    store,
    embeddings: new InMemoryEmbeddingRegistry(),
    consolidator: {
      tier: 'full',
      provider,
      defaultScope: SCOPE,
      reflection: false,
      ...consolidatorExtra,
    },
  });
  await memory.consolidator.start();
  return { memory, provider };
}

describe('curated blocks (wave-D D3)', () => {
  it('the reviser updates several curated blocks in one deep pass', async () => {
    const { memory } = await setupCurated({
      learnedContext: true,
      curatedBlocks: [{ label: 'persona' }, { label: 'scratch', maxChars: 300 }],
    });
    // Evidence so the passes make their calls.
    await memory.episodic.record(SCOPE, {
      summary: 'User onboarding session.',
      startedAt: '2026-01-01T10:00:00.000Z',
      endedAt: '2026-01-01T10:05:00.000Z',
      importance: 0.7,
    });

    const outcome = await memory.consolidator.fireNow('deep', SCOPE);
    expect(outcome?.learnedContextUpdated).toBe(true);
    expect(outcome?.curatedBlocksUpdated).toBe(3);
    expect(await memory.working.read(SCOPE, 'learned_context')).toContain('marathon');
    expect(await memory.working.read(SCOPE, 'persona')).toBe('Curated content for persona.');
    expect(await memory.working.read(SCOPE, 'scratch')).toBe('Curated content for scratch.');
  });

  it('learnedContext: true stays byte-compatible sugar for the learned_context entry', async () => {
    const { memory, provider } = await setupCurated({ learnedContext: true });
    await memory.episodic.record(SCOPE, {
      summary: 'Some episode.',
      startedAt: '2026-01-01T10:00:00.000Z',
      endedAt: '2026-01-01T10:05:00.000Z',
      importance: 0.5,
    });
    const outcome = await memory.consolidator.fireNow('deep', SCOPE);
    expect(outcome?.learnedContextUpdated).toBe(true);
    expect(outcome?.curatedBlocksUpdated).toBe(1);
    // The canonical learned-context prompt is used - not the generic one.
    const call = provider.calls.find((r) =>
      (r.systemMessage ?? '').includes('learned-context block'),
    );
    expect(call).toBeDefined();
  });

  it('custom prompt override reaches the provider', async () => {
    const { memory, provider } = await setupCurated({
      curatedBlocks: [
        { label: 'persona', prompt: 'You maintain the persona card. CUSTOM-MARKER.' },
      ],
    });
    await memory.episodic.record(SCOPE, {
      summary: 'Episode.',
      startedAt: '2026-01-01T10:00:00.000Z',
      endedAt: '2026-01-01T10:05:00.000Z',
      importance: 0.5,
    });
    await memory.consolidator.fireNow('deep', SCOPE);
    expect(provider.calls.some((r) => (r.systemMessage ?? '').includes('CUSTOM-MARKER'))).toBe(
      true,
    );
  });

  it('validates labels: duplicates (incl. the sugar) and the reserved profile label throw', async () => {
    await expect(
      setupCurated({ learnedContext: true, curatedBlocks: [{ label: 'learned_context' }] }),
    ).rejects.toThrow(CuratedBlocksMisconfiguredError);
    await expect(setupCurated({ curatedBlocks: [{ label: 'profile' }] })).rejects.toThrow(
      /reserved/,
    );
    await expect(setupCurated({ curatedBlocks: [{ label: '  ' }] })).rejects.toThrow(/non-empty/);
  });
});

describe('reviserConsolidatorPreset (wave-D D3)', () => {
  const provider = curatedProvider();

  it('produces a hard-budget standard-tier config with deep-reaching cadence', () => {
    const config = reviserConsolidatorPreset({
      provider,
      defaultScope: SCOPE,
      curatedBlocks: [{ label: 'persona' }],
    });
    expect(config.enabled).toBe(true);
    expect(config.tier).toBe('standard');
    expect(config.onExceed).toBe('pause');
    expect(config.triggers).toEqual(['idle:15m', 'cron:0 5 * * *']);
    expect(config.deepProvider).toBe(provider);
    expect(config.curatedBlocks).toEqual([{ label: 'persona' }]);
  });

  it("rejects onExceed 'log' - an unattended reviser must stop, not narrate", () => {
    expect(() =>
      reviserConsolidatorPreset({
        provider,
        defaultScope: SCOPE,
        onExceed: 'log' as never,
      }),
    ).toThrow(/'log' is not allowed/);
  });

  it('the preset output drives a real reviser end to end', async () => {
    const p = curatedProvider();
    const store = createInMemoryStore({ withConflictStore: true, withConsolidatorStore: true });
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      consolidator: reviserConsolidatorPreset({
        provider: p,
        defaultScope: SCOPE,
        curatedBlocks: [{ label: 'persona' }, { label: 'learned_context' }],
      }),
    });
    await memory.consolidator.start();
    await memory.episodic.record(SCOPE, {
      summary: 'Episode.',
      startedAt: '2026-01-01T10:00:00.000Z',
      endedAt: '2026-01-01T10:05:00.000Z',
      importance: 0.5,
    });
    const outcome = await memory.consolidator.fireNow('deep', SCOPE);
    expect(outcome?.curatedBlocksUpdated).toBe(2);
    expect(await memory.working.read(SCOPE, 'persona')).toContain('persona');
  });
});
