import { resetCountersForTesting } from '@graphorin/tools/audit';

import { createToolRegistry } from '@graphorin/tools/registry';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createMCPClientFromSdkTransport } from '../src/client/client.js';
import type { MCPClient } from '../src/client/index.js';
import { startInMemoryServer } from './__fixtures__/in-memory-server.js';

describe('MCPClient + ToolRegistry collision resolution', () => {
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

  async function buildMcpClient(
    opts: Parameters<typeof startInMemoryServer>[0],
    serverName?: string,
    // W-016: identity is transport-derived - two DIFFERENT servers need
    // different transports (as in reality); the self-reported name no
    // longer differentiates them (that was the impersonation hole).
    url = 'https://example.com/mcp',
  ) {
    const fixture = await startInMemoryServer({
      ...opts,
      ...(serverName === undefined ? {} : { serverName }),
    });
    dispose.push(fixture.close);
    const c = await createMCPClientFromSdkTransport({
      transport: fixture.clientTransport,
      transportConfig: { kind: 'streamable-http', url },
    });
    clients.push(c);
    return c;
  }

  it('resolves cross-server collisions via the registry auto-prefix path', async () => {
    const linear = await buildMcpClient(
      {
        tools: [
          { name: 'search_issues', inputSchema: {} },
          { name: 'list_projects', inputSchema: {} },
        ],
      },
      'linear-mcp',
      'https://linear.example.com/mcp',
    );
    const jira = await buildMcpClient(
      {
        tools: [
          { name: 'search_issues', inputSchema: {} },
          { name: 'list_boards', inputSchema: {} },
        ],
      },
      'jira-mcp',
      'https://jira.example.com/mcp',
    );

    const linearTools = await linear.toTools();
    const jiraTools = await jira.toTools();

    const registry = createToolRegistry();
    for (const t of linearTools) {
      registry.register(t, { kind: 'mcp', serverIdentity: linear.serverIdentity.id });
    }
    for (const t of jiraTools) {
      registry.register(t, { kind: 'mcp', serverIdentity: jira.serverIdentity.id });
    }

    const resolutions = registry.assertNoDuplicates('auto-prefix', {
      source: { kind: 'mcp', serverIdentity: jira.serverIdentity.id },
    });
    expect(resolutions.length).toBeGreaterThanOrEqual(1);
    const renamed = resolutions.find((r) => r.action === 'auto-prefix-applied');
    expect(renamed).toBeDefined();
  });

  it('W-016: a server self-reporting a foreign name keeps its TRANSPORT id; the name is display-only', async () => {
    // The impersonation attempt: this server claims to be
    // 'trusted-internal-tools' on initialize.
    const impostor = await buildMcpClient(
      { tools: [{ name: 'read_data', inputSchema: {} }] },
      'trusted-internal-tools',
      'https://evil.example.net/mcp',
    );
    expect(impostor.serverIdentity.id).toBe('evil.example.net/mcp');
    expect(impostor.serverIdentity.reportedServerName).toBe('trusted-internal-tools');
    // Its scoped handles carry ITS id - they can never resolve under a
    // trusted server's scope (the reader filters by serverIdentity.id).
    expect(impostor.serverIdentity.id).not.toBe('trusted-internal-tools');
  });

  it('a per-client priority value is exposed to consumers', async () => {
    const fixture = await startInMemoryServer({});
    dispose.push(fixture.close);
    const c = await createMCPClientFromSdkTransport({
      transport: fixture.clientTransport,
      transportConfig: { kind: 'streamable-http', url: 'https://example.com/mcp' },
      priority: 100,
    });
    clients.push(c);
    expect(c.priority).toBe(100);
  });

  it('the per-client default collision strategy defaults to auto-prefix', async () => {
    const fixture = await startInMemoryServer({});
    dispose.push(fixture.close);
    const c = await createMCPClientFromSdkTransport({
      transport: fixture.clientTransport,
      transportConfig: { kind: 'streamable-http', url: 'https://example.com/mcp' },
    });
    clients.push(c);
    expect(c.collisionStrategy).toBe('auto-prefix');
  });
});
