import { createInMemoryOAuthServerStore } from '@graphorin/security/oauth';
import { describe, expect, it } from 'vitest';

import {
  mcpAuthListSessions,
  mcpAuthRefresh,
  mcpAuthRevoke,
  mcpAuthStatus,
} from '../src/oauth/library.js';

describe('library helpers', () => {
  it('mcpAuthListSessions returns the persisted records', async () => {
    const storage = createInMemoryOAuthServerStore();
    await storage.put({
      id: 'linear-mcp',
      serverUrl: 'https://example.com/mcp',
      clientId: 'abc',
      createdAt: 1,
      updatedAt: 1,
    });
    const sessions = await mcpAuthListSessions(storage);
    expect(sessions.length).toBe(1);
    expect(sessions[0]?.serverId).toBe('linear-mcp');
  });

  it('mcpAuthRefresh rejects when the server is not registered', async () => {
    const storage = createInMemoryOAuthServerStore();
    await expect(mcpAuthRefresh(storage, 'missing')).rejects.toThrow();
  });

  it('mcpAuthRevoke is a no-op when the server is missing', async () => {
    const storage = createInMemoryOAuthServerStore();
    await expect(mcpAuthRevoke(storage, 'missing')).resolves.toBeUndefined();
  });

  it('mcpAuthStatus returns a snapshot with sessions and providers fields', async () => {
    const storage = createInMemoryOAuthServerStore();
    const status = await mcpAuthStatus(storage);
    expect(status.sessions).toBeDefined();
    expect(status.providers).toBeDefined();
  });
});
