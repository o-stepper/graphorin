/**
 * `reanchorRecentResults({ ... })` — C4 post-compaction hook.
 *
 * A compaction routinely summarizes away tool results the model was
 * actively working from; the summary paraphrases them and the handles
 * vanish. This hook scans the DROPPED messages for result handles (the
 * agent's spill hint and the clearing tier's placeholder both embed
 * them), keeps the most recent `maxResults`, optionally re-reads a
 * bounded preview for each via the caller-supplied `readPreview`, and
 * re-injects a `<recent_results>` block under a character budget so the
 * model can pick its working set back up via `read_result` instead of
 * re-running tools. (Claude Code re-reads recently-accessed files after
 * compaction for the same reason.)
 *
 * @packageDocumentation
 */

import type { MessageContent } from '@graphorin/core';
import type { HookDeps, NamedPostCompactionHook } from './types.js';

/** The agent's inline spill hint: `Call read_result with handle "<uri>"`. */
const SPILL_HINT_RE = /read_result with handle "([^"]+)"/g;
/** The clearing tier's placeholder: `via read_result handle: <id>`. */
const CLEARED_HANDLE_RE = /via read_result handle: ([^\s\]·]+)/g;

/** Options for {@link reanchorRecentResults}. */
export interface ReanchorRecentResultsOptions {
  /** Most-recent distinct handles re-anchored. Default `3`. */
  readonly maxResults?: number;
  /** Character budget for the whole injected block. Default `4000`. */
  readonly maxChars?: number;
  /**
   * Optional preview resolver — wire it to the runtime's result reader
   * (e.g. an adapter over the agent's spill reader). Returns the preview
   * text or `null` when the handle cannot be read; failures are treated
   * as `null`. Without it the hook lists the handles alone, which is
   * still enough for the model to `read_result` them on demand.
   */
  readonly readPreview?: (uri: string) => Promise<string | null>;
}

/**
 * Build a `reanchorRecentResults` hook (C4).
 *
 * @stable
 */
export function reanchorRecentResults(
  options: ReanchorRecentResultsOptions = {},
): NamedPostCompactionHook {
  const maxResults = Math.max(1, options.maxResults ?? 3);
  const maxChars = Math.max(0, options.maxChars ?? 4000);
  return {
    id: 'reanchorRecentResults',
    async resolveContent(
      _deps: HookDeps,
      ctx?: import('../types.js').PostCompactionHookContext,
    ): Promise<ReadonlyArray<MessageContent>> {
      const dropped = ctx?.droppedMessages;
      if (dropped === undefined || dropped.length === 0) return [];

      // Collect handles newest-first (scan the dropped slice backwards);
      // dedupe on the handle string.
      const handles: string[] = [];
      const seen = new Set<string>();
      for (let i = dropped.length - 1; i >= 0 && handles.length < maxResults; i -= 1) {
        const msg = dropped[i];
        if (msg?.role !== 'tool' || typeof msg.content !== 'string') continue;
        for (const re of [SPILL_HINT_RE, CLEARED_HANDLE_RE]) {
          re.lastIndex = 0;
          let match = re.exec(msg.content);
          while (match !== null && handles.length < maxResults) {
            const uri = match[1];
            if (uri !== undefined && !seen.has(uri)) {
              seen.add(uri);
              handles.push(uri);
            }
            match = re.exec(msg.content);
          }
        }
      }
      if (handles.length === 0) return [];

      const lines = ['<recent_results anchor="post-compaction">'];
      let used = lines[0]?.length ?? 0;
      for (const uri of handles) {
        let entry = `  <result handle="${escapeXml(uri)}" note="re-read via read_result" />`;
        if (options.readPreview !== undefined) {
          const preview = await options.readPreview(uri).catch(() => null);
          if (preview !== null && preview.length > 0) {
            const remaining = maxChars - used - entry.length;
            const bounded = preview.slice(0, Math.max(0, Math.min(preview.length, remaining)));
            if (bounded.length > 0) {
              entry = `  <result handle="${escapeXml(uri)}">${escapeXml(bounded)}</result>`;
            }
          }
        }
        if (maxChars > 0 && used + entry.length > maxChars) {
          lines.push('  <!-- additional recent results truncated to fit budget -->');
          break;
        }
        used += entry.length;
        lines.push(entry);
      }
      lines.push('</recent_results>');
      return [{ type: 'text', text: lines.join('\n') }];
    },
  };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
