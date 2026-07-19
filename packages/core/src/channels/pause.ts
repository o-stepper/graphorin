import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Brand attached to the signal thrown by `pause(value)` so that the
 * workflow runtime can recognise it across realms (Worker threads,
 * sandboxes, …) without `instanceof`.
 *
 * @stable
 */
export const PAUSE_SIGNAL_BRAND: unique symbol = Symbol.for('graphorin.PauseSignal');

/**
 * Thrown by `pause(value)` from inside a workflow node. The runtime
 * catches it, persists state with a pending pause, and suspends the
 * thread until `Workflow.resume(threadId, directive)` is called.
 *
 * Application code should never construct or catch this directly -
 * always go through `pause(...)`.
 *
 * @stable
 */
export class PauseSignal<TValue = unknown> extends Error {
  readonly [PAUSE_SIGNAL_BRAND]: true = true;
  readonly value: TValue;

  constructor(value: TValue) {
    super('graphorin: workflow paused');
    this.name = 'PauseSignal';
    this.value = value;
  }
}

/**
 * Brand attached to the signal thrown by `pause(value)` when the
 * positional replay diverges from the journaled pause identity.
 * Cross-realm safe like {@link PAUSE_SIGNAL_BRAND}.
 *
 * @stable
 */
export const REPLAY_DIVERGENCE_BRAND: unique symbol = Symbol.for(
  'graphorin.ReplayDivergenceSignal',
);

/**
 * Identity of one pause as recorded next to its satisfied resume value:
 * the durable-primitive `kind` (`timer` / `awakeable` /
 * `approval`) and the awakeable/approval `name`. A plain `pause()` has
 * neither - two plain pauses are indistinguishable BY DESIGN (no
 * false positives; the check is deliberately conservative).
 *
 * @stable
 */
export interface PauseIdentity {
  readonly kind?: string;
  readonly name?: string;
}

/**
 * Thrown by `pause(value)` during replay when the CURRENT pause's
 * identity does not match what the journal recorded for this cursor
 * position: the node body's pause order depends on
 * time/state/LLM output, so a positional replay would silently hand a
 * resume value to the wrong pause. The workflow engine converts this
 * into a typed `pause-replay-divergence` WorkflowError.
 *
 * @stable
 */
export class ReplayDivergenceSignal extends Error {
  readonly [REPLAY_DIVERGENCE_BRAND]: true = true;
  readonly expected: PauseIdentity;
  readonly actual: PauseIdentity;
  readonly cursor: number;

  constructor(expected: PauseIdentity, actual: PauseIdentity, cursor: number) {
    super(
      `graphorin: pause replay divergence at cursor ${cursor}: paused as ${describeIdentity(actual)} where the journal recorded ${describeIdentity(expected)}`,
    );
    this.name = 'ReplayDivergenceSignal';
    this.expected = expected;
    this.actual = actual;
    this.cursor = cursor;
  }
}

/** Cross-realm safe type guard for {@link ReplayDivergenceSignal}. @stable */
export function isReplayDivergenceSignal(err: unknown): err is ReplayDivergenceSignal {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as Record<symbol, unknown>)[REPLAY_DIVERGENCE_BRAND] === true
  );
}

function describeIdentity(id: PauseIdentity): string {
  const parts: string[] = [];
  if (id.kind !== undefined) parts.push(`kind '${id.kind}'`);
  if (id.name !== undefined) parts.push(`name '${id.name}'`);
  return parts.length > 0 ? parts.join(' / ') : 'a plain pause';
}

/**
 * Extract the {@link PauseIdentity} of a pause payload: generic field
 * access only (no import of the durable-primitive types - that would
 * cycle).
 */
function identityOfPauseValue(value: unknown): PauseIdentity {
  if (typeof value !== 'object' || value === null) return {};
  const v = value as { readonly kind?: unknown; readonly name?: unknown };
  return {
    ...(typeof v.kind === 'string' ? { kind: v.kind } : {}),
    ...(typeof v.name === 'string' ? { name: v.name } : {}),
  };
}

/**
 * Resume-injection scope set by the workflow runtime around the second
 * (and later) invocations of a paused node body. When the scope is
 * present, `pause(...)` consults it to decide whether to throw a fresh
 * {@link PauseSignal} or return the injected value the runtime supplied
 * via `Workflow.resume(threadId, new Directive({ resume }))`.
 *
 * This is the storage mechanism that gives `pause()` its symmetric
 * pair semantics (`pause` ↔ `resume`) without forcing every node body
 * to be re-architected as a state machine.
 *
 * @internal
 */
export interface PauseResumeScope {
  /** Ordered resume values replayed to successive `pause()` calls. */
  readonly values: ReadonlyArray<unknown>;
  /**
   * Per-value identity of the pause each value answered.
   * Absent (legacy checkpoints) or `null`/empty entries skip the check.
   */
  readonly meta?: ReadonlyArray<PauseIdentity | null | undefined>;
  cursor: number;
}

const pauseResumeStorage = new AsyncLocalStorage<PauseResumeScope>();

/**
 * Run `fn` inside a scope where successive `pause(...)` calls return the
 * supplied `values` in order instead of throwing a fresh
 * {@link PauseSignal} (a node body re-executes from the top on
 * every resume, so earlier pauses must replay their already-delivered
 * values and only the FIRST unsatisfied `pause()` suspends again). An
 * empty `values` array behaves exactly like no scope - every `pause()`
 * suspends - which is what a static-gate resume needs so a programmatic
 * `pause()` inside the node is never silently satisfied.
 *
 * This helper is the contract between the runtime and `pause(...)`.
 * Consumers of `pause(...)` never call it directly - only the workflow
 * engine wires it up around the resumed node body.
 *
 * @internal
 */
export function runWithPauseResume<R>(
  values: ReadonlyArray<unknown>,
  fn: () => R | Promise<R>,
  meta?: ReadonlyArray<PauseIdentity | null | undefined>,
): Promise<R> {
  const scope: PauseResumeScope = { values, ...(meta !== undefined ? { meta } : {}), cursor: 0 };
  return pauseResumeStorage.run(scope, async () => fn());
}

/**
 * Programmatically suspend the current workflow node. The `value` is
 * surfaced to callers via the `WorkflowSuspendedEvent.value` field; the
 * eventual `Directive({ resume })` is delivered as the return value of
 * this call once the runtime resumes the thread.
 *
 * Implementation note: when the call is made outside a runtime-managed
 * resume scope, `pause(...)` throws a fresh {@link PauseSignal} so the
 * engine can catch it, persist state, and suspend. When the runtime
 * later resumes the node body, it wraps the second invocation in
 * {@link runWithPauseResume}, which causes the same `pause(...)` call to
 * return the operator-supplied resume value instead of throwing.
 *
 * @stable
 */
export function pause<TValue, TResume = unknown>(value: TValue): TResume {
  const scope = pauseResumeStorage.getStore();
  if (scope !== undefined && scope.cursor < scope.values.length) {
    // W-120: verify the replayed value is answering the SAME pause the
    // journal recorded at this cursor. Legacy checkpoints (no meta) and
    // plain pauses (empty identity) replay unchecked - conservative by
    // design, false positives are impossible.
    const expected = scope.meta?.[scope.cursor];
    if (expected != null && (expected.kind !== undefined || expected.name !== undefined)) {
      const actual = identityOfPauseValue(value);
      if (
        (expected.kind !== undefined && expected.kind !== actual.kind) ||
        (expected.name !== undefined && expected.name !== actual.name)
      ) {
        throw new ReplayDivergenceSignal(expected, actual, scope.cursor);
      }
    }
    const next = scope.values[scope.cursor];
    scope.cursor += 1;
    return next as TResume;
  }
  throw new PauseSignal<TValue>(value);
}

/**
 * Cross-realm safe type guard for `PauseSignal`.
 *
 * @stable
 */
export function isPauseSignal(err: unknown): err is PauseSignal {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as Record<symbol, unknown>)[PAUSE_SIGNAL_BRAND] === true
  );
}
