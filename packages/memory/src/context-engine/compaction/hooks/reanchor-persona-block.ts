/**
 * `reanchorPersonaBlock({ blockLabel = 'persona' })` — built-in
 * post-compaction hook. Queries `memory.working.read(...)` for the
 * persona block and returns it as a system-content fragment for
 * re-injection.
 *
 * @packageDocumentation
 */

import type { MessageContent } from '@graphorin/core';
import type { HookDeps, NamedPostCompactionHook } from './types.js';

/**
 * Build a `reanchorPersonaBlock` hook.
 *
 * @stable
 */
export function reanchorPersonaBlock(
  options: { readonly blockLabel?: string } = {},
): NamedPostCompactionHook {
  const blockLabel = options.blockLabel ?? 'persona';
  return {
    id: 'reanchorPersonaBlock',
    async resolveContent(deps: HookDeps): Promise<ReadonlyArray<MessageContent>> {
      const value = await deps.memory.working.read(deps.scope, blockLabel);
      if (value === null || value.length === 0) return [];
      return [
        {
          type: 'text',
          text: `<memory_blocks anchor="post-compaction">\n  <block label="${escapeXml(blockLabel)}">\n    ${escapeXml(value)}\n  </block>\n</memory_blocks>`,
        },
      ];
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
