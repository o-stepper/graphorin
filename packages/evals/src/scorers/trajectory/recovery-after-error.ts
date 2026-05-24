/**
 * `recoveryAfterError` — passes when the harness recovered from every
 * tool error: each `'error'` call must be followed by at least one later
 * `'ok'` call (the run did not dead-end on a failure). A trajectory with
 * no errors passes trivially. This measures harness resilience — that a
 * surfaced `ToolError` re-enters the loop as a tool message and the agent
 * makes forward progress afterwards.
 *
 * @packageDocumentation
 */

import type { Scorer } from '@graphorin/observability/eval';
import type { Trajectory } from './types.js';

/** @stable */
export interface RecoveryAfterErrorOptions {
  /** Optional name override. */
  readonly name?: string;
}

/** @stable */
export function recoveryAfterError<I = unknown>(
  options: RecoveryAfterErrorOptions = {},
): Scorer<I, Trajectory> {
  const name = options.name ?? 'recovery-after-error';
  return {
    name,
    async score({ output }) {
      const calls = output.calls;
      const errorIdx: number[] = [];
      for (let i = 0; i < calls.length; i++) {
        if (calls[i]?.status === 'error') errorIdx.push(i);
      }
      if (errorIdx.length === 0) {
        return { pass: true, score: 1, reason: 'no tool errors to recover from.' };
      }
      const unrecovered = errorIdx.filter((i) => {
        for (let j = i + 1; j < calls.length; j++) {
          if (calls[j]?.status === 'ok') return false;
        }
        return true;
      });
      const pass = unrecovered.length === 0;
      const score = (errorIdx.length - unrecovered.length) / errorIdx.length;
      if (pass) {
        return { pass, score, reason: `recovered from ${errorIdx.length} tool error(s).` };
      }
      return {
        pass,
        score,
        reason: `${unrecovered.length}/${errorIdx.length} tool error(s) had no successful follow-up call.`,
      };
    },
  };
}
