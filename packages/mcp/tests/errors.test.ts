import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { afterEach, describe, expect, it } from 'vitest';
import { createMCPClientFromSdkTransport } from '../src/client/client.js';
import { computeClientCapabilities } from '../src/client/client-handlers.js';
import type { MCPClient } from '../src/client/index.js';
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
import { startInMemoryServer } from './__fixtures__/in-memory-server.js';

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

// W-141: SDK errors are classified by JSON-RPC CODE, not by message.
// The message of an McpError is server-controlled, so these cases pin
// that a server phrasing an ordinary error as 'request timed out' /
// 'cancelled' cannot forge the typed timeout/cancelled classes (and
// the operator counters keyed on them).
describe('W-141 - SDK error classification by code', () => {
  let client: MCPClient | undefined;
  let dispose: (() => Promise<void>) | undefined;

  afterEach(async () => {
    if (client !== undefined) {
      await client.close();
      client = undefined;
    }
    if (dispose !== undefined) {
      await dispose();
      dispose = undefined;
    }
  });

  async function callFailingTool(thrown: Error): Promise<unknown> {
    const fixture = await startInMemoryServer({
      tools: [{ name: 'hostile', description: 'throws', inputSchema: {} }],
      callToolHandler: () => {
        throw thrown;
      },
    });
    dispose = fixture.close;
    client = await createMCPClientFromSdkTransport({
      transport: fixture.clientTransport,
      transportConfig: { kind: 'streamable-http', url: 'https://example.com/mcp' },
    });
    try {
      await client.callTool('hostile', {});
      throw new Error('expected callTool to reject');
    } catch (err) {
      return err;
    }
  }

  it("a server error SAYING 'request timed out' is NOT a timeout", async () => {
    const err = await callFailingTool(
      new McpError(ErrorCode.InternalError, 'request timed out while syncing'),
    );
    expect(err).not.toBeInstanceOf(MCPCallTimeoutError);
    expect(err).toBeInstanceOf(GraphorinMCPError);
  });

  it("a server error SAYING 'cancelled by user' is NOT a cancellation", async () => {
    const err = await callFailingTool(
      new McpError(ErrorCode.InternalError, 'operation cancelled by user'),
    );
    expect(err).not.toBeInstanceOf(MCPCancelledError);
    expect(err).toBeInstanceOf(GraphorinMCPError);
  });

  it('code RequestTimeout maps to MCPCallTimeoutError regardless of message', async () => {
    const err = await callFailingTool(new McpError(ErrorCode.RequestTimeout, 'anything at all'));
    expect(err).toBeInstanceOf(MCPCallTimeoutError);
  });

  it('code MethodNotFound maps to MCPToolNotFoundError', async () => {
    const err = await callFailingTool(new McpError(ErrorCode.MethodNotFound, 'nope'));
    expect(err).toBeInstanceOf(MCPToolNotFoundError);
  });
});

describe('W-141 - advertised elicitation capability', () => {
  it('advertises the explicit form sub-capability of the 2025-11-25 spec', () => {
    expect(computeClientCapabilities({ elicitation: async () => ({ action: 'decline' }) })).toEqual(
      {
        elicitation: { form: {} },
      },
    );
    expect(computeClientCapabilities({})).toBeUndefined();
  });
});
