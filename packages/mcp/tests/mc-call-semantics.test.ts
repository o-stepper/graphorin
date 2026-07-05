import type { ToolExecutionContext } from '@graphorin/core';
import { afterEach, describe, expect, it } from 'vitest';

import { createMCPClientFromSdkTransport } from '../src/client/client.js';
import type { MCPClient } from '../src/client/index.js';
import {
  MCPCallTimeoutError,
  MCPCancelledError,
  MCPToolExecutionError,
} from '../src/errors/index.js';
import { startInMemoryServer } from './__fixtures__/in-memory-server.js';

describe('MC-4/MC-5/MC-3 - call semantics on the adapted path', () => {
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

  async function buildClient(opts: Parameters<typeof startInMemoryServer>[0]) {
    const fixture = await startInMemoryServer(opts);
    dispose = fixture.close;
    client = await createMCPClientFromSdkTransport({
      transport: fixture.clientTransport,
      transportConfig: { kind: 'streamable-http', url: 'https://example.com/mcp' },
    });
    return client;
  }

  it('MC-4: an isError result is a tool FAILURE, with the server text in the error', async () => {
    const c = await buildClient({
      tools: [{ name: 'flaky', description: 'always fails', inputSchema: {} }],
      callToolHandler: async () => ({
        content: [{ type: 'text', text: 'boom: upstream quota exceeded' }],
        isError: true,
      }),
    });
    const tools = await c.toTools();
    const flaky = tools.find((t) => t.name.endsWith('flaky'));
    if (!flaky) throw new Error('expected adapted tool');
    await expect(flaky.execute({}, {} as ToolExecutionContext<unknown>)).rejects.toMatchObject({
      kind: 'tool-execution',
      message: expect.stringContaining('boom: upstream quota exceeded'),
    });
    await expect(flaky.execute({}, {} as ToolExecutionContext<unknown>)).rejects.toBeInstanceOf(
      MCPToolExecutionError,
    );
  });

  it('MC-5: aborting ctx.signal cancels the in-flight MCP call of an adapted tool', async () => {
    const c = await buildClient({
      tools: [{ name: 'slow', description: 'never settles', inputSchema: {} }],
      callToolHandler: () =>
        new Promise(() => {
          // never settles - cancellation must reach the wire
        }),
    });
    const tools = await c.toTools();
    const slow = tools.find((t) => t.name.endsWith('slow'));
    if (!slow) throw new Error('expected adapted tool');
    const ac = new AbortController();
    const pending = slow.execute({}, { signal: ac.signal } as ToolExecutionContext<unknown>);
    setTimeout(() => ac.abort('agent aborted'), 20);
    await expect(pending).rejects.toBeInstanceOf(MCPCancelledError);
  });

  it('MC-3: callTool timeoutMs is honoured and maps to MCPCallTimeoutError', async () => {
    const c = await buildClient({
      tools: [{ name: 'sleepy', description: 'slow tool', inputSchema: {} }],
      callToolHandler: () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ content: [{ type: 'text', text: 'too late' }] }), 5_000);
        }),
    });
    const started = Date.now();
    await expect(c.callTool('sleepy', {}, { timeoutMs: 100 })).rejects.toBeInstanceOf(
      MCPCallTimeoutError,
    );
    expect(Date.now() - started).toBeLessThan(3_000); // not the SDK default 60s
  });
});
