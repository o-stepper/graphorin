/**
 * `reanchorProjectRules({ ruleTagsAllowlist? })` — built-in
 * post-compaction hook. Queries `memory.procedural.activate(...)`
 * and returns the active rule set as a system-content fragment for
 * re-injection into the trimmed buffer.
 *
 * @packageDocumentation
 */

import type { MessageContent } from '@graphorin/core';
import type { HookDeps, NamedPostCompactionHook } from './types.js';

/**
 * Build a `reanchorProjectRules` hook.
 *
 * @stable
 */
export function reanchorProjectRules(
  options: { readonly ruleTagsAllowlist?: ReadonlyArray<string> } = {},
): NamedPostCompactionHook {
  const allowlist =
    options.ruleTagsAllowlist !== undefined ? new Set(options.ruleTagsAllowlist) : null;
  return {
    id: 'reanchorProjectRules',
    async resolveContent(deps: HookDeps): Promise<ReadonlyArray<MessageContent>> {
      const procedural = deps.procedural ?? {};
      const rules = await deps.memory.procedural.activate(deps.scope, procedural);
      const filtered =
        allowlist === null
          ? rules
          : rules.filter((rule) => (rule.tags ?? []).some((tag) => allowlist.has(tag)));
      if (filtered.length === 0) return [];
      const lines = ['<memory_rules anchor="post-compaction">'];
      for (const rule of filtered) {
        lines.push(
          `  <rule priority="${rule.priority}" tags="${escapeXml((rule.tags ?? []).join(','))}">${escapeXml(rule.text)}</rule>`,
        );
      }
      lines.push('</memory_rules>');
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
