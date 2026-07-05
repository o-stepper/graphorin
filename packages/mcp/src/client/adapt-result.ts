/**
 * Result adaptation for the `toTools()` adapter (extracted from
 * `to-tools.ts` per F-MCP-001).
 *
 * Converts an MCP `CallToolResult` into a typed Graphorin `ToolReturn`,
 * handling the structured-content + outputSchema round-trip and the
 * backward-compatible TextContent mirror, and mapping each MCP content
 * part onto a Graphorin {@link MessageContent}.
 *
 * @packageDocumentation
 */

import type {
  InboundSanitizationPolicy,
  MessageContent,
  ToolReturn,
  ZodLikeSchema,
} from '@graphorin/core';
import { incrementCounter } from '@graphorin/tools/audit';
import { applyInboundSanitization } from '@graphorin/tools/inbound';
import { MCPToolExecutionError } from '../errors/index.js';
import type { ServerIdentity } from '../transport/types.js';
import type { MCPCallToolResult, MCPContentPart } from './types.js';

/** Arguments for {@link adaptCallResult}. */
export interface AdaptCallResultArgs {
  readonly result: MCPCallToolResult;
  readonly outputSchema?: ZodLikeSchema<unknown> | undefined;
  readonly serverIdentity: ServerIdentity;
  readonly toolName: string;
  /**
   * Effective per-server inbound-sanitization policy, applied to the
   * `isError` text before it rides into `MCPToolExecutionError` (the
   * executor never sanitizes the error path, so the trust-aware MCP
   * boundary must). Defaults to the MCP-strict
   * `'detect-and-strip-and-wrap'` when omitted.
   */
  readonly inboundSanitization?: InboundSanitizationPolicy;
  readonly logger?: (
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    fields?: Record<string, unknown>,
  ) => void;
}

/**
 * Convert an MCP `CallToolResult` into a typed Graphorin `ToolReturn`,
 * handling the structured-content + outputSchema round-trip and the
 * backward-compatible TextContent mirror.
 *
 * @internal
 */
export function adaptCallResult(args: AdaptCallResultArgs): ToolReturn<unknown> {
  const { result, outputSchema, serverIdentity, toolName } = args;
  // MC-4: the SDK deliberately does NOT throw on isError results - the
  // failure marker must not launder into a successful ToolReturn. Throw
  // the typed error so the executor records a real failure; the server's
  // text rides in the message for model self-correction.
  if (result.isError === true) {
    const errorText = (result.content ?? [])
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join('\n');
    incrementCounter('mcp.call.tool-error.total', {
      server: serverIdentity.id,
      tool: toolName,
    });
    // W-017: the error text is mcp-derived and reaches the model as
    // `ToolError.message` WITHOUT passing the executor's success-path
    // sanitization (`describe(executeError)` never sanitizes - it
    // cannot tell an untrusted MCP error apart from a trusted
    // first-party one). The trust class IS known here, so sanitize at
    // the source with the same policy the adapted tool declares:
    // parity with the success path, including an operator's explicit
    // `pass-through` override.
    let message = errorText;
    if (errorText.length > 0) {
      const outcome = applyInboundSanitization({
        body: errorText,
        policy: args.inboundSanitization ?? 'detect-and-strip-and-wrap',
        trustClass: 'mcp-derived',
        toolName,
        contentOrigin: `mcp:tool-error:${serverIdentity.id}`,
        failClosed: false,
      });
      if (outcome.patternsHit.length > 0) {
        incrementCounter('mcp.tool-error.injection-flagged.total', {
          server: serverIdentity.id,
          tool: toolName,
        });
      }
      message = outcome.body;
    }
    throw new MCPToolExecutionError(
      message.length > 0 ? message : `MCP tool '${toolName}' reported an error result.`,
      { metadata: { tool: toolName } },
    );
  }
  const contentParts: MessageContent[] = [];
  // `resource_link` parts are NOT inlined: each contributes a compact
  // preview (carrying the `uri` as a result handle) so the model fetches
  // the body on demand via `read_result` instead of inflating context.
  const resourceLinkPreviews: string[] = [];
  for (const part of result.content) {
    if (part.type === 'resource_link') {
      incrementCounter('mcp.resource-link.emitted.total', {
        server: serverIdentity.id,
        tool: toolName,
      });
      resourceLinkPreviews.push(formatResourceLinkPreview(part, serverIdentity.id));
    }
    const messagePart = mcpContentToMessageContent(part, serverIdentity.id);
    if (messagePart !== undefined) contentParts.push(messagePart);
  }
  const textParts = (result.content ?? []).filter(
    (p): p is { type: 'text'; text: string } => p.type === 'text',
  );
  // MC-8: the typed `output` is the ONLY channel the agent loop
  // serialises into the tool message - non-text parts must leave a
  // text trace there (the full payloads stay in `contentParts`), and
  // embedded resource TEXT joins the concatenation outright.
  const outputSegments: string[] = [];
  for (const part of result.content ?? []) {
    switch (part.type) {
      case 'text':
        outputSegments.push(part.text);
        break;
      case 'image':
      case 'audio':
        outputSegments.push(describeBinaryPart(part.type, part.mimeType, part.data));
        break;
      case 'resource': {
        if (part.resource.text !== undefined) {
          outputSegments.push(part.resource.text);
        } else if (part.resource.blob !== undefined) {
          outputSegments.push(
            `[resource ${part.resource.uri} ${part.resource.mimeType ?? 'application/octet-stream'}, ~${approxDecodedSize(part.resource.blob)} - full payload in contentParts]`,
          );
        } else {
          outputSegments.push(`Resource ${part.resource.uri}`);
        }
        break;
      }
      case 'resource_link':
        // Joined below via the read_result preview.
        break;
    }
  }
  const concatenatedText = [...outputSegments, ...resourceLinkPreviews].join('\n');

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
      // MC-11: a schema mismatch must not silently drop the payload -
      // log and mirror the structured content as JSON text, exactly
      // like the no-schema branch does.
      args.logger?.(
        'warn',
        'mcp.structured-content.validation.failed: payload mirrored as JSON text',
        { server: serverIdentity.id, tool: toolName },
      );
      const fallbackParts = [...contentParts];
      if (textParts.length === 0) {
        fallbackParts.push({ type: 'text', text: JSON.stringify(result.structuredContent) });
      }
      return Object.freeze({
        output:
          concatenatedText.length > 0 ? concatenatedText : JSON.stringify(result.structuredContent),
        contentParts: Object.freeze(fallbackParts),
      });
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

function mcpContentToMessageContent(
  part: MCPContentPart,
  serverId: string,
): MessageContent | undefined {
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
    case 'resource_link':
      return { type: 'text', text: formatResourceLinkPreview(part, serverId) };
  }
}

/**
 * Render the compact, model-facing preview for a `resource_link`. The
 * handle is SCOPED to the originating server (mcp-skills-06):
 * `mcp:<serverId>:<uri>` - an
 * {@link import('./mcp-resource-reader.js').createMcpResourceReader}
 * parses the prefix and consults ONLY that server, so a malicious
 * server's link (or a prompt-injected model) cannot fetch a resource
 * from a different, more-trusted server through the handle.
 */
function formatResourceLinkPreview(
  part: Extract<MCPContentPart, { type: 'resource_link' }>,
  serverId: string,
): string {
  const label = part.title === undefined || part.title.length === 0 ? part.name : part.title;
  const meta: string[] = [];
  if (part.mimeType !== undefined) meta.push(part.mimeType);
  if (part.size !== undefined) meta.push(`${part.size} bytes`);
  const metaStr = meta.length === 0 ? '' : ` (${meta.join(', ')})`;
  const desc =
    part.description === undefined || part.description.length === 0 ? '' : ` - ${part.description}`;
  return `[resource_link] ${label}${metaStr}${desc}\nFetch the full contents on demand with read_result, handle: ${scopedResourceHandle(serverId, part.uri)}`;
}

/**
 * Build the server-scoped `read_result` handle for an MCP resource
 * (mcp-skills-06): `mcp:<serverId>:<uri>`.
 *
 * @stable
 */
export function scopedResourceHandle(serverId: string, uri: string): string {
  return `mcp:${serverId}:${uri}`;
}

/** Human-readable size of a base64 payload's decoded bytes (MC-8). */
function approxDecodedSize(base64: string): string {
  const bytes = Math.floor((base64.length * 3) / 4);
  return bytes >= 1024 ? `${Math.round(bytes / 1024)}kB` : `${bytes}B`;
}

/** Text descriptor for a non-text content part (MC-8). */
function describeBinaryPart(kind: 'image' | 'audio', mimeType: string, data: string): string {
  return `[${kind} ${mimeType}, ~${approxDecodedSize(data)} - full payload in contentParts]`;
}

function decodeBase64(value: string): Uint8Array {
  return Uint8Array.from(Buffer.from(value, 'base64'));
}
