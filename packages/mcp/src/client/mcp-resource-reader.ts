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
  /**
   * mcp-skills-06: allow a BARE (unscoped) resource URI to be tried
   * against every configured client. Default `false` — handles minted
   * by the adapter are scoped (`mcp:<serverId>:<uri>`) and resolve
   * ONLY against their originating server, so a malicious server's
   * link (or a prompt-injected model) cannot fetch a resource from a
   * different, more-trusted server (the cross-server confused-deputy
   * hop). Enable only when you accept that risk for legacy handles.
   */
  readonly allowCrossServer?: boolean;
}

/** Scoped-handle grammar minted by the tool adapter: `mcp:<serverId>:<uri>`. */
const SCOPED_HANDLE = /^mcp:([^:]+):(.+)$/;

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
    async read(handle, range): Promise<ResultReadOutcome> {
      if (clients.length === 0) {
        throw new Error(
          'createMcpResourceReader: no MCP clients configured to resolve resource handles.',
        );
      }
      // mcp-skills-06: a scoped handle (`mcp:<serverId>:<uri>`) resolves
      // ONLY against its originating server. The try-every-client loop
      // survives solely for bare URIs behind the explicit
      // `allowCrossServer` opt-in.
      const scoped = SCOPED_HANDLE.exec(handle);
      let uri = handle;
      let candidates = clients;
      if (scoped !== null) {
        const serverId = scoped[1] ?? '';
        uri = scoped[2] ?? '';
        candidates = clients.filter((c) => c.serverIdentity.id === serverId);
        if (candidates.length === 0) {
          throw new Error(
            `createMcpResourceReader: no configured client matches the handle's server ` +
              `'${serverId}' — a handle only resolves against its originating server.`,
          );
        }
      } else if (opts.allowCrossServer !== true) {
        throw new Error(
          `createMcpResourceReader: refusing to resolve the unscoped resource URI ` +
            `${JSON.stringify(handle)} against every configured server (cross-server ` +
            `confused-deputy risk). Use the scoped handle from the tool result ` +
            `('mcp:<serverId>:<uri>'), or opt in with allowCrossServer: true.`,
        );
      }
      let lastError: unknown;
      for (const client of candidates) {
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

/**
 * Raw resource bytes (MC-10): text resources as UTF-8, blob resources
 * DECODED from base64 — slicing/totalBytes operate on real payload
 * bytes, never on the ~33%-inflated base64 string (whose arbitrary
 * cuts also break base64 quads).
 */
function resourceBytes(content: MCPResourceContent): Buffer {
  if (content.text !== undefined) return Buffer.from(content.text, 'utf8');
  if (content.blob !== undefined) return Buffer.from(content.blob, 'base64');
  return Buffer.alloc(0);
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
  const buf = resourceBytes(content);
  const full = buf.toString('utf8');
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
      // TL-6: MCP resource content is mcp-derived by definition — the
      // executor re-applies inbound sanitization + dataflow provenance
      // by this class when read_result relays it.
      producerTrustClass: 'mcp-derived' as const,
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
    // TL-6: MCP resource content is mcp-derived by definition.
    producerTrustClass: 'mcp-derived' as const,
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
