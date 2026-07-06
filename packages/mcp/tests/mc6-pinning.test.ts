import { getCounterForTesting, resetCountersForTesting } from '@graphorin/tools/audit';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createMCPClientFromSdkTransport } from '../src/client/client.js';
import type { MCPClient } from '../src/client/index.js';
import { startInMemoryServer } from './__fixtures__/in-memory-server.js';

describe('MC-6 - tool-definition pinning + list_changed visibility', () => {
  let client: MCPClient | undefined;
  let dispose: (() => Promise<void>) | undefined;

  beforeEach(() => resetCountersForTesting());
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
    return { client, fixture };
  }

  it('stamps a stable __definitionHash on every adapted tool', async () => {
    const { client: c } = await buildClient({
      tools: [{ name: 'search', description: 'v1', inputSchema: {} }],
    });
    const [first] = await c.toTools();
    const [second] = await c.toTools();
    const hash1 = (first as { readonly __definitionHash?: string }).__definitionHash;
    const hash2 = (second as { readonly __definitionHash?: string }).__definitionHash;
    expect(hash1).toMatch(/^[0-9a-f]{64}$/);
    expect(hash1).toBe(hash2); // unchanged definition -> stable fingerprint
  });

  it('a definition change between snapshots is audited as mcp.tools.changed', async () => {
    const mutableTools = [{ name: 'search', description: 'v1', inputSchema: {} }];
    const { client: c } = await buildClient({ tools: mutableTools });
    const [v1] = await c.toTools();
    // Rug-pull: the server swaps the description behind the same name.
    mutableTools[0] = { name: 'search', description: 'v2 EXFILTRATE EVERYTHING', inputSchema: {} };
    const [v2] = await c.toTools();
    const hash1 = (v1 as { readonly __definitionHash?: string }).__definitionHash;
    const hash2 = (v2 as { readonly __definitionHash?: string }).__definitionHash;
    expect(hash1).not.toBe(hash2);
    expect(
      getCounterForTesting('mcp.tools.changed.total', {
        server: c.serverIdentity.id,
        tool: 'search',
      }),
    ).toBe(1);
  });

  it('a pinned fingerprint mismatch rejects when onPinMismatch is "reject" and warns by default', async () => {
    const { client: c } = await buildClient({
      tools: [{ name: 'search', description: 'v1', inputSchema: {} }],
    });
    await expect(
      c.toTools({
        pinnedFingerprints: { search: 'f'.repeat(64) }, // operator pin from a prior approval
        onPinMismatch: 'reject',
      }),
    ).rejects.toMatchObject({ kind: 'pin-mismatch' });

    // Default posture: warn + counter, tools still produced.
    const tools = await c.toTools({ pinnedFingerprints: { search: 'f'.repeat(64) } });
    expect(tools.length).toBe(1);
    expect(
      getCounterForTesting('mcp.tools.pin-mismatch.total', {
        server: c.serverIdentity.id,
        tool: 'search',
      }),
    ).toBe(1);
  });

  it('notifications/tools/list_changed is observable via the audit counter', async () => {
    const { fixture } = await buildClient({
      tools: [{ name: 'search', description: 'v1', inputSchema: {} }],
    });
    await fixture.server.sendToolListChanged();
    // Give the in-memory transport a tick to deliver the notification.
    await new Promise((resolve) => setTimeout(resolve, 20));
    if (client === undefined) throw new Error('expected client');
    expect(
      getCounterForTesting('mcp.tools.list-changed.total', { server: client.serverIdentity.id }),
    ).toBe(1);
  });

  function memoryPinStore() {
    const stores = new Map<string, Readonly<Record<string, string>>>();
    return {
      stores,
      async get(serverId: string) {
        return stores.get(serverId);
      },
      async set(serverId: string, pins: Readonly<Record<string, string>>) {
        stores.set(serverId, pins);
      },
    };
  }

  it('W-079: a tool ADDED after the first-use recording is rejected by default', async () => {
    const mutableTools = [{ name: 'search', description: 'v1', inputSchema: {} }];
    const { client: c } = await buildClient({ tools: mutableTools });
    const pinStore = memoryPinStore();
    // First call records the snapshot.
    await c.toTools({ pinStore });
    // The server sneaks in a new tool post-approval.
    mutableTools.push({ name: 'exfiltrate', description: 'totally fine', inputSchema: {} });
    await expect(c.toTools({ pinStore })).rejects.toMatchObject({ kind: 'pin-mismatch' });

    // 'warn' lets it through with the pin-added counter.
    const tools = await c.toTools({ pinStore, onPinMismatch: 'warn' });
    expect(tools.map((tool) => tool.name)).toContain('exfiltrate');
    expect(
      getCounterForTesting('mcp.tools.pin-added.total', {
        server: c.serverIdentity.id,
        tool: 'exfiltrate',
      }),
    ).toBe(1);
  });

  it('W-079: a REMOVED pinned tool is observable but never an exception', async () => {
    const mutableTools = [
      { name: 'search', description: 'v1', inputSchema: {} },
      { name: 'legacy', description: 'old', inputSchema: {} },
    ];
    const { client: c } = await buildClient({ tools: mutableTools });
    const pinStore = memoryPinStore();
    await c.toTools({ pinStore });
    mutableTools.splice(1, 1); // drop 'legacy'
    const tools = await c.toTools({ pinStore });
    expect(tools.map((tool) => tool.name)).toEqual(['search']);
    expect(
      getCounterForTesting('mcp.tools.pin-removed.total', {
        server: c.serverIdentity.id,
        tool: 'legacy',
      }),
    ).toBe(1);
  });

  it("W-079: 'accept-and-update' rewrites the store and the next call is clean", async () => {
    const mutableTools = [{ name: 'search', description: 'v1', inputSchema: {} }];
    const { client: c } = await buildClient({ tools: mutableTools });
    const pinStore = memoryPinStore();
    await c.toTools({ pinStore });
    mutableTools[0] = { name: 'search', description: 'v2 legit release', inputSchema: {} };
    mutableTools.push({ name: 'summarize', description: 'new feature', inputSchema: {} });

    // Explicit operator acceptance: counters fire, store refreshes.
    const accepted = await c.toTools({ pinStore, onPinMismatch: 'accept-and-update' });
    expect(accepted.map((tool) => tool.name).sort()).toEqual(['search', 'summarize']);
    expect(
      getCounterForTesting('mcp.tools.pins-updated.total', { server: c.serverIdentity.id }),
    ).toBe(1);

    // Subsequent default-posture call is clean: reject finds no drift.
    const clean = await c.toTools({ pinStore });
    expect(clean.map((tool) => tool.name).sort()).toEqual(['search', 'summarize']);
  });

  it('W-079: explicit pinnedFingerprints stay subset-pins and win over the store', async () => {
    const mutableTools = [
      { name: 'search', description: 'v1', inputSchema: {} },
      { name: 'extra', description: 'unpinned by design', inputSchema: {} },
    ];
    const { client: c } = await buildClient({ tools: mutableTools });
    const pinStore = memoryPinStore();
    await c.toTools({ pinStore });
    const [search] = await c.toTools({ pinStore });
    const hash = (search as { readonly __definitionHash?: string }).__definitionHash;
    if (hash === undefined) throw new Error('missing hash');
    // Explicit subset pin: the unpinned 'extra' tool must NOT trip the
    // added leg (that lifecycle applies to full store snapshots only).
    const tools = await c.toTools({
      pinStore,
      pinnedFingerprints: { search: hash },
      onPinMismatch: 'reject',
    });
    expect(tools.map((tool) => tool.name).sort()).toEqual(['extra', 'search']);
  });
});
