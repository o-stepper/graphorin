import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { createSqliteStore, type GraphorinSqliteStore } from '../src/index.js';

const PEER = { channelId: 'telegram', accountId: 'bot', peerId: 'peer-1' };
const T0 = '2026-07-12T10:00:00.000Z';
const T1H = '2026-07-12T11:00:00.000Z';
const T2H = '2026-07-12T12:00:00.000Z';

async function makeStore(): Promise<GraphorinSqliteStore> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-pairing-store-'));
  const store = await createSqliteStore({ path: `${dir}/db.sqlite`, skipSqliteVec: true });
  await store.init();
  return store;
}

describe('SqlitePairingStore (migration 034)', () => {
  let store: GraphorinSqliteStore;
  beforeEach(async () => {
    store = await makeStore();
  });

  it('round-trips a pairing request by peer and by code', async () => {
    const request = { ...PEER, code: 'ABCD2345', createdAt: T0, expiresAt: T1H };
    await store.pairing.upsertRequest(request);
    expect(await store.pairing.findRequestByPeer(PEER)).toEqual(request);
    expect(await store.pairing.findRequestByCode('telegram', 'ABCD2345')).toEqual(request);
    expect(await store.pairing.findRequestByCode('telegram', 'NOPE')).toBeNull();
    expect(await store.pairing.findRequestByCode('slack', 'ABCD2345')).toBeNull();
  });

  it('upsert replaces the single pending request per peer', async () => {
    await store.pairing.upsertRequest({ ...PEER, code: 'FIRST234', createdAt: T0, expiresAt: T1H });
    await store.pairing.upsertRequest({ ...PEER, code: 'SECOND23', createdAt: T0, expiresAt: T2H });
    const byPeer = await store.pairing.findRequestByPeer(PEER);
    expect(byPeer?.code).toBe('SECOND23');
    expect(await store.pairing.findRequestByCode('telegram', 'FIRST234')).toBeNull();
  });

  it('countPendingRequests honors the expiry cutoff; prune deletes expired rows', async () => {
    await store.pairing.upsertRequest({ ...PEER, code: 'AAAA2345', createdAt: T0, expiresAt: T1H });
    await store.pairing.upsertRequest({
      ...PEER,
      peerId: 'peer-2',
      code: 'BBBB2345',
      createdAt: T0,
      expiresAt: T2H,
    });
    expect(await store.pairing.countPendingRequests('telegram', T0)).toBe(2);
    expect(await store.pairing.countPendingRequests('telegram', T1H)).toBe(1);
    expect(await store.pairing.countPendingRequests('slack', T0)).toBe(0);
    expect(await store.pairing.pruneExpiredRequests(T1H)).toBe(1);
    expect(await store.pairing.findRequestByPeer(PEER)).toBeNull();
    expect(await store.pairing.findRequestByPeer({ ...PEER, peerId: 'peer-2' })).not.toBeNull();
  });

  it('deleteRequest is scoped to (channelId, code)', async () => {
    await store.pairing.upsertRequest({ ...PEER, code: 'CCCC2345', createdAt: T0, expiresAt: T1H });
    await store.pairing.deleteRequest('slack', 'CCCC2345');
    expect(await store.pairing.findRequestByPeer(PEER)).not.toBeNull();
    await store.pairing.deleteRequest('telegram', 'CCCC2345');
    expect(await store.pairing.findRequestByPeer(PEER)).toBeNull();
  });

  it('paired peers: add / is / list / remove', async () => {
    expect(await store.pairing.isPaired(PEER)).toBe(false);
    await store.pairing.addPairedPeer({ ...PEER, pairedAt: T0 });
    await store.pairing.addPairedPeer({
      channelId: 'slack',
      accountId: 'work',
      peerId: 'U42',
      pairedAt: T0,
    });
    expect(await store.pairing.isPaired(PEER)).toBe(true);
    expect(await store.pairing.listPairedPeers()).toHaveLength(2);
    expect(await store.pairing.listPairedPeers('telegram')).toEqual([{ ...PEER, pairedAt: T0 }]);
    await store.pairing.removePairedPeer(PEER);
    expect(await store.pairing.isPaired(PEER)).toBe(false);
    expect(await store.pairing.listPairedPeers()).toHaveLength(1);
  });

  it('the same code may exist on two different channels (uniqueness is per channel)', async () => {
    await store.pairing.upsertRequest({ ...PEER, code: 'SAME2345', createdAt: T0, expiresAt: T1H });
    await store.pairing.upsertRequest({
      channelId: 'slack',
      accountId: 'work',
      peerId: 'U42',
      code: 'SAME2345',
      createdAt: T0,
      expiresAt: T1H,
    });
    expect((await store.pairing.findRequestByCode('telegram', 'SAME2345'))?.peerId).toBe('peer-1');
    expect((await store.pairing.findRequestByCode('slack', 'SAME2345'))?.peerId).toBe('U42');
  });
});
