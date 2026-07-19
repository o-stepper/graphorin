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
   * Trust classification of the produced summary.
   * `'untrusted-derived'` when the compacted window contained
   * `<<<untrusted_content>>>` envelopes or the injection heuristics
   * flagged the summarizer output - the LLM-authored summary body is
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
   * Reclaim floor: defer a compaction whose predicted reclaim - the
   * older, compactable portion of the buffer (everything but the preserved
   * recent turns) - is below this many tokens. Prevents compact-thrash at the
   * threshold (paying a summarizer call to reclaim a handful of tokens). Opt-in;
   * unset / `0` ⇒ no floor (current behaviour).
   */
  readonly minReclaimTokens?: number;
}

/**
 * Strategy discriminator. The default
 * `'summarize-old-preserve-recent'` strategy invokes the
 * configured summarizer and replaces the older portion with a
 * structured section summary; `'clear-old-tool-results'` is
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
      /**
       * Character budget for the older-messages dump embedded in the
       * summarizer prompt. Without a cap the
       * single-shot prompt carries the ENTIRE older window (~85% of the
       * main model's window at default thresholds) and overflows any
       * smaller `summarizerModel` - the failure is swallowed, so the
       * run silently never compacts. When the dump exceeds the budget
       * the OLDEST messages are elided (a marker notes how many) and
       * the newest are kept verbatim. Default 96_000 chars (~24k
       * tokens); lower it for small summarizer models; `0` disables.
       */
      readonly summarizerInputCharBudget?: number;
      /**
       * Keep the most recent N USER messages from the summarized
       * window verbatim (re-inserted between the summary and the
       * preserved tail) - only assistant/tool content is summarized
       * away. User words are the task statement; paraphrase loses
       * constraints. Default `2`; `0` disables.
       */
      readonly preserveUserMessages?: number;
    }
  | {
      /**
       * Zero-LLM clearing tier (Anthropic `clear_tool_uses`): replace the
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
       * Parity with `clear_tool_uses_20250919`: additionally blank the
       * PAIRED assistant tool-call arguments when a result is cleared,
       * reclaiming the input side of verbose calls too. Default `false`.
       */
      readonly clearToolInputs?: boolean;
      /**
       * The retrieval tool the externalized-handle
       * placeholder advertises. Pass `null` when the runtime does not
       * register `read_result` so the placeholder never promises a tool
       * the model cannot call. Default `'read_result'`.
       */
      readonly readResultToolName?: string | null;
      /**
       * Recoverable clearing. Wire to a spill / `read_result`
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
  /**
   * The messages this compaction dropped (summarized away /
   * cleared), in original order. Lets re-anchoring hooks recover
   * references - e.g. `reanchorRecentResults` re-lists the result
   * handles that just left the window.
   */
  readonly droppedMessages?: ReadonlyArray<Message>;
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
 * Per-call context handed to a PRE-compaction hook -
 * fired BEFORE the summarizer runs, while the full buffer is still
 * available. This is the seam the built-in `memoryFlushHook` uses to
 * salvage durable facts from content that is about to be summarized
 * away.
 *
 * @stable
 */
export interface PreCompactionHookContext {
  readonly scope: SessionScope;
  readonly runId: string;
  readonly sessionId: string;
  readonly agentId: string;
  readonly source: CompactionSource;
  /**
   * The full pre-compaction buffer (what the summarizer is about to
   * operate on) - the model-visible messages, i.e. post-guardrail
   * content, never the raw blocked turns.
   */
  readonly messages: ReadonlyArray<Message>;
}

/**
 * Pre-compaction hook signature. Side-effect only - a
 * pre-hook cannot alter what gets compacted; a throwing hook is
 * recorded in `hookFailures` and never blocks the compaction.
 *
 * @stable
 */
export type PreCompactionHook = (ctx: PreCompactionHookContext) => Promise<void>;

/**
 * Named pre-compaction hook (built-in form): receives the shared hook
 * deps (memory handle, scope, privacy filter) plus the pre-compaction
 * context. Mirrors `NamedPostCompactionHook`.
 *
 * @stable
 */
export interface NamedPreCompactionHook {
  readonly id: string;
  run(
    deps: {
      readonly memory: import('../../memory-interface.js').Memory;
      readonly scope: SessionScope;
      readonly allowSensitivity?: (
        sensitivity: import('@graphorin/core').Sensitivity | undefined,
      ) => boolean;
    },
    ctx: PreCompactionHookContext,
  ): Promise<void>;
}

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
  /**
   * Pre-compaction hooks: fired before the summarizer,
   * with the full buffer in context. Default: none - the built-in
   * `memoryFlushHook` is opt-in. Accepts plain functions or named
   * hooks.
   */
  readonly preCompactionHooks?: ReadonlyArray<PreCompactionHook | NamedPreCompactionHook>;
}

/**
 * Summarizer adapter - accepts a prompt and returns the produced
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
   * built by the compactor using the configured section template;
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
