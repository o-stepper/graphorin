/**
 * `toTools()` adapter - bridges MCP tool descriptors into the
 * Graphorin tool registry.
 *
 * The adapter orchestrates three extracted concerns (F-MCP-001):
 *
 * 1. Filters / namespaces the `listTools()` output, then resolves the
 *    per-server effective `defer_loading` flag - see
 *    {@link import('./defer-loading.js').resolveDeferLoading}.
 * 2. Resolves the per-server inbound prompt-injection policy and strips
 *    imperative payloads from each description - see
 *    {@link import('./inbound-filters.js')}.
 * 3. Converts each MCP tool into a strongly-typed Graphorin `Tool` whose
 *    `execute(...)` calls back into {@link MCPClient.callTool} and adapts
 *    the result - see {@link import('./adapt-result.js').adaptCallResult}.
 *
 * The trust class is pinned to `'mcp-derived'` so the agent runtime's
 * per-step preamble fires regardless of the body-level policy.
 *
 * @packageDocumentation
 */

import type { ContentChunk, InboundSanitizationPolicy, Tool, ToolReturn } from '@graphorin/core';
import { buildJsonSchemaValidator, type JsonSchemaLike } from '../registry/json-schema.js';
import type { ServerIdentity } from '../transport/types.js';
import { adaptCallResult } from './adapt-result.js';
import {
  _resetDeferLoadingDedupForTesting,
  DEFAULT_DEFER_LOADING_THRESHOLD,
  resolveDeferLoading,
} from './defer-loading.js';
import {
  _resetInboundFiltersDedupForTesting,
  resolveInboundPolicy,
  sanitizeDescription,
  sanitizeSchemaAnnotations,
  warnOnPassthroughOverride,
} from './inbound-filters.js';
import { computeToolDefinitionHash } from './pinning.js';
import type { MCPClient, MCPToolDefinition, MCPToToolsOptions } from './types.js';

// Re-exported for backward compatibility: callers (and tests) import
// these symbols directly from `./to-tools.js` and via the client barrel.
export { adaptCallResult } from './adapt-result.js';
export { DEFAULT_DEFER_LOADING_THRESHOLD } from './defer-loading.js';

/**
 * Reset every process-scoped dedup set owned by the adapter modules.
 * Used by tests.
 *
 * @experimental
 */
export function _resetMcpAdapterDedupForTesting(): void {
  _resetDeferLoadingDedupForTesting();
  _resetInboundFiltersDedupForTesting();
}

/** Result returned by {@link adaptMCPTools}. */
export interface AdaptedToolsResult {
  readonly tools: ReadonlyArray<Tool>;
  /** sha256 definition fingerprint per MCP tool name. */
  readonly fingerprints: ReadonlyMap<string, string>;
  readonly autoDeferralFired: boolean;
  readonly resolvedDeferLoading: boolean;
  readonly resolvedInboundSanitization: InboundSanitizationPolicy;
  readonly toolCount: number;
  readonly deferralThreshold: number;
  /**
   * Tool names the operator downgraded below the sink classes
   * via `sideEffectClassByTool` (`'read-only'` / `'pure'`). Each such
   * tool leaves EVERY sink check - the dataflow gate, the Rule-of-Two
   * writer forbid, the read-only capability gate - so operator audits
   * should review this list. Empty when no override downgrades.
   */
  readonly downgradedTools: ReadonlyArray<string>;
}

/**
 * Build the {@link Tool} array for the supplied MCP tool catalogue.
 *
 * @stable
 */
export function adaptMCPTools(args: {
  readonly client: MCPClient;
  readonly serverIdentity: ServerIdentity;
  readonly catalogue: ReadonlyArray<MCPToolDefinition>;
  readonly options?: MCPToToolsOptions;
  readonly logger?: (
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    fields?: Record<string, unknown>,
  ) => void;
}): AdaptedToolsResult {
  const opts = args.options ?? {};
  const fingerprints = new Map<string, string>();
  const filter = opts.filter;
  const namespace = (opts.namespace ?? '').trim();
  const filtered = filter === undefined ? args.catalogue : args.catalogue.filter((t) => filter(t));
  const total = filtered.length;
  const threshold = opts.deferLoadingThreshold ?? DEFAULT_DEFER_LOADING_THRESHOLD;

  const { autoDeferralFired, resolvedDeferLoading } = resolveDeferLoading({
    serverIdentity: args.serverIdentity,
    toolNames: filtered.map((t) => t.name),
    explicitDefer: opts.defer_loading,
    threshold,
    ...(args.logger === undefined ? {} : { logger: args.logger }),
  });

  const resolvedInbound = resolveInboundPolicy(opts.inboundSanitization);
  warnOnPassthroughOverride({
    resolvedInbound,
    serverIdentity: args.serverIdentity,
    ...(args.logger === undefined ? {} : { logger: args.logger }),
  });

  const tools: Tool[] = [];
  const downgradedTools: string[] = [];
  for (const definition of filtered) {
    const namespacedName =
      namespace.length === 0 ? definition.name : `${namespace}.${definition.name}`;
    const sideEffectClass = opts.sideEffectClassByTool?.[namespacedName] ?? 'external-stateful';
    // W-105: a downgrade below the sink classes is an explicit operator
    // trust decision with wide consequences - the tool leaves every sink
    // check (dataflow gate, Rule-of-Two writer forbid, read-only
    // capability gate). One WARN per tool at adaptation time + a result
    // field so audits can pick it up; the server's own readOnlyHint is
    // deliberately never trusted for this.
    if (sideEffectClass === 'read-only' || sideEffectClass === 'pure') {
      downgradedTools.push(namespacedName);
      args.logger?.(
        'warn',
        `mcp.tools.side-effect-downgraded: operator override classifies '${namespacedName}' as '${sideEffectClass}' - the tool leaves every sink check (dataflow gate, Rule-of-Two writer forbid, read-only capability gate)`,
        {
          server: args.serverIdentity.id,
          tool: namespacedName,
          sideEffectClass,
        },
      );
    }
    const preferredModel = opts.preferredModelByTool?.[namespacedName];
    // W-018: strip imperative payloads from schema ANNOTATIONS
    // (description / title / $comment / string examples at any depth -
    // the Invariant Labs tool-poisoning hiding place) before the
    // schema reaches the validator, whose `toJSON()` is what the
    // provider wire and `tool_search` re-expose.
    const sanitizedInput = sanitizeSchemaAnnotations({
      schema: definition.inputSchema as JsonSchemaLike,
      inboundSanitization: resolvedInbound,
      toolName: namespacedName,
      serverIdentity: args.serverIdentity,
    });
    const sanitizedOutput =
      definition.outputSchema === undefined
        ? undefined
        : sanitizeSchemaAnnotations({
            schema: definition.outputSchema as JsonSchemaLike,
            inboundSanitization: resolvedInbound,
            toolName: namespacedName,
            serverIdentity: args.serverIdentity,
          });
    const inputValidator = buildJsonSchemaValidator(sanitizedInput.schema);
    const outputValidator =
      sanitizedOutput === undefined ? undefined : buildJsonSchemaValidator(sanitizedOutput.schema);
    // TOFU invariant (MC-6): the fingerprint hashes the RAW definition,
    // never the sanitized copy. Hashing redacted bytes would invalidate
    // the pins of existing deployments AND collapse two
    // differently-poisoned schemas into one redacted hash, hiding drift.
    // `sanitizeSchemaAnnotations` returns a clone and never mutates
    // `definition`, so the order here is belt-and-braces.
    const definitionHash = computeToolDefinitionHash(definition);
    fingerprints.set(definition.name, definitionHash);
    tools.push(
      buildAdaptedTool({
        client: args.client,
        serverIdentity: args.serverIdentity,
        definitionHash,
        ...(args.logger !== undefined ? { logger: args.logger } : {}),
        mcpToolName: definition.name,
        graphorinToolName: namespacedName,
        description:
          definition.description.length === 0 ? `${definition.name} (MCP)` : definition.description,
        inputSchema: inputValidator,
        outputSchema: outputValidator,
        defer_loading: resolvedDeferLoading,
        inboundSanitization: resolvedInbound,
        sideEffectClass,
        ...(opts.maxResultTokens === undefined ? {} : { maxResultTokens: opts.maxResultTokens }),
        ...(opts.truncationStrategy === undefined
          ? {}
          : { truncationStrategy: opts.truncationStrategy }),
        ...(opts.callTimeoutMs === undefined ? {} : { callTimeoutMs: opts.callTimeoutMs }),
        ...(preferredModel === undefined ? {} : { preferredModel }),
      }),
    );
  }

  return Object.freeze({
    tools: Object.freeze(tools),
    fingerprints,
    autoDeferralFired,
    resolvedDeferLoading,
    resolvedInboundSanitization: resolvedInbound,
    toolCount: total,
    deferralThreshold: threshold,
    downgradedTools: Object.freeze(downgradedTools),
  });
}

interface BuildAdaptedToolArgs {
  readonly client: MCPClient;
  readonly serverIdentity: ServerIdentity;
  readonly mcpToolName: string;
  readonly graphorinToolName: string;
  readonly description: string;
  readonly inputSchema: import('@graphorin/core').ZodLikeSchema<unknown>;
  readonly outputSchema?: import('@graphorin/core').ZodLikeSchema<unknown> | undefined;
  readonly defer_loading: boolean;
  readonly inboundSanitization: InboundSanitizationPolicy;
  readonly sideEffectClass: import('@graphorin/core').SideEffectClass;
  readonly maxResultTokens?: number;
  readonly truncationStrategy?: import('@graphorin/core').TruncationStrategy;
  /** Per-call timeout forwarded to `client.callTool`. */
  readonly callTimeoutMs?: number;
  /** sha256 fingerprint of the producing MCP definition. */
  readonly definitionHash: string;
  readonly logger?: (
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    fields?: Record<string, unknown>,
  ) => void;
  readonly preferredModel?:
    | import('@graphorin/core').ModelHint
    | import('@graphorin/core').ModelSpec;
}

function buildAdaptedTool(args: BuildAdaptedToolArgs): Tool<unknown, unknown, unknown> {
  const sanitizedDescription = sanitizeDescription({
    description: args.description,
    inboundSanitization: args.inboundSanitization,
    toolName: args.graphorinToolName,
    serverIdentity: args.serverIdentity,
  });

  const tool = {
    name: args.graphorinToolName,
    description: sanitizedDescription,
    inputSchema: args.inputSchema,
    ...(args.outputSchema === undefined ? {} : { outputSchema: args.outputSchema }),
    defer_loading: args.defer_loading,
    inboundSanitization: args.inboundSanitization,
    sideEffectClass: args.sideEffectClass,
    sandboxPolicy: 'sandboxed' as const,
    ...(args.maxResultTokens === undefined ? {} : { maxResultTokens: args.maxResultTokens }),
    ...(args.truncationStrategy === undefined
      ? {}
      : { truncationStrategy: args.truncationStrategy }),
    ...(args.preferredModel === undefined ? {} : { preferredModel: args.preferredModel }),
    async execute(
      input: unknown,
      ctx?: import('@graphorin/core').ToolExecutionContext<unknown>,
    ): Promise<ToolReturn<unknown>> {
      // MC-5: the agent's per-call AbortSignal reaches the wire - an
      // aborted run sends `notifications/cancelled` instead of orphaning
      // the JSON-RPC request on the server. MC-3: the per-server call
      // timeout rides along.
      const result = await args.client.callTool(args.mcpToolName, input, {
        ...(ctx?.signal !== undefined ? { signal: ctx.signal } : {}),
        ...(args.callTimeoutMs !== undefined ? { timeoutMs: args.callTimeoutMs } : {}),
      });
      return adaptCallResult({
        result,
        outputSchema: args.outputSchema,
        serverIdentity: args.serverIdentity,
        toolName: args.graphorinToolName,
        inboundSanitization: args.inboundSanitization,
        ...(args.logger !== undefined ? { logger: args.logger } : {}),
      });
    },
  } satisfies Tool<unknown, unknown, unknown>;
  // MC-7: pre-stamp the provenance so the agent's inferToolSource -
  // which honours an existing stamp - classifies tools passed via
  // `config.tools` as 'mcp-derived' (untrusted for the WI-12 dataflow
  // policy) instead of first-party. Zero operator boilerplate.
  return Object.assign(tool, {
    __source: { kind: 'mcp', serverIdentity: args.serverIdentity.id } as const,
    // MC-6: operators persist this fingerprint to pin the approved
    // definition (`toTools({ pinnedFingerprints })`).
    __definitionHash: args.definitionHash,
  });
}

/** Unused export kept for ergonomic test access. */
export type AdaptedToolChunkBuffer = ReadonlyArray<ContentChunk>;
