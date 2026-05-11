import { describe, expect, it } from 'vitest';

import { createInMemoryOAuthServerStore } from '../../src/oauth/index.js';

describe('@graphorin/security/oauth — in-memory store', () => {
  it('round-trips records and supports patch updates', async () => {
    const store = createInMemoryOAuthServerStore();
    await store.put({
      id: 'mcp-test',
      serverUrl: 'https://mcp.example.com',
      clientId: 'cli_test',
      createdAt: 1,
      updatedAt: 1,
    });
    expect(await store.get('mcp-test')).toMatchObject({ clientId: 'cli_test' });
    const updated = await store.update('mcp-test', { scope: 'read write', expiresAt: 100 });
    expect(updated.scope).toBe('read write');
    expect((await store.list()).length).toBe(1);
    await store.delete('mcp-test');
    expect(await store.get('mcp-test')).toBeNull();
  });

  it('throws on update for unknown ids', async () => {
    const store = createInMemoryOAuthServerStore();
    await expect(store.update('missing', {})).rejects.toThrow(/not found/u);
  });
});
