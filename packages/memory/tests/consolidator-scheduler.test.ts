/**
 * Compatibility test — the structural `SchedulerLike` shape exposed
 * by `@graphorin/memory/consolidator/scheduler` is satisfied by the
 * production `@graphorin/triggers` Scheduler. Wires a real Scheduler
 * into the consolidator and asserts that registered idle triggers
 * fire `consolidator.trigger(...)` on the documented schedule.
 */

import type { SessionScope, TriggerStore } from '@graphorin/core';
import { _resetLibModeWarningForTesting, createScheduler } from '@graphorin/triggers';
import { describe, expect, it } from 'vitest';
import {
  type ConsolidatorTriggerSpec,
  createMemory,
  registerConsolidatorTriggers,
} from '../src/index.js';
import { createInMemoryStore, InMemoryEmbeddingRegistry } from './fixtures/in-memory-store.js';

interface InMemoryTriggerRow {
  state: import('@graphorin/core').TriggerState;
}

function inMemoryTriggerStore(): TriggerStore {
  const rows = new Map<string, InMemoryTriggerRow>();
  return {
    async upsert(state) {
      rows.set(state.id, { state });
    },
    async get(id) {
      return rows.get(id)?.state ?? null;
    },
    async list() {
      return [...rows.values()].map((r) => r.state);
    },
    async remove(id) {
      rows.delete(id);
    },
    async recordFire(id, lastFiredAt, nextFireAt) {
      const row = rows.get(id);
      if (row !== undefined) {
        rows.set(id, {
          state: {
            ...row.state,
            lastFiredAt,
            ...(nextFireAt !== undefined ? { nextFireAt } : {}),
          },
        });
      }
    },
    async setDisabled(id, disabled) {
      const row = rows.get(id);
      if (row !== undefined) rows.set(id, { state: { ...row.state, disabled } });
    },
  };
}

describe('@graphorin/memory consolidator <> @graphorin/triggers — Scheduler bridge', () => {
  it('wires idle triggers into a real Scheduler that fires consolidator.trigger', async () => {
    _resetLibModeWarningForTesting();
    const store = createInMemoryStore({ withConsolidatorStore: true });
    const triggerStore = inMemoryTriggerStore();
    let now = 0;
    const handles: Array<{ cb: () => void; ms: number; cancelled: boolean }> = [];
    const scheduler = createScheduler({
      store: triggerStore,
      now: () => now,
      setTimeout: (cb, ms): unknown => {
        const handle = { cb, ms, cancelled: false };
        handles.push(handle);
        return handle;
      },
      clearTimeout: (handle): void => {
        const h = handle as { cancelled: boolean };
        h.cancelled = true;
      },
    });
    const scope: SessionScope = { userId: 'alex', sessionId: 's1' };
    const triggers: ReadonlyArray<ConsolidatorTriggerSpec> = ['idle:5m'];
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      consolidator: { tier: 'free', triggers, defaultScope: scope },
    });
    await memory.consolidator.start();

    let triggered = 0;
    const original = memory.consolidator.trigger.bind(memory.consolidator);
    (memory.consolidator as { trigger: typeof memory.consolidator.trigger }).trigger = async (
      reason,
      target,
    ) => {
      triggered += 1;
      return original(reason, target);
    };

    await scheduler.start();
    const result = await registerConsolidatorTriggers(memory.consolidator, scheduler, {
      scope,
      acknowledgeLibMode: true,
    });
    expect(result.registered.length).toBe(1);
    expect(result.registered[0]?.kind).toBe('idle');

    // Drive the timer one step — the scheduled callback fires the
    // consolidator's trigger() handler.
    expect(handles.length).toBeGreaterThan(0);
    const next = handles[handles.length - 1];
    if (next === undefined) throw new Error('expected scheduled handle');
    now += next.ms;
    next.cb();
    // Allow the scheduled callback's promise chain to resolve.
    await new Promise((resolve) => globalThis.setTimeout(resolve, 0));
    expect(triggered).toBeGreaterThanOrEqual(1);

    await scheduler.stop();
  });

  it('skips turn / event / budget triggers (Scheduler can not autonomously fire them)', async () => {
    _resetLibModeWarningForTesting();
    const store = createInMemoryStore({ withConsolidatorStore: true });
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      consolidator: {
        tier: 'free',
        triggers: ['turn:20', 'event:user-pause', 'budget:0.5', 'cron:0 3 * * *'],
        defaultScope: { userId: 'alex' },
      },
    });
    await memory.consolidator.start();
    const scheduler: import('../src/index.js').SchedulerLike = {
      async register(declaration): Promise<unknown> {
        return declaration;
      },
    };
    const result = await registerConsolidatorTriggers(memory.consolidator, scheduler, {
      scope: { userId: 'alex' },
    });
    const registeredKinds = result.registered.map((r) => r.kind);
    expect(registeredKinds).toEqual(['cron']);
    const skippedReasons = result.skipped.map((s) => s.reason);
    expect(skippedReasons).toContain('unsupported-by-scheduler');
  });

  it('registerWithScheduler registers the default idle + deep-reaching cron via the configured scope (MCON-4)', async () => {
    const store = createInMemoryStore({ withConsolidatorStore: true });
    // No explicit triggers ⇒ the default set, which now includes a daily cron
    // so the **deep** phase is reachable (`#planPhases` only schedules deep for
    // cron / manual / budget reasons).
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      consolidator: { tier: 'free', defaultScope: { userId: 'alex' } },
    });
    await memory.consolidator.start();
    const registered: Array<{ kind: string; spec: string }> = [];
    const scheduler: import('../src/index.js').SchedulerLike = {
      async register(declaration): Promise<unknown> {
        registered.push({ kind: declaration.kind, spec: declaration.spec });
        return declaration;
      },
    };
    const result = await memory.consolidator.registerWithScheduler(scheduler);
    expect(result.registered.map((r) => r.kind).sort()).toEqual(['cron', 'idle']);
    expect(registered.some((r) => r.kind === 'cron')).toBe(true);
  });

  it('registerWithScheduler throws when no defaultScope is configured', async () => {
    const store = createInMemoryStore({ withConsolidatorStore: true });
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      consolidator: { tier: 'free' },
    });
    await memory.consolidator.start();
    const scheduler: import('../src/index.js').SchedulerLike = {
      async register(declaration): Promise<unknown> {
        return declaration;
      },
    };
    await expect(memory.consolidator.registerWithScheduler(scheduler)).rejects.toThrow(
      /defaultScope/,
    );
  });
});
