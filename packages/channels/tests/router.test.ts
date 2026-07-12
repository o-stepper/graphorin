import { describe, expect, it } from 'vitest';
import { ChannelRouteConfigError, createIdentityRouter, defaultSessionKey } from '../src/index.js';

const ID = { channelId: 'telegram', accountId: 'bot-1', peerId: 'peer-7' };

describe('createIdentityRouter', () => {
  it('first match wins over later, broader rows', () => {
    const router = createIdentityRouter({
      routes: [
        { channelId: 'telegram', peerId: 'peer-7', agentId: 'owner-agent' },
        { channelId: 'telegram', agentId: 'telegram-agent' },
        { agentId: 'default-agent' },
      ],
    });
    expect(router.resolve(ID).agentId).toBe('owner-agent');
    expect(router.resolve(ID).routeIndex).toBe(0);
    expect(router.resolve({ ...ID, peerId: 'someone-else' }).agentId).toBe('telegram-agent');
    expect(router.resolve({ ...ID, channelId: 'slack' }).agentId).toBe('default-agent');
  });

  it('derives a stable per-peer session key when the route omits one', () => {
    const router = createIdentityRouter({ routes: [{ agentId: 'a' }] });
    const first = router.resolve(ID);
    const second = router.resolve(ID);
    expect(first.sessionKey).toBe(defaultSessionKey(ID));
    expect(first.sessionKey).toBe('telegram:bot-1:peer-7');
    expect(second.sessionKey).toBe(first.sessionKey);
    // A different peer never lands in the same session by accident.
    expect(router.resolve({ ...ID, peerId: 'peer-8' }).sessionKey).not.toBe(first.sessionKey);
  });

  it('honors an explicit pooled sessionKey', () => {
    const router = createIdentityRouter({
      routes: [
        { channelId: 'telegram', agentId: 'a', sessionKey: 'family-chat' },
        { agentId: 'a' },
      ],
    });
    expect(router.resolve(ID).sessionKey).toBe('family-chat');
    expect(router.resolve({ ...ID, peerId: 'peer-8' }).sessionKey).toBe('family-chat');
  });

  it('accountId constraints participate in matching', () => {
    const router = createIdentityRouter({
      routes: [
        { channelId: 'telegram', accountId: 'bot-2', agentId: 'second-bot' },
        { agentId: 'default-agent' },
      ],
    });
    expect(router.resolve(ID).agentId).toBe('default-agent');
    expect(router.resolve({ ...ID, accountId: 'bot-2' }).agentId).toBe('second-bot');
  });

  it('rejects an empty table, an empty agentId and a table without a catch-all', () => {
    expect(() => createIdentityRouter({ routes: [] })).toThrow(ChannelRouteConfigError);
    expect(() => createIdentityRouter({ routes: [{ agentId: '' }] })).toThrow(/empty agentId/);
    expect(() =>
      createIdentityRouter({ routes: [{ channelId: 'telegram', agentId: 'a' }] }),
    ).toThrow(/catch-all/);
  });
});
