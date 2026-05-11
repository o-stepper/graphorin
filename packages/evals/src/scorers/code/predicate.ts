/**
 * `predicate` — passes when the caller-supplied predicate returns
 * truthy. The escape hatch for ad-hoc, project-specific scoring rules.
 *
 * @packageDocumentation
 */

import type { Case, ScoreResult, Scorer } from '@graphorin/observability/eval';

/** @stable */
export interface PredicateOptions<I, O> {
  readonly name: string;
  readonly check: (args: {
    readonly case: Case<I, O>;
    readonly output: O;
    readonly durationMs: number;
  }) => Promise<boolean | ScoreResult> | boolean | ScoreResult;
}

/** @stable */
export function predicate<I = unknown, O = unknown>(options: PredicateOptions<I, O>): Scorer<I, O> {
  return {
    name: options.name,
    async score(args) {
      const result = await options.check(args);
      if (typeof result === 'boolean') {
        return { pass: result, score: result ? 1 : 0 };
      }
      return result;
    },
  };
}
