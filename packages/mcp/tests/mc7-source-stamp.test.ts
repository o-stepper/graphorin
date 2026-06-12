import type { ToolSource } from '@graphorin/core';
import { deriveTaintLabel } from '@graphorin/security/dataflow';
import { createToolRegistry } from '@graphorin/tools/registry';
import { afterEach, describe, expect, it } from 'vitest';

import { createMCPClientFromSdkTransport } from '../src/client/client.js';
import type { MCPClient } from '../src/client/index.js';
import { startInMemoryServer } from './__fixtures__/in-memory-server.js';

describe('MC-7 — adapted tools carry the mcp source stamp (taint survives config.tools)', () => {
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

  async function buildTools() {
    const fixture = await startInMemoryServer({
      tools: [{ name: 'fetch_page', description: 'fetch a page', inputSchema: {} }],
    });
    dispose = fixture.close;
    client = await createMCPClientFromSdkTransport({
      transport: fixture.clientTransport,
      transportConfig: { kind: 'streamable-http', url: 'https://example.com/mcp' },
    });
    return { tools: await client.toTools(), serverId: client.serverIdentity.id };
  }

  it('stamps __source { kind: "mcp", serverIdentity } on every adapted tool', async () => {
    const { tools, serverId } = await buildTools();
    const tool = tools[0];
    if (!tool) throw new Error('expected an adapted tool');
    const stamped = (tool as { readonly __source?: ToolSource }).__source;
    expect(stamped).toEqual({ kind: 'mcp', serverIdentity: serverId });
  });

  it('the stamp drives mcp-derived trust class and an untrusted taint label at registration', async () => {
    const { tools } = await buildTools();
    const tool = tools[0];
    if (!tool) throw new Error('expected an adapted tool');
    // Mirrors the agent's inferToolSource path: a pre-stamped source is
    // honoured at registration instead of defaulting to first-party.
    const stamped = (tool as { readonly __source?: ToolSource }).__source;
    if (stamped === undefined) throw new Error('expected a __source stamp');
    const registry = createToolRegistry();
    const entry = registry.register(tool, stamped);
    expect(entry.__trustClass).toBe('mcp-derived');
    const taint = deriveTaintLabel({ trustClass: entry.__trustClass, source: stamped });
    expect(taint.untrusted).toBe(true);
    expect(taint.sourceKind).toBe('mcp');
  });
});
