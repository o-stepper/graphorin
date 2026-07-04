/**
 * Durable workflow primitives (D1) built on the `pause(...)` substrate:
 *
 * - {@link sleepUntil} / {@link sleepFor} — **durable timers**: the node
 *   suspends with a persisted wake-at timestamp; `workflow.tick(threadId)`
 *   (or any scheduler calling it) resumes the thread once the deadline
 *   passes. The timer survives process restarts because it lives in the
 *   checkpointed frontier, not in a `setTimeout`.
 * - {@link awaitExternal} — **durable promises (awakeables)**: the node
 *   suspends under a caller-chosen name; an external system resolves it
 *   later via `workflow.resolveAwakeable(threadId, name, value)` and the
 *   node receives `value` as the call's return.
 * - {@link requestApproval} — **first-class persisted approvals**: an
 *   awakeable specialized for human sign-off, resolved via
 *   `workflow.approve(threadId, name, decision)`.
 *
 * Each helper throws the same branded `PauseSignal` that `pause(...)`
 * throws, carrying a reserved, JSON-safe pause value the engine
 * recognises (`kind: 'graphorin.timer' | 'graphorin.awakeable' |
 * 'graphorin.approval'`) to stamp `wakeAt` / `name` onto the persisted
 * pause record. On resume the body re-executes from the top and the
 * already-delivered values replay in order (WF-2), exactly like plain
 * `pause(...)`.
 *
 * @packageDocumentation
 */

import { pause } from './pause.js';

/** Reserved pause-value kind for durable timers (D1). */
export const TIMER_PAUSE_KIND = 'graphorin.timer' as const;
/** Reserved pause-value kind for awakeables / durable promises (D1). */
export const AWAKEABLE_PAUSE_KIND = 'graphorin.awakeable' as const;
/** Reserved pause-value kind for persisted approvals (D1). */
export const APPROVAL_PAUSE_KIND = 'graphorin.approval' as const;

/** Pause value carried by a durable-timer suspension. */
export interface TimerPauseValue {
  readonly kind: typeof TIMER_PAUSE_KIND;
  /** Epoch milliseconds at which the timer becomes due. */
  readonly wakeAt: number;
}

/** Pause value carried by an awakeable suspension. */
export interface AwakeablePauseValue {
  readonly kind: typeof AWAKEABLE_PAUSE_KIND;
  /** Caller-chosen name targeted by `workflow.resolveAwakeable(...)`. */
  readonly name: string;
}

/** Pause value carried by a persisted-approval suspension. */
export interface ApprovalPauseValue {
  readonly kind: typeof APPROVAL_PAUSE_KIND;
  /** Caller-chosen name targeted by `workflow.approve(...)`. */
  readonly name: string;
  /** Free-form payload surfaced to the approver (what is being approved). */
  readonly payload?: unknown;
}

/** Type guard for {@link TimerPauseValue}. @stable */
export function isTimerPauseValue(value: unknown): value is TimerPauseValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { kind?: unknown }).kind === TIMER_PAUSE_KIND &&
    typeof (value as { wakeAt?: unknown }).wakeAt === 'number'
  );
}

/** Type guard for {@link AwakeablePauseValue}. @stable */
export function isAwakeablePauseValue(value: unknown): value is AwakeablePauseValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { kind?: unknown }).kind === AWAKEABLE_PAUSE_KIND &&
    typeof (value as { name?: unknown }).name === 'string'
  );
}

/** Type guard for {@link ApprovalPauseValue}. @stable */
export function isApprovalPauseValue(value: unknown): value is ApprovalPauseValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { kind?: unknown }).kind === APPROVAL_PAUSE_KIND &&
    typeof (value as { name?: unknown }).name === 'string'
  );
}

/**
 * Durably sleep until an absolute instant. Suspends the workflow thread
 * with a persisted wake-at timestamp; `workflow.tick(threadId)` resumes
 * it once due. Returns nothing on resume.
 *
 * @stable
 */
export function sleepUntil(at: string | number | Date): void {
  const wakeAt = typeof at === 'number' ? at : at instanceof Date ? at.getTime() : Date.parse(at);
  if (!Number.isFinite(wakeAt)) {
    throw new TypeError(
      `[graphorin/core] sleepUntil(...) got an unparseable instant: ${String(at)}`,
    );
  }
  pause<TimerPauseValue, unknown>({ kind: TIMER_PAUSE_KIND, wakeAt });
}

/**
 * Durably sleep for a relative duration (sugar over {@link sleepUntil}).
 *
 * @stable
 */
export function sleepFor(ms: number): void {
  if (!Number.isFinite(ms) || ms < 0) {
    throw new TypeError(`[graphorin/core] sleepFor(...) needs a non-negative duration, got ${ms}`);
  }
  sleepUntil(Date.now() + ms);
}

/**
 * Suspend on a named durable promise. The thread stays suspended (and
 * survives restarts) until an external caller resolves it via
 * `workflow.resolveAwakeable(threadId, name, value)`; that `value` is
 * returned here.
 *
 * @stable
 */
export function awaitExternal<TResume = unknown>(name: string): TResume {
  if (typeof name !== 'string' || name.length === 0) {
    throw new TypeError('[graphorin/core] awaitExternal(name) needs a non-empty name');
  }
  return pause<AwakeablePauseValue, TResume>({ kind: AWAKEABLE_PAUSE_KIND, name });
}

/**
 * Suspend on a named persisted approval. Resolved by
 * `workflow.approve(threadId, name, decision)`; the decision is returned
 * here. The optional payload is surfaced on the pending pause record so
 * an approval UI can show what is being approved.
 *
 * @stable
 */
export function requestApproval<TDecision = unknown>(name: string, payload?: unknown): TDecision {
  if (typeof name !== 'string' || name.length === 0) {
    throw new TypeError('[graphorin/core] requestApproval(name) needs a non-empty name');
  }
  return pause<ApprovalPauseValue, TDecision>({
    kind: APPROVAL_PAUSE_KIND,
    name,
    ...(payload !== undefined ? { payload } : {}),
  });
}
