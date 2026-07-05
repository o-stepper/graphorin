/**
 * @graphorin/triggers - durable cron / interval / idle / event
 * trigger scheduler for the Graphorin framework.
 *
 * @packageDocumentation
 */

import type { TriggerState, TriggerStore } from '@graphorin/core/contracts';
import { nextFireAfter, type ParsedCron, parseCron } from './cron.js';

export { CronParseError, nextFireAfter, type ParsedCron, parseCron } from './cron.js';

/** Canonical version constant. Mirrors the `package.json` version. */
export const VERSION = '0.5.0';

/**
 * Catch-up policy applied when a trigger missed one or more fires
 * while the scheduler was offline.
 *
 * - `'none'` - drop missed fires (default; safest for personal-assistant scenarios).
 * - `'last'` - fire once on resume (best for cron-style daily jobs).
 * - `'all'` - fire each missed run up to `maxCatchupRuns` within `catchupWindowMs`.
 *
 * @stable
 */
export type CatchupPolicy = 'none' | 'last' | 'all';

/** @stable */
export type TriggerKind = 'cron' | 'interval' | 'idle' | 'event';

/** @stable */
export interface TriggerOptions {
  readonly catchupPolicy?: CatchupPolicy;
  readonly maxCatchupRuns?: number;
  /**
   * How far back (from the last successful fire) misses are honored.
   * Catch-up counts REAL missed fires (RP-12), so the window must
   * exceed the trigger period - a 24h window can never catch up a
   * daily cron whose boundary is itself 24h after the last fire.
   * Default 24h.
   */
  readonly catchupWindowMs?: number;
  readonly tags?: ReadonlyArray<string>;
  /**
   * Suppress the one-time per-process library-mode WARN. Library
   * callers acknowledging that triggers fire only as long as the
   * process lives pass `true` here.
   */
  readonly acknowledgeLibMode?: boolean;
}

/**
 * Trigger callback. Receives an optional `payload` for `event`
 * triggers; for cron / interval / idle triggers `payload` is
 * `undefined`.
 *
 * @stable
 */
export type TriggerCallback = (payload?: unknown) => void | Promise<void>;

/**
 * Public trigger declaration emitted by the helper functions
 * (`cron(...)`, `interval(...)`, `idle(...)`, `event(...)`).
 *
 * @stable
 */
export interface TriggerDeclaration {
  readonly id: string;
  readonly kind: TriggerKind;
  readonly spec: string;
  readonly callback: TriggerCallback;
  readonly options: TriggerOptions;
}

/**
 * Build a cron trigger declaration. The expression is validated
 * eagerly - a malformed cron expression throws at registration time,
 * not at first fire.
 *
 * @stable
 */
export function cron(
  id: string,
  expression: string,
  callback: TriggerCallback,
  options: TriggerOptions = {},
): TriggerDeclaration {
  parseCron(expression);
  return { id, kind: 'cron', spec: expression, callback, options };
}

/** @stable */
export function interval(
  id: string,
  intervalMs: number,
  callback: TriggerCallback,
  options: TriggerOptions = {},
): TriggerDeclaration {
  if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
    throw new Error(`[graphorin/triggers] interval(${id}): intervalMs must be > 0`);
  }
  return {
    id,
    kind: 'interval',
    spec: String(intervalMs),
    callback,
    options,
  };
}

/** @stable */
export function idle(
  id: string,
  idleMs: number,
  callback: TriggerCallback,
  options: TriggerOptions = {},
): TriggerDeclaration {
  if (!Number.isFinite(idleMs) || idleMs <= 0) {
    throw new Error(`[graphorin/triggers] idle(${id}): idleMs must be > 0`);
  }
  return {
    id,
    kind: 'idle',
    spec: String(idleMs),
    callback,
    options,
  };
}

/** @stable */
export function event(
  id: string,
  eventName: string,
  callback: TriggerCallback,
  options: TriggerOptions = {},
): TriggerDeclaration {
  if (eventName.length === 0) {
    throw new Error(`[graphorin/triggers] event(${id}): eventName must not be empty`);
  }
  return {
    id,
    kind: 'event',
    spec: eventName,
    callback,
    options,
  };
}

/**
 * Lifecycle event emitted by {@link Scheduler.events}. Useful for
 * tests and for piping into observability without monkey-patching.
 *
 * @stable
 */
export type SchedulerEvent =
  | { readonly type: 'started' }
  | { readonly type: 'stopped' }
  | { readonly type: 'registered'; readonly id: string; readonly kind: TriggerKind }
  | { readonly type: 'fire-start'; readonly id: string; readonly firedAt: number }
  | { readonly type: 'fire-end'; readonly id: string; readonly durationMs: number }
  | {
      readonly type: 'fire-error';
      readonly id: string;
      readonly error: unknown;
      readonly durationMs: number;
    }
  | { readonly type: 'catchup-applied'; readonly id: string; readonly missed: number }
  | { readonly type: 'lib-mode-warning'; readonly id: string };

/**
 * Options for {@link createScheduler}.
 *
 * @stable
 */
export interface CreateSchedulerOptions {
  readonly store: TriggerStore;
  /** Default `'lib'`. Server mode skips the lib-mode warning. */
  readonly mode?: 'lib' | 'server';
  /** Override the wall clock - used by tests. */
  readonly now?: () => number;
  /**
   * Override `setTimeout`. The callback receives the chosen delay in
   * milliseconds; the return value is the handle the scheduler
   * later passes to `clearTimeout`. Tests inject a controllable timer.
   */
  readonly setTimeout?: (cb: () => void, ms: number) => unknown;
  readonly clearTimeout?: (handle: unknown) => void;
  /**
   * Resets the per-process WARN-once flag. Used by the test suite to
   * verify the warning fires exactly once per run.
   *
   * @internal
   */
  readonly _resetLibModeFlag?: boolean;
}

/**
 * Public Scheduler surface.
 *
 * @stable
 */
export interface Scheduler {
  register(declaration: TriggerDeclaration): Promise<TriggerState>;
  unregister(id: string): Promise<void>;
  list(): Promise<readonly TriggerState[]>;
  start(): Promise<void>;
  stop(): Promise<void>;
  /** Emit `eventName` to every registered `event` trigger. */
  emit(eventName: string, payload?: unknown): Promise<void>;
  /** Manually fire `id` (used by `graphorin triggers fire`, Phase 15). */
  fire(id: string, payload?: unknown): Promise<void>;
  /**
   * Flip the persistent `disabled` flag (IP-17). Disabling cancels the
   * armed timer but keeps the trigger registered + persisted; enabling
   * recomputes the next fire from now and re-arms. The destructive
   * removal is `unregister(...)`.
   */
  setDisabled(id: string, disabled: boolean): Promise<TriggerState>;
  /** AsyncIterable lifecycle event stream. */
  events(): AsyncIterable<SchedulerEvent>;
  /** Notify the scheduler that the user / runtime is no longer idle. */
  recordActivity(): void;
}

/** @stable */
export function createScheduler(options: CreateSchedulerOptions): Scheduler {
  return new SchedulerImpl(options);
}

/** Module-scoped flag - one WARN per process. */
let LIB_MODE_WARNED = false;

/**
 * Test-only helper. Drops the per-process WARN-once flag so the next
 * `register(...)` call in lib mode emits the warning again.
 *
 * @internal
 */
export function _resetLibModeWarningForTesting(): void {
  LIB_MODE_WARNED = false;
}

const DEFAULT_CATCHUP_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Node clamps `setTimeout` delays beyond `2^31 - 1` ms to 1 ms - a
 * quarterly cron would fire immediately in a hot loop (RP-15). Delays
 * above this arm an intermediate wake-up that re-schedules instead.
 */
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

class SchedulerImpl implements Scheduler {
  readonly #store: TriggerStore;
  readonly #mode: 'lib' | 'server';
  readonly #now: () => number;
  readonly #setTimeout: (cb: () => void, ms: number) => unknown;
  readonly #clearTimeout: (handle: unknown) => void;
  #started = false;
  #disposed = false;
  #lastActivity: number;
  #handles: Map<string, unknown> = new Map();
  #parsedCron: Map<string, ParsedCron> = new Map();
  #declarations: Map<string, TriggerDeclaration> = new Map();
  #eventQueue: SchedulerEvent[] = [];
  #eventResolvers: Array<(value: IteratorResult<SchedulerEvent>) => void> = [];
  #closedEvents = false;

  constructor(options: CreateSchedulerOptions) {
    this.#store = options.store;
    this.#mode = options.mode ?? 'lib';
    this.#now = options.now ?? Date.now;
    this.#setTimeout = options.setTimeout ?? ((cb, ms) => globalThis.setTimeout(cb, ms));
    this.#clearTimeout =
      options.clearTimeout ?? ((h) => globalThis.clearTimeout(h as ReturnType<typeof setTimeout>));
    this.#lastActivity = this.#now();
    if (options._resetLibModeFlag) LIB_MODE_WARNED = false;
  }

  async register(declaration: TriggerDeclaration): Promise<TriggerState> {
    if (this.#mode === 'lib' && declaration.options.acknowledgeLibMode !== true) {
      if (!LIB_MODE_WARNED) {
        LIB_MODE_WARNED = true;
        console.warn(
          `[graphorin/triggers] running in library mode - triggers fire only while the parent process is alive. ` +
            `Pass { acknowledgeLibMode: true } to suppress this warning.`,
        );
        this.#publish({ type: 'lib-mode-warning', id: declaration.id });
      }
    }

    if (declaration.kind === 'cron') {
      this.#parsedCron.set(declaration.id, parseCron(declaration.spec));
    }
    this.#declarations.set(declaration.id, declaration);

    const now = this.#now();
    const existing = await this.#store.get(declaration.id);
    const nextFireMs = this.#computeNextFire(declaration, existing, now);
    const state: TriggerState = {
      id: declaration.id,
      kind: declaration.kind,
      spec: declaration.spec,
      callbackRef: declaration.id,
      ...(existing?.lastFiredAt !== undefined ? { lastFiredAt: existing.lastFiredAt } : {}),
      ...(nextFireMs !== null ? { nextFireAt: new Date(nextFireMs).toISOString() } : {}),
      missedFires: 0,
      disabled: existing?.disabled === true,
      catchupPolicy: declaration.options.catchupPolicy ?? 'none',
      maxCatchupRuns: declaration.options.maxCatchupRuns ?? 1,
      catchupWindowMs: declaration.options.catchupWindowMs ?? DEFAULT_CATCHUP_WINDOW_MS,
      ...(declaration.options.tags !== undefined ? { tags: declaration.options.tags } : {}),
      createdAt: existing !== null ? existing.createdAt : new Date(now).toISOString(),
      ...(existing !== null ? { updatedAt: new Date(now).toISOString() } : {}),
    };
    await this.#store.upsert(state);

    this.#publish({ type: 'registered', id: declaration.id, kind: declaration.kind });

    if (existing !== null && (declaration.kind === 'cron' || declaration.kind === 'interval')) {
      await this.#applyCatchup(state, existing, now);
    }

    if (this.#started) this.#schedule(declaration.id, state);
    return state;
  }

  async unregister(id: string): Promise<void> {
    this.#cancelHandle(id);
    this.#declarations.delete(id);
    this.#parsedCron.delete(id);
    await this.#store.remove(id);
  }

  async list(): Promise<readonly TriggerState[]> {
    return this.#store.list();
  }

  async start(): Promise<void> {
    if (this.#started || this.#disposed) return;
    this.#started = true;
    this.#publish({ type: 'started' });
    const states = await this.#store.list();
    for (const state of states) {
      if (state.disabled) continue;
      this.#schedule(state.id, state);
    }
  }

  async stop(): Promise<void> {
    if (!this.#started) return;
    this.#started = false;
    for (const id of [...this.#handles.keys()]) this.#cancelHandle(id);
    this.#publish({ type: 'stopped' });
    this.#closedEvents = true;
    while (this.#eventResolvers.length > 0) {
      const resolver = this.#eventResolvers.shift();
      resolver?.({ done: true, value: undefined });
    }
  }

  async emit(eventName: string, payload?: unknown): Promise<void> {
    for (const decl of this.#declarations.values()) {
      if (decl.kind === 'event' && decl.spec === eventName) {
        await this.fire(decl.id, payload);
      }
    }
  }

  async fire(id: string, payload?: unknown): Promise<void> {
    const decl = this.#declarations.get(id);
    if (decl === undefined) {
      throw new Error(`[graphorin/triggers] no trigger registered with id '${id}'`);
    }
    const firedAt = this.#now();
    this.#publish({ type: 'fire-start', id, firedAt });
    const start = firedAt;
    try {
      await decl.callback(payload);
      const durationMs = this.#now() - start;
      this.#publish({ type: 'fire-end', id, durationMs });
      const state = await this.#store.get(id);
      // RP-13: compute the next fire from THIS fire's timestamp - the
      // persisted state still carries the PREVIOUS lastFiredAt, which
      // for interval triggers yields `prev + interval ≈ now` and an
      // immediate duplicate via the clamped-to-0 delay. Idle triggers
      // never self-reschedule: their next window starts only when
      // `recordActivity()` observes new activity (a fire-driven re-arm
      // would compute a stale `lastActivity + idleMs`, clamp to 0 and
      // refire in a loop).
      const nextFireMs =
        state !== null && decl.kind !== 'idle'
          ? this.#computeNextFire(
              decl,
              { ...state, lastFiredAt: new Date(firedAt).toISOString() },
              this.#now(),
            )
          : null;
      await this.#store.recordFire(
        id,
        new Date(firedAt).toISOString(),
        nextFireMs !== null ? new Date(nextFireMs).toISOString() : undefined,
      );
      if (this.#started && decl.kind !== 'idle') {
        const refreshed = await this.#store.get(id);
        if (refreshed !== null) this.#schedule(id, refreshed);
      }
    } catch (err) {
      const durationMs = this.#now() - start;
      this.#publish({ type: 'fire-error', id, error: err, durationMs });
      // RP-14: the one-shot timer is consumed by this fire - recompute
      // and persist the next fire WITHOUT recording a successful fire
      // (lastFiredAt stays put), and re-arm, so a single callback
      // failure cannot permanently silence a daily cron.
      try {
        const state = await this.#store.get(id);
        if (state !== null && decl.kind !== 'idle') {
          const nextFireMs = this.#computeNextFire(
            decl,
            { ...state, lastFiredAt: new Date(firedAt).toISOString() },
            this.#now(),
          );
          const updated: TriggerState = {
            ...state,
            ...(nextFireMs !== null ? { nextFireAt: new Date(nextFireMs).toISOString() } : {}),
            updatedAt: new Date(this.#now()).toISOString(),
          };
          await this.#store.upsert(updated);
          if (this.#started) this.#schedule(id, updated);
        }
      } catch {
        // Best-effort re-arm - a store failure here must not become an
        // unhandled rejection out of the timer callback.
      }
    }
  }

  async setDisabled(id: string, disabled: boolean): Promise<TriggerState> {
    const state = await this.#store.get(id);
    if (state === null) {
      throw new Error(`[graphorin/triggers] no trigger registered with id '${id}'`);
    }
    const nowIso = new Date(this.#now()).toISOString();
    if (disabled) {
      this.#cancelHandle(id);
      const updated: TriggerState = { ...state, disabled: true, updatedAt: nowIso };
      await this.#store.upsert(updated);
      return updated;
    }
    // Re-enable: recompute the next fire from NOW (a stale persisted
    // nextFireAt from before the disable would otherwise clamp to 0 and
    // fire immediately), then re-arm.
    const decl = this.#declarations.get(id);
    const nextMs =
      decl !== undefined
        ? this.#computeNextFire(decl, { ...state, lastFiredAt: nowIso }, this.#now())
        : null;
    const updated: TriggerState = {
      ...state,
      disabled: false,
      ...(nextMs !== null ? { nextFireAt: new Date(nextMs).toISOString() } : {}),
      updatedAt: nowIso,
    };
    await this.#store.upsert(updated);
    if (this.#started) this.#schedule(id, updated);
    return updated;
  }

  recordActivity(): void {
    this.#lastActivity = this.#now();
    // periphery (P-14): never (re)arm idle timers on a scheduler that
    // is not started - a stopped scheduler firing callbacks is a
    // lifecycle violation. The activity timestamp is still recorded so
    // a later start() computes the idle window correctly.
    if (!this.#started) return;
    // Reschedule idle triggers so they treat "now" as the start of
    // their idle window.
    for (const decl of this.#declarations.values()) {
      if (decl.kind !== 'idle') continue;
      this.#cancelHandle(decl.id);
      const idleMs = Number.parseInt(decl.spec, 10);
      const handle = this.#setTimeout(() => {
        void this.fire(decl.id);
      }, idleMs);
      this.#handles.set(decl.id, handle);
    }
  }

  events(): AsyncIterable<SchedulerEvent> {
    const queue = this.#eventQueue;
    const resolvers = this.#eventResolvers;
    const me = this;
    return {
      [Symbol.asyncIterator](): AsyncIterator<SchedulerEvent> {
        return {
          async next(): Promise<IteratorResult<SchedulerEvent>> {
            if (queue.length > 0) {
              const value = queue.shift() as SchedulerEvent;
              return { done: false, value };
            }
            if (me.#closedEvents) return { done: true, value: undefined };
            return new Promise((resolve) => resolvers.push(resolve));
          },
          async return(): Promise<IteratorResult<SchedulerEvent>> {
            return { done: true, value: undefined };
          },
        };
      },
    };
  }

  // ---------------------------------------------------------------------------

  #publish(event: SchedulerEvent): void {
    if (this.#closedEvents) return;
    if (this.#eventResolvers.length > 0) {
      const resolver = this.#eventResolvers.shift();
      resolver?.({ done: false, value: event });
      return;
    }
    this.#eventQueue.push(event);
  }

  #computeNextFire(
    decl: TriggerDeclaration,
    state: TriggerState | null,
    now: number,
  ): number | null {
    switch (decl.kind) {
      case 'cron': {
        const parsed = this.#parsedCron.get(decl.id) ?? parseCron(decl.spec);
        const next = nextFireAfter(parsed, new Date(now));
        return next === null ? null : next.getTime();
      }
      case 'interval': {
        const intervalMs = Number.parseInt(decl.spec, 10);
        const last = state?.lastFiredAt !== undefined ? Date.parse(state.lastFiredAt) : now;
        const next = last + intervalMs;
        // periphery-11: after downtime `last + interval` is in the past;
        // the schedule clamp turned that into an IMMEDIATE fire even
        // under `catchupPolicy: 'none'` ("drop missed fires"). Advance
        // to the next FUTURE boundary on the original cadence - missed
        // boundaries are the catch-up machinery's business, not the
        // base schedule's. (Cron already behaves this way:
        // `nextFireAfter(now)` is always future.)
        if (next <= now && Number.isFinite(intervalMs) && intervalMs > 0) {
          const missedBoundaries = Math.floor((now - last) / intervalMs) + 1;
          return last + missedBoundaries * intervalMs;
        }
        return next;
      }
      case 'idle': {
        const idleMs = Number.parseInt(decl.spec, 10);
        return this.#lastActivity + idleMs;
      }
      case 'event':
        return null;
    }
  }

  async #applyCatchup(state: TriggerState, existing: TriggerState, now: number): Promise<void> {
    if (state.catchupPolicy === 'none') return;
    const decl = this.#declarations.get(state.id);
    if (decl === undefined || (decl.kind !== 'cron' && decl.kind !== 'interval')) return;
    const lastFired = existing.lastFiredAt !== undefined ? Date.parse(existing.lastFiredAt) : null;
    if (lastFired === null) return;
    if (lastFired < now - state.catchupWindowMs) return;

    // RP-12: count the REAL missed fires by walking the schedule from
    // the last successful fire to now - a restart with zero crossed
    // boundaries must apply zero catch-up (the old code fired `1` /
    // `maxCatchupRuns` times unconditionally).
    const SCAN_CAP = 1000;
    let missed = 0;
    if (decl.kind === 'cron') {
      const parsed = this.#parsedCron.get(decl.id) ?? parseCron(decl.spec);
      let cursor = lastFired;
      while (missed < SCAN_CAP) {
        const next = nextFireAfter(parsed, new Date(cursor));
        if (next === null || next.getTime() > now) break;
        cursor = next.getTime();
        missed += 1;
      }
    } else {
      const intervalMs = Number.parseInt(decl.spec, 10);
      missed = Math.floor((now - lastFired) / intervalMs);
    }
    if (missed <= 0) return;

    const toFire = state.catchupPolicy === 'last' ? 1 : Math.min(missed, state.maxCatchupRuns);
    for (let i = 0; i < toFire; i++) {
      await this.fire(state.id);
    }
    // The overflow beyond what we re-ran is recorded for health/CLI.
    const excess = missed - toFire;
    if (excess > 0) {
      const refreshed = await this.#store.get(state.id);
      if (refreshed !== null) {
        await this.#store.upsert({ ...refreshed, missedFires: excess });
      }
    }
    this.#publish({ type: 'catchup-applied', id: state.id, missed });
  }

  #schedule(id: string, state: TriggerState): void {
    this.#cancelHandle(id);
    if (state.disabled) return;
    const decl = this.#declarations.get(id);
    if (decl === undefined) return;
    if (decl.kind === 'event') return;

    let delay: number | null = null;
    if (state.nextFireAt !== undefined) {
      delay = Date.parse(state.nextFireAt) - this.#now();
    } else {
      const next = this.#computeNextFire(decl, state, this.#now());
      delay = next === null ? null : next - this.#now();
    }
    if (delay === null) return;
    if (delay < 0) delay = 0;

    if (delay > MAX_TIMEOUT_MS) {
      // RP-15: chunk the wait - the intermediate wake-up re-reads the
      // freshest state and re-schedules (it never fires the callback).
      const handle = this.#setTimeout(() => {
        void this.#store
          .get(id)
          .then((s) => {
            if (s !== null) this.#schedule(id, s);
          })
          .catch(() => {});
      }, MAX_TIMEOUT_MS);
      this.#handles.set(id, handle);
      return;
    }

    const handle = this.#setTimeout(() => {
      void this.fire(id);
    }, delay);
    this.#handles.set(id, handle);
  }

  #cancelHandle(id: string): void {
    const handle = this.#handles.get(id);
    if (handle !== undefined) {
      this.#clearTimeout(handle);
      this.#handles.delete(id);
    }
  }
}
