/**
 * `toolUsageValidator` — output guardrail that asserts the
 * structured `toolCalls` produced by the agent against operator
 * policy: required tool names that must appear, forbidden tool
 * names that must not appear, and an optional caller-supplied
 * predicate for richer rules (e.g. "no more than three writes per
 * run").
 *
 * Reference: the project's security architecture, § Guardrails.
 *
 * @packageDocumentation
 */

import { defineOutputGuardrail } from '../builders.js';
import type { GuardrailResult, OutputGuardrail } from '../types.js';

/**
 * Shape of one observed tool call. Aligned with `ToolCall` from
 * `@graphorin/core` but decoupled — the validator reads only what it
 * needs so deployments can repurpose it for other shapes.
 *
 * @stable
 */
export interface ObservedToolCall {
  readonly toolName: string;
  readonly toolCallId?: string;
  readonly args?: unknown;
}

/**
 * Options for `toolUsageValidator(...)`.
 *
 * @stable
 */
export interface ToolUsageValidatorOptions {
  /** Tool names that must appear at least once. */
  readonly requiredTools?: ReadonlyArray<string>;
  /** Tool names that must NOT appear. */
  readonly forbiddenTools?: ReadonlyArray<string>;
  /** Maximum number of total tool invocations. */
  readonly maxCalls?: number;
  /** Maximum number of invocations per tool name. */
  readonly maxPerTool?: number;
  /**
   * Custom predicate. Returning `false` rejects the run with the
   * supplied `message`.
   */
  readonly predicate?: (
    calls: ReadonlyArray<ObservedToolCall>,
  ) => { readonly ok: true } | { readonly ok: false; readonly message: string };
  /** Action on rejection. Defaults to `'block'`. */
  readonly action?: 'block' | 'warn';
  /** Override guardrail name. */
  readonly name?: string;
}

/**
 * Construct the tool-usage validator.
 *
 * @stable
 */
export function toolUsageValidator(
  opts: ToolUsageValidatorOptions = {},
): OutputGuardrail<{ readonly toolCalls?: ReadonlyArray<ObservedToolCall> } | unknown> {
  const required = new Set(opts.requiredTools ?? []);
  const forbidden = new Set(opts.forbiddenTools ?? []);
  const action = opts.action ?? 'block';
  const name = opts.name ?? 'toolUsageValidator';

  return defineOutputGuardrail({
    name,
    check: (
      value: { readonly toolCalls?: ReadonlyArray<ObservedToolCall> } | unknown,
    ): GuardrailResult<unknown> => {
      const calls = extractToolCalls(value);

      if (opts.maxCalls !== undefined && calls.length > opts.maxCalls) {
        return {
          ok: false,
          action,
          message: `observed ${calls.length} tool calls; limit is ${opts.maxCalls}`,
          metadata: Object.freeze({ totalCalls: calls.length }),
        };
      }

      const counts = new Map<string, number>();
      for (const call of calls) {
        if (forbidden.has(call.toolName)) {
          return {
            ok: false,
            action,
            message: `forbidden tool '${call.toolName}' was invoked`,
            metadata: Object.freeze({ tool: call.toolName }),
          };
        }
        counts.set(call.toolName, (counts.get(call.toolName) ?? 0) + 1);
      }
      if (opts.maxPerTool !== undefined) {
        for (const [tool, n] of counts) {
          if (n > opts.maxPerTool) {
            return {
              ok: false,
              action,
              message: `tool '${tool}' was invoked ${n} times; limit per-tool is ${opts.maxPerTool}`,
              metadata: Object.freeze({ tool, count: n }),
            };
          }
        }
      }

      const missing: string[] = [];
      for (const tool of required) if (!counts.has(tool)) missing.push(tool);
      if (missing.length > 0) {
        return {
          ok: false,
          action,
          message: `required tools missing: ${missing.join(', ')}`,
          metadata: Object.freeze({ missing }),
        };
      }

      if (opts.predicate !== undefined) {
        const decision = opts.predicate(calls);
        if (!decision.ok) {
          return {
            ok: false,
            action,
            message: decision.message,
            metadata: Object.freeze({ totalCalls: calls.length }),
          };
        }
      }

      return { ok: true };
    },
  });
}

function extractToolCalls(value: unknown): ReadonlyArray<ObservedToolCall> {
  if (value === null || value === undefined) return [];
  if (
    Array.isArray(value) &&
    value.every((v) => typeof v === 'object' && v !== null && 'toolName' in (v as object))
  ) {
    return value as ReadonlyArray<ObservedToolCall>;
  }
  if (typeof value === 'object' && value !== null && 'toolCalls' in (value as object)) {
    const calls = (value as { toolCalls?: ReadonlyArray<ObservedToolCall> }).toolCalls;
    return Array.isArray(calls) ? calls : [];
  }
  return [];
}
