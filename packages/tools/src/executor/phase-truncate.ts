/**
 * Truncation phase: split the envelope into text + non-text parts,
 * resolve the PRODUCER's taint for handle reads, route
 * structured overflow through spill-to-file, bound the body via
 * `truncateBody(...)`, and emit the truncation / spill audit rows.
 *
 * @packageDocumentation
 */

import type {
  AISpan,
  ResolvedTool,
  RunContext,
  Sensitivity,
  ToolCall,
  ToolSource,
  ToolTrustClass,
} from '@graphorin/core';

import { incrementCounter, observeHistogram } from '../audit/index.js';
import { defaultInboundSanitization } from '../builder/trust-class.js';
import { type ResultEnvelope, splitTextAndContentParts } from '../result/envelope.js';
import { type TruncationOutcome, truncateBody } from '../result/truncate.js';
import type { ExecutorRuntime, HandleProducerTaint } from './types.js';

/** Trust classes whose content must not launder through handle reads. */
export function isUntrustedProducerClass(trustClass: ToolTrustClass): boolean {
  return defaultInboundSanitization(trustClass) === 'detect-and-strip-and-wrap';
}

/** Outcome of {@link runTruncationPhase}. */
export interface TruncationPhaseResult {
  /** The envelope split into text body + non-text content parts. */
  readonly split: ReturnType<typeof splitTextAndContentParts>;
  readonly truncation: TruncationOutcome;
  /** The producing tool's taint when this call is a handle read. */
  readonly producerTaint: HandleProducerTaint | undefined;
  readonly effectiveTrustClass: ToolTrustClass;
  readonly effectiveSource: ToolSource;
  readonly effectiveSensitivity: Sensitivity | undefined;
}

// Truncation pipeline.
export async function runTruncationPhase(
  rt: ExecutorRuntime,
  input: {
    readonly call: ToolCall;
    readonly tool: ResolvedTool;
    readonly runContext: RunContext;
    readonly stepNumber: number;
    readonly span: AISpan<'tool.execute'>;
    readonly envelope: ResultEnvelope;
  },
): Promise<TruncationPhaseResult> {
  const { call, tool, runContext, stepNumber, span, envelope } = input;
  const split = splitTextAndContentParts(envelope);
  // Surface every non-text content-part kind as a span attribute so
  // operators see image / audio / file pass-through behaviour.
  if (split.nonText.length > 0) {
    const kinds = [...new Set(split.nonText.map((p) => p.type))];
    for (const kind of kinds) {
      span.setAttributes({
        [`graphorin.tool.result.contentpart.kind.${kind}`]: true,
      });
    }
  }
  // TL-2: a structured (object/array) output that overflows the cap must
  // not be inlined whole. `normalize` always resolves a concrete strategy
  // (default `'middle'`), so when a structured output lands on that default
  // we route it through spill-to-file instead - the model sees a bounded
  // preview + a `read_result` handle while the full blob is preserved out of
  // context. An explicitly pinned `'tail'` / `'summarize'` / `'spill-to-file'`
  // is honoured. Under the cap `truncateBody` is a no-op regardless, so small
  // objects and all string outputs pass through unchanged.
  // TL-6 / tools-03: resolve the PRODUCER's taint before truncation -
  // a handle read returns content produced by an earlier tool, and a
  // re-spill of that content must persist the producer's class (not
  // read_result's own) into the new artifact's sidecar. Resolution
  // order: this executor's in-memory map, then the class the reader
  // reported (the file reader recovers it from the sidecar, covering
  // the second-executor / resumed-process cases).
  const readHandle =
    typeof (call.args as { readonly handle?: unknown } | null | undefined)?.handle === 'string'
      ? (call.args as { readonly handle: string }).handle
      : undefined;
  const mappedTaint = readHandle !== undefined ? rt.handleProducerTaint.get(readHandle) : undefined;
  const readerReported = envelope.output as
    | {
        readonly producerTrustClass?: unknown;
        readonly producerSource?: unknown;
        readonly producerSensitivity?: unknown;
        readonly producerImperativeFlagged?: unknown;
      }
    | null
    | undefined;
  const readerReportedClass =
    typeof readerReported?.producerTrustClass === 'string'
      ? (readerReported.producerTrustClass as ToolTrustClass)
      : undefined;
  const readerReportedSource =
    typeof readerReported?.producerSource === 'object' &&
    readerReported.producerSource !== null &&
    typeof (readerReported.producerSource as { readonly kind?: unknown }).kind === 'string'
      ? (readerReported.producerSource as ToolSource)
      : undefined;
  const producerTaint =
    mappedTaint !== undefined && isUntrustedProducerClass(mappedTaint.trustClass)
      ? mappedTaint
      : readerReportedClass !== undefined && isUntrustedProducerClass(readerReportedClass)
        ? {
            trustClass: readerReportedClass,
            source: readerReportedSource ?? tool.__source,
            ...(typeof readerReported?.producerSensitivity === 'string'
              ? { sensitivity: readerReported.producerSensitivity as Sensitivity }
              : {}),
            ...(readerReported?.producerImperativeFlagged === true
              ? { imperativeFlagged: true }
              : {}),
          }
        : undefined;
  const effectiveTrustClass = producerTaint?.trustClass ?? tool.__trustClass;
  const effectiveSource = producerTaint?.source ?? tool.__source;
  const effectiveSensitivity = producerTaint?.sensitivity ?? tool.sensitivity;

  const baseStrategy = tool.truncationStrategy ?? 'middle';
  const isStructuredOutput = envelope.output !== undefined && typeof envelope.output !== 'string';
  const effectiveStrategy =
    isStructuredOutput && baseStrategy === 'middle' ? 'spill-to-file' : baseStrategy;
  span.setAttributes({
    'graphorin.tool.result.truncation.strategy': effectiveStrategy,
    'graphorin.tool.result.truncation.source': 'tool',
    'graphorin.tool.result.max_tokens': tool.maxResultTokens ?? 16384,
  });
  const truncation = await truncateBody({
    body: split.text,
    maxTokens: tool.maxResultTokens ?? 16384,
    strategy: effectiveStrategy,
    options: {
      ...(rt.options.tokenCounter !== undefined ? { counter: rt.options.tokenCounter } : {}),
      ...(rt.options.summarizer !== undefined ? { summarizer: rt.options.summarizer } : {}),
      spill: rt.spillWriter,
      runId: runContext.runId,
      toolCallId: call.toolCallId,
      // Effective (producer-aware) sensitivity: a secret-produced body
      // stays secret through a handle-read re-spill, so the WI-10
      // secret gate keeps it off disk (tools-03).
      ...(effectiveSensitivity !== undefined ? { toolSensitivityTier: effectiveSensitivity } : {}),
      producerTrustClass: effectiveTrustClass,
      producerSource: effectiveSource,
      // W-156: the spill-time whole-artifact scan uses the operator's
      // pattern catalogue / budget when configured.
      ...(rt.options.imperativePatterns !== undefined
        ? { imperativePatterns: rt.options.imperativePatterns }
        : {}),
      ...(rt.options.imperativeBudgetMs !== undefined
        ? { imperativeBudgetMs: rt.options.imperativeBudgetMs }
        : {}),
      signal: runContext.signal,
    },
  });
  span.setAttributes({
    'graphorin.tool.result.truncation.applied': truncation.truncated,
  });
  if (truncation.truncated) {
    observeHistogram('tool.result.size.tokens', truncation.originalTokens, {
      toolName: tool.name,
    });
    incrementCounter('tool.result.truncation.applied.total', {
      toolName: tool.name,
      strategy: truncation.strategyApplied,
    });
    incrementCounter(
      'tool.result.truncation.bytes-dropped.total',
      { toolName: tool.name, strategy: truncation.strategyApplied },
      Math.max(0, split.text.length - truncation.body.length),
    );
    rt.emit({
      action: 'tool:result:truncated',
      actor: { kind: 'tool', id: tool.name },
      target: tool.name,
      decision: 'success',
      ts: Date.now(),
      context: { runId: runContext.runId, stepNumber, toolCallId: call.toolCallId },
      metadata: {
        strategy: truncation.strategyApplied,
        originalTokens: truncation.originalTokens,
        keptTokens: truncation.keptTokens,
        droppedTokens: truncation.droppedTokens,
        ...(truncation.artifactPath !== undefined ? { artifactPath: truncation.artifactPath } : {}),
        ...(truncation.summarizerModel !== undefined
          ? { summarizerModel: truncation.summarizerModel }
          : {}),
      },
    });
    if (truncation.artifactPath !== undefined) {
      rt.emit({
        action: 'tool:result:spill:written',
        actor: { kind: 'tool', id: tool.name },
        target: tool.name,
        decision: 'success',
        ts: Date.now(),
        context: { runId: runContext.runId, stepNumber, toolCallId: call.toolCallId },
        metadata: {
          artifactPath: truncation.artifactPath,
          byteCount: truncation.artifactBytes ?? 0,
        },
      });
      incrementCounter('tool.result.spill.written.total', { toolName: tool.name });
      if (truncation.artifactBytes !== undefined) {
        incrementCounter(
          'tool.result.spill.bytes.total',
          { toolName: tool.name },
          truncation.artifactBytes,
        );
      }
    }
  } else {
    observeHistogram('tool.result.size.tokens', truncation.originalTokens, {
      toolName: tool.name,
    });
  }

  return {
    split,
    truncation,
    producerTaint,
    effectiveTrustClass,
    effectiveSource,
    effectiveSensitivity,
  };
}
