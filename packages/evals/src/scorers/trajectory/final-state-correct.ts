/**
 * `finalStateCorrect` - the goal-state compare. Passes when the
 * trajectory's `finalState` (optionally read at `path`) deep-equals
 * `expected`, or satisfies the `matches` predicate. This is the canonical
 * "did the harness actually accomplish the task" signal - it inspects the
 * world the tools mutated, not just the model's final words.
 *
 * @packageDocumentation
 */

import type { Scorer } from '@graphorin/observability/eval';
import type { Trajectory } from './types.js';
import { deepEqual, readPath, stringifySafe, truncate } from './util.js';

/** @stable */
export interface FinalStateCorrectOptions {
  /** Expected goal state, compared by deep-equality. Provide this or `matches`. */
  readonly expected?: unknown;
  /** Dot-path into `finalState` to compare instead of the whole snapshot. */
  readonly path?: string;
  /** Custom goal predicate, evaluated against the (path-resolved) state. */
  readonly matches?: (finalState: unknown) => boolean;
  /** Optional name override. */
  readonly name?: string;
}

/** @stable */
export function finalStateCorrect<I = unknown>(
  options: FinalStateCorrectOptions,
): Scorer<I, Trajectory> {
  if (options.matches === undefined && !('expected' in options)) {
    throw new TypeError('finalStateCorrect: provide either `expected` or `matches`.');
  }
  const name = options.name ?? 'final-state-correct';
  const matches = options.matches;
  const where = options.path ?? '<root>';
  return {
    name,
    async score({ output }) {
      const value =
        options.path !== undefined ? readPath(output.finalState, options.path) : output.finalState;

      if (matches !== undefined) {
        const pass = matches(value);
        if (pass) return { pass, score: 1 };
        return {
          pass,
          score: 0,
          reason: `final state at '${where}' did not satisfy the goal predicate.`,
        };
      }

      const pass = deepEqual(value, options.expected);
      if (pass) return { pass, score: 1 };
      return {
        pass,
        score: 0,
        reason: `final state mismatch at '${where}': expected ${truncate(stringifySafe(options.expected))}, received ${truncate(stringifySafe(value))}.`,
      };
    },
  };
}
