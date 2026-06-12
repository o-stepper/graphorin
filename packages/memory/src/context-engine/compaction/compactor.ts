/**
 * Auto-compaction subsystem core (RB-46 / suggested DEC-162 /
 * ADR-050). Trims the in-flight ContextEngine message buffer when
 * the assembled token count crosses a per-provider threshold; the
 * trim is summarized via the configured 9-section template; the
 * trim is followed by synchronous-await firing of registered
 * post-compaction hooks (lifecycle owned by Phase 12; this module
 * exposes the trim primitive).
 *
 * Disjoint from the Phase 10c consolidator: never writes to
 * `semantic_facts` / `episodic_episodes` / `procedural_rules`;
 * reads only `memory.metadata(...)` / `memory.semantic.search(...)`
 * / `memory.procedural.activate(...)` / `memory.working.read(...)`
 * (non-mutating).
 *
 * @packageDocumentation
 */

import type { Message, ModelSpec, SystemMessage } from '@graphorin/core';
import type { ContextLocalePack } from '../locale-packs/index.js';
import {
  type ContextTokenCounter,
  countMessageTokens,
  HEURISTIC_TOKEN_COUNTER,
} from '../token-counter.js';
import {
  buildSummarizerPrompt,
  type CompactionMetadataPayload,
  renderFinalSummary,
  SUMMARY_TEMPLATE_NAME,
  SUMMARY_TEMPLATE_VERSION,
} from './templates/summary-9-section.js';
import type {
  CompactionContext,
  CompactionResult,
  CompactionSource,
  CompactionStrategy,
  CompactionSummarizer,
} from './types.js';

/**
 * Default count of recent turns preserved verbatim by the
 * `summarize-old-preserve-recent` strategy.
 *
 * @stable
 */
export const DEFAULT_PRESERVE_RECENT_TURNS = 6;

/**
 * Trim the in-flight buffer using the
 * `summarize-old-preserve-recent` strategy. Returns the trimmed
 * messages + summary metadata; the caller is responsible for
 * appending the summary to the message buffer (Phase 12 owns the
 * lifecycle; this module exposes the primitive).
 *
 * @stable
 */
export interface ExecuteCompactionInput {
  readonly messages: ReadonlyArray<Message>;
  readonly source: CompactionSource;
  readonly strategy: CompactionStrategy;
  readonly localePack: ContextLocalePack;
  readonly summarizer: CompactionSummarizer;
  readonly tokenCounter?: ContextTokenCounter;
  readonly thresholdTokens: number;
  readonly runId: string;
  readonly sessionId: string;
  readonly agentId: string;
  readonly scope: import('@graphorin/core').SessionScope;
  readonly providerTrust?: import('@graphorin/core').LocalProviderTrust;
  readonly now?: () => number;
  readonly signal?: AbortSignal;
}

/**
 * Perform a compaction call. Returns the result envelope containing
 * the produced summary, the dropped/preserved message slices, and
 * the per-event metadata. Phase 12 / `agent.compact()` is the
 * lifecycle owner; this function is the trim primitive.
 *
 * @stable
 */
export async function executeCompaction(input: ExecuteCompactionInput): Promise<CompactionResult> {
  const counter = input.tokenCounter ?? HEURISTIC_TOKEN_COUNTER;
  const now = input.now ?? Date.now;
  const startTs = now();
  const beforeTokens = await countMessageTokens(input.messages, counter);

  if (input.strategy.kind === 'custom') {
    const ctx: CompactionContext = {
      runId: input.runId,
      sessionId: input.sessionId,
      agentId: input.agentId,
      scope: input.scope,
      source: input.source,
      messages: input.messages,
      beforeTokens,
      thresholdTokens: input.thresholdTokens,
      preserveRecentTurns: DEFAULT_PRESERVE_RECENT_TURNS,
      providerTrust: input.providerTrust ?? 'public-tls',
    };
    const result = await input.strategy.compact(ctx);
    return result;
  }

  const preserveRecentTurns = input.strategy.preserveRecentTurns ?? DEFAULT_PRESERVE_RECENT_TURNS;
  const summarizerModelInput = input.strategy.summarizerModel;
  const summarizerTimeoutMs = input.strategy.summarizerTimeoutMs;

  // Slice the older portion + preserve the recent N turns. We treat
  // a "turn" as a single message for the v0.1 surface; the spec
  // notes more nuanced segmentation is post-MVP per Q-121.
  const olderCount = Math.max(0, input.messages.length - preserveRecentTurns);
  const olderMessages = input.messages.slice(0, olderCount);
  const preservedMessages = input.messages.slice(olderCount);

  if (olderMessages.length === 0) {
    return Object.freeze({
      summary: '',
      summaryTokens: 0,
      beforeTokens,
      afterTokens: beforeTokens,
      droppedMessageIds: Object.freeze([]),
      droppedMessageIndices: Object.freeze([]),
      preservedMessages: Object.freeze([...preservedMessages]),
      trimmedMessages: Object.freeze([...preservedMessages]),
      source: input.source,
      durationMs: now() - startTs,
      hooksFiredCount: 0,
    });
  }

  const template = {
    preamble: input.localePack.compactionSummaryTemplate.preamble,
    sections: input.localePack.compactionSummaryTemplate.sections,
  };
  const prompt = buildSummarizerPrompt({ template, olderMessages });

  const summarizerInput: {
    prompt: string;
    model?: ModelSpec | string;
    signal?: AbortSignal;
    timeoutMs?: number;
  } = { prompt };
  if (summarizerModelInput !== undefined) summarizerInput.model = summarizerModelInput;
  if (input.signal !== undefined) summarizerInput.signal = input.signal;
  if (summarizerTimeoutMs !== undefined) summarizerInput.timeoutMs = summarizerTimeoutMs;
  const summarized = await input.summarizer.summarize(summarizerInput);

  // Section 9 metadata payload — stable shape so consumers can
  // deserialize and reason about a compaction event.
  const metadata: CompactionMetadataPayload = {
    compactedAtIso: new Date(startTs).toISOString(),
    // CE-14: positional labels, prefixed with the compaction instant so
    // they no longer collide across compaction events (core Message has
    // no id — these are indices into THIS compaction's dropped slice).
    compactedFromMessageIds: Object.freeze(olderMessages.map((_, idx) => `c${startTs}_msg_${idx}`)),
    compactedFromMessageIndices: Object.freeze(olderMessages.map((_, idx) => idx)),
    compactedFromTokens: await countMessageTokens(olderMessages, counter),
    summaryTokens: summarized.usageTokens ?? (await counter.countText(summarized.text)),
    summarizerModel: resolveSummarizerModelLabel(summarizerModelInput, input.summarizer.id),
    templateName: SUMMARY_TEMPLATE_NAME,
    templateVersion: SUMMARY_TEMPLATE_VERSION,
    preserveRecentTurns,
  };

  const finalSummary = renderFinalSummary({
    template,
    summaryFromLlm: summarized.text,
    preservedMessages,
    metadata,
  });
  const summaryTokens = await counter.countText(finalSummary);

  const summaryMessage: SystemMessage = {
    role: 'system',
    content: finalSummary,
  };
  const trimmedMessages: ReadonlyArray<Message> = Object.freeze([
    summaryMessage,
    ...preservedMessages,
  ]);
  const afterTokens = await countMessageTokens(trimmedMessages, counter);
  const durationMs = now() - startTs;

  return Object.freeze({
    summary: finalSummary,
    summaryTokens,
    beforeTokens,
    afterTokens,
    droppedMessageIds: metadata.compactedFromMessageIds,
    droppedMessageIndices: metadata.compactedFromMessageIndices,
    preservedMessages: Object.freeze([...preservedMessages]),
    trimmedMessages,
    source: input.source,
    durationMs,
    hooksFiredCount: 0,
  });
}

function resolveSummarizerModelLabel(
  modelInput: ModelSpec | string | undefined,
  summarizerId: string | undefined,
): string | null {
  if (typeof modelInput === 'string') return modelInput;
  if (modelInput !== undefined) {
    const provider =
      'provider' in modelInput
        ? `${modelInput.provider.name}:${modelInput.model}`
        : `${modelInput.name}:${modelInput.modelId}`;
    return provider;
  }
  return summarizerId ?? null;
}
