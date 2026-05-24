/**
 * Client-side request handlers for server-initiated MCP requests
 * (WI-13 / P2-2): **elicitation** (`elicitation/create`) and **sampling**
 * (`sampling/createMessage`).
 *
 * Both are gated: the client advertises a capability and registers a
 * handler *only* when the operator supplies the matching callback on
 * {@link CreateMCPClientOptions}. A conforming server will not issue a
 * request for an un-advertised capability, so the default client is inert
 * (no implicit prompting, no implicit model calls — R4).
 *
 * The SDK request/result schemas are kept inside this module; the public
 * surface speaks only the Graphorin-typed {@link MCPElicitationRequest} /
 * {@link MCPSamplingRequest} boundary.
 *
 * @packageDocumentation
 */

import { incrementCounter } from '@graphorin/tools/audit';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import {
  type ClientCapabilities,
  CreateMessageRequestSchema,
  ElicitRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type {
  MCPElicitationHandler,
  MCPSamplingContent,
  MCPSamplingHandler,
  MCPSamplingRequest,
} from './types.js';

/** Mutable holder so handlers can label counters with the server id. */
export interface ServerIdRef {
  current: string;
}

/** Options for {@link registerClientRequestHandlers}. */
export interface ClientRequestHandlerOptions {
  readonly elicitation?: MCPElicitationHandler;
  readonly sampling?: MCPSamplingHandler;
  readonly serverIdRef: ServerIdRef;
}

/**
 * Compute the {@link ClientCapabilities} to advertise on `initialize`,
 * based on which server-initiated handlers the operator supplied.
 * Returns `undefined` when none are configured (advertise nothing).
 */
export function computeClientCapabilities(opts: {
  readonly elicitation?: unknown;
  readonly sampling?: unknown;
}): ClientCapabilities | undefined {
  if (opts.elicitation === undefined && opts.sampling === undefined) return undefined;
  return {
    ...(opts.elicitation === undefined ? {} : { elicitation: {} }),
    ...(opts.sampling === undefined ? {} : { sampling: {} }),
  };
}

/**
 * Register the elicitation / sampling request handlers on `sdkClient`,
 * one per supplied callback. Must be called **before** `connect(...)` so
 * the handlers are in place when the session begins delivering
 * server-initiated requests.
 */
export function registerClientRequestHandlers(
  sdkClient: Client,
  opts: ClientRequestHandlerOptions,
): void {
  const { serverIdRef } = opts;

  if (opts.elicitation !== undefined) {
    const handler = opts.elicitation;
    sdkClient.setRequestHandler(ElicitRequestSchema, async (request, extra) => {
      incrementCounter('mcp.elicitation.requested.total', { server: serverIdRef.current });
      const params = request.params;
      const requestedSchema =
        'requestedSchema' in params && params.requestedSchema !== undefined
          ? (params.requestedSchema as Readonly<Record<string, unknown>>)
          : { type: 'object', properties: {} };
      const result = await handler(
        { message: params.message, requestedSchema },
        { signal: extra.signal },
      );
      if (result.action === 'accept') {
        incrementCounter('mcp.elicitation.accepted.total', { server: serverIdRef.current });
        return result.content === undefined
          ? { action: 'accept' }
          : { action: 'accept', content: result.content };
      }
      incrementCounter('mcp.elicitation.declined.total', {
        server: serverIdRef.current,
        action: result.action,
      });
      return { action: result.action };
    });
  }

  if (opts.sampling !== undefined) {
    const handler = opts.sampling;
    sdkClient.setRequestHandler(CreateMessageRequestSchema, async (request, extra) => {
      incrementCounter('mcp.sampling.requested.total', { server: serverIdRef.current });
      const p = request.params;
      const mp = p.modelPreferences;
      const samplingRequest: MCPSamplingRequest = {
        messages: p.messages.map((m) => ({
          role: m.role,
          content: toGraphorinContent(firstContentBlock(m.content)),
        })),
        maxTokens: p.maxTokens,
        ...(p.systemPrompt === undefined ? {} : { systemPrompt: p.systemPrompt }),
        ...(p.temperature === undefined ? {} : { temperature: p.temperature }),
        ...(p.stopSequences === undefined ? {} : { stopSequences: p.stopSequences }),
        ...(mp === undefined
          ? {}
          : {
              modelPreferences: {
                ...(mp.hints === undefined
                  ? {}
                  : { hints: mp.hints.map((h) => (h.name === undefined ? {} : { name: h.name })) }),
                ...(mp.costPriority === undefined ? {} : { costPriority: mp.costPriority }),
                ...(mp.speedPriority === undefined ? {} : { speedPriority: mp.speedPriority }),
                ...(mp.intelligencePriority === undefined
                  ? {}
                  : { intelligencePriority: mp.intelligencePriority }),
              },
            }),
        ...(p.includeContext === undefined ? {} : { includeContext: p.includeContext }),
      };
      const result = await handler(samplingRequest, { signal: extra.signal });
      incrementCounter('mcp.sampling.completed.total', { server: serverIdRef.current });
      return {
        role: result.role,
        content: result.content,
        model: result.model,
        ...(result.stopReason === undefined ? {} : { stopReason: result.stopReason }),
      };
    });
  }
}

/** Narrow an SDK message content (block | block[]) to a single block. */
function firstContentBlock(content: unknown): { readonly type?: unknown; [k: string]: unknown } {
  const block = Array.isArray(content) ? content[0] : content;
  if (block !== null && typeof block === 'object') {
    return block as { readonly type?: unknown; [k: string]: unknown };
  }
  return { type: 'text', text: '' };
}

/** Map an SDK content block to the Graphorin sampling-content union. */
function toGraphorinContent(block: {
  readonly type?: unknown;
  [k: string]: unknown;
}): MCPSamplingContent {
  if (block.type === 'image') {
    return {
      type: 'image',
      data: String(block.data ?? ''),
      mimeType: String(block.mimeType ?? 'application/octet-stream'),
    };
  }
  if (block.type === 'audio') {
    return {
      type: 'audio',
      data: String(block.data ?? ''),
      mimeType: String(block.mimeType ?? 'application/octet-stream'),
    };
  }
  if (block.type === 'text') {
    return { type: 'text', text: String(block.text ?? '') };
  }
  return { type: 'text', text: JSON.stringify(block) };
}
