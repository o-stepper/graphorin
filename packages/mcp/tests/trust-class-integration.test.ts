import { resetCountersForTesting } from '@graphorin/tools/audit';
import { createToolRegistry } from '@graphorin/tools/registry';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createMCPClientFromSdkTransport } from '../src/client/client.js';
import type { MCPClient } from '../src/client/index.js';
import { startInMemoryServer } from './__fixtures__/in-memory-server.js';

describe('MCP-derived tools — trust class + registry integration', () => {
  let client: MCPClient | undefined;
  let dispose: (() => Promise<void>) | undefined;

  beforeEach(() => {
    resetCountersForTesting();
  });

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

  it("registry assigns __trustClass = 'mcp-derived' to every produced tool", async () => {
    const c = await buildClient({
      tools: [{ name: 'search', inputSchema: {} }],
    });
    const registry = createToolRegistry();
    const tools = await c.toTools();
    for (const tool of tools) {
      const entry = registry.register(tool, {
        kind: 'mcp',
        serverIdentity: c.serverIdentity.id,
      });
      expect(entry.__trustClass).toBe('mcp-derived');
      expect(entry.__source.kind).toBe('mcp');
    }
  });

  it('inboundSanitization default propagates through the registry', async () => {
    const c = await buildClient({
      tools: [{ name: 'search', inputSchema: {} }],
    });
    const registry = createToolRegistry();
    const tools = await c.toTools();
    const first = tools[0];
    if (first === undefined) throw new Error('expected at least one tool');
    const entry = registry.register(first, {
      kind: 'mcp',
      serverIdentity: c.serverIdentity.id,
    });
    expect(entry.inboundSanitization).toBe('detect-and-strip-and-wrap');
  });

  it('per-server pass-through override propagates through the registry without changing trust class', async () => {
    const c = await buildClient({
      tools: [{ name: 'search', inputSchema: {} }],
    });
    const registry = createToolRegistry();
    const tools = await c.toTools({ inboundSanitization: 'pass-through' });
    const first = tools[0];
    if (first === undefined) throw new Error('expected at least one tool');
    const entry = registry.register(first, {
      kind: 'mcp',
      serverIdentity: c.serverIdentity.id,
    });
    expect(entry.inboundSanitization).toBe('pass-through');
    expect(entry.__trustClass).toBe('mcp-derived');
  });

  it('side-effect class defaults to external-stateful for MCP-derived tools', async () => {
    const c = await buildClient({
      tools: [{ name: 'search', inputSchema: {} }],
    });
    const registry = createToolRegistry();
    const tools = await c.toTools();
    const first = tools[0];
    if (first === undefined) throw new Error('expected at least one tool');
    const entry = registry.register(first, {
      kind: 'mcp',
      serverIdentity: c.serverIdentity.id,
    });
    expect(entry.__sideEffectClass).toBe('external-stateful');
  });

  it('per-server sideEffectClassByTool override is honoured by the registry', async () => {
    const c = await buildClient({
      tools: [{ name: 'search', inputSchema: {} }],
    });
    const registry = createToolRegistry();
    const tools = await c.toTools({ sideEffectClassByTool: { search: 'read-only' } });
    const first = tools[0];
    if (first === undefined) throw new Error('expected at least one tool');
    const entry = registry.register(first, {
      kind: 'mcp',
      serverIdentity: c.serverIdentity.id,
    });
    expect(entry.__sideEffectClass).toBe('read-only');
  });
});
