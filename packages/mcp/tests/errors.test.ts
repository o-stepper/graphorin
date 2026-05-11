import { describe, expect, it } from 'vitest';

import {
  GraphorinMCPError,
  MCPAuthError,
  MCPCallTimeoutError,
  MCPCancelledError,
  MCPConnectionError,
  MCPInvalidConfigError,
  MCPProtocolError,
  MCPToolNotFoundError,
  MCPTransportNotSupportedError,
} from '../src/errors/index.js';

describe('errors', () => {
  it('every typed error class has a stable lowercase kind', () => {
    expect(new MCPConnectionError('x', {}).kind).toBe('connection-failed');
    expect(new MCPProtocolError('x', {}).kind).toBe('protocol-error');
    expect(new MCPAuthError('x', {}).kind).toBe('auth-error');
    expect(new MCPToolNotFoundError('x', {}).kind).toBe('tool-not-found');
    expect(new MCPCancelledError('x', {}).kind).toBe('cancelled');
    expect(new MCPInvalidConfigError('x', {}).kind).toBe('invalid-config');
  });

  it('MCPCallTimeoutError honours the variant discriminator', () => {
    const timeout = new MCPCallTimeoutError('x', {});
    expect(timeout.kind).toBe('call-timeout');
    const sessionLost = new MCPCallTimeoutError('x', { variant: 'session-lost' });
    expect(sessionLost.kind).toBe('session-lost');
  });

  it('MCPTransportNotSupportedError honours the variant discriminator', () => {
    const generic = new MCPTransportNotSupportedError('x', {});
    expect(generic.kind).toBe('transport-not-supported');
    const resumable = new MCPTransportNotSupportedError('x', {
      variant: 'transport-resumable-not-supported',
    });
    expect(resumable.kind).toBe('transport-resumable-not-supported');
  });

  it('hint and metadata round-trip through every concrete subclass', () => {
    const err = new MCPProtocolError('boom', {
      hint: 'try harder',
      metadata: { server: 'linear-mcp', tool: 'search_issues' },
    });
    expect(err.hint).toBe('try harder');
    expect(err.metadata.server).toBe('linear-mcp');
    expect(err.metadata.tool).toBe('search_issues');
  });

  it('errors extend the abstract GraphorinMCPError base class', () => {
    expect(new MCPProtocolError('x', {})).toBeInstanceOf(GraphorinMCPError);
    expect(new MCPProtocolError('x', {})).toBeInstanceOf(Error);
  });

  it('cause is preserved on chained errors', () => {
    const cause = new Error('underlying');
    const err = new MCPConnectionError('wrap', { cause });
    expect(err.cause).toBe(cause);
  });
});
