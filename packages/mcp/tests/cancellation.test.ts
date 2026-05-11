import { resetCountersForTesting } from '@graphorin/tools/audit';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createMCPClientFromSdkTransport } from '../src/client/client.js';
import type { MCPClient } from '../src/client/index.js';
import { MCPCancelledError } from '../src/errors/index.js';
import { startInMemoryServer } from './__fixtures__/in-memory-server.js';

describe('MCPClient — AbortSignal cancellation discipline', () => {
  let client: MCPClient | undefined;
  let dispose: (() => Promise<void>) | undefined;

  beforeEach(() => {
    resetCountersForTesting();
  });

  afterEach(async () => {
    if (client !== undefined) {
      try {
        await client.close();
      } catch {
        // The cancellation paths may have already torn the transport down.
      }
      client = undefined;
    }
    if (dispose !== undefined) {
      await dispose();
      dispose = undefined;
    }
  });

  it('callTool rejects with MCPCancelledError when the AbortSignal aborts mid-call', async () => {
    const fixture = await startInMemoryServer({
      tools: [{ name: 'slow', inputSchema: {} }],
      callToolHandler: async () => {
        // Simulate a long-running tool call.
        await new Promise((resolve) => setTimeout(resolve, 250));
        return { content: [{ type: 'text', text: 'done' }] };
      },
    });
    dispose = fixture.close;
    client = await createMCPClientFromSdkTransport({
      transport: fixture.clientTransport,
      transportConfig: { kind: 'streamable-http', url: 'https://example.com/mcp' },
    });
    const ctrl = new AbortController();
    const start = performance.now();
    const callPromise = client.callTool('slow', {}, { signal: ctrl.signal });
    // Abort immediately.
    setTimeout(() => ctrl.abort(), 5);
    await expect(callPromise).rejects.toBeInstanceOf(MCPCancelledError);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(200);
  });

  it('listTools propagates AbortSignal abort as MCPCancelledError', async () => {
    const fixture = await startInMemoryServer({
      tools: [{ name: 't', inputSchema: {} }],
    });
    dispose = fixture.close;
    client = await createMCPClientFromSdkTransport({
      transport: fixture.clientTransport,
      transportConfig: { kind: 'streamable-http', url: 'https://example.com/mcp' },
    });
    const ctrl = new AbortController();
    ctrl.abort();
    await expect(client.listTools({ signal: ctrl.signal })).rejects.toBeInstanceOf(
      MCPCancelledError,
    );
  });
});
