/**
 * Test fixture: an in-process MCP server instance + an
 * `InMemoryTransport` linked-pair. Tests use this to drive the
 * client without spawning a real child process or opening a real
 * HTTP server.
 *
 * The fixture relies only on the `@modelcontextprotocol/sdk` SDK +
 * `zod` (already a `devDependencies` of the package). It exposes a
 * narrow API the test files can configure per scenario:
 *
 * - `tools`            — the catalogue surfaced by `tools/list`.
 * - `callToolHandler`  — handler invoked on `tools/call`.
 * - `resources`        — the catalogue surfaced by `resources/list`.
 * - `prompts`          — the catalogue surfaced by `prompts/list`.
 * - `getPromptHandler` — handler invoked on `prompts/get`.
 */

import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import {
  CallToolRequestSchema,
  CreateMessageResultSchema,
  ElicitResultSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

/**
 * Server→client helpers handed to {@link InMemoryServerOptions.callToolHandler}
 * so a tool call can drive elicitation / sampling mid-flight (WI-13).
 */
export interface CallToolServerExtra {
  /** Send an `elicitation/create` request to the connected client. */
  elicit(params: {
    message: string;
    requestedSchema: Record<string, unknown>;
  }): Promise<{ action: string; content?: Record<string, unknown> }>;
  /** Send a `sampling/createMessage` request to the connected client. */
  sample(params: Record<string, unknown>): Promise<{
    role: string;
    content: { type: string; [k: string]: unknown };
    model: string;
    stopReason?: string;
  }>;
}

export interface FixtureToolDefinition {
  readonly name: string;
  readonly description?: string;
  readonly inputSchema: Readonly<Record<string, unknown>>;
  readonly outputSchema?: Readonly<Record<string, unknown>>;
}

export interface FixtureResourceDefinition {
  readonly uri: string;
  readonly name?: string;
  readonly description?: string;
  readonly mimeType?: string;
  readonly content?: { readonly text?: string; readonly blob?: string };
}

export interface FixturePromptDefinition {
  readonly name: string;
  readonly description?: string;
  readonly arguments?: ReadonlyArray<{
    readonly name: string;
    readonly description?: string;
    readonly required?: boolean;
  }>;
}

export interface InMemoryServerOptions {
  readonly serverName?: string;
  readonly serverVersion?: string;
  readonly tools?: ReadonlyArray<FixtureToolDefinition>;
  readonly resources?: ReadonlyArray<FixtureResourceDefinition>;
  readonly prompts?: ReadonlyArray<FixturePromptDefinition>;
  readonly callToolHandler?: (
    name: string,
    args: unknown,
    extra: CallToolServerExtra,
  ) => Promise<{
    readonly content: ReadonlyArray<Record<string, unknown>>;
    readonly structuredContent?: Record<string, unknown>;
    readonly isError?: boolean;
  }>;
  readonly getPromptHandler?: (
    name: string,
    args?: Record<string, string>,
  ) => Promise<{
    readonly messages: ReadonlyArray<{
      readonly role: 'user' | 'assistant';
      readonly content: { type: 'text'; text: string };
    }>;
  }>;
}

export interface InMemoryServerFixture {
  readonly clientTransport: Transport;
  readonly server: Server;
  close(): Promise<void>;
}

/**
 * Build an in-process MCP server bound to one half of an
 * `InMemoryTransport.createLinkedPair()`. The other half is returned
 * as `clientTransport`. Tests pass `clientTransport` to the SDK
 * client (or to {@link createMCPClient} via a bypass when the test
 * needs to skip the public transport-factory).
 */
export async function startInMemoryServer(
  opts: InMemoryServerOptions = {},
): Promise<InMemoryServerFixture> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = new Server(
    {
      name: opts.serverName ?? 'graphorin-test-server',
      version: opts.serverVersion ?? '0.0.1',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: (opts.tools ?? []).map((t) => ({
      name: t.name,
      description: t.description ?? '',
      // The MCP spec mandates `inputSchema.type === 'object'` for tool
      // input shapes; the fixture promotes a bare schema upward when
      // the test author leaves it implicit.
      inputSchema:
        t.inputSchema.type === 'object'
          ? t.inputSchema
          : { type: 'object', properties: {}, ...t.inputSchema },
      ...(t.outputSchema === undefined ? {} : { outputSchema: t.outputSchema }),
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req, extra) => {
    const { name, arguments: args } = req.params;
    if (opts.callToolHandler !== undefined) {
      const serverExtra: CallToolServerExtra = {
        elicit: (params) =>
          extra.sendRequest({ method: 'elicitation/create', params }, ElicitResultSchema),
        sample: (params) =>
          extra.sendRequest(
            { method: 'sampling/createMessage', params },
            CreateMessageResultSchema,
          ),
      };
      const result = await opts.callToolHandler(name, args, serverExtra);
      return result;
    }
    return {
      content: [{ type: 'text', text: `called ${name}` }],
    };
  });

  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: (opts.resources ?? []).map((r) => ({
      uri: r.uri,
      ...(r.name === undefined ? {} : { name: r.name }),
      ...(r.description === undefined ? {} : { description: r.description }),
      ...(r.mimeType === undefined ? {} : { mimeType: r.mimeType }),
    })),
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (req) => {
    const uri = req.params.uri;
    const match = (opts.resources ?? []).find((r) => r.uri === uri);
    if (match === undefined) {
      throw new Error(`resource not found: ${uri}`);
    }
    return {
      contents: [
        {
          uri: match.uri,
          ...(match.mimeType === undefined ? {} : { mimeType: match.mimeType }),
          ...(match.content?.text === undefined ? {} : { text: match.content.text }),
          ...(match.content?.blob === undefined ? {} : { blob: match.content.blob }),
        },
      ],
    };
  });

  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: (opts.prompts ?? []).map((p) => ({
      name: p.name,
      ...(p.description === undefined ? {} : { description: p.description }),
      ...(p.arguments === undefined ? {} : { arguments: [...p.arguments] }),
    })),
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (req) => {
    const name = req.params.name;
    if (opts.getPromptHandler !== undefined) {
      const result = await opts.getPromptHandler(name, req.params.arguments);
      return result;
    }
    return {
      messages: [{ role: 'user', content: { type: 'text', text: `prompt:${name}` } }],
    };
  });

  await server.connect(serverTransport);

  return {
    clientTransport,
    server,
    async close() {
      await server.close();
    },
  };
}
