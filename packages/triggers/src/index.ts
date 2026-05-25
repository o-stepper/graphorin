/**
 * @graphorin/triggers — durable cron / interval / idle / event
 * trigger scheduler for the Graphorin framework.
 *
 * @packageDocumentation
 */

import type { TriggerState, TriggerStore } from '@graphorin/core/contracts';
import { nextFireAfter, type ParsedCron, parseCron } from './cron.js';

export { CronParseError, nextFireAfter, type ParsedCron, parseCron } from './cron.js';

/** Canonical version constant. Mirrors the `package.json` version. */
export const VERSION = '0.4.0';

/**
 * Catch-up policy applied when a trigger missed one or more fires
 * while the scheduler was offline.
 *
 * - `'none'` — drop missed fires (default; safest for personal-assistant scenarios).
 * - `'last'` — fire once on resume (best for cron-style daily jobs).
 * - `'all'` — fire each missed run up to `maxCatchupRuns` within `catchupWindowMs`.
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
 * eagerly — a malformed cron expression throws at registration time,
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
  /** Override the wall clock — used by tests. */
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
  /** AsyncIterable lifecycle event stream. */
  events(): AsyncIterable<SchedulerEvent>;
  /** Notify the scheduler that the user / runtime is no longer idle. */
  recordActivity(): void;
}

/** @stable */
export function createScheduler(options: CreateSchedulerOptions): Scheduler {
  return new SchedulerImpl(options);
}

/** Module-scoped flag — one WARN per process. */
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
          `[graphorin/triggers] running in library mode — triggers fire only while the parent process is alive. ` +
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

    if (existing !== null && declaration.kind === 'cron') {
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
      const nextFireMs = state !== null ? this.#computeNextFire(decl, state, this.#now()) : null;
      await this.#store.recordFire(
        id,
        new Date(firedAt).toISOString(),
        nextFireMs !== null ? new Date(nextFireMs).toISOString() : undefined,
      );
      if (this.#started) {
        const refreshed = await this.#store.get(id);
        if (refreshed !== null) this.#schedule(id, refreshed);
      }
    } catch (err) {
      const durationMs = this.#now() - start;
      this.#publish({ type: 'fire-error', id, error: err, durationMs });
    }
  }

  recordActivity(): void {
    this.#lastActivity = this.#now();
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
        return last + intervalMs;
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
    const lastFired = existing.lastFiredAt !== undefined ? Date.parse(existing.lastFiredAt) : null;
    if (lastFired === null) return;
    const window = state.catchupWindowMs;
    const cutoff = now - window;
    if (lastFired < cutoff) return;
    const max = state.maxCatchupRuns;
    let missed = 0;
    if (state.catchupPolicy === 'last') {
      missed = 1;
    } else if (state.catchupPolicy === 'all') {
      // Best-effort estimate — for cron we don't enumerate every
      // missed fire, we cap at `max`.
      missed = max;
    }
    for (let i = 0; i < missed; i++) {
      await this.fire(state.id);
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
