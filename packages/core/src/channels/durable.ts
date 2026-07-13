/**
 * Durable workflow primitives (D1) built on the `pause(...)` substrate:
 *
 * - {@link sleepUntil} / {@link sleepFor} - **durable timers**: the node
 *   suspends with a persisted wake-at timestamp; `workflow.tick(threadId)`
 *   (or any scheduler calling it) resumes the thread once the deadline
 *   passes. The timer survives process restarts because it lives in the
 *   checkpointed frontier, not in a `setTimeout`.
 * - {@link awaitExternal} - **durable promises (awakeables)**: the node
 *   suspends under a caller-chosen name; an external system resolves it
 *   later via `workflow.resolveAwakeable(threadId, name, value)` and the
 *   node receives `value` as the call's return.
 * - {@link requestApproval} - **first-class persisted approvals**: an
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
  /**
   * E1 defer-timeout: epoch-ms deadline. An approval carrying one joins
   * the durable-timer enumeration (the suspended checkpoint's `wakeAt`
   * metadata, which the workflow timer daemon already scans); once due,
   * `workflow.tick(threadId)` resolves the approval with
   * {@link ApprovalPauseValue.timeoutDecision} instead of waiting for a
   * human - the auto-deny composition for deferred permission
   * decisions. Absent ⇒ the approval waits indefinitely (pre-E1
   * behaviour).
   */
  readonly wakeAt?: number;
  /**
   * JSON-safe decision delivered when the deadline fires. Defaults to
   * {@link DEFAULT_APPROVAL_TIMEOUT_DECISION} (an auto-deny). The
   * timeout VALUE itself (how long to wait) is caller policy.
   */
  readonly timeoutDecision?: unknown;
}

/**
 * The decision a deadline-carrying approval resolves with when its
 * timeout fires and no explicit `timeoutDecision` was supplied: a
 * deny, so an unattended deferred permission fails closed.
 *
 * @stable
 */
export const DEFAULT_APPROVAL_TIMEOUT_DECISION: {
  readonly granted: false;
  readonly reason: string;
} = Object.freeze({ granted: false as const, reason: 'defer-timeout' });

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
 * Structural schema slice `awaitExternal({ schema })` validates the
 * resolved payload against. Matches zod v3 and v4 (and anything else
 * exposing the same `safeParse`) without a zod dependency in core -
 * the same structural stance as the tools-layer schema seam.
 *
 * @stable
 */
export interface PayloadSchemaLike<T> {
  safeParse(
    value: unknown,
  ):
    | { readonly success: true; readonly data: T }
    | { readonly success: false; readonly error: { readonly message: string } };
}

/**
 * Thrown by {@link awaitExternal} when the resolved payload fails the
 * declared `schema`. The workflow engine recognises it by `name` and
 * RESTORES the suspension instead of failing the thread: the invalid
 * value is discarded, the pending pause survives, and the resolver
 * receives a typed `awakeable-payload-invalid` error. Validation runs
 * at the replay delivery point (the node re-executing with the
 * resumed value) because that is the only place the schema object
 * exists - `PendingPauseRecord` persists `name`/`wakeAt` only and a
 * schema is not serializable across processes.
 *
 * @stable
 */
export class AwakeablePayloadError extends TypeError {
  override readonly name = 'AwakeablePayloadError';
  constructor(
    public readonly awakeableName: string,
    public readonly issues: string,
  ) {
    super(
      `[graphorin/core] awakeable '${awakeableName}' was resolved with a payload that fails ` +
        `its schema: ${issues}`,
    );
  }
}

/**
 * Structural guard for {@link AwakeablePayloadError} - matches by
 * `name` so the check survives duplicated module instances.
 *
 * @stable
 */
export function isAwakeablePayloadError(err: unknown): err is AwakeablePayloadError {
  return (
    err instanceof Error &&
    err.name === 'AwakeablePayloadError' &&
    typeof (err as { awakeableName?: unknown }).awakeableName === 'string'
  );
}

/** Options for {@link awaitExternal}. @stable */
export interface AwaitExternalOptions<TResume> {
  /**
   * Validates the resolved payload at the replay delivery point. On
   * failure the engine restores the suspension (the thread stays
   * suspended, the invalid value is discarded) and the resolver gets
   * a typed `awakeable-payload-invalid` error. The parsed (possibly
   * transformed) value is what the node receives.
   */
  readonly schema?: PayloadSchemaLike<TResume>;
}

/**
 * Suspend on a named durable promise. The thread stays suspended (and
 * survives restarts) until an external caller resolves it via
 * `workflow.resolveAwakeable(threadId, name, value)`; that `value` is
 * returned here. With `options.schema` the value is validated on
 * delivery - see {@link AwakeablePayloadError} for the rejection
 * semantics.
 *
 * @stable
 */
export function awaitExternal<TResume = unknown>(
  name: string,
  options?: AwaitExternalOptions<TResume>,
): TResume {
  if (typeof name !== 'string' || name.length === 0) {
    throw new TypeError('[graphorin/core] awaitExternal(name) needs a non-empty name');
  }
  const value = pause<AwakeablePauseValue, TResume>({ kind: AWAKEABLE_PAUSE_KIND, name });
  const schema = options?.schema;
  if (schema !== undefined) {
    const parsed = schema.safeParse(value);
    if (!parsed.success) {
      throw new AwakeablePayloadError(name, parsed.error.message);
    }
    return parsed.data;
  }
  return value;
}

/** Options for {@link requestApproval} (E1 defer-timeout). @stable */
export interface RequestApprovalOptions {
  /**
   * Absolute deadline. When it passes with the approval still pending,
   * `workflow.tick(threadId)` resolves it with `timeoutDecision` (the
   * auto-deny composition); the workflow timer daemon enumerates the
   * deadline exactly like a `sleepUntil` timer. How long to wait is
   * caller policy - the framework only provides the mechanism.
   */
  readonly timeoutAt?: string | number | Date;
  /**
   * JSON-safe decision delivered on timeout. Default
   * {@link DEFAULT_APPROVAL_TIMEOUT_DECISION} (a deny) - an unattended
   * deferred permission fails closed.
   */
  readonly timeoutDecision?: unknown;
}

/**
 * Suspend on a named persisted approval. Resolved by
 * `workflow.approve(threadId, name, decision)`; the decision is returned
 * here. The optional payload is surfaced on the pending pause record so
 * an approval UI can show what is being approved. With
 * `options.timeoutAt` the approval also carries a durable deadline -
 * see {@link RequestApprovalOptions}.
 *
 * @stable
 */
export function requestApproval<TDecision = unknown>(
  name: string,
  payload?: unknown,
  options?: RequestApprovalOptions,
): TDecision {
  if (typeof name !== 'string' || name.length === 0) {
    throw new TypeError('[graphorin/core] requestApproval(name) needs a non-empty name');
  }
  let wakeAt: number | undefined;
  if (options?.timeoutAt !== undefined) {
    const at = options.timeoutAt;
    wakeAt = typeof at === 'number' ? at : at instanceof Date ? at.getTime() : Date.parse(at);
    if (!Number.isFinite(wakeAt)) {
      throw new TypeError(
        `[graphorin/core] requestApproval(...) got an unparseable timeoutAt: ${String(at)}`,
      );
    }
  }
  return pause<ApprovalPauseValue, TDecision>({
    kind: APPROVAL_PAUSE_KIND,
    name,
    ...(payload !== undefined ? { payload } : {}),
    ...(wakeAt !== undefined ? { wakeAt } : {}),
    ...(options?.timeoutDecision !== undefined ? { timeoutDecision: options.timeoutDecision } : {}),
  });
}
