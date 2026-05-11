/**
 * `createMCPClient(...)` — the entry point for opening a typed MCP
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
  MCPCancelledError,
  MCPConnectionError,
  MCPProtocolError,
  MCPToolNotFoundError,
} from '../errors/index.js';
import { deriveServerIdentity } from '../helpers/identity.js';
import { validateMCPServerConfig } from '../helpers/validate-config.js';
import type { ServerIdentity } from '../transport/types.js';
import { adaptMCPTools } from './to-tools.js';
import { buildTransport } from './transport-factory.js';
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
const DEFAULT_CLIENT_VERSION = '0.1.0';

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

  const built = buildTransport(options.transport);
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
  });
}

/**
 * Internal factory that takes a pre-built SDK `Transport`. Exposed
 * for the test seam — production code uses {@link createMCPClient}.
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
  const serverIdentity = deriveServerIdentity(
    options.transportConfig,
    options.serverInfoName ?? serverInfo.name,
  );
  const collisionStrategy: CollisionStrategy = options.collisionStrategy ?? 'auto-prefix';

  const resumable =
    isStreamableHttp(options.transport) &&
    (options.transport as StreamableHTTPClientTransport).sessionId !== undefined;
  if (options.logger !== undefined) {
    options.logger('info', 'mcp.session.resumable.resolved', {
      server: serverIdentity.id,
      value: resumable,
      source: resumable ? 'server-advertises' : 'transport-default',
    });
  }
  let structuredContentSeenLogged = false;

  async function listTools(opts?: {
    signal?: AbortSignal;
  }): Promise<ReadonlyArray<MCPToolDefinition>> {
    const requestOptions = opts?.signal === undefined ? {} : { signal: opts.signal };
    let result: Awaited<ReturnType<typeof sdkClient.listTools>>;
    try {
      result = await sdkClient.listTools({}, requestOptions);
    } catch (cause) {
      throw mapSdkError(cause, {});
    }
    const tools = (result.tools ?? []) as ReadonlyArray<{
      name: string;
      description?: string;
      inputSchema: Readonly<Record<string, unknown>>;
      outputSchema?: Readonly<Record<string, unknown>>;
      title?: string;
    }>;
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
    let result: Awaited<ReturnType<typeof sdkClient.listResources>>;
    try {
      result = await sdkClient.listResources({}, requestOptions);
    } catch (cause) {
      throw mapSdkError(cause, {});
    }
    const items = (result.resources ?? []) as ReadonlyArray<{
      uri: string;
      name?: string;
      description?: string;
      mimeType?: string;
    }>;
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
    let result: Awaited<ReturnType<typeof sdkClient.listPrompts>>;
    try {
      result = await sdkClient.listPrompts({}, requestOptions);
    } catch (cause) {
      throw mapSdkError(cause, {});
    }
    const items = (result.prompts ?? []) as ReadonlyArray<{
      name: string;
      description?: string;
      arguments?: ReadonlyArray<{ name: string; description?: string; required?: boolean }>;
    }>;
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
    const requestOptions = opts?.signal === undefined ? {} : { signal: opts.signal };
    incrementCounter('mcp.call.invoked.total', { server: serverIdentity.id, tool: name });
    let result: Awaited<ReturnType<typeof sdkClient.callTool>>;
    try {
      result = await sdkClient.callTool(
        { name, arguments: args as Record<string, unknown> },
        undefined,
        requestOptions,
      );
    } catch (cause) {
      const mapped = mapSdkError(cause, { tool: name });
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

  async function readResource(
    uri: string,
    opts?: { signal?: AbortSignal },
  ): Promise<MCPResourceContent> {
    const requestOptions = opts?.signal === undefined ? {} : { signal: opts.signal };
    let result: Awaited<ReturnType<typeof sdkClient.readResource>>;
    try {
      result = await sdkClient.readResource({ uri }, requestOptions);
    } catch (cause) {
      throw mapSdkError(cause, {});
    }
    const first = ((result.contents ?? []) as ReadonlyArray<MCPResourceContent>)[0];
    if (first === undefined) {
      throw new MCPProtocolError(`MCP server returned no contents for resource '${uri}'.`, {
        metadata: { server: serverIdentity.id },
      });
    }
    return Object.freeze(first);
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
      throw mapSdkError(cause, {});
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

  async function toTools(toolsOpts?: MCPToToolsOptions): Promise<ReadonlyArray<Tool>> {
    const catalogue = await listTools();
    const adapted = adaptMCPTools({
      client: clientApi,
      serverIdentity,
      catalogue,
      ...(toolsOpts === undefined ? {} : { options: toolsOpts }),
      ...(options.logger === undefined ? {} : { logger: options.logger }),
    });
    return adapted.tools;
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
    resumable,
    listTools,
    listResources,
    listPrompts,
    callTool,
    readResource,
    getPrompt,
    toTools,
    close,
  });
  return clientApi;
}

function mapSdkError(cause: unknown, ctx: { readonly tool?: string }): Error {
  const metadata = ctx.tool === undefined ? {} : { tool: ctx.tool };
  if (cause instanceof Error) {
    const name = cause.name;
    const message = cause.message ?? '';
    if (name === 'AbortError' || /aborted|cancell/i.test(message)) {
      return new MCPCancelledError('MCP request was cancelled.', { metadata, cause });
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
