/**
 * Result-envelope phase: reconcile the streaming buffer with the
 * tool's explicit return value into a canonical `ResultEnvelope`, then
 * run the optional output-schema validation.
 *
 * @packageDocumentation
 */

import type {
  CompletedToolCall,
  ResolvedTool,
  RunContext,
  ToolCall,
  ZodLikeSchema,
} from '@graphorin/core';

import { incrementCounter } from '../audit/index.js';
import { type ResultEnvelope, toResultEnvelope } from '../result/envelope.js';
import type { StreamingAggregator } from '../streaming/channel.js';
import { failWith } from './outcome.js';
import type { ExecutorRuntime } from './types.js';

/** Outcome of {@link buildEnvelopePhase}. */
export type EnvelopePhaseOutcome =
  | { readonly ok: true; readonly envelope: ResultEnvelope }
  | { readonly ok: false; readonly completed: CompletedToolCall };

// Reconcile streaming buffer with explicit return. `undefined` is
// the canonical "no explicit return" signal (per the
// buffer-becomes-output discipline for streaming-hint tools);
// `null` is a legitimate return value and is forwarded as-is.
export function buildEnvelopePhase(
  rt: ExecutorRuntime,
  input: {
    readonly call: ToolCall;
    readonly tool: ResolvedTool;
    readonly runContext: RunContext;
    readonly stepNumber: number;
    readonly durationMs: number;
    readonly rawResult: unknown;
    readonly aggregator: StreamingAggregator;
  },
): EnvelopePhaseOutcome {
  const { call, tool, runContext, stepNumber, durationMs, rawResult, aggregator } = input;
  const explicitReturnPresent = rawResult !== undefined;
  const envelope = explicitReturnPresent
    ? toResultEnvelope({ raw: rawResult as unknown })
    : toResultEnvelope({ raw: undefined, chunks: aggregator.chunks });
  if (explicitReturnPresent && aggregator.chunks.length > 0) {
    incrementCounter('tool.streaming.return-and-stream-conflict.total', { toolName: tool.name });
  }

  // Optional output schema validation.
  if (tool.outputSchema !== undefined && envelope.output !== undefined) {
    const out = (tool.outputSchema as ZodLikeSchema<unknown>).safeParse(envelope.output);
    if (!out.success) {
      return {
        ok: false,
        completed: failWith(
          rt,
          call,
          tool,
          'invalid_output',
          out.error.message,
          runContext,
          stepNumber,
          durationMs,
        ),
      };
    }
  }
  return { ok: true, envelope };
}
