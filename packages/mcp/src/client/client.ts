import pkg from '../../package.json' with { type: 'json' };
/**
 * `createMCPClient(...)` - the entry point for opening a typed MCP
 * client connection.
 *
 * The returned {@link MCPClient}:
 *
 * - Wraps the `@modelcontextprotocol/sdk` `Client` instance and the
 *   selected SDK transport.
 * - Exposes `listTools` / `listResources` / `listPrompts` /
 *   `callTool` / `readResource` / `getPrompt` / `close` plus the
 *   strategy-aware `toTools(...)` adapter.
 * - Emits one INFO-log per server when the connected transport is
 *   the deprecated SSE transport, on the resolved resumable
 *   capability, and when the structured-content + outputSchema
 *   round-trip first succeeds.
 *
 * @packageDocumentation
 */

import type { Tool } from '@graphorin/core';
import { incrementCounter } from '@graphorin/tools/audit';
import type { CollisionStrategy } from '@graphorin/tools/registry';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import {
  ErrorCode,
  McpError,
  ToolListChangedNotificationSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {
  MCPCallTimeoutError,
  MCPCancelledError,
  MCPConnectionError,
  MCPInvalidConfigError,
  MCPProtocolError,
  MCPToolNotFoundError,
} from '../errors/index.js';
import { deriveServerIdentity } from '../helpers/identity.js';
import { validateMCPServerConfig } from '../helpers/validate-config.js';
import type { ServerIdentity } from '../transport/types.js';
import { computeClientCapabilities, registerClientRequestHandlers } from './client-handlers.js';
import { runToTools, type ToolFingerprintRef } from './to-tools-run.js';
import { buildTransport, type TransportAuthSource } from './transport-factory.js';
import type {
  CreateMCPClientOptions,
  MCPCallToolResult,
  MCPClient,
  MCPContentPart,
  MCPPromptDefinition,
  MCPPromptMessage,
  MCPResourceContent,
  MCPResourceDefinition,
  MCPToolDefinition,
  MCPToToolsOptions,
} from './types.js';

const DEFAULT_CLIENT_NAME = 'graphorin-mcp-client';
const DEFAULT_CLIENT_VERSION: string = pkg.version;

/**
 * Process-scoped dedup flag for the deprecated SSE transport WARN.
 * Once set, subsequent {@link createMCPClient} calls with the SSE
 * transport do not re-emit the warning. Tests reset via
 * {@link _resetSseWarnDedupForTesting}.
 */
let sseWarnEmittedThisProcess = false;

/**
 * Reset the SSE WARN dedup flag. Used by tests.
 *
 * @experimental
 */
export function _resetSseWarnDedupForTesting(): void {
  sseWarnEmittedThisProcess = false;
}

/**
 * Open a typed MCP client connection.
 *
 * @stable
 */
export async function createMCPClient(options: CreateMCPClientOptions): Promise<MCPClient> {
  validateMCPServerConfig({ transport: options.transport });

  // Mutually exclusive (documented on `CreateMCPClientOptions`): a live
  // OAuth provider and a static pre-shared token cannot both drive the
  // outbound `Authorization` header.
  if (options.authProvider !== undefined && options.bearerToken !== undefined) {
    throw new MCPInvalidConfigError(
      '`authProvider` and `bearerToken` are mutually exclusive; supply at most one.',
      { metadata: { transport: options.transport.kind } },
    );
  }
  const auth = resolveTransportAuth(options);
  if (auth !== undefined && options.transport.kind === 'stdio') {
    throw new MCPInvalidConfigError(
      'authProvider / bearerToken require an HTTP transport (streamable-http or sse); the stdio transport carries no Authorization header.',
      { metadata: { transport: 'stdio' } },
    );
  }

  if (
    options.transport.kind === 'sse' &&
    options.suppressDeprecatedTransportWarning !== true &&
    !sseWarnEmittedThisProcess
  ) {
    sseWarnEmittedThisProcess = true;
    if (options.logger !== undefined) {
      options.logger(
        'warn',
        'MCP SSE transport is deprecated; migrate the server to the streamable-http transport when possible.',
      );
    }
    incrementCounter('mcp.transport.deprecated.warn.total', { transport: 'sse' });
  }

  const built = buildTransport(options.transport, auth === undefined ? undefined : { auth });
  return createMCPClientFromSdkTransport({
    transport: built.transport,
    transportConfig: options.transport,
    ...(options.collisionStrategy === undefined
      ? {}
      : { collisionStrategy: options.collisionStrategy }),
    ...(options.priority === undefined ? {} : { priority: options.priority }),
    ...(options.serverInfoName === undefined ? {} : { serverInfoName: options.serverInfoName }),
    ...(options.logger === undefined ? {} : { logger: options.logger }),
    ...(options.clientName === undefined ? {} : { clientName: options.clientName }),
    ...(options.clientVersion === undefined ? {} : { clientVersion: options.clientVersion }),
    ...(options.elicitation === undefined ? {} : { elicitation: options.elicitation }),
    ...(options.sampling === undefined ? {} : { sampling: options.sampling }),
    ...(options.onTransportClose === undefined
      ? {}
      : { onTransportClose: options.onTransportClose }),
    ...(options.onTransportError === undefined
      ? {}
      : { onTransportError: options.onTransportError }),
  });
}

/**
 * Internal factory that takes a pre-built SDK `Transport`. Exposed
 * for the test seam - production code uses {@link createMCPClient}.
 *
 * @internal
 */
export interface CreateMCPClientFromSdkTransportOptions {
  readonly transport: Transport;
  readonly transportConfig: import('../transport/types.js').MCPTransportConfig;
  readonly collisionStrategy?: CollisionStrategy;
  readonly priority?: number;
  readonly serverInfoName?: string;
  readonly logger?: CreateMCPClientOptions['logger'];
  readonly clientName?: string;
  readonly clientVersion?: string;
  readonly elicitation?: CreateMCPClientOptions['elicitation'];
  readonly sampling?: CreateMCPClientOptions['sampling'];
  readonly onTransportClose?: CreateMCPClientOptions['onTransportClose'];
  readonly onTransportError?: CreateMCPClientOptions['onTransportError'];
}

/**
 * Build an {@link MCPClient} from a pre-built SDK transport. The
 * production {@link createMCPClient} delegates here after building
 * the SDK transport from a {@link MCPTransportConfig}.
 *
 * @internal
 */
export async function createMCPClientFromSdkTransport(
  options: CreateMCPClientFromSdkTransportOptions,
): Promise<MCPClient> {
  const sdkClient = new Client({
    name: options.clientName ?? DEFAULT_CLIENT_NAME,
    version: options.clientVersion ?? DEFAULT_CLIENT_VERSION,
  });

  // WI-13 (P2-2): advertise + register the server-initiated request
  // handlers (elicitation / sampling) before connecting, so they are in
  // place when the session starts. Both are gated - capabilities are
  // advertised only when the operator supplied the matching callback.
  const clientCapabilities = computeClientCapabilities({
    elicitation: options.elicitation,
    sampling: options.sampling,
  });
  if (clientCapabilities !== undefined) {
    sdkClient.registerCapabilities(clientCapabilities);
  }
  const serverIdRef = { current: 'unknown' };
  registerClientRequestHandlers(sdkClient, {
    ...(options.elicitation === undefined ? {} : { elicitation: options.elicitation }),
    ...(options.sampling === undefined ? {} : { sampling: options.sampling }),
    serverIdRef,
  });
  // MC-6: surface server-side catalogue churn - at minimum an audit
  // counter + log line; operators re-run toTools() to refresh and
  // re-sanitize the catalogue (which also re-runs the drift diff).
  sdkClient.setNotificationHandler(ToolListChangedNotificationSchema, async () => {
    incrementCounter('mcp.tools.list-changed.total', {
      server: serverIdRef.current ?? 'unknown',
    });
    options.logger?.(
      'warn',
      'mcp.tools.list_changed received - re-run toTools() to refresh + re-sanitize the catalogue',
      { server: serverIdRef.current },
    );
  });

  try {
    await sdkClient.connect(options.transport);
  } catch (cause) {
    throw new MCPConnectionError(
      `MCP transport could not be established: ${(cause as Error).message ?? String(cause)}`,
      {
        metadata: { transport: options.transportConfig.kind },
        cause,
      },
    );
  }

  const serverInfo = sdkClient.getServerVersion() ?? {
    name: 'unknown',
    version: '0.0.0',
  };
  // W-016: the identity derives from the TRANSPORT config (operator-
  // controlled) plus the explicit operator `serverInfoName` override -
  // never from the name the remote server self-reports on initialize.
  // TOFU pins, handle scoping and taint labels all key off this id; a
  // server-controlled id defeats every one of them (rename = fresh pin,
  // claim a trusted name = inherit its scope). The self-reported name
  // survives for display only.
  const derivedIdentity = deriveServerIdentity(options.transportConfig, options.serverInfoName);
  const serverIdentity: typeof derivedIdentity = Object.freeze({
    ...derivedIdentity,
    ...(typeof serverInfo.name === 'string' && serverInfo.name.length > 0
      ? { reportedServerName: serverInfo.name }
      : {}),
  });
  // Backfill the server id so the client-side request handlers
  // (registered before connect) label their counters with it.
  serverIdRef.current = serverIdentity.id;
  // mcp-skills-10: surface transport lifecycle. Without these a dead
  // stdio child / dropped HTTP session is observable only as
  // MCPProtocolErrors on subsequent calls. The SDK Protocol base
  // exposes assignable onclose/onerror callbacks (the transport's own
  // handlers are managed by the SDK - never overwrite those).
  sdkClient.onclose = () => {
    incrementCounter('mcp.transport.closed.total', { server: serverIdentity.id });
    options.logger?.('warn', 'MCP transport closed - rebuild the client to reconnect', {
      server: serverIdentity.id,
    });
    options.onTransportClose?.({ server: serverIdentity.id });
  };
  sdkClient.onerror = (error: Error) => {
    incrementCounter('mcp.transport.error.total', { server: serverIdentity.id });
    options.onTransportError?.(error, { server: serverIdentity.id });
  };
  const collisionStrategy: CollisionStrategy = options.collisionStrategy ?? 'auto-prefix';

  // MC-1: the client-side eventStore option was removed - per the
  // Streamable HTTP spec event replay is the SERVER's responsibility,
  // and the SDK transport auto-reconnects with Last-Event-ID on its
  // own. Warn legacy callers instead of silently ignoring the option.
  if ((options as { readonly eventStore?: unknown }).eventStore !== undefined) {
    options.logger?.(
      'warn',
      "the client 'eventStore' option was removed (MC-1): event replay is a server responsibility; the SDK transport auto-reconnects with Last-Event-ID. Remove the option.",
      { server: serverIdentity.id },
    );
  }
  // MC-9: a session id means stateful routing, NOT a replay guarantee.
  const sessionIdPresent =
    isStreamableHttp(options.transport) &&
    (options.transport as StreamableHTTPClientTransport).sessionId !== undefined;
  const resumable = sessionIdPresent;
  if (options.logger !== undefined) {
    options.logger('info', 'mcp.session.session-id.resolved', {
      server: serverIdentity.id,
      value: sessionIdPresent,
      source: sessionIdPresent ? 'session-id-present' : 'transport-default',
    });
  }
  let structuredContentSeenLogged = false;

  /**
   * mcp-skills-02: MCP list operations are cursor-paginated (protocol
   * 2024-11-05+) and the SDK does NOT auto-paginate - a single call
   * returns page 1 only. Ignoring `nextCursor` silently truncated the
   * catalogue: tools beyond the first page never reached `toTools()`,
   * defer-loading thresholds counted a partial catalogue, pin
   * fingerprints covered a partial catalogue, and resources/prompts were
   * under-listed. Every list surface now drains the cursor chain, with a
   * defensive page cap against buggy/adversarial servers that never
   * terminate it.
   */
  const MAX_LIST_PAGES = 100;

  function warnListPageCap(what: 'tools' | 'resources' | 'prompts', collected: number): void {
    options.logger?.(
      'warn',
      `mcp.list.${what}.page-cap-reached: server kept returning nextCursor after ${MAX_LIST_PAGES} pages; the ${what} catalogue is truncated at ${collected} entries.`,
      { server: serverIdentity.id },
    );
  }

  async function listTools(opts?: {
    signal?: AbortSignal;
  }): Promise<ReadonlyArray<MCPToolDefinition>> {
    const requestOptions = opts?.signal === undefined ? {} : { signal: opts.signal };
    type SdkTool = {
      name: string;
      description?: string;
      inputSchema: Readonly<Record<string, unknown>>;
      outputSchema?: Readonly<Record<string, unknown>>;
      title?: string;
    };
    const tools: SdkTool[] = [];
    let cursor: string | undefined;
    for (let page = 0; ; page++) {
      if (page >= MAX_LIST_PAGES) {
        warnListPageCap('tools', tools.length);
        break;
      }
      let result: Awaited<ReturnType<typeof sdkClient.listTools>>;
      try {
        result = await sdkClient.listTools(cursor === undefined ? {} : { cursor }, requestOptions);
      } catch (cause) {
        throw mapSdkError(cause, { aborted: opts?.signal?.aborted === true });
      }
      tools.push(...((result.tools ?? []) as ReadonlyArray<SdkTool>));
      cursor = (result as { nextCursor?: string }).nextCursor;
      if (cursor === undefined) break;
    }
    if (!structuredContentSeenLogged && tools.some((t) => t.outputSchema !== undefined)) {
      structuredContentSeenLogged = true;
      if (options.logger !== undefined) {
        options.logger('info', 'mcp.server.structured-content.detected', {
          server: serverIdentity.id,
        });
      }
    }
    return Object.freeze(
      tools.map((t) =>
        Object.freeze({
          name: t.name,
          description: t.description ?? '',
          inputSchema: t.inputSchema,
          ...(t.outputSchema === undefined ? {} : { outputSchema: t.outputSchema }),
          ...(t.title === undefined ? {} : { title: t.title }),
        }),
      ),
    );
  }

  async function listResources(opts?: {
    signal?: AbortSignal;
  }): Promise<ReadonlyArray<MCPResourceDefinition>> {
    const requestOptions = opts?.signal === undefined ? {} : { signal: opts.signal };
    type SdkResource = {
      uri: string;
      name?: string;
      description?: string;
      mimeType?: string;
    };
    const items: SdkResource[] = [];
    let cursor: string | undefined;
    for (let page = 0; ; page++) {
      if (page >= MAX_LIST_PAGES) {
        warnListPageCap('resources', items.length);
        break;
      }
      let result: Awaited<ReturnType<typeof sdkClient.listResources>>;
      try {
        result = await sdkClient.listResources(
          cursor === undefined ? {} : { cursor },
          requestOptions,
        );
      } catch (cause) {
        throw mapSdkError(cause, { aborted: opts?.signal?.aborted === true });
      }
      items.push(...((result.resources ?? []) as ReadonlyArray<SdkResource>));
      cursor = (result as { nextCursor?: string }).nextCursor;
      if (cursor === undefined) break;
    }
    return Object.freeze(
      items.map((r) =>
        Object.freeze({
          uri: r.uri,
          ...(r.name === undefined ? {} : { name: r.name }),
          ...(r.description === undefined ? {} : { description: r.description }),
          ...(r.mimeType === undefined ? {} : { mimeType: r.mimeType }),
        }),
      ),
    );
  }

  async function listPrompts(opts?: {
    signal?: AbortSignal;
  }): Promise<ReadonlyArray<MCPPromptDefinition>> {
    const requestOptions = opts?.signal === undefined ? {} : { signal: opts.signal };
    type SdkPrompt = {
      name: string;
      description?: string;
      arguments?: ReadonlyArray<{ name: string; description?: string; required?: boolean }>;
    };
    const items: SdkPrompt[] = [];
    let cursor: string | undefined;
    for (let page = 0; ; page++) {
      if (page >= MAX_LIST_PAGES) {
        warnListPageCap('prompts', items.length);
        break;
      }
      let result: Awaited<ReturnType<typeof sdkClient.listPrompts>>;
      try {
        result = await sdkClient.listPrompts(
          cursor === undefined ? {} : { cursor },
          requestOptions,
        );
      } catch (cause) {
        throw mapSdkError(cause, { aborted: opts?.signal?.aborted === true });
      }
      items.push(...((result.prompts ?? []) as ReadonlyArray<SdkPrompt>));
      cursor = (result as { nextCursor?: string }).nextCursor;
      if (cursor === undefined) break;
    }
    return Object.freeze(
      items.map((p) =>
        Object.freeze({
          name: p.name,
          ...(p.description === undefined ? {} : { description: p.description }),
          ...(p.arguments === undefined
            ? {}
            : {
                arguments: Object.freeze(
                  p.arguments.map((a) =>
                    Object.freeze({
                      name: a.name,
                      ...(a.description === undefined ? {} : { description: a.description }),
                      ...(a.required === undefined ? {} : { required: a.required }),
                    }),
                  ),
                ),
              }),
        }),
      ),
    );
  }

  async function callTool(
    name: string,
    args: unknown,
    opts?: { signal?: AbortSignal; timeoutMs?: number },
  ): Promise<MCPCallToolResult> {
    // MC-3: `timeoutMs` maps onto the SDK's RequestOptions - both the
    // per-attempt and the total ceiling, so progress notifications
    // cannot extend past the caller's budget.
    const requestOptions = {
      ...(opts?.signal === undefined ? {} : { signal: opts.signal }),
      ...(opts?.timeoutMs === undefined
        ? {}
        : { timeout: opts.timeoutMs, maxTotalTimeout: opts.timeoutMs }),
    };
    incrementCounter('mcp.call.invoked.total', { server: serverIdentity.id, tool: name });
    let result: Awaited<ReturnType<typeof sdkClient.callTool>>;
    try {
      result = await sdkClient.callTool(
        { name, arguments: args as Record<string, unknown> },
        undefined,
        requestOptions,
      );
    } catch (cause) {
      const mapped = mapSdkError(cause, {
        tool: name,
        aborted: opts?.signal?.aborted === true,
      });
      if (mapped instanceof MCPCancelledError) {
        incrementCounter('mcp.call.cancelled.total', { server: serverIdentity.id, tool: name });
      } else {
        incrementCounter('mcp.call.failed.total', { server: serverIdentity.id, tool: name });
      }
      throw mapped;
    }
    const content = (result.content ?? []) as ReadonlyArray<MCPContentPart>;
    return Object.freeze({
      content: Object.freeze([...content]),
      ...(result.structuredContent === undefined
        ? {}
        : { structuredContent: result.structuredContent as Readonly<Record<string, unknown>> }),
      ...(result.isError === undefined ? {} : { isError: Boolean(result.isError) }),
    });
  }

  async function readResourceContents(
    uri: string,
    opts?: { signal?: AbortSignal },
  ): Promise<ReadonlyArray<MCPResourceContent>> {
    const requestOptions = opts?.signal === undefined ? {} : { signal: opts.signal };
    let result: Awaited<ReturnType<typeof sdkClient.readResource>>;
    try {
      result = await sdkClient.readResource({ uri }, requestOptions);
    } catch (cause) {
      throw mapSdkError(cause, { aborted: opts?.signal?.aborted === true });
    }
    const contents = (result.contents ?? []) as ReadonlyArray<MCPResourceContent>;
    if (contents.length === 0) {
      throw new MCPProtocolError(`MCP server returned no contents for resource '${uri}'.`, {
        metadata: { server: serverIdentity.id },
      });
    }
    return Object.freeze(contents.map((c) => Object.freeze(c)));
  }

  async function readResource(
    uri: string,
    opts?: { signal?: AbortSignal },
  ): Promise<MCPResourceContent> {
    const contents = await readResourceContents(uri, opts);
    // mcp-skills-11: the `resources/read` result is an ARRAY precisely
    // because one URI can yield multiple contents. The single-content
    // convenience keeps its shape, but a silent truncation is now a
    // visible one.
    if (contents.length > 1) {
      incrementCounter('mcp.resource.multi-content-truncated.total', {
        server: serverIdentity.id,
      });
      options.logger?.(
        'warn',
        `resource '${uri}' returned ${contents.length} content items; readResource() surfaces only the first - use readResourceContents() for all of them`,
        { server: serverIdentity.id },
      );
    }
    return contents[0] as MCPResourceContent;
  }

  async function getPrompt(
    name: string,
    args?: unknown,
    opts?: { signal?: AbortSignal },
  ): Promise<{ readonly messages: ReadonlyArray<MCPPromptMessage> }> {
    const requestOptions = opts?.signal === undefined ? {} : { signal: opts.signal };
    let result: Awaited<ReturnType<typeof sdkClient.getPrompt>>;
    try {
      result = await sdkClient.getPrompt(
        {
          name,
          ...(args === undefined ? {} : { arguments: args as Record<string, string> }),
        },
        requestOptions,
      );
    } catch (cause) {
      throw mapSdkError(cause, { aborted: opts?.signal?.aborted === true });
    }
    const messages = (result.messages ?? []).map(
      (m): MCPPromptMessage =>
        Object.freeze({
          role: m.role,
          content: m.content as MCPContentPart,
        }),
    );
    return Object.freeze({ messages: Object.freeze(messages) });
  }

  // W-080: cross-snapshot drift tracking spans this client's lifetime;
  // the pipeline itself lives in `runToTools` (shared with the managed
  // wrapper, which passes ITSELF as the client so adapted tools survive
  // an inner-client swap on reconnect).
  const toolFingerprintRef: ToolFingerprintRef = { current: undefined };

  async function toTools(toolsOpts?: MCPToToolsOptions): Promise<ReadonlyArray<Tool>> {
    return runToTools({
      client: clientApi,
      fingerprintRef: toolFingerprintRef,
      ...(options.logger === undefined ? {} : { logger: options.logger }),
      ...(toolsOpts === undefined ? {} : { toolsOpts }),
    });
  }

  async function close(): Promise<void> {
    try {
      await sdkClient.close();
    } catch (cause) {
      // Treat double-close as a no-op; surface other failures.
      if (cause instanceof Error && cause.message.toLowerCase().includes('already')) return;
      throw new MCPConnectionError('MCP transport could not be closed cleanly.', {
        metadata: { transport: options.transportConfig.kind, server: serverIdentity.id },
        cause,
      });
    }
  }

  const clientApi: MCPClient = Object.freeze({
    id: serverIdentity.id,
    serverInfo,
    serverIdentity,
    collisionStrategy,
    ...(options.priority === undefined ? {} : { priority: options.priority }),
    sessionIdPresent,
    resumable,
    listTools,
    listResources,
    listPrompts,
    callTool,
    readResource,
    readResourceContents,
    getPrompt,
    toTools,
    close,
  });
  return clientApi;
}

/**
 * Resolve the live {@link TransportAuthSource} for the outbound
 * `Authorization` header from the mutually-exclusive `authProvider` /
 * `bearerToken` options. `authProvider.resolveHeader()` already returns
 * the full header value (`Bearer …`); a static `bearerToken` is wrapped
 * into a constant `Bearer`-prefixed resolver. Returns `undefined` when
 * neither is supplied (no header injection).
 */
function resolveTransportAuth(options: CreateMCPClientOptions): TransportAuthSource | undefined {
  const provider = options.authProvider;
  if (provider !== undefined) {
    return { resolveHeader: () => provider.resolveHeader() };
  }
  if (options.bearerToken !== undefined) {
    const token = options.bearerToken;
    const header = /^bearer\s/i.test(token) ? token : `Bearer ${token}`;
    return { resolveHeader: () => header };
  }
  return undefined;
}

function mapSdkError(
  cause: unknown,
  ctx: { readonly tool?: string; readonly aborted?: boolean },
): Error {
  const metadata = ctx.tool === undefined ? {} : { tool: ctx.tool };
  // W-141: cancellation is classified from OUR OWN AbortSignal state
  // (ctx.aborted), never from error text. SDK 1.29 wraps a local abort
  // as McpError(RequestTimeout, String(reason)) (protocol.js cancel()),
  // so neither the code nor the message distinguishes it - but the
  // caller's signal does, and it cannot be forged by a server.
  if (ctx.aborted === true) {
    return new MCPCancelledError('MCP request was cancelled.', { metadata, cause });
  }
  // Classify McpError by JSON-RPC CODE. The message is server-
  // controlled text: matching it would let a malicious server forge
  // the typed timeout/cancelled classes (and the operator counters
  // keyed on them) by phrasing an ordinary error as 'request timed
  // out'. Codes are the protocol's typed channel; the SDK raises its
  // own client-side timeout as -32001 (RequestTimeout).
  if (cause instanceof McpError) {
    if (cause.code === ErrorCode.RequestTimeout) {
      return new MCPCallTimeoutError(
        `MCP request timed out${ctx.tool ? ` (tool: ${ctx.tool})` : ''}.`,
        { metadata, cause },
      );
    }
    if (
      cause.code === ErrorCode.MethodNotFound ||
      // Tool-not-found stays message-matched as a fallback: real
      // servers signal an unknown tool via InvalidParams/InternalError
      // text at least as often as via MethodNotFound. This class is
      // benign to forge - it feeds no cancelled/timeout counter and
      // triggers no retry semantics, so DX wins over strictness here.
      /unknown\s+tool|tool\s+not\s+found|method\s+not\s+found/i.test(cause.message)
    ) {
      return new MCPToolNotFoundError(`MCP tool not found${ctx.tool ? `: ${ctx.tool}` : ''}.`, {
        metadata,
        cause,
      });
    }
    return new MCPProtocolError(cause.message.length === 0 ? cause.toString() : cause.message, {
      metadata,
      cause,
    });
  }
  if (cause instanceof Error) {
    const name = cause.name;
    const message = cause.message ?? '';
    // Local cancellation can also surface as an AbortError (transport
    // paths); the name check is trustworthy for plain errors.
    if (name === 'AbortError') {
      return new MCPCancelledError('MCP request was cancelled.', { metadata, cause });
    }
    // Last-resort message fallbacks for PLAIN Errors thrown by
    // transports or SDK paths outside JSON-RPC (no code to go by).
    // Server-authored error text cannot reach this branch: RPC-level
    // failures arrive as McpError and are classified above.
    if (/aborted|cancell/i.test(message)) {
      return new MCPCancelledError('MCP request was cancelled.', { metadata, cause });
    }
    if (/request timed out|timed out/i.test(message)) {
      return new MCPCallTimeoutError(
        `MCP request timed out${ctx.tool ? ` (tool: ${ctx.tool})` : ''}.`,
        {
          metadata,
          cause,
        },
      );
    }
    if (/unknown\s+tool|tool\s+not\s+found|method\s+not\s+found/i.test(message)) {
      return new MCPToolNotFoundError(`MCP tool not found${ctx.tool ? `: ${ctx.tool}` : ''}.`, {
        metadata,
        cause,
      });
    }
    return new MCPProtocolError(message.length === 0 ? cause.toString() : message, {
      metadata,
      cause,
    });
  }
  return new MCPProtocolError(`MCP request failed: ${String(cause)}`, { metadata, cause });
}

function isStreamableHttp(transport: unknown): transport is StreamableHTTPClientTransport {
  return (
    typeof transport === 'object' &&
    transport !== null &&
    transport.constructor !== undefined &&
    transport.constructor.name === 'StreamableHTTPClientTransport'
  );
}

export type { ServerIdentity };
