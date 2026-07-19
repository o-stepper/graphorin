/**
 * Helpers for deriving stable {@link ServerIdentity} records from the
 * supplied {@link MCPTransportConfig}, plus the operator-facing
 * formatter the audit emitter and the trace span attributes use.
 *
 * @packageDocumentation
 */

import { createHash } from 'node:crypto';

import type {
  MCPTransportConfig,
  ServerIdentity,
  SseTransportConfig,
  StdioTransportConfig,
  StreamableHttpTransportConfig,
} from '../transport/types.js';

/**
 * Compute the canonical {@link ServerIdentity} for the supplied
 * transport. The id is suitable for use as a registry key and as the
 * operator-facing label in audit rows + trace attributes.
 *
 * The id derives ONLY from operator-controlled data (the
 * transport config) plus the optional operator-supplied
 * `serverInfoName` override. The name a server self-reports on
 * `initialize` never participates: every security-relevant surface
 * keys off this id (TOFU pins, `mcp:<id>:<uri>` handle scoping, taint
 * labels, audit rows), and a server-controlled id let a rug-pull
 * server mint a fresh TOFU record by renaming itself, or impersonate a
 * trusted server's scope by claiming its name. HTTP-family ids include
 * a non-default port, so localhost:3001 and localhost:3002 are
 * distinct servers.
 *
 * @stable
 */
export function deriveServerIdentity(
  transport: MCPTransportConfig,
  serverInfoName?: string,
): ServerIdentity {
  switch (transport.kind) {
    case 'stdio':
      return deriveStdioIdentity(transport, serverInfoName);
    case 'streamable-http':
      return deriveStreamableHttpIdentity(transport, serverInfoName);
    case 'sse':
      return deriveSseIdentity(transport, serverInfoName);
  }
}

function deriveStdioIdentity(
  transport: StdioTransportConfig,
  serverInfoName?: string,
): ServerIdentity {
  const argsHash = createHash('sha256')
    .update((transport.args ?? []).join('\u0000'))
    .digest('hex')
    .slice(0, 16);
  const command = basenameWithoutExt(transport.command);
  const id = serverInfoName ?? `${command}-${argsHash}`;
  return Object.freeze({
    kind: 'mcp-stdio',
    id,
    command,
    argsHash,
    ...(serverInfoName === undefined ? {} : { serverInfoName }),
  });
}

function deriveStreamableHttpIdentity(
  transport: StreamableHttpTransportConfig,
  serverInfoName?: string,
): ServerIdentity {
  const url = new URL(typeof transport.url === 'string' ? transport.url : transport.url.toString());
  const urlHostname = url.hostname;
  const urlPath = url.pathname.length === 0 ? '/' : url.pathname;
  // W-016: `url.host` (hostname:port for non-default ports) - two local
  // servers on different ports must not collide into one identity.
  const id = serverInfoName ?? `${url.host}${urlPath}`;
  return Object.freeze({
    kind: 'mcp-streamable-http',
    id,
    urlHostname,
    urlPath,
    ...(serverInfoName === undefined ? {} : { serverInfoName }),
  });
}

function deriveSseIdentity(transport: SseTransportConfig, serverInfoName?: string): ServerIdentity {
  const url = new URL(typeof transport.url === 'string' ? transport.url : transport.url.toString());
  const urlHostname = url.hostname;
  const urlPath = url.pathname.length === 0 ? '/' : url.pathname;
  // W-016: see deriveStreamableHttpIdentity - port-inclusive host.
  const id = serverInfoName ?? `${url.host}${urlPath}`;
  return Object.freeze({
    kind: 'mcp-sse',
    id,
    urlHostname,
    urlPath,
    ...(serverInfoName === undefined ? {} : { serverInfoName }),
  });
}

function basenameWithoutExt(command: string): string {
  const slashIdx = Math.max(command.lastIndexOf('/'), command.lastIndexOf('\\'));
  const base = slashIdx === -1 ? command : command.slice(slashIdx + 1);
  const dotIdx = base.lastIndexOf('.');
  return dotIdx <= 0 ? base : base.slice(0, dotIdx);
}

/**
 * Operator-facing single-line label for a {@link MCPTransportConfig}.
 * Suitable for trace attributes, audit rows, and CLI output.
 *
 * @stable
 */
export function formatMCPServerName(transport: MCPTransportConfig): string {
  switch (transport.kind) {
    case 'stdio':
      return `stdio:${basenameWithoutExt(transport.command)}${
        (transport.args ?? []).length === 0 ? '' : ` ${(transport.args ?? []).join(' ')}`
      }`;
    case 'streamable-http':
      return `streamable-http:${typeof transport.url === 'string' ? transport.url : transport.url.toString()}`;
    case 'sse':
      return `sse:${typeof transport.url === 'string' ? transport.url : transport.url.toString()}`;
  }
}
