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

import type { MessageContent, ToolReturn, ZodLikeSchema } from '@graphorin/core';
import { incrementCounter } from '@graphorin/tools/audit';
import type { ServerIdentity } from '../transport/types.js';
import type { MCPCallToolResult, MCPContentPart } from './types.js';

/** Arguments for {@link adaptCallResult}. */
export interface AdaptCallResultArgs {
  readonly result: MCPCallToolResult;
  readonly outputSchema?: ZodLikeSchema<unknown> | undefined;
  readonly serverIdentity: ServerIdentity;
  readonly toolName: string;
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
      resourceLinkPreviews.push(formatResourceLinkPreview(part));
    }
    const messagePart = mcpContentToMessageContent(part);
    if (messagePart !== undefined) contentParts.push(messagePart);
  }
  const textParts = (result.content ?? []).filter(
    (p): p is { type: 'text'; text: string } => p.type === 'text',
  );
  const concatenatedText = [...textParts.map((t) => t.text), ...resourceLinkPreviews].join('\n');

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
    case 'resource_link':
      return { type: 'text', text: formatResourceLinkPreview(part) };
  }
}

/**
 * Render the compact, model-facing preview for a `resource_link`. The
 * `uri` doubles as the `read_result` handle — an
 * {@link import('./mcp-resource-reader.js').createMcpResourceReader}
 * resolves it on demand via {@link MCPClient.readResource}.
 */
function formatResourceLinkPreview(
  part: Extract<MCPContentPart, { type: 'resource_link' }>,
): string {
  const label = part.title === undefined || part.title.length === 0 ? part.name : part.title;
  const meta: string[] = [];
  if (part.mimeType !== undefined) meta.push(part.mimeType);
  if (part.size !== undefined) meta.push(`${part.size} bytes`);
  const metaStr = meta.length === 0 ? '' : ` (${meta.join(', ')})`;
  const desc =
    part.description === undefined || part.description.length === 0 ? '' : ` — ${part.description}`;
  return `[resource_link] ${label}${metaStr}${desc}\nFetch the full contents on demand with read_result, handle: ${part.uri}`;
}

function decodeBase64(value: string): Uint8Array {
  return Uint8Array.from(Buffer.from(value, 'base64'));
}
