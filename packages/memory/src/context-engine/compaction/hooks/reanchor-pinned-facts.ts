/**
 * `reanchorPinnedFacts({ pinnedFactIds, maxTokens })` - built-in
 * post-compaction hook. Looks up the explicitly-pinned fact IDs
 * via `memory.semantic.get(...)` and returns them as a
 * system-content fragment with their tags.
 *
 * @packageDocumentation
 */

import type { MessageContent } from '@graphorin/core';
import { type ContextTokenCounter, HEURISTIC_TOKEN_COUNTER } from '../../token-counter.js';
import type { HookDeps, NamedPostCompactionHook } from './types.js';

/**
 * Build a `reanchorPinnedFacts` hook.
 *
 * @stable
 */
export function reanchorPinnedFacts(options: {
  readonly pinnedFactIds: ReadonlyArray<string>;
  readonly maxTokens?: number;
  readonly tokenCounter?: ContextTokenCounter;
}): NamedPostCompactionHook {
  const ids = options.pinnedFactIds;
  const maxTokens = Math.max(0, options.maxTokens ?? 2000);
  const counter = options.tokenCounter ?? HEURISTIC_TOKEN_COUNTER;
  return {
    id: 'reanchorPinnedFacts',
    async resolveContent(deps: HookDeps): Promise<ReadonlyArray<MessageContent>> {
      if (ids.length === 0) return [];
      const lines = ['<memory_pinned_facts anchor="post-compaction">'];
      let runningTokens = 0;
      for (const id of ids) {
        const fact = await deps.memory.semantic.get(deps.scope, id).catch(() => null);
        if (fact === null || fact.deletedAt !== undefined) continue;
        // context-engine-02: pinning is not a privacy override - a
        // secret-tier fact the D2 filter withholds from the assembled
        // prompt must not re-enter via the post-compaction splice.
        if (deps.allowSensitivity !== undefined && !deps.allowSensitivity(fact.sensitivity)) {
          continue;
        }
        const tagBlob =
          fact.tags !== undefined ? ` tags="${escapeXml((fact.tags ?? []).join(','))}"` : '';
        const fragment = `  <fact id="${escapeXml(fact.id)}"${tagBlob}>${escapeXml(fact.text)}</fact>`;
        const fragmentTokens = await counter.countText(fragment);
        if (maxTokens > 0 && runningTokens + fragmentTokens > maxTokens) {
          lines.push('  <!-- additional pinned facts truncated to fit budget -->');
          break;
        }
        runningTokens += fragmentTokens;
        lines.push(fragment);
      }
      if (lines.length === 1) return [];
      lines.push('</memory_pinned_facts>');
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
