import { describe, expect, it } from 'vitest';
import { ChannelAccessConfigError, createAccessController } from '../src/index.js';
import { createInMemoryPairingStore } from '../src/testkit/index.js';

const PEER = { channelId: 'telegram', accountId: 'bot', peerId: 'peer-1' };

function fixedClock(startMs: number): { now: () => Date; advance: (ms: number) => void } {
  let t = startMs;
  return {
    now: () => new Date(t),
    advance: (ms) => {
      t += ms;
    },
  };
}

describe("policy 'disabled' / 'open' / 'allowlist'", () => {
  it('disabled denies everyone', async () => {
    const controller = createAccessController({ policy: { kind: 'disabled' } });
    expect(await controller.check(PEER)).toEqual({ kind: 'deny', reason: 'disabled' });
  });

  it('open allows everyone', async () => {
    const controller = createAccessController({ policy: { kind: 'open' } });
    expect(await controller.check(PEER)).toEqual({ kind: 'allow' });
  });

  it('allowlist passes listed peers pointwise, denies the rest', async () => {
    const controller = createAccessController({
      policy: {
        kind: 'allowlist',
        allowlist: [
          { channelId: 'telegram', peerId: 'peer-1' },
          { channelId: 'slack', accountId: 'work', peerId: 'U42' },
        ],
      },
    });
    expect(await controller.check(PEER)).toEqual({ kind: 'allow' });
    expect(await controller.check({ ...PEER, peerId: 'peer-2' })).toEqual({
      kind: 'deny',
      reason: 'not-allowlisted',
    });
    // accountId in the entry participates in matching.
    expect(
      await controller.check({ channelId: 'slack', accountId: 'personal', peerId: 'U42' }),
    ).toEqual({ kind: 'deny', reason: 'not-allowlisted' });
    expect(
      await controller.check({ channelId: 'slack', accountId: 'work', peerId: 'U42' }),
    ).toEqual({ kind: 'allow' });
  });

  it('rejects an empty allowlist eagerly (fail-closed at construction)', () => {
    expect(() => createAccessController({ policy: { kind: 'allowlist' } })).toThrow(
      ChannelAccessConfigError,
    );
    expect(() => createAccessController({ policy: { kind: 'allowlist', allowlist: [] } })).toThrow(
      /non-empty allowlist/,
    );
  });
});

describe("policy 'pairing'", () => {
  const HOUR = 60 * 60 * 1000;

  function build(overrides?: { maxPendingPerChannel?: number; ttlMs?: number }) {
    const store = createInMemoryPairingStore();
    const clock = fixedClock(Date.parse('2026-07-12T10:00:00Z'));
    let seq = 0;
    const controller = createAccessController({
      policy: { kind: 'pairing', pairing: { ...overrides } },
      store,
      now: clock.now,
      generateCode: () => {
        seq += 1;
        return `CODE${seq}`;
      },
    });
    return { store, clock, controller };
  }

  it('requires a store at construction', () => {
    expect(() => createAccessController({ policy: { kind: 'pairing' } })).toThrow(
      /requires a PairingStore/,
    );
  });

  it('first contact issues a one-hour code; repeat contact re-surfaces it un-issued', async () => {
    const { controller } = build();
    const first = await controller.check(PEER);
    expect(first).toEqual({
      kind: 'pairing-challenge',
      code: 'CODE1',
      expiresAt: '2026-07-12T11:00:00.000Z',
      issued: true,
    });
    const second = await controller.check(PEER);
    expect(second).toEqual({ ...first, issued: false });
  });

  it('approve pairs the peer exactly once and later checks allow', async () => {
    const { controller } = build();
    await controller.check(PEER);
    const paired = await controller.approve('telegram', 'CODE1');
    expect(paired).toMatchObject({ ...PEER, pairedAt: '2026-07-12T10:00:00.000Z' });
    // One-time: the code is consumed.
    expect(await controller.approve('telegram', 'CODE1')).toBeNull();
    expect(await controller.check(PEER)).toEqual({ kind: 'allow' });
    expect(await controller.listPaired('telegram')).toHaveLength(1);
  });

  it('an expired code cannot be approved and a new challenge is issued after expiry', async () => {
    const { controller, clock } = build();
    await controller.check(PEER);
    clock.advance(HOUR + 1);
    expect(await controller.approve('telegram', 'CODE1')).toBeNull();
    const again = await controller.check(PEER);
    expect(again).toMatchObject({ kind: 'pairing-challenge', code: 'CODE2', issued: true });
  });

  it('caps simultaneously pending codes per channel', async () => {
    const { controller } = build({ maxPendingPerChannel: 2 });
    await controller.check({ ...PEER, peerId: 'p1' });
    await controller.check({ ...PEER, peerId: 'p2' });
    expect(await controller.check({ ...PEER, peerId: 'p3' })).toEqual({
      kind: 'deny',
      reason: 'pairing-limit',
    });
    // A peer with an existing pending code is NOT affected by the cap.
    expect(await controller.check({ ...PEER, peerId: 'p1' })).toMatchObject({
      kind: 'pairing-challenge',
      issued: false,
    });
  });

  it('expired requests stop counting toward the cap (opportunistic prune)', async () => {
    const { controller, clock } = build({ maxPendingPerChannel: 1, ttlMs: 1000 });
    await controller.check({ ...PEER, peerId: 'p1' });
    expect(await controller.check({ ...PEER, peerId: 'p2' })).toEqual({
      kind: 'deny',
      reason: 'pairing-limit',
    });
    clock.advance(2000);
    expect(await controller.check({ ...PEER, peerId: 'p2' })).toMatchObject({
      kind: 'pairing-challenge',
      issued: true,
    });
  });

  it('revoke removes a durably paired peer', async () => {
    const { controller } = build();
    await controller.check(PEER);
    await controller.approve('telegram', 'CODE1');
    await controller.revoke(PEER);
    expect(await controller.check(PEER)).toMatchObject({ kind: 'pairing-challenge' });
  });
});
