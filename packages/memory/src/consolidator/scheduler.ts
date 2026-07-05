/**
 * Bridge helpers - wire a {@link Consolidator} into the
 * `@graphorin/triggers` Scheduler so trigger declarations fire on
 * the documented schedule (DEC-150 - "same code path lib + server").
 *
 * The bridge is structural: any object that exposes the same shape
 * as `@graphorin/triggers`'s `Scheduler` (a `register(declaration)`
 * method) works. The structural import keeps `@graphorin/memory`
 * dependency-free at the type level - the workspace consumer
 * supplies the actual scheduler at runtime.
 *
 * @packageDocumentation
 */

import type { SessionScope } from '@graphorin/core';
import type { Consolidator } from './runtime.js';
import { type ParsedTrigger, parseTriggerSpec, reasonFromTrigger } from './triggers.js';
import type { ConsolidatorTriggerSpec } from './types.js';

/**
 * Catch-up policy applied when a trigger missed one or more fires
 * while the scheduler was offline. Mirrors
 * `@graphorin/triggers`'s `CatchupPolicy` - duplicated here so the
 * memory package stays import-free at the type level.
 *
 * @stable
 */
export type ConsolidatorCatchupPolicy = 'none' | 'last' | 'all';

/**
 * Subset of the `@graphorin/triggers` Scheduler surface the bridge
 * needs. Defined structurally so consumers can inject mocks in
 * tests without taking the package dependency.
 *
 * @stable
 */
export interface SchedulerLike {
  register(declaration: TriggerDeclarationLike): Promise<unknown>;
  unregister?(id: string): Promise<void>;
}

/**
 * Subset of `@graphorin/triggers`'s `TriggerDeclaration` accepted
 * by {@link SchedulerLike.register}. Field names mirror the
 * upstream shape exactly so the structural type is interchangeable
 * with the real export.
 *
 * @stable
 */
export interface TriggerDeclarationLike {
  readonly id: string;
  readonly kind: 'cron' | 'interval' | 'idle' | 'event';
  readonly spec: string;
  readonly callback: (payload?: unknown) => void | Promise<void>;
  readonly options: {
    readonly catchupPolicy?: ConsolidatorCatchupPolicy;
    readonly maxCatchupRuns?: number;
    readonly catchupWindowMs?: number;
    readonly tags?: ReadonlyArray<string>;
    readonly acknowledgeLibMode?: boolean;
  };
}

/** Options accepted by {@link registerConsolidatorTriggers}. */
export interface RegisterTriggersOptions {
  /**
   * Scope passed to `consolidator.trigger(...)` for every fire. The
   * consolidator only operates on a single user/session at a time
   * (DEC-005 single-user-per-process); multi-tenant deployments
   * register one scheduler-trigger pair per scope.
   */
  readonly scope: SessionScope;
  /**
   * Catch-up policy applied to every registered trigger. Defaults
   * to `'none'` per DEC-150 - safest for personal-assistant
   * scenarios.
   */
  readonly catchupPolicy?: ConsolidatorCatchupPolicy;
  /** Suppress the per-process library-mode WARN. Defaults to `true`. */
  readonly acknowledgeLibMode?: boolean;
  /** Optional id prefix - useful when multiple scopes share a scheduler. */
  readonly idPrefix?: string;
  /** Optional tags forwarded to the scheduler. */
  readonly tags?: ReadonlyArray<string>;
  /**
   * Filter - only register the supplied subset of triggers. By
   * default every parseable trigger declared on the consolidator is
   * registered (turn / event triggers are skipped because the
   * Scheduler has no way to fire them on its own).
   */
  readonly include?: ReadonlyArray<ConsolidatorTriggerSpec>;
}

/**
 * Outcome of {@link registerConsolidatorTriggers}.
 *
 * @stable
 */
export interface RegisterTriggersResult {
  readonly registered: ReadonlyArray<{
    readonly id: string;
    readonly kind: ParsedTrigger['kind'];
    readonly raw: string;
  }>;
  readonly skipped: ReadonlyArray<{
    readonly raw: string;
    readonly reason: 'unsupported-by-scheduler' | 'filtered-out';
  }>;
}

/**
 * Register every cron / idle / interval trigger declared on the
 * supplied consolidator with the scheduler. Each trigger fires
 * `consolidator.trigger(reason, scope)` so the lib-mode + server
 * paths converge on the same handler.
 *
 * Turn triggers (`turn:N`) and event triggers (`event:NAME`) are
 * skipped - the scheduler cannot count user turns autonomously, and
 * event triggers fire from the consumer's emit path. The runtime
 * caller is responsible for those (e.g. invoking
 * `consolidator.trigger(...)` from the agent loop).
 *
 * @stable
 */
export async function registerConsolidatorTriggers(
  consolidator: Consolidator,
  scheduler: SchedulerLike,
  options: RegisterTriggersOptions,
): Promise<RegisterTriggersResult> {
  const config = consolidator.config();
  const include = options.include ?? config.triggers;
  const acknowledgeLibMode = options.acknowledgeLibMode ?? true;
  const catchupPolicy: ConsolidatorCatchupPolicy = options.catchupPolicy ?? 'none';
  const registered: Array<{ id: string; kind: ParsedTrigger['kind']; raw: string }> = [];
  const skipped: Array<{ raw: string; reason: 'unsupported-by-scheduler' | 'filtered-out' }> = [];
  const seenSet = new Set(include);
  for (const spec of config.triggers) {
    if (!seenSet.has(spec)) {
      skipped.push({ raw: spec, reason: 'filtered-out' });
      continue;
    }
    const parsed = parseTriggerSpec(spec);
    if (parsed.kind === 'turn' || parsed.kind === 'event' || parsed.kind === 'budget') {
      skipped.push({ raw: parsed.raw, reason: 'unsupported-by-scheduler' });
      continue;
    }
    const id = `${options.idPrefix ?? 'consolidator'}:${parsed.raw}`;
    const kind: 'cron' | 'idle' | 'interval' = parsed.kind === 'cron' ? 'cron' : 'idle';
    const declaration: TriggerDeclarationLike = {
      id,
      kind,
      spec: parsed.kind === 'cron' ? parsed.expression : String(parsed.idleMs),
      async callback() {
        await consolidator.trigger(reasonFromTrigger(parsed), options.scope);
      },
      options: {
        catchupPolicy,
        acknowledgeLibMode,
        ...(options.tags !== undefined ? { tags: options.tags } : {}),
      },
    };
    await scheduler.register(declaration);
    registered.push({ id, kind: parsed.kind, raw: parsed.raw });
  }
  return Object.freeze({
    registered: Object.freeze(registered),
    skipped: Object.freeze(skipped),
  });
}
