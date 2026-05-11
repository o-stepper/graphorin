/**
 * `classifyTool(...)` — derive the memory-guard tier for a tool /
 * skill / mcp invocation per DEC-153.
 *
 * The classifier is **structural** — it inspects:
 *
 * 1. An explicit `memoryGuardTier` field (operator opt-in).
 * 2. The trust level of the source (`'untrusted'` is decisive).
 * 3. Tags and the per-tool ACL (heuristic for `'memory-aware'`).
 *
 * The algorithm is short and deterministic; it intentionally avoids
 * runtime probing so the classification is cheap to recompute.
 *
 * @packageDocumentation
 */

import type { MemoryGuardTier } from './types.js';

/**
 * Subset of the `Tool` shape the classifier needs. Decoupled from
 * `@graphorin/core`'s `Tool` type so the classifier can also work on
 * the lighter shapes the skills loader produces.
 *
 * @stable
 */
export interface ClassifiableTool {
  readonly name?: string;
  readonly tags?: ReadonlyArray<string>;
  /** Per-tool ACL declared by `tool({ secretsAllowed })`. */
  readonly secretsAllowed?: ReadonlyArray<string>;
  /** Operator opt-in tier override. */
  readonly memoryGuardTier?: MemoryGuardTier;
  /** Source trust level — `'untrusted'` forces the strict tier. */
  readonly trustLevel?: 'built-in' | 'user-defined' | 'trusted' | 'untrusted';
}

/**
 * Set of regex patterns that hint at memory-related tools. The list
 * is intentionally short and English-language; deployments that need
 * locale-specific tagging should set `memoryGuardTier` explicitly.
 *
 * @stable
 */
export const DEFAULT_MEMORY_TAG_PATTERNS: ReadonlyArray<RegExp> = Object.freeze([
  /^memory$/i,
  /^memory[:.\-_].*/i,
  /^remember$/i,
  /^recall$/i,
  /^fact[s]?$/i,
]);

/**
 * Classify a tool. Pure function — never inspects runtime state.
 *
 * Precedence (top wins):
 *   1. Operator-set `memoryGuardTier`.
 *   2. `trustLevel === 'untrusted'` → `'untrusted'`.
 *   3. Tags or `secretsAllowed` mention memory → `'memory-aware'`.
 *   4. Default → `'unknown'`.
 *
 * @stable
 */
export function classifyTool(
  tool: ClassifiableTool,
  patterns: ReadonlyArray<RegExp> = DEFAULT_MEMORY_TAG_PATTERNS,
): MemoryGuardTier {
  if (tool.memoryGuardTier !== undefined) return tool.memoryGuardTier;
  if (tool.trustLevel === 'untrusted') return 'untrusted';
  if (looksMemoryAware(tool, patterns)) return 'memory-aware';
  return 'unknown';
}

function looksMemoryAware(tool: ClassifiableTool, patterns: ReadonlyArray<RegExp>): boolean {
  for (const tag of tool.tags ?? []) {
    if (patterns.some((p) => p.test(tag))) return true;
  }
  for (const key of tool.secretsAllowed ?? []) {
    if (patterns.some((p) => p.test(key))) return true;
  }
  if (tool.name !== undefined && patterns.some((p) => p.test(tool.name as string))) {
    return true;
  }
  return false;
}
