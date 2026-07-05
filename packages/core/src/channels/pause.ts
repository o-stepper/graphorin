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
  /** Ordered resume values replayed to successive `pause()` calls (WF-2). */
  readonly values: ReadonlyArray<unknown>;
  cursor: number;
}

const pauseResumeStorage = new AsyncLocalStorage<PauseResumeScope>();

/**
 * Run `fn` inside a scope where successive `pause(...)` calls return the
 * supplied `values` in order instead of throwing a fresh
 * {@link PauseSignal} (WF-2: a node body re-executes from the top on
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
): Promise<R> {
  const scope: PauseResumeScope = { values, cursor: 0 };
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
