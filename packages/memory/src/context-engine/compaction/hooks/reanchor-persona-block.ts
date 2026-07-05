/**
 * `reanchorPersonaBlock({ blockLabel = 'persona' })` - built-in
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
      // context-engine-02: the D2 privacy filter gates re-anchored content
      // exactly as it gates the assembled prompt - a secret-tier persona
      // block the assembly withheld must not ship to the provider via the
      // post-compaction splice. `read()` returns only the value, so the
      // sensitivity comes from the block listing; a block absent from the
      // listing (unwritten, default-value fallback) is evaluated at the
      // engine's default sensitivity.
      if (deps.allowSensitivity !== undefined) {
        const blocks = await deps.memory.working.list(deps.scope);
        const block = blocks.find((b) => b.label === blockLabel);
        if (!deps.allowSensitivity(block?.sensitivity)) return [];
      }
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
