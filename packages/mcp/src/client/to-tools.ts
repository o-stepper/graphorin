/**
 * `toTools()` adapter — bridges MCP tool descriptors into the
 * Graphorin tool registry.
 *
 * The adapter:
 *
 * 1. Filters / namespaces / optionally bulk-defers the
 *    `listTools()` output.
 * 2. Computes the per-server effective `defer_loading` flag: when
 *    the operator does not pass an explicit `defer_loading`, the
 *    auto-default fires once when `listTools().length >
 *    deferLoadingThreshold` (default `10`) and flips deferral on
 *    for every tool from the server.
 * 3. Converts each MCP tool into a strongly-typed Graphorin
 *    `Tool` whose `execute(...)` calls back into
 *    {@link MCPClient.callTool}.
 * 4. Performs the structured-content + outputSchema round-trip:
 *    when the MCP server advertises an `outputSchema`, the
 *    adapter validates `structuredContent` against the converted
 *    schema and surfaces it as the typed `output`; falls through
 *    to the unstructured text body when the structured form is
 *    missing or non-conforming.
 * 5. Applies the strict per-server inbound prompt-injection
 *    sanitization defaults at execution time — the trust class is
 *    pinned to `'mcp-derived'` so the agent runtime's per-step
 *    preamble fires regardless of the body-level policy.
 *
 * @packageDocumentation
 */

import type {
  ContentChunk,
  MessageContent,
  Tool,
  ToolReturn,
  ZodLikeSchema,
} from '@graphorin/core';
import { incrementCounter } from '@graphorin/tools/audit';
import { applyInboundSanitization } from '@graphorin/tools/inbound';
import { buildJsonSchemaValidator, type JsonSchemaLike } from '../registry/json-schema.js';
import type { ServerIdentity } from '../transport/types.js';
import type {
  MCPCallToolResult,
  MCPClient,
  MCPContentPart,
  MCPToolDefinition,
  MCPToToolsOptions,
} from './types.js';

/** Default auto-deferral threshold per the operator-facing convention. */
export const DEFAULT_DEFER_LOADING_THRESHOLD = 10;

/**
 * Process-scoped dedup keys for the `pass-through` override WARN. The
 * spec mandates exactly-one WARN per server identity per process — the
 * Set retains the keys for the lifetime of the process. Tests reset
 * via {@link _resetMcpAdapterDedupForTesting}.
 */
const passthroughWarnSeen = new Set<string>();

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
 * Reset every process-scoped dedup set. Used by tests.
 *
 * @experimental
 */
export function _resetMcpAdapterDedupForTesting(): void {
  passthroughWarnSeen.clear();
  autoDeferralInfoSeen.clear();
  explicitDeferralInfoSeen.clear();
}

/** Result returned by {@link adaptMCPTools}. */
export interface AdaptedToolsResult {
  readonly tools: ReadonlyArray<Tool>;
  readonly autoDeferralFired: boolean;
  readonly resolvedDeferLoading: boolean;
  readonly resolvedInboundSanitization:
    | 'pass-through'
    | 'detect-and-flag'
    | 'detect-and-strip'
    | 'detect-and-wrap'
    | 'detect-and-strip-and-wrap';
  readonly toolCount: number;
  readonly deferralThreshold: number;
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
  const filter = opts.filter;
  const namespace = (opts.namespace ?? '').trim();
  const filtered = filter === undefined ? args.catalogue : args.catalogue.filter((t) => filter(t));
  const total = filtered.length;
  const threshold = opts.deferLoadingThreshold ?? DEFAULT_DEFER_LOADING_THRESHOLD;
  const explicitDefer = opts.defer_loading;
  const autoDeferralFired = explicitDefer === undefined && total > threshold;
  const resolvedDeferLoading = explicitDefer ?? autoDeferralFired;
  const resolvedInbound = opts.inboundSanitization ?? 'detect-and-strip-and-wrap';

  if (autoDeferralFired) {
    for (let i = 0; i < total; i++) {
      incrementCounter('tool.retrieval.deferred.total', { source: 'mcp-server-default' });
    }
    const dedupKey = `${args.serverIdentity.id}:${threshold}`;
    if (!autoDeferralInfoSeen.has(dedupKey) && args.logger !== undefined) {
      autoDeferralInfoSeen.add(dedupKey);
      args.logger('info', 'mcp.tools.defer_loading.auto-default fired', {
        server: args.serverIdentity.id,
        thresholdValue: threshold,
        toolCount: total,
        toolNames: filtered.map((t) => t.name),
        source: 'mcp-server-default',
      });
    }
  } else if (explicitDefer === true) {
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
  } else if (explicitDefer === false) {
    for (let i = 0; i < total; i++) {
      incrementCounter('tool.retrieval.eager.total', { source: 'mcp-explicit-eager' });
    }
  }

  // WARN-once per server when the operator opts out of body-level
  // sanitization. The trust class stays `'mcp-derived'` regardless so
  // the per-step preamble in the agent runtime still fires; the WARN
  // exists so the audit log records the operator's deliberate choice.
  if (resolvedInbound === 'pass-through' && !passthroughWarnSeen.has(args.serverIdentity.id)) {
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

  const tools: Tool[] = [];
  for (const definition of filtered) {
    const namespacedName =
      namespace.length === 0 ? definition.name : `${namespace}.${definition.name}`;
    const sideEffectClass = opts.sideEffectClassByTool?.[namespacedName] ?? 'external-stateful';
    const preferredModel = opts.preferredModelByTool?.[namespacedName];
    const inputValidator = buildJsonSchemaValidator(definition.inputSchema as JsonSchemaLike);
    const outputValidator =
      definition.outputSchema === undefined
        ? undefined
        : buildJsonSchemaValidator(definition.outputSchema as JsonSchemaLike);
    tools.push(
      buildAdaptedTool({
        client: args.client,
        serverIdentity: args.serverIdentity,
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
        ...(preferredModel === undefined ? {} : { preferredModel }),
      }),
    );
  }

  return Object.freeze({
    tools: Object.freeze(tools),
    autoDeferralFired,
    resolvedDeferLoading,
    resolvedInboundSanitization: resolvedInbound,
    toolCount: total,
    deferralThreshold: threshold,
  });
}

interface BuildAdaptedToolArgs {
  readonly client: MCPClient;
  readonly serverIdentity: ServerIdentity;
  readonly mcpToolName: string;
  readonly graphorinToolName: string;
  readonly description: string;
  readonly inputSchema: ZodLikeSchema<unknown>;
  readonly outputSchema?: ZodLikeSchema<unknown> | undefined;
  readonly defer_loading: boolean;
  readonly inboundSanitization:
    | 'pass-through'
    | 'detect-and-flag'
    | 'detect-and-strip'
    | 'detect-and-wrap'
    | 'detect-and-strip-and-wrap';
  readonly sideEffectClass: import('@graphorin/core').SideEffectClass;
  readonly maxResultTokens?: number;
  readonly truncationStrategy?: import('@graphorin/core').TruncationStrategy;
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
    async execute(input: unknown): Promise<ToolReturn<unknown>> {
      const result = await args.client.callTool(args.mcpToolName, input);
      return adaptCallResult({
        result,
        outputSchema: args.outputSchema,
        serverIdentity: args.serverIdentity,
        toolName: args.graphorinToolName,
      });
    },
  } satisfies Tool<unknown, unknown, unknown>;
  return tool;
}

function sanitizeDescription(args: {
  readonly description: string;
  readonly inboundSanitization: BuildAdaptedToolArgs['inboundSanitization'];
  readonly toolName: string;
  readonly serverIdentity: ServerIdentity;
}): string {
  // Tool descriptions go into the per-step tool catalogue verbatim;
  // we strip imperative payloads but never wrap the description in
  // the `<<<untrusted_content>>>` envelope (the wrap is reserved for
  // tool result bodies emitted into the conversation history).
  const stripPolicy: BuildAdaptedToolArgs['inboundSanitization'] =
    args.inboundSanitization === 'pass-through' ? 'pass-through' : 'detect-and-strip';
  const outcome = applyInboundSanitization({
    body: args.description,
    policy: stripPolicy,
    trustClass: 'mcp-derived',
    toolName: args.toolName,
    contentOrigin: `mcp:tool-description:${args.serverIdentity.id}`,
    failClosed: false,
  });
  return outcome.body;
}

interface AdaptCallResultArgs {
  readonly result: MCPCallToolResult;
  readonly outputSchema?: ZodLikeSchema<unknown> | undefined;
  readonly serverIdentity: ServerIdentity;
  readonly toolName: string;
}

/**
 * Convert an MCP `CallToolResult` into a typed Graphorin
 * `ToolReturn`, handling the structured-content + outputSchema
 * round-trip and the backward-compatible TextContent mirror.
 *
 * @internal
 */
export function adaptCallResult(args: AdaptCallResultArgs): ToolReturn<unknown> {
  const { result, outputSchema, serverIdentity, toolName } = args;
  const contentParts: MessageContent[] = [];
  for (const part of result.content) {
    const messagePart = mcpContentToMessageContent(part);
    if (messagePart !== undefined) contentParts.push(messagePart);
  }
  const textParts = (result.content ?? []).filter(
    (p): p is { type: 'text'; text: string } => p.type === 'text',
  );
  const concatenatedText = textParts.map((t) => t.text).join('\n');

  if (result.structuredContent !== undefined) {
    if (outputSchema !== undefined) {
      const validation = outputSchema.safeParse(result.structuredContent);
      if (validation.success) {
        incrementCounter('mcp.structured-content.emitted.total', {
          server: serverIdentity.id,
          tool: toolName,
        });
        const finalParts = [...contentParts];
        if (textParts.length === 0) {
          finalParts.push({ type: 'text', text: JSON.stringify(result.structuredContent) });
        }
        return Object.freeze({
          output: validation.data,
          contentParts: Object.freeze(finalParts),
        });
      }
      incrementCounter('mcp.structured-content.validation.failure.total', {
        server: serverIdentity.id,
        tool: toolName,
      });
      // Fall through to the text mirror path on schema failure.
    } else {
      incrementCounter('mcp.structured-content.emitted.total', {
        server: serverIdentity.id,
        tool: toolName,
      });
      const finalParts = [...contentParts];
      if (textParts.length === 0) {
        finalParts.push({ type: 'text', text: JSON.stringify(result.structuredContent) });
      }
      return Object.freeze({
        output: result.structuredContent,
        contentParts: Object.freeze(finalParts),
      });
    }
  }

  return Object.freeze({
    output: concatenatedText,
    contentParts: Object.freeze(contentParts),
  });
}

function mcpContentToMessageContent(part: MCPContentPart): MessageContent | undefined {
  switch (part.type) {
    case 'text':
      return { type: 'text', text: part.text };
    case 'image':
      return {
        type: 'image',
        image: decodeBase64(part.data),
        mimeType: part.mimeType,
      };
    case 'audio':
      return {
        type: 'audio',
        audio: decodeBase64(part.data),
        mimeType: part.mimeType,
      };
    case 'resource': {
      const text = part.resource.text;
      if (text !== undefined) {
        return { type: 'text', text };
      }
      const blob = part.resource.blob;
      if (blob !== undefined) {
        return {
          type: 'file',
          file: decodeBase64(blob),
          mimeType: part.resource.mimeType ?? 'application/octet-stream',
        };
      }
      return { type: 'text', text: `Resource ${part.resource.uri}` };
    }
  }
}

function decodeBase64(value: string): Uint8Array {
  return Uint8Array.from(Buffer.from(value, 'base64'));
}

/** Unused export kept for ergonomic test access. */
export type AdaptedToolChunkBuffer = ReadonlyArray<ContentChunk>;
