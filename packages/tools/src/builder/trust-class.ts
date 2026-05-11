/**
 * Compute the {@link ToolTrustClass} from a tool's registration source
 * and (optionally) declared sandbox policy.
 *
 * The trust class is the load-bearing input for downstream defaults:
 *
 * - inbound sanitization policy (the per-class default matrix);
 * - truncation strategy (`'summarize'` for built-in `web_search`,
 *   `'tail'` for `code_execution`, `'middle'` everywhere else);
 * - per-step preamble selection (`<<<untrusted_content>>>` envelope
 *   wrapping is suppressed for built-in trusted tools).
 *
 * Pure function; side-effect free.
 *
 * @stable
 */

import type {
  InboundSanitizationPolicy,
  ToolSource,
  ToolTrustClass,
  TruncationStrategy,
} from '@graphorin/core';

/**
 * Resolve the trust class for a registration. The `'web-search'`
 * subsystem name is special-cased so the built-in web-search adapter
 * (when present) gets the same treatment as MCP-derived tools even
 * though it is structurally a built-in tool.
 *
 * @stable
 */
export function resolveTrustClass(source: ToolSource): ToolTrustClass {
  switch (source.kind) {
    case 'first-party':
      return 'first-party-user-defined';
    case 'built-in':
      if (source.subsystem === 'web-search') return 'web-search';
      return 'first-party-built-in';
    case 'skill':
      return source.trustLevel === 'trusted' ? 'skill-trusted' : 'skill-untrusted';
    case 'mcp':
      return 'mcp-derived';
    case 'web-search':
      return 'web-search';
  }
}

/**
 * Default inbound-sanitization policy per trust class. Operator
 * overrides via `tool({ inboundSanitization: ... })` always win.
 *
 * - `'first-party-built-in'`     → `'pass-through'` (zero overhead).
 * - `'first-party-user-defined'` → `'detect-and-flag'` (no body
 *   modification, but operator visibility is preserved).
 * - `'skill-trusted'`            → `'detect-and-flag'`.
 * - `'skill-untrusted'`          → `'detect-and-strip-and-wrap'`.
 * - `'mcp-derived'`              → `'detect-and-strip-and-wrap'`.
 * - `'web-search'`               → `'detect-and-strip-and-wrap'`.
 *
 * @stable
 */
export function defaultInboundSanitization(trustClass: ToolTrustClass): InboundSanitizationPolicy {
  switch (trustClass) {
    case 'first-party-built-in':
      return 'pass-through';
    case 'first-party-user-defined':
    case 'skill-trusted':
      return 'detect-and-flag';
    case 'skill-untrusted':
    case 'mcp-derived':
    case 'web-search':
      return 'detect-and-strip-and-wrap';
  }
}

/**
 * Default truncation strategy per trust class + tool name.
 *
 * - Built-in `web_search`     → `'summarize'`.
 * - Built-in `code_execution` → `'tail'`.
 * - Everything else           → `'middle'`.
 *
 * @stable
 */
export function defaultTruncationStrategy(
  trustClass: ToolTrustClass,
  toolName: string,
): TruncationStrategy {
  if (trustClass === 'first-party-built-in' && toolName === 'code_execution') return 'tail';
  if (trustClass === 'web-search' || toolName === 'web_search') return 'summarize';
  return 'middle';
}
