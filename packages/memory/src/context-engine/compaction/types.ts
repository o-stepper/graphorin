/**
 * Public types for the in-flight auto-compaction subsystem (RB-46
 * / suggested DEC-162 / ADR-050).
 *
 * @packageDocumentation
 */

import type { LocalProviderTrust, Message, ModelSpec, SessionScope } from '@graphorin/core';

/**
 * Source classification for a compaction event. Surfaced on the
 * `context.compacted` agent event AND on the
 * `context.compaction.triggered.total{source}` counter.
 *
 * @stable
 */
export type CompactionSource = 'auto-trigger' | 'manual' | 'pre-step';

/**
 * Per-call context handed to a custom strategy + post-compaction
 * hooks. Threaded through Phase 12's lifecycle.
 *
 * @stable
 */
export interface CompactionContext {
  readonly runId: string;
  readonly sessionId: string;
  readonly agentId: string;
  readonly scope: SessionScope;
  readonly source: CompactionSource;
  readonly messages: ReadonlyArray<Message>;
  readonly beforeTokens: number;
  readonly thresholdTokens: number;
  readonly preserveRecentTurns: number;
  readonly providerTrust: LocalProviderTrust;
  readonly summarizerModel?: ModelSpec | string;
}

/**
 * Outcome of a compaction call.
 *
 * @stable
 */
export interface CompactionResult {
  readonly summary: string;
  readonly summaryTokens: number;
  readonly beforeTokens: number;
  readonly afterTokens: number;
  readonly droppedMessageIds: ReadonlyArray<string>;
  readonly droppedMessageIndices: ReadonlyArray<number>;
  readonly preservedMessages: ReadonlyArray<Message>;
  readonly trimmedMessages: ReadonlyArray<Message>;
  readonly source: CompactionSource;
  readonly durationMs: number;
  readonly hooksFiredCount: number;
  /**
   * Trust classification of the produced summary (CE-15).
   * `'untrusted-derived'` when the compacted window contained
   * `<<<untrusted_content>>>` envelopes or the injection heuristics
   * flagged the summarizer output — the LLM-authored summary body is
   * then wrapped in a `trust="derived"` envelope so taint survives
   * compaction instead of laundering into an authoritative system
   * message. `'trusted'` (or absent, for custom strategies that
   * predate the field) otherwise.
   */
  readonly summaryTrust?: 'trusted' | 'untrusted-derived';
}

/**
 * Built-in trigger configuration. The auto-trigger fires when the
 * counted message-buffer tokens cross the threshold; manual and
 * pre-step trigger sources bypass evaluation entirely.
 *
 * @stable
 */
export interface CompactionTriggerConfig {
  readonly thresholdTokens?: number;
  readonly thresholdRatio?: number;
  /**
   * SOTA-4 reclaim-floor: defer a compaction whose predicted reclaim — the
   * older, compactable portion of the buffer (everything but the preserved
   * recent turns) — is below this many tokens. Prevents compact-thrash at the
   * threshold (paying a summarizer call to reclaim a handful of tokens). Opt-in;
   * unset / `0` ⇒ no floor (current behaviour).
   */
  readonly minReclaimTokens?: number;
}

/**
 * Strategy discriminator. The default
 * `'summarize-old-preserve-recent'` strategy invokes the
 * configured summarizer and replaces the older portion with a
 * structured 9-section summary; `'clear-old-tool-results'` (SOTA-1) is
 * a zero-LLM tier that replaces the oldest tool results with compact
 * placeholders BEFORE any summarizer call, falling back to summarize
 * only if clearing did not reclaim enough; the `'custom'` variant
 * accepts an arbitrary callable.
 *
 * @stable
 */
export type CompactionStrategy =
  | {
      readonly kind: 'summarize-old-preserve-recent';
      readonly preserveRecentTurns?: number;
      readonly summarizerModel?: ModelSpec | string;
      readonly summarizerTimeoutMs?: number;
      readonly templateName?: string;
      readonly preStep?: boolean;
    }
  | {
      /**
       * SOTA-1 zero-LLM clearing tier (Anthropic `clear_tool_uses`): replace the
       * oldest tool results with placeholders before paying for a summarizer.
       */
      readonly kind: 'clear-old-tool-results';
      /** Most-recent tool results kept verbatim (default 3). */
      readonly keepToolUses?: number;
      /** Only clear if at least this many tokens are reclaimable (default 0). */
      readonly clearAtLeast?: number;
      /** Tool names whose results are never cleared. */
      readonly excludeTools?: ReadonlyArray<string>;
      /**
       * A6 / SOTA-2 — recoverable clearing. Wire to a spill / `read_result`
       * registry: cleared content is saved behind a handle and the placeholder
       * references it so the model can re-fetch via `read_result`. Omitted ⇒ bare
       * placeholders (irrecoverable). Only fires for clears that commit.
       */
      readonly externalize?: (
        content: string,
        info: {
          readonly toolCallId: string;
          readonly toolName?: string;
          readonly clearedTokens: number;
        },
      ) => Promise<{ readonly handleId: string; readonly preview?: string }>;
      /**
       * What to do when clearing leaves the buffer over the threshold. Defaults
       * to summarizing the already-cleared buffer (so the LLM sees the reduced
       * window); set `false` for a pure zero-LLM tier that stops after clearing.
       */
      readonly summarizeFallback?:
        | false
        | {
            readonly preserveRecentTurns?: number;
            readonly summarizerModel?: ModelSpec | string;
            readonly summarizerTimeoutMs?: number;
            readonly templateName?: string;
          };
    }
  | {
      readonly kind: 'custom';
      readonly compact: (ctx: CompactionContext) => Promise<CompactionResult>;
    };

/**
 * Per-call context handed to a post-compaction hook.
 *
 * @stable
 */
export interface PostCompactionHookContext {
  readonly result: CompactionResult;
  readonly scope: SessionScope;
  readonly runId: string;
  readonly sessionId: string;
  readonly agentId: string;
  readonly source: CompactionSource;
}

/**
 * Post-compaction hook signature. Each hook returns the
 * `MessageContent[]` parts the harness should append to the
 * trimmed message buffer (re-injected Context Essentials).
 *
 * @stable
 */
export type PostCompactionHook = (
  ctx: PostCompactionHookContext,
) => Promise<ReadonlyArray<import('@graphorin/core').MessageContent>>;

/**
 * Full compaction config. Either `false` (explicitly disabled),
 * `'auto'` (resolved per-provider at warm-up) or a fully-specified
 * record.
 *
 * @stable
 */
export interface CompactionConfig {
  readonly trigger?: 'never' | CompactionTriggerConfig;
  readonly strategy?: CompactionStrategy;
  readonly postCompactionHooks?: ReadonlyArray<PostCompactionHook>;
}

/**
 * Summarizer adapter — accepts a prompt and returns the produced
 * summary. The Phase 06 `Provider` adapters implement this
 * signature; tests pass a deterministic stub. The summarizer
 * adapter is intentionally narrow so the compaction subsystem
 * does not take the heavier `Provider` dependency directly.
 *
 * @stable
 */
export interface CompactionSummarizer {
  /**
   * Produce a summary text for the supplied prompt. The prompt is
   * built by the compactor using the configured 9-section template;
   * the adapter is responsible for invoking the underlying LLM.
   */
  summarize(input: {
    readonly prompt: string;
    readonly model?: ModelSpec | string;
    readonly signal?: AbortSignal;
    readonly timeoutMs?: number;
  }): Promise<{ readonly text: string; readonly usageTokens?: number }>;
  readonly id?: string;
}
