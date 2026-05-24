/**
 * {@link createMcpResourceReader} — resolve MCP `resource_link` handles
 * on demand (WI-13 / P2-2, ties to WI-10 result handles).
 *
 * The `toTools()` adapter surfaces an MCP `resource_link` as a preview +
 * the resource `uri` (the {@link import('@graphorin/tools/result').ResultReader}
 * handle) instead of inlining the body. This reader resolves that handle
 * via {@link MCPClient.readResource} when the model later calls the
 * built-in `read_result` tool — so a large MCP resource never inflates
 * context until the model actually asks for it.
 *
 * Compose it with the agent's spill-file reader (the agent tries each
 * configured reader in order): the spill reader claims
 * `graphorin-spill:` handles, this reader resolves the rest. With more
 * than one MCP client, the reader tries each until one server resolves
 * the URI.
 *
 * Network note (R4): this reader performs no I/O until `read(...)` is
 * called, and then only over a connection the operator already opened.
 *
 * @packageDocumentation
 */

import { incrementCounter } from '@graphorin/tools/audit';
import type { ResultReader, ResultReadOutcome, ResultReadRange } from '@graphorin/tools/result';
import type { MCPClient, MCPResourceContent } from './types.js';

/** Configuration for {@link createMcpResourceReader}. */
export interface McpResourceReaderOptions {
  /** Clients consulted (in order) to resolve a resource URI. */
  readonly clients: ReadonlyArray<MCPClient>;
  /** Default `maxBytes` when `read(...)` is called without one. Default `65536`. */
  readonly defaultMaxBytes?: number;
}

/**
 * Build a {@link ResultReader} that resolves MCP resource URIs through
 * one or more connected {@link MCPClient}s.
 *
 * @stable
 */
export function createMcpResourceReader(opts: McpResourceReaderOptions): ResultReader {
  const clients = [...opts.clients];
  const defaultMaxBytes = opts.defaultMaxBytes ?? 65_536;
  return {
    async read(uri, range): Promise<ResultReadOutcome> {
      if (clients.length === 0) {
        throw new Error(
          'createMcpResourceReader: no MCP clients configured to resolve resource handles.',
        );
      }
      let lastError: unknown;
      for (const client of clients) {
        let content: MCPResourceContent;
        try {
          content = await client.readResource(uri);
        } catch (err) {
          lastError = err;
          continue;
        }
        incrementCounter('mcp.resource-link.resolved.total', {
          server: client.serverIdentity.id,
        });
        return sliceResource(content, range, defaultMaxBytes);
      }
      const suffix = lastError instanceof Error ? ` Last error: ${lastError.message}` : '';
      throw new Error(
        `createMcpResourceReader: no configured MCP server resolved resource ${JSON.stringify(uri)}.${suffix}`,
      );
    },
  };
}

/** Prefer the text body; fall back to the (base64) blob payload. */
function resourceBody(content: MCPResourceContent): string {
  if (content.text !== undefined) return content.text;
  if (content.blob !== undefined) return content.blob;
  return '';
}

/**
 * Apply a {@link ResultReadRange} to the fully-fetched resource body,
 * mirroring the spill-file reader's slicing semantics (line mode wins;
 * `maxBytes` caps the returned slice) so `read_result` pages uniformly.
 */
function sliceResource(
  content: MCPResourceContent,
  range: ResultReadRange | undefined,
  defaultMaxBytes: number,
): ResultReadOutcome {
  const full = resourceBody(content);
  const buf = Buffer.from(full, 'utf8');
  const totalBytes = buf.byteLength;
  const cap = Math.max(0, range?.maxBytes ?? defaultMaxBytes);

  if (range?.startLine !== undefined || range?.endLine !== undefined) {
    const lines = full.split('\n');
    const start = Math.max(1, range.startLine ?? 1);
    const end = Math.min(lines.length, range.endLine ?? lines.length);
    const selected = start <= end ? lines.slice(start - 1, end).join('\n') : '';
    const capped = Buffer.byteLength(selected, 'utf8') > cap;
    const out = capBytes(selected, cap);
    return Object.freeze({
      content: out,
      bytes: Buffer.byteLength(out, 'utf8'),
      totalBytes,
      eof: end >= lines.length && !capped,
    });
  }

  const offset = clamp(range?.offset ?? 0, 0, totalBytes);
  const requested = range?.length ?? totalBytes - offset;
  const rawEnd = clamp(offset + Math.max(0, requested), offset, totalBytes);
  const end = Math.min(rawEnd, offset + cap);
  const slice = buf.subarray(offset, end);
  return Object.freeze({
    content: slice.toString('utf8'),
    bytes: slice.byteLength,
    totalBytes,
    eof: end >= totalBytes,
  });
}

function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

/** Truncate `s` to at most `maxBytes` UTF-8 bytes (tolerating a split trailing char). */
function capBytes(s: string, maxBytes: number): string {
  if (Buffer.byteLength(s, 'utf8') <= maxBytes) return s;
  return Buffer.from(s, 'utf8').subarray(0, maxBytes).toString('utf8');
}
