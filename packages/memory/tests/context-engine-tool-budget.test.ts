import { describe, expect, it } from 'vitest';
import { allocateToolCatalogue, type ToolBudgetEntry, updateLazyLoadedSet } from '../src/index.js';

const TOOL_SEARCH: ToolBudgetEntry = { name: 'tool_search', description: 'search deferred tools' };

function fixture(n: number, prefix = 'tool'): ReadonlyArray<ToolBudgetEntry> {
  return Object.freeze(
    Array.from({ length: n }, (_, i) => ({
      name: `${prefix}_${i}`,
      description: `tool number ${i}`,
    })),
  );
}

describe('context-engine — tool budget allocator (RB-44; Phase 10d)', () => {
  it('skips deferral when eager + tool_search fits the cap', async () => {
    const out = await allocateToolCatalogue({
      eagerTools: fixture(20),
      lazyLoadedTools: [],
      toolSearch: TOOL_SEARCH,
      maxToolsInContext: 30,
    });
    expect(out.autoDeferralFired).toBe(false);
    expect(out.deferred).toEqual([]);
    expect(out.visible.length).toBe(21); // 20 eager + tool_search
  });

  it('cap=0 disables deferral entirely (every eager tool ships; tool_search NOT injected)', async () => {
    const out = await allocateToolCatalogue({
      eagerTools: fixture(90),
      lazyLoadedTools: [],
      toolSearch: TOOL_SEARCH,
      maxToolsInContext: 0,
    });
    expect(out.autoDeferralFired).toBe(false);
    expect(out.visible.length).toBe(90);
    expect(out.visible.some((t) => t.name === 'tool_search')).toBe(false);
  });

  it('auto-deferral fires when eager + tool_search exceeds cap (90 eager tools, cap 30)', async () => {
    const out = await allocateToolCatalogue({
      eagerTools: fixture(90),
      lazyLoadedTools: [],
      toolSearch: TOOL_SEARCH,
      maxToolsInContext: 30,
    });
    expect(out.autoDeferralFired).toBe(true);
    expect(out.visible.length).toBe(30); // 29 ranked eager + tool_search
    expect(out.visible[out.visible.length - 1]).toBe(TOOL_SEARCH);
    // tool_search counts toward the cap of 30; deferred = 90 - 29 = 61.
    expect(out.deferred.length).toBe(61);
    // tool_search is exempt from deferral.
    expect(out.deferred.some((t) => t.name === 'tool_search')).toBe(false);
  });

  it('extreme low cap of 1 keeps tool_search visible', async () => {
    const out = await allocateToolCatalogue({
      eagerTools: fixture(20),
      lazyLoadedTools: [],
      toolSearch: TOOL_SEARCH,
      maxToolsInContext: 1,
    });
    expect(out.autoDeferralFired).toBe(true);
    expect(out.visible).toEqual([TOOL_SEARCH]);
    expect(out.deferred.length).toBe(20);
  });

  it('prepareStep({ tools }) override bypasses the allocator entirely', async () => {
    const overrideTools = fixture(2, 'override');
    const out = await allocateToolCatalogue({
      eagerTools: fixture(90),
      lazyLoadedTools: [],
      toolSearch: TOOL_SEARCH,
      maxToolsInContext: 30,
      prepareStepOverride: overrideTools,
    });
    expect(out.prepareStepOverrideApplied).toBe(true);
    expect(out.autoDeferralFired).toBe(false);
    expect(out.visible).toEqual(overrideTools);
    expect(out.visible.some((t) => t.name === 'tool_search')).toBe(false);
  });

  it('lazy-loaded set evicts oldest by LRU when union exceeds cap (cap=5)', async () => {
    let lazy = updateLazyLoadedSet([], { added: ['t_a'], now: () => 1 });
    lazy = updateLazyLoadedSet(lazy, { added: ['t_b'], now: () => 2 });
    lazy = updateLazyLoadedSet(lazy, { added: ['t_c'], now: () => 3 });
    lazy = updateLazyLoadedSet(lazy, { added: ['t_d'], now: () => 4 });
    lazy = updateLazyLoadedSet(lazy, { added: ['t_e'], now: () => 5 });
    // Cap of 5: tool_search (1) + 4 lazy slots; the oldest must be evicted.
    const out = await allocateToolCatalogue({
      eagerTools: [],
      lazyLoadedTools: lazy,
      toolSearch: TOOL_SEARCH,
      maxToolsInContext: 5,
    });
    expect(out.evictedLazy).toEqual([{ toolName: 't_a', reason: 'lru' }]);
    expect(out.visible.map((t) => t.name)).toContain('t_e');
    expect(out.visible.map((t) => t.name)).toContain('tool_search');
  });

  it('lastUsedAt update via invoked event protects the would-be-evicted entry', async () => {
    let lazy = updateLazyLoadedSet([], { added: ['t_a'], now: () => 1 });
    lazy = updateLazyLoadedSet(lazy, { added: ['t_b'], now: () => 2 });
    lazy = updateLazyLoadedSet(lazy, { added: ['t_c'], now: () => 3 });
    lazy = updateLazyLoadedSet(lazy, { added: ['t_d'], now: () => 4 });
    // Re-invoke t_a so it becomes the newest by lastUsedAt.
    lazy = updateLazyLoadedSet(lazy, { invoked: ['t_a'], now: () => 100 });
    lazy = updateLazyLoadedSet(lazy, { added: ['t_e'], now: () => 101 });
    const out = await allocateToolCatalogue({
      eagerTools: [],
      lazyLoadedTools: lazy,
      toolSearch: TOOL_SEARCH,
      maxToolsInContext: 5,
    });
    // t_b should now be the oldest, since t_a was re-invoked.
    expect(out.evictedLazy).toEqual([{ toolName: 't_b', reason: 'lru' }]);
  });

  it('uses the ranker when supplied to pick the survivors', async () => {
    const out = await allocateToolCatalogue({
      eagerTools: fixture(10),
      lazyLoadedTools: [],
      toolSearch: TOOL_SEARCH,
      maxToolsInContext: 4, // 3 ranked + tool_search
      ranker: {
        async search() {
          return [
            { toolName: 'tool_5', score: 0.9 },
            { toolName: 'tool_7', score: 0.8 },
            { toolName: 'tool_3', score: 0.7 },
          ];
        },
      },
    });
    const visibleNames = out.visible.map((t) => t.name);
    expect(visibleNames).toEqual(['tool_5', 'tool_7', 'tool_3', 'tool_search']);
    expect(out.deferred.length).toBe(7);
  });
});
