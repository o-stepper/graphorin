import { getCounterForTesting, resetCountersForTesting } from '@graphorin/tools/audit';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  _resetSseWarnDedupForTesting,
  createMCPClientFromSdkTransport,
} from '../src/client/client.js';
import type { MCPClient } from '../src/client/index.js';
import { _resetMcpAdapterDedupForTesting } from '../src/client/to-tools.js';
import { startInMemoryServer } from './__fixtures__/in-memory-server.js';

describe('MCPClient.toTools - process-scoped dedup discipline', () => {
  let dispose: Array<() => Promise<void>> = [];
  let clients: MCPClient[] = [];
  let logEntries: { level: string; message: string; fields?: Record<string, unknown> }[] = [];

  beforeEach(() => {
    resetCountersForTesting();
    _resetMcpAdapterDedupForTesting();
    _resetSseWarnDedupForTesting();
    logEntries = [];
    dispose = [];
    clients = [];
  });

  afterEach(async () => {
    for (const c of clients) await c.close();
    for (const d of dispose) await d();
  });

  async function buildClient(opts: Parameters<typeof startInMemoryServer>[0], serverName?: string) {
    const fixture = await startInMemoryServer(opts);
    dispose.push(fixture.close);
    const c = await createMCPClientFromSdkTransport({
      transport: fixture.clientTransport,
      transportConfig: { kind: 'streamable-http', url: 'https://example.com/mcp' },
      ...(serverName === undefined ? {} : { serverInfoName: serverName }),
      logger: (level, message, fields) => {
        logEntries.push({
          level,
          message,
          ...(fields === undefined ? {} : { fields }),
        });
      },
    });
    clients.push(c);
    return c;
  }

  it('emits exactly one WARN per server when inboundSanitization is set to pass-through', async () => {
    const c = await buildClient({
      tools: [{ name: 't', inputSchema: {} }],
    });
    await c.toTools({ inboundSanitization: 'pass-through' });
    await c.toTools({ inboundSanitization: 'pass-through' });
    const warns = logEntries.filter(
      (e) => e.level === 'warn' && e.message === 'mcp.inbound.sanitization.passthrough-override',
    );
    expect(warns.length).toBe(1);
    expect(
      getCounterForTesting('mcp.inbound.sanitization.passthrough-override.warn.total', {
        server: c.serverIdentity.id,
      }),
    ).toBe(1);
  });

  it('the pass-through WARN does not silence the trust class on subsequent tool registration', async () => {
    const c = await buildClient({
      tools: [{ name: 't', inputSchema: {} }],
    });
    const tools = await c.toTools({ inboundSanitization: 'pass-through' });
    expect(tools[0]?.inboundSanitization).toBe('pass-through');
    // The trust class is computed by the registry's normaliseTool; the
    // adapter does not surface it on the public Tool interface but the
    // sandboxed sandbox policy + the mcp-derived default override remain.
    expect(tools[0]?.sandboxPolicy).toBe('sandboxed');
  });

  it('emits exactly one INFO log per server for the auto-default deferral threshold', async () => {
    const tools = Array.from({ length: 11 }, (_, i) => ({ name: `t${i}`, inputSchema: {} }));
    const c = await buildClient({ tools });
    await c.toTools();
    await c.toTools();
    const infos = logEntries.filter(
      (e) => e.level === 'info' && e.message === 'mcp.tools.defer_loading.auto-default fired',
    );
    expect(infos.length).toBe(1);
    expect(infos[0]?.fields?.source).toBe('mcp-server-default');
    expect(infos[0]?.fields?.toolCount).toBe(11);
    expect(infos[0]?.fields?.thresholdValue).toBe(10);
  });

  it('counter mcp.retrieval.deferred.total increments per tool when auto-deferral fires', async () => {
    const tools = Array.from({ length: 11 }, (_, i) => ({ name: `t${i}`, inputSchema: {} }));
    const c = await buildClient({ tools });
    await c.toTools();
    expect(
      getCounterForTesting('tool.retrieval.deferred.total', { source: 'mcp-server-default' }),
    ).toBe(11);
  });

  it('emits an INFO log on explicit defer_loading: true with source explicit', async () => {
    const c = await buildClient({
      tools: [{ name: 'tiny', inputSchema: {} }],
    });
    await c.toTools({ defer_loading: true });
    const infos = logEntries.filter(
      (e) => e.level === 'info' && e.message === 'mcp.tools.defer_loading.explicit fired',
    );
    expect(infos.length).toBe(1);
    expect(infos[0]?.fields?.source).toBe('explicit');
  });

  it('counter tool.retrieval.eager.total increments per tool when explicit defer_loading is false', async () => {
    const tools = Array.from({ length: 4 }, (_, i) => ({ name: `t${i}`, inputSchema: {} }));
    const c = await buildClient({ tools });
    await c.toTools({ defer_loading: false });
    expect(
      getCounterForTesting('tool.retrieval.eager.total', { source: 'mcp-explicit-eager' }),
    ).toBe(4);
  });

  it('deferLoadingThreshold: 5 fires the auto-default at the lower threshold', async () => {
    const tools = Array.from({ length: 6 }, (_, i) => ({ name: `t${i}`, inputSchema: {} }));
    const c = await buildClient({ tools });
    const adapted = await c.toTools({ deferLoadingThreshold: 5 });
    for (const t of adapted) {
      expect(t.defer_loading).toBe(true);
    }
  });

  it('deferLoadingThreshold: 50 suppresses the auto-default for an 11-tool server', async () => {
    const tools = Array.from({ length: 11 }, (_, i) => ({ name: `t${i}`, inputSchema: {} }));
    const c = await buildClient({ tools });
    const adapted = await c.toTools({ deferLoadingThreshold: 50 });
    for (const t of adapted) {
      expect(t.defer_loading).toBe(false);
    }
    const infos = logEntries.filter(
      (e) => e.level === 'info' && e.message === 'mcp.tools.defer_loading.auto-default fired',
    );
    expect(infos.length).toBe(0);
  });
});
