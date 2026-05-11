import { describe, expect, it } from 'vitest';

import { MCPInvalidConfigError, MCPTransportNotSupportedError } from '../src/errors/index.js';
import {
  deriveServerIdentity,
  formatMCPServerName,
  validateMCPServerConfig,
} from '../src/helpers/index.js';

describe('deriveServerIdentity', () => {
  it('produces a stable id for stdio transports', () => {
    const id = deriveServerIdentity({
      kind: 'stdio',
      command: '/usr/local/bin/example-server',
      args: ['--root', '/tmp'],
    });
    expect(id.kind).toBe('mcp-stdio');
    if (id.kind === 'mcp-stdio') {
      expect(id.command).toBe('example-server');
      expect(id.argsHash.length).toBe(16);
      expect(id.id).toContain('example-server-');
    }
  });

  it('produces a stable id for streamable-http transports', () => {
    const id = deriveServerIdentity({
      kind: 'streamable-http',
      url: 'https://example.com/mcp',
    });
    expect(id.kind).toBe('mcp-streamable-http');
    if (id.kind === 'mcp-streamable-http') {
      expect(id.urlHostname).toBe('example.com');
      expect(id.urlPath).toBe('/mcp');
      expect(id.id).toBe('example.com/mcp');
    }
  });

  it('produces a stable id for sse transports', () => {
    const id = deriveServerIdentity({
      kind: 'sse',
      url: new URL('https://sse.example.com/api/mcp'),
    });
    expect(id.kind).toBe('mcp-sse');
  });

  it('honours an operator-supplied serverInfoName', () => {
    const id = deriveServerIdentity(
      {
        kind: 'streamable-http',
        url: 'https://example.com/mcp',
      },
      'linear-mcp',
    );
    expect(id.id).toBe('linear-mcp');
    expect(id.serverInfoName).toBe('linear-mcp');
  });
});

describe('formatMCPServerName', () => {
  it('renders a single-line label for stdio transports', () => {
    const label = formatMCPServerName({
      kind: 'stdio',
      command: 'node',
      args: ['./server.js', '--port', '0'],
    });
    expect(label).toBe('stdio:node ./server.js --port 0');
  });

  it('renders a single-line label for streamable-http transports', () => {
    expect(
      formatMCPServerName({
        kind: 'streamable-http',
        url: 'https://example.com/mcp',
      }),
    ).toBe('streamable-http:https://example.com/mcp');
  });

  it('renders a single-line label for sse transports', () => {
    expect(
      formatMCPServerName({
        kind: 'sse',
        url: 'https://sse.example.com/api',
      }),
    ).toBe('sse:https://sse.example.com/api');
  });
});

describe('validateMCPServerConfig', () => {
  it('rejects a stdio transport without a command', () => {
    expect(() =>
      validateMCPServerConfig({
        transport: { kind: 'stdio', command: '' },
      }),
    ).toThrow(MCPInvalidConfigError);
  });

  it('rejects HTTP transports with an unsupported scheme', () => {
    expect(() =>
      validateMCPServerConfig({
        transport: { kind: 'streamable-http', url: 'ftp://example.com/mcp' },
      }),
    ).toThrow(MCPInvalidConfigError);
  });

  it('rejects HTTP transports with an empty url', () => {
    expect(() =>
      validateMCPServerConfig({
        transport: { kind: 'streamable-http', url: '' },
      }),
    ).toThrow(MCPInvalidConfigError);
  });

  it('rejects resumable: true on the stdio transport', () => {
    expect(() =>
      validateMCPServerConfig({
        transport: { kind: 'stdio', command: 'node' },
        resumable: true,
      }),
    ).toThrow(MCPTransportNotSupportedError);
  });

  it('rejects resumable: true on the deprecated sse transport', () => {
    expect(() =>
      validateMCPServerConfig({
        transport: { kind: 'sse', url: 'https://example.com/mcp' },
        resumable: true,
      }),
    ).toThrow(MCPTransportNotSupportedError);
  });

  it('accepts a valid streamable-http transport without resumable', () => {
    expect(() =>
      validateMCPServerConfig({
        transport: { kind: 'streamable-http', url: 'https://example.com/mcp' },
      }),
    ).not.toThrow();
  });

  it('accepts a valid stdio transport with arguments', () => {
    expect(() =>
      validateMCPServerConfig({
        transport: { kind: 'stdio', command: 'node', args: ['server.js'] },
      }),
    ).not.toThrow();
  });
});
