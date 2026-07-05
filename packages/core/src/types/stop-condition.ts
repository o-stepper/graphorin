import type { RunState } from './run.js';

/**
 * Predicate consulted by the agent runtime after every step to decide
 * whether the loop should stop.
 *
 * Stop conditions are pure - they look at the current `RunState` and
 * return a boolean. The runtime never re-orders or short-circuits the
 * order in which operands of `and` / `or` are evaluated, so users can
 * rely on the obvious left-to-right semantics.
 *
 * @stable
 */
export interface StopCondition {
  /** Human-friendly label included in observability spans. */
  readonly description: string;
  /** Returns `true` when the run should stop on this state. */
  readonly check: (state: RunState) => boolean;
}

/**
 * Stop after `n` total steps (`stepNumber >= n`). The default condition
 * for the agent runtime is `isStepCount(50)`.
 *
 * @stable
 */
export function isStepCount(n: number): StopCondition {
  if (!Number.isFinite(n) || n <= 0) {
    throw new RangeError(`isStepCount: n must be a positive integer (got ${String(n)})`);
  }
  return {
    description: `step >= ${n}`,
    check: (state): boolean => state.steps.length >= n,
  };
}

/**
 * Stop as soon as the most recent assistant message contains a tool call
 * with the given name.
 *
 * @stable
 */
export function hasToolCall(toolName: string): StopCondition {
  return {
    description: `tool-call:${toolName}`,
    check: (state): boolean => {
      for (let i = state.messages.length - 1; i >= 0; i--) {
        const msg = state.messages[i];
        if (msg && msg.role === 'assistant') {
          const calls = msg.toolCalls;
          if (calls?.some((c) => c.toolName === toolName)) {
            return true;
          }
          // First assistant message without the call → not yet matched.
          return false;
        }
      }
      return false;
    },
  };
}

/**
 * Stop when the run reaches a terminal status.
 *
 * @stable
 */
export const isTerminal: StopCondition = {
  description: 'status:terminal',
  check: (state): boolean =>
    state.status === 'completed' || state.status === 'failed' || state.status === 'aborted',
};

/**
 * Stop when **any** of the supplied conditions is satisfied.
 *
 * @stable
 */
export function or(...conditions: readonly StopCondition[]): StopCondition {
  return {
    description: `or(${conditions.map((c) => c.description).join(', ')})`,
    check: (state): boolean => conditions.some((c) => c.check(state)),
  };
}

/**
 * Stop only when **all** of the supplied conditions are satisfied.
 *
 * @stable
 */
export function and(...conditions: readonly StopCondition[]): StopCondition {
  return {
    description: `and(${conditions.map((c) => c.description).join(', ')})`,
    check: (state): boolean => conditions.every((c) => c.check(state)),
  };
}

/**
 * Negate the supplied condition.
 *
 * @stable
 */
export function not(condition: StopCondition): StopCondition {
  return {
    description: `not(${condition.description})`,
    check: (state): boolean => !condition.check(state),
  };
}
