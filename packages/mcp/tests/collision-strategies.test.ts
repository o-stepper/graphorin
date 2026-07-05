import { resetCountersForTesting } from '@graphorin/tools/audit';
import { tool } from '@graphorin/tools/builder';
import { ToolCollisionError } from '@graphorin/tools/errors';
import { createToolRegistry } from '@graphorin/tools/registry';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';

import { createMCPClientFromSdkTransport } from '../src/client/client.js';
import type { MCPClient } from '../src/client/index.js';
import { startInMemoryServer } from './__fixtures__/in-memory-server.js';

describe('MCP collision strategies - registry integration', () => {
  let dispose: Array<() => Promise<void>> = [];
  let clients: MCPClient[] = [];

  beforeEach(() => {
    resetCountersForTesting();
    dispose = [];
    clients = [];
  });

  afterEach(async () => {
    for (const c of clients) await c.close();
    for (const d of dispose) await d();
  });

  async function buildMcp(opts: Parameters<typeof startInMemoryServer>[0], serverName: string) {
    const fixture = await startInMemoryServer({ ...opts, serverName });
    dispose.push(fixture.close);
    const c = await createMCPClientFromSdkTransport({
      transport: fixture.clientTransport,
      transportConfig: { kind: 'streamable-http', url: 'https://example.com/mcp' },
      serverInfoName: serverName,
    });
    clients.push(c);
    return c;
  }

  it("'priority' resolves cross-server collisions per the priority ladder", async () => {
    const linear = await buildMcp(
      {
        tools: [
          { name: 'search_issues', inputSchema: {} },
          { name: 'list_projects', inputSchema: {} },
        ],
      },
      'linear-mcp',
    );
    const jira = await buildMcp(
      {
        tools: [
          { name: 'search_issues', inputSchema: {} },
          { name: 'list_boards', inputSchema: {} },
        ],
      },
      'jira-mcp',
    );

    const registry = createToolRegistry();
    for (const t of await linear.toTools()) {
      registry.register(t, { kind: 'mcp', serverIdentity: linear.serverIdentity.id });
    }
    for (const t of await jira.toTools()) {
      registry.register(t, { kind: 'mcp', serverIdentity: jira.serverIdentity.id });
    }

    const resolutions = registry.assertNoDuplicates('priority', {
      source: { kind: 'mcp', serverIdentity: jira.serverIdentity.id },
      priority: 100,
    });
    const priorityOutcome = resolutions.find((r) => r.action === 'priority-resolved');
    expect(priorityOutcome).toBeDefined();
    // The registry contains exactly one search_issues entry after resolution.
    const entries = registry.list().filter((e) => e.name === 'search_issues');
    expect(entries.length).toBe(1);
  });

  it("'manual' throws ToolCollisionError on the second registration", async () => {
    const linear = await buildMcp(
      {
        tools: [{ name: 'search_issues', inputSchema: {} }],
      },
      'linear-mcp',
    );
    const jira = await buildMcp(
      {
        tools: [{ name: 'search_issues', inputSchema: {} }],
      },
      'jira-mcp',
    );

    const registry = createToolRegistry();
    for (const t of await linear.toTools()) {
      registry.register(t, { kind: 'mcp', serverIdentity: linear.serverIdentity.id });
    }
    for (const t of await jira.toTools()) {
      registry.register(t, { kind: 'mcp', serverIdentity: jira.serverIdentity.id });
    }

    expect(() =>
      registry.assertNoDuplicates('manual', {
        source: { kind: 'mcp', serverIdentity: jira.serverIdentity.id },
      }),
    ).toThrow(ToolCollisionError);
  });

  it('first-party tools win over MCP-derived tools regardless of strategy', async () => {
    const mcp = await buildMcp(
      {
        tools: [{ name: 'search_issues', inputSchema: {} }],
      },
      'linear-mcp',
    );

    const registry = createToolRegistry();
    const firstParty = tool({
      name: 'search_issues',
      description: 'First-party search.',
      inputSchema: z.object({}),
      sideEffectClass: 'read-only',
      execute: async () => ({ ok: true }),
    });
    registry.register(firstParty);
    for (const t of await mcp.toTools()) {
      registry.register(t, { kind: 'mcp', serverIdentity: mcp.serverIdentity.id });
    }

    const resolutions = registry.assertNoDuplicates('auto-prefix', {
      source: { kind: 'mcp', serverIdentity: mcp.serverIdentity.id },
    });
    const renamed = resolutions.find((r) => r.action === 'auto-prefix-applied');
    expect(renamed).toBeDefined();
    if (renamed?.action === 'auto-prefix-applied') {
      expect(renamed.renamed.from).toBe('search_issues');
      expect(renamed.renamed.to).toContain('search_issues');
    }
    // The unprefixed name is held by the first-party registration.
    const unprefixedEntry = registry.get('search_issues');
    expect(unprefixedEntry?.__source.kind).toBe('first-party');
  });
});
