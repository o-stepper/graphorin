/**
 * Inbound prompt-injection filtering for the `toTools()` adapter
 * (extracted from `to-tools.ts` per F-MCP-001).
 *
 * Owns: the per-server inbound-sanitization default, the once-per-server
 * `pass-through` override WARN, and the tool-description strip applied at
 * registration time. The trust class is pinned to `'mcp-derived'` for
 * every produced tool so the agent runtime's per-step preamble fires
 * regardless of the body-level policy chosen here.
 *
 * @packageDocumentation
 */

import type { InboundSanitizationPolicy } from '@graphorin/core';
import { incrementCounter } from '@graphorin/tools/audit';
import { applyInboundSanitization } from '@graphorin/tools/inbound';
import type { ServerIdentity } from '../transport/types.js';

/** Operator-supplied structured logger (mirrors the client logger shape). */
type AdapterLogger = (
  level: 'debug' | 'info' | 'warn' | 'error',
  message: string,
  fields?: Record<string, unknown>,
) => void;

/**
 * Process-scoped dedup keys for the `pass-through` override WARN. The
 * spec mandates exactly-one WARN per server identity per process — the
 * Set retains the keys for the lifetime of the process. Tests reset via
 * {@link import('./to-tools.js')._resetMcpAdapterDedupForTesting}.
 */
const passthroughWarnSeen = new Set<string>();

/**
 * Reset the inbound-filter dedup set. Used by
 * {@link import('./to-tools.js')._resetMcpAdapterDedupForTesting}.
 *
 * @experimental
 */
export function _resetInboundFiltersDedupForTesting(): void {
  passthroughWarnSeen.clear();
}

/**
 * Resolve the effective per-server inbound-sanitization policy. MCP
 * tools default to the strictest body-level policy.
 */
export function resolveInboundPolicy(
  override: InboundSanitizationPolicy | undefined,
): InboundSanitizationPolicy {
  return override ?? 'detect-and-strip-and-wrap';
}

/**
 * WARN-once per server when the operator opts out of body-level
 * sanitization. The trust class stays `'mcp-derived'` regardless so the
 * per-step preamble in the agent runtime still fires; the WARN exists so
 * the audit log records the operator's deliberate choice.
 */
export function warnOnPassthroughOverride(args: {
  readonly resolvedInbound: InboundSanitizationPolicy;
  readonly serverIdentity: ServerIdentity;
  readonly logger?: AdapterLogger;
}): void {
  if (args.resolvedInbound !== 'pass-through') return;
  if (passthroughWarnSeen.has(args.serverIdentity.id)) return;
  passthroughWarnSeen.add(args.serverIdentity.id);
  incrementCounter('mcp.inbound.sanitization.passthrough-override.warn.total', {
    server: args.serverIdentity.id,
  });
  if (args.logger !== undefined) {
    args.logger('warn', 'mcp.inbound.sanitization.passthrough-override', {
      server: args.serverIdentity.id,
      policy: 'pass-through',
      note: "Body-level prompt-injection sanitization is disabled for this MCP server; the trust class remains 'mcp-derived' so the per-step preamble still fires. The WARN cannot be silenced (deliberate operator-friction).",
    });
  }
}

/**
 * Strip imperative payloads from a tool description before it enters the
 * per-step tool catalogue. The description is never wrapped in the
 * `<<<untrusted_content>>>` envelope (the wrap is reserved for tool
 * result bodies emitted into the conversation history).
 */
export function sanitizeDescription(args: {
  readonly description: string;
  readonly inboundSanitization: InboundSanitizationPolicy;
  readonly toolName: string;
  readonly serverIdentity: ServerIdentity;
}): string {
  const stripPolicy: InboundSanitizationPolicy =
    args.inboundSanitization === 'pass-through' ? 'pass-through' : 'detect-and-strip';
  const outcome = applyInboundSanitization({
    body: args.description,
    policy: stripPolicy,
    trustClass: 'mcp-derived',
    toolName: args.toolName,
    contentOrigin: `mcp:tool-description:${args.serverIdentity.id}`,
    failClosed: false,
  });
  // C6: tool-description poisoning is a registration-time SIGNAL, not
  // just a silent strip — count it so operators see which server ships
  // imperative-laden descriptions (Invariant Labs tool-poisoning class).
  if (outcome.patternsHit.length > 0) {
    incrementCounter('mcp.tool-description.injection-flagged.total', {
      server: args.serverIdentity.id,
      tool: args.toolName,
    });
  }
  return outcome.body;
}
