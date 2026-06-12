/**
 * MC-2 regression: `authProvider` / `bearerToken` must be forwarded into
 * the streamable-http / sse transports and resolve the `Authorization`
 * header on *every* outgoing request (per-request token refresh), and
 * passing both must throw a typed config error.
 */
import { describe, expect, it } from 'vitest';
import { createMCPClient } from '../src/client/client.js';
import { buildTransport, type TransportAuthSource } from '../src/client/transport-factory.js';
import { MCPInvalidConfigError } from '../src/errors/index.js';
import type { OAuthAuthorizationProvider } from '../src/oauth/bridge.js';

/**
 * Drive the SDK transport's outbound request path by issuing a
 * `start()` on a streamable-http transport. The SDK opens a GET SSE
 * stream on start, which routes through the (wrapped) fetch. We capture
 * the `Authorization` header the wrapper injected on each call.
 */
async function captureAuthHeaders(opts: {
  readonly auth: TransportAuthSource;
  readonly calls: number;
}): Promise<string[]> {
  const seen: string[] = [];
  const fetchSpy: typeof fetch = (async (_url: unknown, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    seen.push(headers.get('authorization') ?? '');
    // Return a benign empty SSE/JSON response so the SDK does not throw
    // before our wrapper has run.
    return new Response('', { status: 200, headers: { 'content-type': 'text/event-stream' } });
  }) as unknown as typeof fetch;

  const built = buildTransport(
    {
      kind: 'streamable-http',
      url: 'https://mcp.example.com/v1',
      fetch: fetchSpy,
    },
    { auth: opts.auth },
  );

  // The SDK installs our wrapped fetch as `_fetch` and routes every
  // outbound request through it. We invoke that exact wrapped fetch
  // `calls` times to exercise the per-request path deterministically
  // (no live server handshake required).
  const wrapped = (built.transport as unknown as { _fetch?: typeof fetch })._fetch;
  expect(wrapped).toBeDefined();
  for (let i = 0; i < opts.calls; i++) {
    await (wrapped as typeof fetch)('https://mcp.example.com/v1', {
      method: 'POST',
      headers: {},
    });
  }
  return seen;
}

describe('MC-2: auth passthrough into the MCP transport', () => {
  it('resolves the Authorization header on every outgoing request via authProvider', async () => {
    let token = 'tok-1';
    const provider: OAuthAuthorizationProvider = Object.freeze({
      serverId: 'example-mcp',
      async resolveHeader() {
        return `Bearer ${token}`;
      },
      async refresh() {
        throw new Error('not used');
      },
    });

    const headers = await captureAuthHeaders({ auth: provider, calls: 3 });
    expect(headers).toEqual(['Bearer tok-1', 'Bearer tok-1', 'Bearer tok-1']);

    // Rotate the token in the provider; the very next request must carry
    // the new token — no client re-creation.
    token = 'tok-2';
    const after = await captureAuthHeaders({ auth: provider, calls: 1 });
    expect(after).toEqual(['Bearer tok-2']);
  });

  it('forwards a static bearerToken on every request', async () => {
    // Mirrors how createMCPClient wraps a static `bearerToken` into a
    // constant `Bearer`-prefixed resolver.
    const headers = await captureAuthHeaders({
      auth: { resolveHeader: () => 'Bearer static-xyz' },
      calls: 2,
    });
    expect(headers).toEqual(['Bearer static-xyz', 'Bearer static-xyz']);
  });

  it('throws a typed config error when both authProvider and bearerToken are supplied', async () => {
    const provider: OAuthAuthorizationProvider = Object.freeze({
      serverId: 'example-mcp',
      async resolveHeader() {
        return 'Bearer x';
      },
      async refresh() {
        throw new Error('not used');
      },
    });
    await expect(
      createMCPClient({
        transport: { kind: 'streamable-http', url: 'https://mcp.example.com/v1' },
        authProvider: provider,
        bearerToken: 'static-xyz',
      }),
    ).rejects.toBeInstanceOf(MCPInvalidConfigError);
  });

  it('threads bearerToken to the wire through the public createMCPClient entry point', async () => {
    let sawAuth: string | null = null;
    const fetchSpy: typeof fetch = (async (_url: unknown, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      sawAuth = headers.get('authorization');
      // Fail the handshake AFTER the wrapper ran so we can assert the
      // injected header without standing up a live MCP server.
      return new Response('nope', { status: 401 });
    }) as unknown as typeof fetch;

    await expect(
      createMCPClient({
        transport: {
          kind: 'streamable-http',
          url: 'https://mcp.example.com/v1',
          fetch: fetchSpy,
        },
        bearerToken: 'wire-token',
      }),
    ).rejects.toBeDefined();
    expect(sawAuth).toBe('Bearer wire-token');
  });

  it('rejects authProvider / bearerToken on the stdio transport', async () => {
    await expect(
      createMCPClient({
        transport: { kind: 'stdio', command: '/usr/bin/true' },
        bearerToken: 'static-xyz',
      }),
    ).rejects.toBeInstanceOf(MCPInvalidConfigError);
  });

  it('exposes no dead resolveAuthHeader field on the built transport', () => {
    const built = buildTransport({
      kind: 'streamable-http',
      url: 'https://mcp.example.com/v1',
    });
    expect('resolveAuthHeader' in built).toBe(false);
  });
});
