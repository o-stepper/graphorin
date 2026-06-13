/**
 * SOTA-1: zero-LLM tool-result clearing — the cheapest pre-compaction tier.
 *
 * Mirrors Anthropic context editing (`clear_tool_uses_20250919`): when the
 * buffer crosses the compaction threshold, replace the oldest tool results with
 * a compact placeholder BEFORE paying for a summarizer LLM call. The most recent
 * `keepToolUses` results stay verbatim, `excludeTools` are never touched, and
 * clearing is skipped entirely when it would reclaim fewer than `clearAtLeast`
 * tokens (not worth the context churn). Pure + deterministic — no provider call.
 *
 * @packageDocumentation
 */

import type { Message, ToolMessage } from '@graphorin/core';
import { type ContextTokenCounter, countMessageTokens } from '../token-counter.js';

/** Placeholder prefix on a cleared tool result — makes clearing idempotent. */
export const CLEARED_TOOL_RESULT_MARKER = '[cleared tool result';

/** Default count of most-recent tool results kept verbatim. */
export const DEFAULT_KEEP_TOOL_USES = 3;

/** Knobs for {@link clearOldToolResults} (mirrors the strategy variant). */
export interface ClearToolResultsOptions {
  /** Most-recent tool results kept verbatim (default {@link DEFAULT_KEEP_TOOL_USES}). */
  readonly keepToolUses?: number;
  /** Only clear if at least this many tokens are reclaimable; else leave untouched (default 0). */
  readonly clearAtLeast?: number;
  /** Tool names whose results are never cleared. */
  readonly excludeTools?: ReadonlyArray<string>;
  /** Placeholder builder; defaults to a one-line `[cleared tool result …]` marker. */
  readonly placeholder?: (info: {
    readonly toolCallId: string;
    readonly toolName?: string;
    readonly clearedTokens: number;
  }) => string;
}

/** Result of a clearing pass. `clearedIndices` empty ⇒ nothing changed. */
export interface ClearToolResultsOutcome {
  readonly messages: ReadonlyArray<Message>;
  readonly clearedIndices: ReadonlyArray<number>;
  readonly reclaimedTokens: number;
}

function defaultPlaceholder(info: { toolName?: string; clearedTokens: number }): string {
  return `${CLEARED_TOOL_RESULT_MARKER} · ${info.toolName ?? 'tool'} · ${info.clearedTokens} tokens elided · re-run the tool if needed]`;
}

function isAlreadyCleared(content: Message['content']): boolean {
  return typeof content === 'string' && content.startsWith(CLEARED_TOOL_RESULT_MARKER);
}

/**
 * Replace the oldest clearable tool results with placeholders. Returns the new
 * buffer (same length — content is replaced in place, never removed) plus the
 * cleared indices and reclaimed token count. Idempotent: already-cleared
 * placeholders are skipped on a second pass.
 */
export async function clearOldToolResults(
  messages: ReadonlyArray<Message>,
  options: ClearToolResultsOptions,
  counter: ContextTokenCounter,
): Promise<ClearToolResultsOutcome> {
  const keep = options.keepToolUses ?? DEFAULT_KEEP_TOOL_USES;
  const exclude = new Set(options.excludeTools ?? []);
  const placeholder = options.placeholder ?? defaultPlaceholder;

  // toolCallId → toolName from every assistant tool-call in the buffer.
  const toolNameById = new Map<string, string>();
  for (const m of messages) {
    if (m.role === 'assistant' && m.toolCalls) {
      for (const tc of m.toolCalls) toolNameById.set(tc.toolCallId, tc.toolName);
    }
  }

  // Indices of all not-yet-cleared tool-result messages, oldest first.
  const toolIdx: number[] = [];
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (m?.role === 'tool' && !isAlreadyCleared(m.content)) toolIdx.push(i);
  }

  // Keep the most-recent `keep`; older ones are candidates unless excluded.
  const keptCutoff = toolIdx.length - Math.max(0, keep);
  const replacements = new Map<number, ToolMessage>();
  let reclaimable = 0;
  for (let j = 0; j < toolIdx.length && j < keptCutoff; j++) {
    const idx = toolIdx[j];
    if (idx === undefined) continue;
    const tm = messages[idx] as ToolMessage;
    const name = toolNameById.get(tm.toolCallId);
    if (name !== undefined && exclude.has(name)) continue;
    const originalTokens = await countMessageTokens([tm], counter);
    const replaced: ToolMessage = {
      role: 'tool',
      toolCallId: tm.toolCallId,
      content: placeholder({
        toolCallId: tm.toolCallId,
        ...(name !== undefined ? { toolName: name } : {}),
        clearedTokens: originalTokens,
      }),
    };
    const placeholderTokens = await countMessageTokens([replaced], counter);
    reclaimable += Math.max(0, originalTokens - placeholderTokens);
    replacements.set(idx, replaced);
  }

  const clearAtLeast = options.clearAtLeast ?? 0;
  if (replacements.size === 0 || reclaimable < clearAtLeast) {
    return { messages, clearedIndices: [], reclaimedTokens: 0 };
  }

  const out = messages.map((m, i) => replacements.get(i) ?? m);
  return {
    messages: out,
    clearedIndices: [...replacements.keys()],
    reclaimedTokens: reclaimable,
  };
}
