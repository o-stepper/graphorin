/**
 * Deferred-loading resolution for the `toTools()` adapter (extracted
 * from `to-tools.ts` per F-MCP-001).
 *
 * Computes the per-server effective `defer_loading` flag: when the
 * operator does not pass an explicit `defer_loading`, the auto-default
 * fires once when `listTools().length > deferLoadingThreshold` (default
 * `10`) and flips deferral on for every tool from the server. Emits the
 * retrieval counters and the once-per-server INFO log.
 *
 * @packageDocumentation
 */

import { incrementCounter } from '@graphorin/tools/audit';
import type { ServerIdentity } from '../transport/types.js';

/** Default auto-deferral threshold per the operator-facing convention. */
export const DEFAULT_DEFER_LOADING_THRESHOLD = 10;

/** Operator-supplied structured logger (mirrors the client logger shape). */
type AdapterLogger = (
  level: 'debug' | 'info' | 'warn' | 'error',
  message: string,
  fields?: Record<string, unknown>,
) => void;

/**
 * Process-scoped dedup keys for the auto-default INFO-log. Each
 * `(serverIdentity, threshold)` pair triggers the log once across all
 * `MCPClient.toTools(...)` invocations in the process so re-running
 * `toTools()` on the same client does not double-log.
 */
const autoDeferralInfoSeen = new Set<string>();

/**
 * Process-scoped dedup keys for the explicit `defer_loading: true`
 * INFO-log. Mirrors the auto-default discipline.
 */
const explicitDeferralInfoSeen = new Set<string>();

/**
 * Reset the deferral dedup sets. Used by
 * {@link import('./to-tools.js')._resetMcpAdapterDedupForTesting}.
 *
 * @experimental
 */
export function _resetDeferLoadingDedupForTesting(): void {
  autoDeferralInfoSeen.clear();
  explicitDeferralInfoSeen.clear();
}

/** Outcome of {@link resolveDeferLoading}. */
export interface DeferralResolution {
  readonly autoDeferralFired: boolean;
  readonly resolvedDeferLoading: boolean;
}

/**
 * Resolve the effective `defer_loading` flag for a server's tool
 * catalogue and emit the retrieval counters + once-per-server INFO log.
 */
export function resolveDeferLoading(args: {
  readonly serverIdentity: ServerIdentity;
  readonly toolNames: ReadonlyArray<string>;
  readonly explicitDefer: boolean | undefined;
  readonly threshold: number;
  readonly logger?: AdapterLogger;
}): DeferralResolution {
  const total = args.toolNames.length;
  const autoDeferralFired = args.explicitDefer === undefined && total > args.threshold;
  const resolvedDeferLoading = args.explicitDefer ?? autoDeferralFired;

  if (autoDeferralFired) {
    for (let i = 0; i < total; i++) {
      incrementCounter('tool.retrieval.deferred.total', { source: 'mcp-server-default' });
    }
    const dedupKey = `${args.serverIdentity.id}:${args.threshold}`;
    if (!autoDeferralInfoSeen.has(dedupKey) && args.logger !== undefined) {
      autoDeferralInfoSeen.add(dedupKey);
      args.logger('info', 'mcp.tools.defer_loading.auto-default fired', {
        server: args.serverIdentity.id,
        thresholdValue: args.threshold,
        toolCount: total,
        toolNames: [...args.toolNames],
        source: 'mcp-server-default',
      });
    }
  } else if (args.explicitDefer === true) {
    for (let i = 0; i < total; i++) {
      incrementCounter('tool.retrieval.deferred.total', { source: 'explicit' });
    }
    const dedupKey = `${args.serverIdentity.id}:explicit`;
    if (!explicitDeferralInfoSeen.has(dedupKey) && args.logger !== undefined) {
      explicitDeferralInfoSeen.add(dedupKey);
      args.logger('info', 'mcp.tools.defer_loading.explicit fired', {
        server: args.serverIdentity.id,
        toolCount: total,
        source: 'explicit',
      });
    }
  } else if (args.explicitDefer === false) {
    for (let i = 0; i < total; i++) {
      incrementCounter('tool.retrieval.eager.total', { source: 'mcp-explicit-eager' });
    }
  }

  return { autoDeferralFired, resolvedDeferLoading };
}
