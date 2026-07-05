/**
 * `argumentValidity` - passes when every tool call's arguments are
 * accepted by that tool's own `inputSchema` (a Zod-like `safeParse`).
 * Calls to tools not present in the supplied set are ignored. Validates
 * arguments only - a call whose args are valid but whose execution failed
 * is still counted valid here (use {@link recoveryAfterError} for that).
 *
 * @packageDocumentation
 */

import type { Scorer } from '@graphorin/observability/eval';
import type { Trajectory } from './types.js';

interface SchemaLike {
  safeParse(value: unknown): { readonly success: boolean };
}

/** @stable */
export interface ArgumentValidityOptions {
  /** The tools whose `inputSchema` is used to validate matching calls. */
  readonly tools: ReadonlyArray<{ readonly name: string; readonly inputSchema: SchemaLike }>;
  /** Optional name override. */
  readonly name?: string;
}

/** @stable */
export function argumentValidity<I = unknown>(
  options: ArgumentValidityOptions,
): Scorer<I, Trajectory> {
  const schemas = new Map<string, SchemaLike>(options.tools.map((t) => [t.name, t.inputSchema]));
  const name = options.name ?? 'argument-validity';
  return {
    name,
    async score({ output }) {
      let checked = 0;
      let invalid = 0;
      let firstBad: string | undefined;
      for (const call of output.calls) {
        const schema = schemas.get(call.toolName);
        if (schema === undefined) continue;
        checked++;
        let ok = false;
        try {
          ok = schema.safeParse(call.args).success;
        } catch {
          ok = false;
        }
        if (!ok) {
          invalid++;
          if (firstBad === undefined) firstBad = call.toolName;
        }
      }
      if (checked === 0) return { pass: true, score: 1 };
      const pass = invalid === 0;
      if (pass) return { pass, score: 1 };
      return {
        pass,
        score: (checked - invalid) / checked,
        reason: `${invalid}/${checked} tool call(s) had arguments rejected by their inputSchema (first: ${firstBad}).`,
      };
    },
  };
}
