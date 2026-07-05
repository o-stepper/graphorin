import { describe, expect, it } from 'vitest';

import { scopedResourceHandle } from '../src/client/adapt-result.js';

import { deriveServerIdentity, formatMCPServerName } from '../src/helpers/identity.js';

describe('deriveServerIdentity - edge cases', () => {
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

describe('W-016 - transport-derived identity', () => {
  it('two local servers on different ports get DIFFERENT ids', () => {
    const a = deriveServerIdentity({ kind: 'streamable-http', url: 'http://localhost:3001/mcp' });
    const b = deriveServerIdentity({ kind: 'streamable-http', url: 'http://localhost:3002/mcp' });
    expect(a.id).toBe('localhost:3001/mcp');
    expect(b.id).toBe('localhost:3002/mcp');
    expect(a.id).not.toBe(b.id);
  });

  it('a default-port URL keeps the plain host', () => {
    const id = deriveServerIdentity({
      kind: 'streamable-http',
      url: 'https://api.example.com/mcp',
    });
    expect(id.id).toBe('api.example.com/mcp');
  });

  it('the operator serverInfoName override still wins', () => {
    const id = deriveServerIdentity(
      { kind: 'streamable-http', url: 'http://localhost:3001/mcp' },
      'my-pinned-name',
    );
    expect(id.id).toBe('my-pinned-name');
  });
});

describe('W-140 - colon-safe scoped handles', () => {
  it('round-trips an id containing ":" through mint -> parse', () => {
    const handle = scopedResourceHandle('localhost:3001/mcp', 'file:///notes/a.txt');
    // The grammar segment holds no raw ':' in the id position.
    const match = /^mcp:([^:]+):(.+)$/.exec(handle);
    expect(match).not.toBeNull();
    expect(decodeURIComponent(match?.[1] ?? '')).toBe('localhost:3001/mcp');
    expect(match?.[2]).toBe('file:///notes/a.txt');
  });

  it('round-trips an operator override containing ":"', () => {
    const handle = scopedResourceHandle('team:tools', 'res://x');
    const match = /^mcp:([^:]+):(.+)$/.exec(handle);
    expect(decodeURIComponent(match?.[1] ?? '')).toBe('team:tools');
    expect(match?.[2]).toBe('res://x');
  });
});

describe('formatMCPServerName - edge cases', () => {
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
