/**
 * Zero-LLM tool-result clearing - the cheapest pre-compaction tier.
 *
 * Mirrors Anthropic context editing (`clear_tool_uses_20250919`): when the
 * buffer crosses the compaction threshold, replace the oldest tool results with
 * a compact placeholder BEFORE paying for a summarizer LLM call. The most recent
 * `keepToolUses` results stay verbatim, `excludeTools` are never touched, and
 * clearing is skipped entirely when it would reclaim fewer than `clearAtLeast`
 * tokens (not worth the context churn). Pure + deterministic - no provider call.
 *
 * @packageDocumentation
 */

import type { Message, ToolMessage } from '@graphorin/core';
import {
  type ContextTokenCounter,
  countMessageTokens,
  renderMessageText,
} from '../token-counter.js';

/** Placeholder prefix on a cleared tool result - makes clearing idempotent. */
export const CLEARED_TOOL_RESULT_MARKER = '[cleared tool result';

/** Default count of most-recent tool results kept verbatim. */
export const DEFAULT_KEEP_TOOL_USES = 3;

/** Knobs for {@link clearOldToolResults} (mirrors the strategy variant). */
export interface ClearToolResultsOptions {
  /** Most-recent tool results kept verbatim (default `DEFAULT_KEEP_TOOL_USES`). */
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
  /**
   * Recoverable clearing. When provided, the original tool-result
   * text of each cleared message is handed to this callback (wire it to a spill
   * store / the `read_result` handle registry) and the placeholder references the
   * returned handle id + preview, so the model can re-fetch the full result via
   * `read_result` rather than losing it. Invoked only for clears that actually
   * commit (after the `clearAtLeast` floor), so a rejected clearing never spills.
   * Omitted ⇒ the bare `placeholder` (irrecoverable, byte-identical default).
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
   * The tool the externalized-handle placeholder
   * advertises. The memory package cannot know whether the agent
   * registered `read_result` (that depends on spill wiring), so callers
   * whose runtime does NOT expose it pass `null` and the placeholder
   * degrades to a tool-neutral phrasing instead of promising a tool the
   * model cannot call. Default `'read_result'` (the agent built-in).
   */
  readonly readResultToolName?: string | null;
  /**
   * Parity with `clear_tool_uses_20250919`: additionally blank the PAIRED
   * assistant message's tool-call arguments for every cleared result,
   * reclaiming the input side of verbose calls too. Default `false`.
   */
  readonly clearToolInputs?: boolean;
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

/** A placeholder that points at the externalized handle (recoverable via read_result). */
function handlePlaceholder(info: {
  toolName?: string;
  clearedTokens: number;
  handleId: string;
  preview?: string;
  readToolName?: string | null;
}): string {
  const preview = info.preview !== undefined && info.preview.length > 0 ? ` · ${info.preview}` : '';
  // C4 (context-engine-11): only advertise a retrieval tool the caller
  // vouches exists; `null` degrades to a tool-neutral phrasing.
  const retrieval =
    info.readToolName === null
      ? `full result externalized to handle: ${info.handleId}`
      : `full result via ${info.readToolName ?? 'read_result'} handle: ${info.handleId}`;
  return `${CLEARED_TOOL_RESULT_MARKER} · ${info.toolName ?? 'tool'} · ${info.clearedTokens} tokens · ${retrieval}${preview}]`;
}

function isAlreadyCleared(content: Message['content']): boolean {
  return typeof content === 'string' && content.startsWith(CLEARED_TOOL_RESULT_MARKER);
}

/**
 * Replace the oldest clearable tool results with placeholders. Returns the new
 * buffer (same length - content is replaced in place, never removed) plus the
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
  const clearedTokensByIdx = new Map<number, number>();
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
    clearedTokensByIdx.set(idx, originalTokens);
  }

  const clearAtLeast = options.clearAtLeast ?? 0;
  if (replacements.size === 0 || reclaimable < clearAtLeast) {
    return { messages, clearedIndices: [], reclaimedTokens: 0 };
  }

  // A6: only now that the clearing commits, externalize each cleared result to a
  // recoverable handle and rewrite its placeholder to reference it. Skipped
  // clears (above) never reach here, so the spill never fires for nothing.
  const externalize = options.externalize;
  if (externalize !== undefined) {
    for (const idx of replacements.keys()) {
      const tm = messages[idx] as ToolMessage;
      const name = toolNameById.get(tm.toolCallId);
      const clearedTokens = clearedTokensByIdx.get(idx) ?? 0;
      const content = typeof tm.content === 'string' ? tm.content : renderMessageText(tm);
      const handle = await externalize(content, {
        toolCallId: tm.toolCallId,
        ...(name !== undefined ? { toolName: name } : {}),
        clearedTokens,
      });
      replacements.set(idx, {
        role: 'tool',
        toolCallId: tm.toolCallId,
        content: handlePlaceholder({
          ...(name !== undefined ? { toolName: name } : {}),
          clearedTokens,
          handleId: handle.handleId,
          ...(handle.preview !== undefined ? { preview: handle.preview } : {}),
          ...(options.readResultToolName !== undefined
            ? { readToolName: options.readResultToolName }
            : {}),
        }),
      });
    }
  }

  let out: Message[] = messages.map((m, i) => replacements.get(i) ?? m);

  // C4 (clear_tool_uses parity): blank the paired assistant tool-call
  // ARGUMENTS for every cleared result. The call's name and id survive
  // (the transcript stays well-formed); only the argument payload is
  // replaced with a marker object.
  if (options.clearToolInputs === true && replacements.size > 0) {
    const clearedCallIds = new Set<string>();
    for (const idx of replacements.keys()) {
      const tm = messages[idx] as ToolMessage;
      clearedCallIds.add(tm.toolCallId);
    }
    out = out.map((m) => {
      if (m.role !== 'assistant' || m.toolCalls === undefined) return m;
      if (!m.toolCalls.some((tc) => clearedCallIds.has(tc.toolCallId))) return m;
      return {
        ...m,
        toolCalls: m.toolCalls.map((tc) =>
          clearedCallIds.has(tc.toolCallId)
            ? { ...tc, args: { cleared: '[tool input elided by context clearing]' } }
            : tc,
        ),
      };
    });
  }

  return {
    messages: out,
    clearedIndices: [...replacements.keys()],
    reclaimedTokens: reclaimable,
  };
}
