/**
 * Per-step tool-catalogue cardinality allocator (RB-44 / suggested
 * DEC-160 / ADR-048). Composes with the layered token-budget
 * allocator on the same `assemble()` call: deferral lowers the
 * tool-catalogue cost which lowers the system-prompt cost; the
 * existing token-budget allocator continues to manage the layered
 * template cost as before.
 *
 * @packageDocumentation
 */

import type {
  LazyLoadedToolEntry,
  ToolBudgetEntry,
  ToolCatalogueInput,
  ToolCatalogueResult,
} from './types.js';

/**
 * Run the tool-catalogue allocator. Pure function; the lazy-loaded
 * set is read but **not** mutated — the caller threads the new
 * state through their own bookkeeping (the agent runtime in Phase
 * 12 owns the per-`RunContext` lifecycle).
 *
 * @stable
 */
export async function allocateToolCatalogue(
  input: ToolCatalogueInput,
): Promise<ToolCatalogueResult> {
  // `prepareStep({ tools })` precedence — bypass everything.
  if (input.prepareStepOverride !== undefined) {
    return Object.freeze({
      visible: Object.freeze([...input.prepareStepOverride]),
      deferred: Object.freeze([] as ToolBudgetEntry[]),
      evictedLazy: Object.freeze(
        [] as ReadonlyArray<{
          readonly toolName: string;
          readonly reason: 'lru' | 'cap-overflow';
        }>,
      ),
      prepareStepOverrideApplied: true,
      autoDeferralFired: false,
    });
  }

  const cap = Math.max(0, input.maxToolsInContext);
  const eager = [...input.eagerTools];
  const lazy = [...input.lazyLoadedTools];
  const toolSearchEntry = input.toolSearch;

  // Cap == 0 → auto-deferral disabled. Ship every eager tool;
  // suppress `tool_search` per the spec ("setting maxToolsInContext: 0
  // suppresses tool_search registration AND keeps every registered
  // tool eager").
  if (cap === 0) {
    return Object.freeze({
      visible: Object.freeze([...eager]),
      deferred: Object.freeze([]),
      evictedLazy: Object.freeze(
        [] as ReadonlyArray<{
          readonly toolName: string;
          readonly reason: 'lru' | 'cap-overflow';
        }>,
      ),
      prepareStepOverrideApplied: false,
      autoDeferralFired: false,
    });
  }

  // The visible budget == cap. `tool_search` is exempt and counted
  // toward the assembled catalogue when any tool is deferred.
  // Compute eager + lazy + (`tool_search` when fired) ≤ cap.
  const eagerByName = new Map(eager.map((t) => [t.name, t]));
  const lazyByName = new Map<string, ToolBudgetEntry>();
  const lazyEntriesByName = new Map<string, LazyLoadedToolEntry>();
  for (const entry of lazy) {
    const tool = eagerByName.get(entry.toolName);
    if (tool !== undefined) {
      // The lazy entry shadows the eager entry — eager set membership
      // takes precedence (the tool is back in the eager set).
      continue;
    }
    lazyEntriesByName.set(entry.toolName, entry);
    lazyByName.set(entry.toolName, { name: entry.toolName });
  }

  // Determine whether deferral fires (eager.length + 1 > cap, where the
  // +1 is the always-present `tool_search` entry the caller supplies).
  const exemptCount = toolSearchEntry !== undefined ? 1 : 0;
  const wantsAutoDeferral = eager.length + exemptCount > cap;

  if (!wantsAutoDeferral) {
    // No deferral needed — ship every eager tool + lazy + tool_search
    // (when supplied).
    const lazyAdditions: ToolBudgetEntry[] = [];
    const evictedLazy: Array<{
      readonly toolName: string;
      readonly reason: 'lru' | 'cap-overflow';
    }> = [];
    // Lazy may still overflow when union > cap.
    const visibleBudget = cap - exemptCount;
    const visibleSpentOnEager = eager.length;
    if (visibleSpentOnEager + lazyByName.size <= visibleBudget) {
      lazyAdditions.push(...lazyByName.values());
    } else {
      // LRU eviction inside the lazy set.
      const sortedLazy = [...lazyByName.values()].sort((a, b) => {
        const ae = lazyEntriesByName.get(a.name);
        const be = lazyEntriesByName.get(b.name);
        return (ae?.lastUsedAt ?? 0) - (be?.lastUsedAt ?? 0);
      });
      const lazySlots = Math.max(0, visibleBudget - visibleSpentOnEager);
      const evictCount = sortedLazy.length - lazySlots;
      const evicted = sortedLazy.slice(0, evictCount);
      const survived = sortedLazy.slice(evictCount);
      lazyAdditions.push(...survived);
      for (const entry of evicted) {
        evictedLazy.push({ toolName: entry.name, reason: 'lru' });
      }
    }
    void visibleSpentOnEager;
    const visible: ToolBudgetEntry[] = [
      ...eager,
      ...lazyAdditions,
      ...(toolSearchEntry !== undefined ? [toolSearchEntry] : []),
    ];
    return Object.freeze({
      visible: Object.freeze(visible),
      deferred: Object.freeze([]),
      evictedLazy: Object.freeze(evictedLazy),
      prepareStepOverrideApplied: false,
      autoDeferralFired: false,
    });
  }

  // Auto-deferral fires. Rank the eager tools and pick the top
  // `cap - exemptCount` survivors.
  const eagerSurvivors = await pickEagerSurvivors(
    eager,
    Math.max(0, cap - exemptCount),
    input.lastUserMessage ?? '',
    input.ranker,
  );
  const deferred: ToolBudgetEntry[] = eager.filter(
    (t) => !eagerSurvivors.some((s) => s.name === t.name),
  );

  // Lazy-loaded set still wants slots; reserve nothing for them when
  // deferral fires (the eager survivors win the budget). Every lazy
  // entry is evicted with `'cap-overflow'` reason.
  const evictedLazy: Array<{ readonly toolName: string; readonly reason: 'lru' | 'cap-overflow' }> =
    [];
  for (const entry of lazyByName.values()) {
    evictedLazy.push({ toolName: entry.name, reason: 'cap-overflow' });
  }

  const visible: ToolBudgetEntry[] = [
    ...eagerSurvivors,
    ...(toolSearchEntry !== undefined ? [toolSearchEntry] : []),
  ];

  return Object.freeze({
    visible: Object.freeze(visible),
    deferred: Object.freeze(deferred),
    evictedLazy: Object.freeze(evictedLazy),
    prepareStepOverrideApplied: false,
    autoDeferralFired: true,
  });
}

async function pickEagerSurvivors(
  eager: ReadonlyArray<ToolBudgetEntry>,
  budget: number,
  query: string,
  ranker: ToolCatalogueInput['ranker'],
): Promise<ReadonlyArray<ToolBudgetEntry>> {
  if (budget <= 0) return [];
  if (eager.length <= budget) return eager;
  if (ranker === undefined) {
    // Stable fallback: preserve registration order (the first
    // `budget` entries win). Deterministic and dependency-free.
    return eager.slice(0, budget);
  }
  const ranked = await ranker.search(query, budget);
  if (ranked.length === 0) return eager.slice(0, budget);
  const eagerByName = new Map(eager.map((t) => [t.name, t]));
  const survivors: ToolBudgetEntry[] = [];
  for (const hit of ranked) {
    const entry = eagerByName.get(hit.toolName);
    if (entry !== undefined && !survivors.some((s) => s.name === entry.name)) {
      survivors.push(entry);
      if (survivors.length >= budget) break;
    }
  }
  // Top-up with any remaining eager tools to fill the budget when
  // the ranker returned fewer hits than requested.
  if (survivors.length < budget) {
    for (const entry of eager) {
      if (!survivors.some((s) => s.name === entry.name)) {
        survivors.push(entry);
        if (survivors.length >= budget) break;
      }
    }
  }
  return survivors;
}

/**
 * Update the lazy-loaded set after a step. The caller threads the
 * returned snapshot through their own bookkeeping (Phase 12 owns
 * the lifecycle in production; tests use this directly).
 *
 * @stable
 */
export function updateLazyLoadedSet(
  current: ReadonlyArray<LazyLoadedToolEntry>,
  events: {
    readonly added?: ReadonlyArray<string>;
    readonly invoked?: ReadonlyArray<string>;
    readonly evicted?: ReadonlyArray<string>;
    readonly now?: () => number;
  } = {},
): ReadonlyArray<LazyLoadedToolEntry> {
  const now = (events.now ?? Date.now)();
  const map = new Map<string, LazyLoadedToolEntry>();
  for (const entry of current) {
    map.set(entry.toolName, entry);
  }
  for (const toolName of events.added ?? []) {
    if (!map.has(toolName)) {
      map.set(toolName, { toolName, addedAt: now, lastUsedAt: now });
    }
  }
  for (const toolName of events.invoked ?? []) {
    const entry = map.get(toolName);
    if (entry !== undefined) {
      map.set(toolName, { ...entry, lastUsedAt: now });
    }
  }
  for (const toolName of events.evicted ?? []) {
    map.delete(toolName);
  }
  return Object.freeze([...map.values()]);
}
