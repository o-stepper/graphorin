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
  ) {
    const fixture = await startInMemoryServer({
      ...opts,
      ...(serverName === undefined ? {} : { serverName }),
    });
    dispose.push(fixture.close);
    const c = await createMCPClientFromSdkTransport({
      transport: fixture.clientTransport,
      transportConfig: { kind: 'streamable-http', url: 'https://example.com/mcp' },
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
    );
    const jira = await buildMcpClient(
      {
        tools: [
          { name: 'search_issues', inputSchema: {} },
          { name: 'list_boards', inputSchema: {} },
        ],
      },
      'jira-mcp',
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
