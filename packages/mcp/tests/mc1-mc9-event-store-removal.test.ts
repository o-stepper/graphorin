import { afterEach, describe, expect, it } from 'vitest';

import { createMCPClientFromSdkTransport } from '../src/client/client.js';
import type { MCPClient } from '../src/client/index.js';
import { startInMemoryServer } from './__fixtures__/in-memory-server.js';

describe('MC-1/MC-9 — client eventStore removed; honest session semantics', () => {
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

  it('a legacy eventStore input warns once instead of silently doing nothing', async () => {
    const fixture = await startInMemoryServer({ tools: [] });
    dispose = fixture.close;
    const warnings: Array<{ level: string; message: string }> = [];
    client = await createMCPClientFromSdkTransport({
      transport: fixture.clientTransport,
      transportConfig: { kind: 'streamable-http', url: 'https://example.com/mcp' },
      logger: (level, message) => {
        warnings.push({ level, message });
      },
      // Legacy option removed by MC-1 — runtime coerces to a warn.
      ...({ eventStore: { kind: 'legacy' } } as Record<string, unknown>),
    });
    expect(warnings.some((w) => w.level === 'warn' && w.message.includes('eventStore'))).toBe(true);
  });

  it('exposes sessionIdPresent with the honest semantics (resumable is its deprecated alias)', async () => {
    const fixture = await startInMemoryServer({ tools: [] });
    dispose = fixture.close;
    client = await createMCPClientFromSdkTransport({
      transport: fixture.clientTransport,
      transportConfig: { kind: 'streamable-http', url: 'https://example.com/mcp' },
    });
    const c = client as MCPClient & { readonly sessionIdPresent?: boolean };
    expect(typeof c.sessionIdPresent).toBe('boolean');
    expect(c.sessionIdPresent).toBe(c.resumable); // alias agreement
  });
});
