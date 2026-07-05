/**
 * mcp-skills-02 regression: `listTools` / `listResources` / `listPrompts`
 * must drain the cursor chain.
 *
 * MCP list operations are cursor-paginated since protocol 2024-11-05 and
 * the SDK does not auto-paginate. Pre-fix the client called each list
 * once and ignored `nextCursor`, so a paginating server's catalogue was
 * silently truncated to page 1 - tools beyond it were invisible to
 * `toTools()`, defer-loading thresholds counted a partial catalogue, and
 * pin fingerprints covered a partial catalogue.
 */
import { afterEach, describe, expect, it } from 'vitest';

import { createMCPClientFromSdkTransport } from '../src/client/client.js';
import type { MCPClient } from '../src/client/index.js';
import { startInMemoryServer } from './__fixtures__/in-memory-server.js';

describe('mcp-skills-02: cursor pagination', () => {
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

  it('listTools drains every page (5 tools served 2 per page)', async () => {
    const tools = Array.from({ length: 5 }, (_, i) => ({
      name: `tool_${i}`,
      description: `Tool number ${i}.`,
      inputSchema: { type: 'object', properties: {} } as const,
    }));
    const c = await buildClient({ tools, pageSize: 2 });
    const listed = await c.listTools();
    expect(listed.map((t) => t.name)).toEqual(['tool_0', 'tool_1', 'tool_2', 'tool_3', 'tool_4']);
    // The adapted Tool[] surface sees the full catalogue too.
    const adapted = await c.toTools();
    expect(adapted).toHaveLength(5);
  });

  it('listResources and listPrompts drain every page', async () => {
    const c = await buildClient({
      resources: Array.from({ length: 3 }, (_, i) => ({
        uri: `mem://res/${i}`,
        name: `res-${i}`,
      })),
      prompts: Array.from({ length: 3 }, (_, i) => ({ name: `prompt-${i}` })),
      pageSize: 1,
    });
    const resources = await c.listResources();
    expect(resources.map((r) => r.uri)).toEqual(['mem://res/0', 'mem://res/1', 'mem://res/2']);
    const prompts = await c.listPrompts();
    expect(prompts.map((p) => p.name)).toEqual(['prompt-0', 'prompt-1', 'prompt-2']);
  });

  it('single-page servers behave exactly as before', async () => {
    const c = await buildClient({
      tools: [{ name: 'only', inputSchema: { type: 'object', properties: {} } }],
    });
    expect((await c.listTools()).map((t) => t.name)).toEqual(['only']);
  });
});
