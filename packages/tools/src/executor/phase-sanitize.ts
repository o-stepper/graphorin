/**
 * Inbound-sanitization phase: defang the `content` field of tainted
 * handle reads in place (TL-6), scan the truncated body under the
 * tool's (or producer's) sanitization policy, emit the hit / blocked
 * audit rows, and surface `inbound_sanitization_blocked` on a
 * fail-closed block.
 *
 * @packageDocumentation
 */

import type {
  AISpan,
  CompletedToolCall,
  ResolvedTool,
  RunContext,
  ToolCall,
  ToolError,
  ToolTrustClass,
} from '@graphorin/core';

import { incrementCounter } from '../audit/index.js';
import { defaultInboundSanitization } from '../builder/trust-class.js';
import { applyInboundSanitization, type SanitizationOutcome } from '../inbound/sanitize.js';
import type { ResultEnvelope } from '../result/envelope.js';
import { frozenCompleted } from './outcome.js';
import type { ExecutorRuntime, HandleProducerTaint } from './types.js';

/** Outcome of {@link runSanitizePhase}. */
export type SanitizePhaseOutcome =
  | {
      readonly ok: true;
      /** The (possibly defanged) structured output the result carries. */
      readonly effectiveOutput: unknown;
      readonly sanitization: SanitizationOutcome;
    }
  | { readonly ok: false; readonly completed: CompletedToolCall };

export function runSanitizePhase(
  rt: ExecutorRuntime,
  input: {
    readonly call: ToolCall;
    readonly tool: ResolvedTool;
    readonly runContext: RunContext;
    readonly stepNumber: number;
    readonly durationMs: number;
    readonly span: AISpan<'tool.execute'>;
    readonly envelope: ResultEnvelope;
    readonly truncatedBody: string;
    readonly producerTaint: HandleProducerTaint | undefined;
    readonly effectiveTrustClass: ToolTrustClass;
  },
): SanitizePhaseOutcome {
  const {
    call,
    tool,
    runContext,
    stepNumber,
    durationMs,
    span,
    envelope,
    truncatedBody,
    producerTaint,
    effectiveTrustClass,
  } = input;

  // TL-6: a handle read returns content PRODUCED by an earlier tool -
  // sanitize and record provenance by the PRODUCER's trust class
  // (resolved above, before truncation), not the reader's own
  // (read_result is a trusted built-in; without this an untrusted
  // spill laundered to trusted on the way back in).
  // TL-6: object outputs bypass `wrapOutput` untouched (WI-10), so for
  // a tainted handle read the `content` string field is defanged
  // in place - that is the channel the model actually reads.
  let effectiveOutput = envelope.output;
  if (
    producerTaint !== undefined &&
    typeof effectiveOutput === 'object' &&
    effectiveOutput !== null &&
    typeof (effectiveOutput as { readonly content?: unknown }).content === 'string'
  ) {
    const contentSanitization = applyInboundSanitization({
      body: (effectiveOutput as { readonly content: string }).content,
      policy: defaultInboundSanitization(effectiveTrustClass),
      trustClass: effectiveTrustClass,
      toolName: tool.name,
      ...(rt.options.imperativePatterns !== undefined
        ? { patterns: rt.options.imperativePatterns }
        : {}),
      ...(rt.options.imperativeBudgetMs !== undefined
        ? { budgetMs: rt.options.imperativeBudgetMs }
        : {}),
    });
    effectiveOutput = { ...(effectiveOutput as object), content: contentSanitization.body };
  }

  // Inbound sanitization.
  const sanitization = applyInboundSanitization({
    body: truncatedBody,
    // When producer taint fired, the producer-class default (always
    // 'detect-and-strip-and-wrap' - taint only fires for untrusted
    // classes) overrides the reader's own baked policy: the reader was
    // classified for ITS provenance, not for the content it relays.
    policy:
      producerTaint !== undefined
        ? defaultInboundSanitization(effectiveTrustClass)
        : (tool.inboundSanitization ?? 'pass-through'),
    trustClass: effectiveTrustClass,
    toolName: tool.name,
    ...(tool.failClosed === true ? { failClosed: true } : {}),
    ...(rt.options.imperativePatterns !== undefined
      ? { patterns: rt.options.imperativePatterns }
      : {}),
    ...(rt.options.imperativeBudgetMs !== undefined
      ? { budgetMs: rt.options.imperativeBudgetMs }
      : {}),
  });
  if (sanitization.patternsHit.length > 0) {
    for (const pattern of sanitization.patternsHit) {
      incrementCounter('tool.inbound.sanitization.hit.total', {
        pattern,
        trustClass: tool.__trustClass,
        toolName: tool.name,
      });
    }
    rt.emit({
      action: 'tool:result:sanitization:hit',
      actor: { kind: 'tool', id: tool.name },
      target: tool.name,
      decision: 'success',
      ts: Date.now(),
      context: { runId: runContext.runId, stepNumber, toolCallId: call.toolCallId },
      metadata: {
        patterns: [...sanitization.patternsHit],
        trustClass: tool.__trustClass,
        policyAction: sanitization.wrapped
          ? 'wrapped'
          : sanitization.stripped
            ? 'stripped'
            : 'flagged',
      },
    });
  }
  if (sanitization.blocked) {
    incrementCounter('tool.inbound.sanitization.blocked.total', {
      trustClass: tool.__trustClass,
    });
    rt.emit({
      action: 'tool:result:sanitization:blocked',
      actor: { kind: 'tool', id: tool.name },
      target: tool.name,
      decision: 'denied',
      ts: Date.now(),
      context: { runId: runContext.runId, stepNumber, toolCallId: call.toolCallId },
      metadata: {
        trustClass: tool.__trustClass,
        patterns: [...sanitization.patternsHit],
      },
    });
    const error: ToolError = {
      toolCallId: call.toolCallId,
      toolName: tool.name,
      kind: 'inbound_sanitization_blocked',
      message: `Tool result blocked by inbound sanitization (patterns: ${sanitization.patternsHit.join(', ')}).`,
    };
    return { ok: false, completed: frozenCompleted(call, error, stepNumber, durationMs) };
  }
  incrementCounter(
    'tool.inbound.sanitization.scan.duration_us.total',
    {
      trustClass: tool.__trustClass,
    },
    sanitization.scanDurationUs,
  );
  span.setAttributes({
    'graphorin.tool.inbound.sanitization.scan_duration_us': sanitization.scanDurationUs,
    'graphorin.tool.inbound.sanitization.policy': tool.inboundSanitization ?? 'pass-through',
    'graphorin.tool.inbound.sanitization.patterns_hit_count': sanitization.patternsHit.length,
  });

  return { ok: true, effectiveOutput, sanitization };
}
