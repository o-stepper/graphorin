/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * MCP client for the tour, connected over the in-memory linked-pair
 * transport.
 *
 * Why a local facade: the production entry point `createMCPClient(...)`
 * always BUILDS its SDK transport from an `MCPTransportConfig` (stdio
 * child process / HTTP dial) - it cannot accept a pre-built in-memory
 * transport. The internal seam that can (`createMCPClientFromSdkTransport`,
 * see `packages/mcp/src/client/client.ts`) is `@internal` and is not
 * re-exported through the package's `exports` map, so an out-of-package
 * consumer cannot import it. The tour therefore composes the SAME public
 * bridge parts the real client delegates to:
 *
 * - `deriveServerIdentity(...)` - the operator-controlled identity the
 *   trust machinery keys off (W-016), and
 * - `adaptMCPTools(...)`        - the stable descriptor-to-`Tool` adapter
 *   (sanitized descriptions/schemas, defer-loading resolution, definition
 *   fingerprints, `execute()` round-tripping through `callTool`).
 *
 * The facade implements the full `MCPClient` surface so `adaptMCPTools`
 * receives a well-typed client; the surfaces the tour's server does not
 * serve (resources / prompts) fail with a descriptive error instead of
 * pretending.
 */

import type { Tool } from '@graphorin/core';
import {
  adaptMCPTools,
  deriveServerIdentity,
  type MCPCallToolResult,
  type MCPClient,
  type MCPContentPart,
  type MCPToolDefinition,
  type MCPToToolsOptions,
} from '@graphorin/mcp';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';

/** Options for {@link connectTourMcpClient}. */
export interface ConnectTourMcpClientOptions {
  /** The client half of the in-memory linked pair. */
  readonly transport: Transport;
  /**
   * Operator-supplied identity override - becomes `client.id` and the
   * `serverIdentity` every audit row / taint label keys off.
   */
  readonly serverInfoName: string;
}

/**
 * Connect an SDK `Client` over the supplied in-memory transport and wrap
 * it in the Graphorin {@link MCPClient} surface.
 */
export async function connectTourMcpClient(
  options: ConnectTourMcpClientOptions,
): Promise<MCPClient> {
  const sdkClient = new Client({ name: 'tools-harness-tour', version: '1.0.0' });
  await sdkClient.connect(options.transport);

  // The identity derives from operator-controlled data only (W-016). The
  // `stdio` shape is used for its identity fields; no child process is
  // spawned - the in-memory linked pair replaces the wire.
  const serverIdentity = deriveServerIdentity(
    { kind: 'stdio', command: 'tools-harness-tour-linked-pair' },
    options.serverInfoName,
  );

  const reported = sdkClient.getServerVersion();
  const serverInfo = {
    name: typeof reported?.name === 'string' ? reported.name : 'unknown',
    version: typeof reported?.version === 'string' ? reported.version : '0.0.0',
  };

  async function listTools(): Promise<ReadonlyArray<MCPToolDefinition>> {
    const result = await sdkClient.listTools({});
    return Object.freeze(
      (result.tools ?? []).map((t) =>
        Object.freeze({
          name: t.name,
          description: t.description ?? '',
          inputSchema: t.inputSchema as Readonly<Record<string, unknown>>,
          ...(t.outputSchema === undefined
            ? {}
            : { outputSchema: t.outputSchema as Readonly<Record<string, unknown>> }),
        }),
      ),
    );
  }

  async function callTool(
    name: string,
    args: unknown,
    opts?: { signal?: AbortSignal; timeoutMs?: number },
  ): Promise<MCPCallToolResult> {
    const requestOptions = {
      ...(opts?.signal === undefined ? {} : { signal: opts.signal }),
      ...(opts?.timeoutMs === undefined
        ? {}
        : { timeout: opts.timeoutMs, maxTotalTimeout: opts.timeoutMs }),
    };
    const result = await sdkClient.callTool(
      { name, arguments: args as Record<string, unknown> },
      undefined,
      requestOptions,
    );
    const content = (result.content ?? []) as ReadonlyArray<MCPContentPart>;
    return Object.freeze({
      content: Object.freeze([...content]),
      ...(result.structuredContent === undefined
        ? {}
        : { structuredContent: result.structuredContent as Readonly<Record<string, unknown>> }),
      ...(result.isError === undefined ? {} : { isError: Boolean(result.isError) }),
    });
  }

  function notServed(surface: string): Error {
    return new Error(`the tools-harness-tour server serves no ${surface} - tools only.`);
  }

  const client: MCPClient = Object.freeze({
    id: serverIdentity.id,
    serverInfo,
    serverIdentity,
    collisionStrategy: 'auto-prefix' as const,
    sessionIdPresent: false,
    resumable: false,
    listTools,
    // The tour server advertises only the `tools` capability.
    listPrompts: async () => {
      throw notServed('prompts');
    },
    listResources: async () => {
      throw notServed('resources');
    },
    readResource: async () => {
      throw notServed('resources');
    },
    readResourceContents: async () => {
      throw notServed('resources');
    },
    getPrompt: async () => {
      throw notServed('prompts');
    },
    callTool,
    async toTools(toolsOpts?: MCPToToolsOptions): Promise<ReadonlyArray<Tool>> {
      const catalogue = await listTools();
      const adapted = adaptMCPTools({
        client,
        serverIdentity,
        catalogue,
        ...(toolsOpts === undefined ? {} : { options: toolsOpts }),
      });
      return adapted.tools;
    },
    async close(): Promise<void> {
      await sdkClient.close();
    },
  });
  return client;
}
