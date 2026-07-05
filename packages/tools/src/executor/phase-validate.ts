/**
 * Argument-validation phase: schema-validate the LLM-generated args,
 * with the optional single-round repair hook on failure.
 *
 * @packageDocumentation
 */

import type { CompletedToolCall, ResolvedTool, RunContext, ToolCall } from '@graphorin/core';

import { describe, failWith } from './outcome.js';
import type { ExecutorRuntime } from './types.js';

/** Outcome of {@link runValidateArgsPhase}. */
export type ValidateArgsOutcome =
  | {
      readonly ok: true;
      /** The schema-validated (possibly coerced) input the tool executes on. */
      readonly validatedInput: unknown;
      /**
       * Raw-shaped args that passed the schema (post-repair when repair ran)
       * - what an approval gate / human is shown and what a resume replays.
       */
      readonly effectiveArgs: unknown;
    }
  | { readonly ok: false; readonly completed: CompletedToolCall };

// Validate args FIRST (with optional single-round repair) - tools-02.
// The approval flow used to run before validation on raw `call.args`,
// which was a TOCTOU on a security control: a human could approve
// invalid args X, after which the repair hook rewrote them into
// schema-valid Y and Y executed without re-gating; predicates also saw
// pre-coercion values their typed signature never promised. Now the
// gate evaluates the VALIDATED input, the approval record carries the
// post-repair raw-shaped args (what will actually run), and nothing
// can change between the grant and the execution.
export async function runValidateArgsPhase(
  rt: ExecutorRuntime,
  input: {
    readonly call: ToolCall;
    readonly tool: ResolvedTool;
    readonly runContext: RunContext;
    readonly stepNumber: number;
    readonly disableRepair: boolean;
  },
): Promise<ValidateArgsOutcome> {
  const { call, tool, runContext, stepNumber, disableRepair } = input;
  const parsed = tool.inputSchema.safeParse(call.args);
  if (parsed.success) {
    return { ok: true, validatedInput: parsed.data, effectiveArgs: call.args };
  }
  if (rt.options.repair !== undefined && disableRepair !== true) {
    try {
      const repaired = await rt.options.repair.repair({
        toolName: tool.name,
        invalidArgs: call.args,
        schemaError: parsed.error,
        signal: runContext.signal,
      });
      if (repaired === null) {
        return {
          ok: false,
          completed: failWith(
            rt,
            call,
            tool,
            'invalid_input',
            parsed.error.message,
            runContext,
            stepNumber,
          ),
        };
      }
      const reparsed = tool.inputSchema.safeParse(repaired);
      if (!reparsed.success) {
        return {
          ok: false,
          completed: failWith(
            rt,
            call,
            tool,
            'invalid_input',
            reparsed.error.message,
            runContext,
            stepNumber,
          ),
        };
      }
      return { ok: true, validatedInput: reparsed.data, effectiveArgs: repaired };
    } catch (cause) {
      return {
        ok: false,
        completed: failWith(
          rt,
          call,
          tool,
          'invalid_input',
          describe(cause),
          runContext,
          stepNumber,
        ),
      };
    }
  }
  return {
    ok: false,
    completed: failWith(
      rt,
      call,
      tool,
      'invalid_input',
      parsed.error.message,
      runContext,
      stepNumber,
    ),
  };
}
