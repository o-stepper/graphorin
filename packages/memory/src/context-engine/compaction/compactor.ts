/**
 * Auto-compaction subsystem core (RB-46 / suggested DEC-162 /
 * ADR-050). Trims the in-flight ContextEngine message buffer when
 * the assembled token count crosses a per-provider threshold; the
 * trim is summarized via the configured section template; the
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
import {
  type ImperativeScanResult as ScanResult,
  scanImperativePatterns,
} from '@graphorin/observability/redaction';
import { UNTRUSTED_CONTENT_OPEN_PREFIX, wrapUntrusted } from '../../internal/envelope.js';
import type { ContextLocalePack } from '../locale-packs/index.js';
import {
  type ContextTokenCounter,
  countMessageTokens,
  HEURISTIC_TOKEN_COUNTER,
  renderMessageText,
} from '../token-counter.js';
import { clearOldToolResults } from './clear-tool-results.js';
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

/** Opening marker of the inbound-untrusted envelope (tools sanitize layer). */
const UNTRUSTED_MARKER = UNTRUSTED_CONTENT_OPEN_PREFIX;

/**
 * Wall-clock budget for the injection scan of the summarizer
 * output. The scanner's 5ms default exists for the per-tool-result
 * hot path; a compaction already paid for an LLM call, the summary
 * body is a single bounded text, and the pattern catalogue is fixed,
 * so the scan here runs UNBUDGETED - a wall-clock budget only turned
 * scheduler noise into a `null` verdict (a 50ms budget was observed
 * expiring on a degraded CI runner, silently failing the check open).
 */
const COMPACTION_SCAN_BUDGET_MS = Number.POSITIVE_INFINITY;

/**
 * Trust decision for a freshly produced summary. Exported for
 * unit tests because the `scan === null` branch (scanner budget
 * exceeded) MUST fail closed: the scanner's contract is "null = the
 * caller applies its own best-effort degradation", and treating null
 * as "no hits" would commit a poisoned summary as trusted exactly on
 * the contended hosts where the budget expires.
 *
 * @internal
 */
export function resolveSummaryTrust(
  windowUntrusted: boolean,
  scan: ScanResult | null,
): 'trusted' | 'untrusted-derived' {
  if (windowUntrusted) return 'untrusted-derived';
  if (scan === null) return 'untrusted-derived';
  return scan.hits.length > 0 ? 'untrusted-derived' : 'trusted';
}

/** Does the compacted window carry inbound-untrusted envelopes? */
function windowContainsUntrusted(messages: ReadonlyArray<Message>): boolean {
  return messages.some((message) => renderMessageText(message).includes(UNTRUSTED_MARKER));
}

/**
 * Wrap the LLM-authored summary body in a derived-trust
 * envelope. Envelope marker sequences inside the body are neutralized
 * first so summarizer output influenced by injected text cannot break
 * out of the envelope and masquerade as authoritative system text.
 * Delegates to the shared `internal/envelope.ts` helper so the
 * whole memory package neutralizes markers with one scheme; the
 * output is byte-identical to the historical inline implementation on
 * literal-marker inputs.
 */
function wrapSummaryAsDerived(body: string): string {
  return wrapUntrusted(body, { trust: 'derived', tool: 'compaction-summarizer' });
}

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

  if (input.strategy.kind === 'clear-old-tool-results') {
    return executeClearStrategy(input, input.strategy, counter, now, startTs, beforeTokens);
  }

  const preserveRecentTurns = input.strategy.preserveRecentTurns ?? DEFAULT_PRESERVE_RECENT_TURNS;
  const summarizerModelInput = input.strategy.summarizerModel;
  const summarizerTimeoutMs = input.strategy.summarizerTimeoutMs;

  // Slice the older portion + preserve the recent N turns. We treat
  // a "turn" as a single message for the v0.1 surface; the spec
  // notes more nuanced segmentation is post-MVP per Q-121.
  let olderCount = Math.max(0, input.messages.length - preserveRecentTurns);
  // context-engine-01: never split an assistant/tool pair. A purely
  // positional slice can strand a `role:'tool'` message at the head of
  // the preserved window while its `tool_calls` assistant partner is
  // summarized away - OpenAI-compatible servers 400 on the orphan and
  // `invalid-request` is fallback-ineligible, so the run would die right
  // after an otherwise successful compaction. Snap the boundary backward
  // until the preserved slice starts on a non-`tool` message: preserving
  // more than requested is always transcript-safe. (The
  // clear-tool-results strategy is immune by construction - it replaces
  // content in place and never removes messages.)
  while (olderCount > 0 && input.messages[olderCount]?.role === 'tool') {
    olderCount -= 1;
  }
  const olderRaw = input.messages.slice(0, olderCount);
  const preservedTail = input.messages.slice(olderCount);

  // C4: keep the most recent USER messages verbatim across compaction -
  // only assistant/tool content gets summarized away. User words are the
  // task statement; a paraphrase in the summary routinely drops the
  // constraint that mattered. The carried messages are removed from the
  // summarizer's input (no double-counting) and re-inserted between the
  // summary and the preserved tail, keeping their relative order.
  const preserveUserMessages = Math.max(0, input.strategy.preserveUserMessages ?? 2);
  const carriedUserIndices = new Set<number>();
  if (preserveUserMessages > 0) {
    for (let i = olderRaw.length - 1; i >= 0 && carriedUserIndices.size < preserveUserMessages; ) {
      if (olderRaw[i]?.role === 'user') carriedUserIndices.add(i);
      i -= 1;
    }
  }
  // Degenerate guard: on a tiny (user-dominated) window, carrying users
  // could empty the summarizable slice and turn the whole compaction into
  // a no-op - there, positional summarization wins.
  if (carriedUserIndices.size > 0 && carriedUserIndices.size === olderRaw.length) {
    carriedUserIndices.clear();
  }
  const olderMessages = olderRaw.filter((_, idx) => !carriedUserIndices.has(idx));
  const carriedUserMessages = olderRaw.filter((_, idx) => carriedUserIndices.has(idx));
  const preservedMessages = [...carriedUserMessages, ...preservedTail];

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
      summaryTrust: 'trusted',
    });
  }

  const template = {
    preamble: input.localePack.compactionSummaryTemplate.preamble,
    sections: input.localePack.compactionSummaryTemplate.sections,
  };
  const prompt = buildSummarizerPrompt({
    template,
    olderMessages,
    ...(input.strategy.summarizerInputCharBudget !== undefined
      ? { maxDumpChars: input.strategy.summarizerInputCharBudget }
      : {}),
  });

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

  // Section 9 metadata payload - stable shape so consumers can
  // deserialize and reason about a compaction event.
  const metadata: CompactionMetadataPayload = {
    compactedAtIso: new Date(startTs).toISOString(),
    // CE-14: positional labels, prefixed with the compaction instant so
    // they no longer collide across compaction events (core Message has
    // no id - these are indices into THIS compaction's dropped slice).
    compactedFromMessageIds: Object.freeze(olderMessages.map((_, idx) => `c${startTs}_msg_${idx}`)),
    compactedFromMessageIndices: Object.freeze(olderMessages.map((_, idx) => idx)),
    compactedFromTokens: await countMessageTokens(olderMessages, counter),
    summaryTokens: summarized.usageTokens ?? (await counter.countText(summarized.text)),
    summarizerModel: resolveSummarizerModelLabel(summarizerModelInput, input.summarizer.id),
    templateName: SUMMARY_TEMPLATE_NAME,
    templateVersion: SUMMARY_TEMPLATE_VERSION,
    preserveRecentTurns,
  };

  // CE-15: the summary must not launder untrusted content into a
  // trusted system message. When the compacted window carried
  // untrusted envelopes - or the injection heuristics flag the
  // summarizer output itself - the LLM-authored body is committed
  // inside a derived-trust envelope (sticky across re-compactions:
  // the envelope re-triggers this detection next time around).
  const summaryScan = scanImperativePatterns(summarized.text, undefined, COMPACTION_SCAN_BUDGET_MS);
  const summaryTrust = resolveSummaryTrust(windowContainsUntrusted(olderMessages), summaryScan);
  const finalSummary = renderFinalSummary({
    template,
    summaryFromLlm:
      summaryTrust === 'untrusted-derived'
        ? wrapSummaryAsDerived(summarized.text)
        : summarized.text,
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
    summaryTrust,
  });
}

/**
 * Clear the oldest tool results (zero-LLM), then summarize only if the
 * cleared buffer is still over the threshold. The summarizer runs on the
 * already-reduced window, so a few-tool-result buffer compacts for free.
 */
async function executeClearStrategy(
  input: ExecuteCompactionInput,
  strategy: Extract<CompactionStrategy, { kind: 'clear-old-tool-results' }>,
  counter: ContextTokenCounter,
  now: () => number,
  startTs: number,
  beforeTokens: number,
): Promise<CompactionResult> {
  const outcome = await clearOldToolResults(
    input.messages,
    {
      ...(strategy.keepToolUses !== undefined ? { keepToolUses: strategy.keepToolUses } : {}),
      ...(strategy.clearAtLeast !== undefined ? { clearAtLeast: strategy.clearAtLeast } : {}),
      ...(strategy.excludeTools !== undefined ? { excludeTools: strategy.excludeTools } : {}),
      ...(strategy.externalize !== undefined ? { externalize: strategy.externalize } : {}),
      ...(strategy.clearToolInputs !== undefined
        ? { clearToolInputs: strategy.clearToolInputs }
        : {}),
      ...(strategy.readResultToolName !== undefined
        ? { readResultToolName: strategy.readResultToolName }
        : {}),
    },
    counter,
  );
  const afterClearTokens = await countMessageTokens(outcome.messages, counter);

  const fallback = strategy.summarizeFallback;
  if (fallback !== false && afterClearTokens > input.thresholdTokens) {
    // Clearing did not reclaim enough - summarize the ALREADY-cleared buffer.
    const summarized = await executeCompaction({
      ...input,
      messages: outcome.messages,
      strategy: { kind: 'summarize-old-preserve-recent', ...(fallback ?? {}) },
    });
    return Object.freeze({
      ...summarized,
      // Report against the original buffer + carry the cleared indices.
      beforeTokens,
      droppedMessageIndices: Object.freeze([
        ...outcome.clearedIndices,
        ...summarized.droppedMessageIndices.filter((i) => !outcome.clearedIndices.includes(i)),
      ]),
      durationMs: now() - startTs,
    });
  }

  // Zero-LLM clear-only outcome: content replaced in place, nothing summarized.
  const clearedSet = new Set(outcome.clearedIndices);
  const preservedMessages = outcome.messages.filter((_, i) => !clearedSet.has(i));
  return Object.freeze({
    summary: '',
    summaryTokens: 0,
    beforeTokens,
    afterTokens: afterClearTokens,
    droppedMessageIds: Object.freeze(outcome.clearedIndices.map((i) => `c${startTs}_cleared_${i}`)),
    droppedMessageIndices: Object.freeze([...outcome.clearedIndices]),
    preservedMessages: Object.freeze(preservedMessages),
    trimmedMessages: Object.freeze([...outcome.messages]),
    source: input.source,
    durationMs: now() - startTs,
    hooksFiredCount: 0,
    summaryTrust: 'trusted',
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
