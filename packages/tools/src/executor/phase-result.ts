/**
 * Result-assembly phase: build the final `ToolResult` (bounded output,
 * sanitized content parts, WI-10 spill handle), register the artifact's
 * producer taint for later handle reads (TL-6), record the output's
 * provenance with the data-flow guard (WI-12 / P1-3), and emit the
 * `tool:execute:end` / `tool:execute:streamed` audit rows plus the
 * `tool.execute.end` streaming event.
 *
 * @packageDocumentation
 */

import type {
  CompletedToolCall,
  ResolvedTool,
  RunContext,
  Sensitivity,
  ToolCall,
  ToolResult,
  ToolSource,
  ToolTrustClass,
} from '@graphorin/core';

import type { SanitizationOutcome } from '../inbound/sanitize.js';
import type { ResultEnvelope, splitTextAndContentParts } from '../result/envelope.js';
import type { TruncationOutcome } from '../result/truncate.js';
import type { StreamingAggregator } from '../streaming/channel.js';
import { frozenCompleted, toEndEvent } from './outcome.js';
import type { ExecutorRuntime } from './types.js';

function wrapOutput(rawOutput: unknown, sanitizedText: string, originalText: string): unknown {
  // When the rendered text is byte-identical to the original (nothing was
  // truncated or sanitized), pass the typed output through unchanged - small
  // objects keep their structure for downstream consumers (code-mode, etc).
  if (sanitizedText === originalText) return rawOutput;
  // Otherwise the body was bounded (truncated) and/or had imperative content
  // stripped. The model must see exactly that bounded text - never the full
  // structured object (TL-2). Previously a non-string output was returned
  // whole here, so the cap + inbound sanitization were computed and thrown
  // away and the agent inlined the entire blob (and any injection past the
  // cap) verbatim. Returning the bounded text closes that bypass; the full
  // value is preserved out of context behind the spill `resultHandle`.
  return sanitizedText;
}

export function assembleResultPhase(
  rt: ExecutorRuntime,
  input: {
    readonly call: ToolCall;
    readonly tool: ResolvedTool;
    readonly runContext: RunContext;
    readonly stepNumber: number;
    readonly durationMs: number;
    readonly envelope: ResultEnvelope;
    readonly split: ReturnType<typeof splitTextAndContentParts>;
    readonly truncation: TruncationOutcome;
    readonly sanitization: SanitizationOutcome;
    /** The (possibly defanged) structured output from the sanitize phase. */
    readonly effectiveOutput: unknown;
    readonly effectiveTrustClass: ToolTrustClass;
    readonly effectiveSource: ToolSource;
    readonly effectiveSensitivity: Sensitivity | undefined;
    readonly aggregator: StreamingAggregator;
    readonly idempotencyKey: string | undefined;
  },
): CompletedToolCall {
  const {
    call,
    tool,
    runContext,
    stepNumber,
    durationMs,
    envelope,
    split,
    truncation,
    sanitization,
    effectiveOutput,
    effectiveTrustClass,
    effectiveSource,
    effectiveSensitivity,
    aggregator,
    idempotencyKey,
  } = input;

  const sanitizedOutput = wrapOutput(effectiveOutput, sanitization.body, split.text);
  const result: ToolResult = {
    toolCallId: call.toolCallId,
    toolName: tool.name,
    output: sanitizedOutput,
    contentParts: [
      ...split.nonText,
      ...split.textParts.map((p) => ({ ...p, text: sanitization.body }) as typeof p),
    ],
    durationMs,
    // WI-10 (P1-4): when the body spilled to a file, surface a structured,
    // opaque handle + the bounded preview so the agent inlines the preview
    // (not the full blob) and the model can fetch the rest via `read_result`.
    ...(truncation.resultHandle !== undefined
      ? {
          resultHandle: {
            uri: truncation.resultHandle,
            kind: 'spill-file' as const,
            preview: sanitization.body,
            producerTrustClass: effectiveTrustClass,
            ...(truncation.artifactBytes !== undefined ? { bytes: truncation.artifactBytes } : {}),
          },
        }
      : {}),
  };
  if (truncation.resultHandle !== undefined) {
    // TL-6: remember who produced this artifact so a later read
    // re-applies the producer's taint (effective values chain taint
    // across re-spills of handle reads too).
    rt.handleProducerTaint.set(truncation.resultHandle, {
      trustClass: effectiveTrustClass,
      source: effectiveSource,
      ...(effectiveSensitivity !== undefined ? { sensitivity: effectiveSensitivity } : {}),
    });
  }
  // Record this output's provenance so later sink gates can detect
  // untrusted-to-sink flows (WI-12 / P1-3). Uses the sanitized text the
  // model will actually see - that is the only content it can forward.
  if (rt.options.dataFlowGuard !== undefined) {
    rt.options.dataFlowGuard.record({
      toolName: tool.name,
      trustClass: effectiveTrustClass,
      ...(effectiveSensitivity !== undefined ? { sensitivity: effectiveSensitivity } : {}),
      source: effectiveSource,
      outputText: sanitization.body,
      ...(envelope.taint !== undefined ? { taintOverride: envelope.taint } : {}),
      runContext,
    });
  }
  rt.emit({
    action: 'tool:execute:end',
    actor: { kind: 'tool', id: tool.name },
    target: tool.name,
    decision: 'success',
    ts: Date.now(),
    context: { runId: runContext.runId, stepNumber, toolCallId: call.toolCallId },
    metadata: {
      durationMs,
      ...(idempotencyKey !== undefined ? { idempotencyKey } : {}),
      ...(tool.__streamingHint ? { streamingHint: true, chunkCount: aggregator.chunkCount } : {}),
    },
  });
  if (tool.__streamingHint) {
    rt.emit({
      action: 'tool:execute:streamed',
      actor: { kind: 'tool', id: tool.name },
      target: tool.name,
      decision: 'success',
      ts: Date.now(),
      context: { runId: runContext.runId, stepNumber, toolCallId: call.toolCallId },
      metadata: {
        chunkCount: aggregator.chunkCount,
        progressEventCount: aggregator.progressEventCount,
        totalBytes: aggregator.totalBytes,
        durationMs,
        streamingHint: true,
        // Resume support is a Phase 09 (MCP) cross-cut; we expose
        // `resumed: false` here so the audit row is forward-compatible
        // with the resumable session metadata the MCP adapter will
        // wire later.
        resumed: false,
      },
    });
  }
  rt.options.streamingSink?.(toEndEvent(call, result.output, durationMs));

  return frozenCompleted(call, result, stepNumber, durationMs);
}
