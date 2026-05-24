/**
 * `redundantCallDetection` — passes when the harness made no more than
 * `maxRedundant` (default `0`) redundant repeat calls. A call is redundant
 * when an *earlier successful* call with the same name and deep-equal
 * arguments already produced that result. Only prior `'ok'` calls seed the
 * set, so a retry after an error is never flagged as redundant.
 *
 * @packageDocumentation
 */

import type { Scorer } from '@graphorin/observability/eval';
import type { Trajectory } from './types.js';
import { canonicalize } from './util.js';

/** @stable */
export interface RedundantCallDetectionOptions {
  /** Maximum tolerated redundant repeats before the scorer fails. Default `0`. */
  readonly maxRedundant?: number;
  /** Tool names exempt from the check (legitimately repeatable). */
  readonly ignore?: ReadonlyArray<string>;
  /** Optional name override. */
  readonly name?: string;
}

/** @stable */
export function redundantCallDetection<I = unknown>(
  options: RedundantCallDetectionOptions = {},
): Scorer<I, Trajectory> {
  const maxRedundant = options.maxRedundant ?? 0;
  const ignore = new Set(options.ignore ?? []);
  const name = options.name ?? 'redundant-call-detection';
  return {
    name,
    async score({ output }) {
      const seen = new Set<string>();
      const redundant: string[] = [];
      let total = 0;
      for (const call of output.calls) {
        if (ignore.has(call.toolName)) continue;
        total++;
        // Only a successful call establishes a "result already obtained"
        // fact; a retry after an error is expected, not redundant.
        if (call.status !== 'ok') continue;
        const key = `${call.toolName}(${canonicalize(call.args)})`;
        if (seen.has(key)) redundant.push(call.toolName);
        else seen.add(key);
      }
      const pass = redundant.length <= maxRedundant;
      const score = total > 0 ? (total - redundant.length) / total : 1;
      if (pass) return { pass, score };
      return {
        pass,
        score,
        reason: `${redundant.length} redundant repeat call(s) (max ${maxRedundant}): [${redundant.join(', ')}].`,
      };
    },
  };
}
