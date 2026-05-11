import { describe, expect, it } from 'vitest';

import { deriveServerIdentity, formatMCPServerName } from '../src/helpers/identity.js';

describe('deriveServerIdentity — edge cases', () => {
  it('strips trailing extensions from a stdio command basename', () => {
    const id = deriveServerIdentity({ kind: 'stdio', command: 'C:\\bin\\example.exe' });
    if (id.kind === 'mcp-stdio') {
      expect(id.command).toBe('example');
    }
  });

  it('handles a streamable-http url with no pathname', () => {
    const id = deriveServerIdentity({ kind: 'streamable-http', url: 'https://example.com' });
    if (id.kind === 'mcp-streamable-http') {
      expect(id.urlPath).toBe('/');
      expect(id.id).toBe('example.com/');
    }
  });

  it('handles a stdio command without args', () => {
    const id = deriveServerIdentity({ kind: 'stdio', command: 'plain' });
    if (id.kind === 'mcp-stdio') {
      expect(id.argsHash.length).toBe(16);
    }
  });
});

describe('formatMCPServerName — edge cases', () => {
  it('renders a stdio command with no arguments', () => {
    expect(formatMCPServerName({ kind: 'stdio', command: '/usr/bin/node' })).toBe('stdio:node');
  });

  it('accepts a URL instance for streamable-http', () => {
    expect(
      formatMCPServerName({
        kind: 'streamable-http',
        url: new URL('https://example.com/mcp'),
      }),
    ).toContain('https://example.com/mcp');
  });

  it('accepts a URL instance for sse', () => {
    expect(
      formatMCPServerName({
        kind: 'sse',
        url: new URL('https://sse.example.com/api'),
      }),
    ).toContain('https://sse.example.com/api');
  });
});
