/**
 * `correctToolSelected` — passes when the trajectory called the expected
 * tool(s). With `requireOrder`, the expected names must appear as an
 * ordered subsequence of the actual calls (other calls may interleave);
 * otherwise every expected name must appear at least once.
 *
 * @packageDocumentation
 */

import type { Scorer } from '@graphorin/observability/eval';
import type { Trajectory } from './types.js';

/** @stable */
export interface CorrectToolSelectedOptions {
  /** The tool name (or ordered sequence of names) the harness should call. */
  readonly expected: string | ReadonlyArray<string>;
  /** When `true`, the expected names must appear in order. Default `false`. */
  readonly requireOrder?: boolean;
  /** Optional name override. */
  readonly name?: string;
}

/** @stable */
export function correctToolSelected<I = unknown>(
  options: CorrectToolSelectedOptions,
): Scorer<I, Trajectory> {
  const expected =
    typeof options.expected === 'string' ? [options.expected] : [...options.expected];
  const requireOrder = options.requireOrder ?? false;
  const name = options.name ?? 'correct-tool-selected';
  return {
    name,
    async score({ output }) {
      const called = output.calls.map((c) => c.toolName);
      if (expected.length === 0) return { pass: true, score: 1 };

      if (requireOrder) {
        let cursor = 0;
        for (const toolName of called) {
          if (cursor < expected.length && toolName === expected[cursor]) cursor++;
        }
        const pass = cursor === expected.length;
        if (pass) return { pass, score: 1 };
        return {
          pass,
          score: cursor / expected.length,
          reason: `expected tools [${expected.join(' → ')}] as an ordered subsequence; saw [${called.join(', ')}].`,
        };
      }

      const missing = expected.filter((n) => !called.includes(n));
      const pass = missing.length === 0;
      if (pass) return { pass, score: 1 };
      return {
        pass,
        score: (expected.length - missing.length) / expected.length,
        reason: `missing expected tool call(s): [${missing.join(', ')}]; saw [${called.join(', ')}].`,
      };
    },
  };
}
