/**
 * `validateMCPServerConfig(...)` — sanity-check a transport configuration
 * before {@link createMCPClient} runs the network-level handshake.
 *
 * The validator catches the most common configuration mistakes
 * (missing url for HTTP transports, empty command for stdio,
 * unsupported `resumable: true` for stdio / sse, …) and surfaces them
 * as {@link MCPInvalidConfigError} so the operator does not have to
 * read a transport-specific stack trace.
 *
 * @packageDocumentation
 */

import { MCPInvalidConfigError, MCPTransportNotSupportedError } from '../errors/index.js';
import type { MCPTransportConfig } from '../transport/types.js';

/**
 * Throws {@link MCPInvalidConfigError} on invalid configuration.
 *
 * @stable
 */
export function validateMCPServerConfig(opts: {
  readonly transport: MCPTransportConfig;
  readonly resumable?: boolean;
}): void {
  validateTransport(opts.transport);
  if (opts.resumable === true) {
    if (opts.transport.kind === 'stdio') {
      throw new MCPTransportNotSupportedError(
        'Resumable streaming sessions are not supported on the stdio transport.',
        {
          variant: 'transport-resumable-not-supported',
          metadata: { transport: 'stdio' },
          hint: 'Use the streamable-http transport when you need Mcp-Session-Id + Last-Event-ID resume semantics.',
        },
      );
    }
    if (opts.transport.kind === 'sse') {
      throw new MCPTransportNotSupportedError(
        'Resumable streaming sessions are not supported on the deprecated sse transport.',
        {
          variant: 'transport-resumable-not-supported',
          metadata: { transport: 'sse' },
          hint: 'Migrate to the streamable-http transport for resumable session support.',
        },
      );
    }
  }
}

function validateTransport(transport: MCPTransportConfig): void {
  switch (transport.kind) {
    case 'stdio': {
      if (typeof transport.command !== 'string' || transport.command.length === 0) {
        throw new MCPInvalidConfigError('stdio transport requires a non-empty `command`.', {
          metadata: { transport: 'stdio' },
        });
      }
      if (transport.args !== undefined && !Array.isArray(transport.args)) {
        throw new MCPInvalidConfigError('stdio transport `args` must be an array of strings.', {
          metadata: { transport: 'stdio' },
        });
      }
      return;
    }
    case 'streamable-http':
    case 'sse': {
      if (transport.url === undefined || transport.url === null || transport.url === '') {
        throw new MCPInvalidConfigError(
          `${transport.kind} transport requires a non-empty \`url\`.`,
          {
            metadata: { transport: transport.kind },
          },
        );
      }
      try {
        const candidate =
          typeof transport.url === 'string' ? new URL(transport.url) : transport.url;
        if (candidate.protocol !== 'http:' && candidate.protocol !== 'https:') {
          throw new MCPInvalidConfigError(
            `${transport.kind} transport \`url\` must use http: or https: (got ${candidate.protocol}).`,
            { metadata: { transport: transport.kind } },
          );
        }
      } catch (cause) {
        if (cause instanceof MCPInvalidConfigError) throw cause;
        throw new MCPInvalidConfigError(`${transport.kind} transport \`url\` is not a valid URL.`, {
          metadata: { transport: transport.kind },
          cause,
        });
      }
      return;
    }
  }
}
