import { describe, expect, it } from 'vitest';

import { buildTransport } from '../src/client/transport-factory.js';

describe('buildTransport', () => {
  it('builds a stdio transport for the stdio config kind', () => {
    const out = buildTransport({
      kind: 'stdio',
      command: '/usr/bin/node',
      args: ['--version'],
      env: { PATH: '/usr/bin' },
      cwd: '/tmp',
      stderr: 'ignore',
    });
    expect(out.transport).toBeDefined();
    expect(out.transport.constructor.name).toBe('StdioClientTransport');
  });

  it('builds a streamable-http transport for the streamable-http config kind', () => {
    const out = buildTransport({
      kind: 'streamable-http',
      url: 'https://example.com/mcp',
      headers: { Authorization: 'Bearer test' },
    });
    expect(out.transport).toBeDefined();
    expect(out.transport.constructor.name).toBe('StreamableHTTPClientTransport');
  });

  it('builds a streamable-http transport with a pre-existing sessionId', () => {
    const out = buildTransport({
      kind: 'streamable-http',
      url: new URL('https://example.com/mcp'),
      sessionId: 'session-123',
    });
    expect(out.transport).toBeDefined();
  });

  it('builds an sse transport for the sse config kind', () => {
    const out = buildTransport({
      kind: 'sse',
      url: 'https://example.com/sse',
      headers: { 'X-Test': 'true' },
    });
    expect(out.transport).toBeDefined();
    expect(out.transport.constructor.name).toBe('SSEClientTransport');
  });
});
