import type { ServerEventFrame } from '@graphorin/protocol';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createReplayBuffer,
  type ReplayBuffer,
  scheduleReplayBufferPruning,
} from '../src/ws/replay-buffer.js';

function makeEvent(eventId: string, type = 'text.delta'): ServerEventFrame {
  return {
    v: '1',
    kind: 'event',
    eventId,
    subscriptionId: '__pending__',
    subject: 'session:abc/events',
    type,
    payload: { eventId },
  };
}

describe('createReplayBuffer', () => {
  it('replays nothing when the buffer is empty', () => {
    const buf = createReplayBuffer();
    expect(buf.replay('s', undefined).events).toHaveLength(0);
  });

  it('replays everything when the cursor is undefined', () => {
    const buf = createReplayBuffer();
    for (let i = 0; i < 5; i += 1) buf.push('s', makeEvent(`e-${i}`));
    const slice = buf.replay('s', undefined);
    expect(slice.events.map((e) => e.eventId)).toEqual(['e-0', 'e-1', 'e-2', 'e-3', 'e-4']);
  });

  it('replays only events after the cursor', () => {
    const buf = createReplayBuffer();
    for (let i = 0; i < 5; i += 1) buf.push('s', makeEvent(`e-${i}`));
    const slice = buf.replay('s', 'e-2');
    expect(slice.events.map((e) => e.eventId)).toEqual(['e-3', 'e-4']);
  });

  it('emits droppedCount when older than the buffer cutoff', () => {
    const buf = createReplayBuffer({ maxEvents: 3 });
    for (let i = 0; i < 5; i += 1) buf.push('s', makeEvent(`e-${i}`));
    expect(buf.size('s')).toBe(3);
    const slice = buf.replay('s', 'e-0');
    expect(slice.droppedCount).toBe(2);
    expect(slice.events.map((e) => e.eventId)).toEqual(['e-2', 'e-3', 'e-4']);
  });

  it('prunes by TTL', () => {
    let now = 0;
    const buf = createReplayBuffer({ ttlMs: 10_000, now: () => now });
    buf.push('s', makeEvent('e-1'));
    now = 20_000;
    buf.prune();
    expect(buf.size('s')).toBe(0);
  });

  it('forgets a subject', () => {
    const buf = createReplayBuffer();
    buf.push('s', makeEvent('e-1'));
    buf.forget('s');
    expect(buf.size('s')).toBe(0);
  });
});

describe('W-028 - periodic eviction, dropped-map hygiene, stats', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('a TTL-expired subject disappears COMPLETELY on prune(), including its dropped entry', () => {
    let now = 0;
    const buf = createReplayBuffer({ maxEvents: 2, ttlMs: 10_000, now: () => now });
    // Overflow first so the dropped map has an entry for the subject.
    for (let i = 0; i < 4; i += 1) buf.push('s', makeEvent(`e-${i}`));
    expect(buf.stats?.()).toEqual({ subjects: 1, events: 2 });
    now = 20_000;
    buf.prune();
    // No push/replay/size on the subject needed - the sweep alone
    // releases it, dropped entry included (observable via stats +
    // droppedCount semantics below).
    expect(buf.stats?.()).toEqual({ subjects: 0, events: 0 });
    // A fresh no-cursor subscription on the emptied subject reports no
    // drop (the dropped entry is gone, not leaking forever).
    expect(buf.replay('s', undefined).droppedCount).toBe(0);
  });

  it('a resume with a cursor that misses the buffer still reports droppedCount >= 1', () => {
    let now = 0;
    const buf = createReplayBuffer({ ttlMs: 10_000, now: () => now });
    buf.push('s', makeEvent('old-1'));
    now = 20_000;
    buf.prune();
    // New event after the sweep; the old cursor no longer resolves.
    buf.push('s', makeEvent('new-1'));
    const slice = buf.replay('s', 'old-1');
    expect(slice.droppedCount).toBeGreaterThanOrEqual(1);
    expect(slice.events.map((e) => e.eventId)).toEqual(['new-1']);
  });

  it('stats() counts subjects and buffered events across subjects', () => {
    const buf = createReplayBuffer();
    buf.push('a', makeEvent('a-1'));
    buf.push('a', makeEvent('a-2'));
    buf.push('b', makeEvent('b-1'));
    expect(buf.stats?.()).toEqual({ subjects: 2, events: 3 });
  });

  it('scheduleReplayBufferPruning fires prune() on the interval and stops on the stop function', () => {
    vi.useFakeTimers();
    let pruneCalls = 0;
    const fake: ReplayBuffer = {
      push: () => {},
      replay: () => ({ events: [], droppedCount: 0, nextEventIdHint: undefined }),
      size: () => 0,
      forget: () => {},
      prune: () => {
        pruneCalls += 1;
      },
    };
    const stop = scheduleReplayBufferPruning(fake, { intervalMs: 1_000 });
    vi.advanceTimersByTime(3_500);
    expect(pruneCalls).toBe(3);
    stop();
    vi.advanceTimersByTime(5_000);
    expect(pruneCalls).toBe(3);
  });

  it('an external ReplayBuffer implementation WITHOUT stats keeps compiling and degrades to 0', () => {
    const minimal: ReplayBuffer = {
      push: () => {},
      replay: () => ({ events: [], droppedCount: 0, nextEventIdHint: undefined }),
      size: () => 0,
      forget: () => {},
      prune: () => {},
    };
    // The optional-member contract the metrics sampler relies on.
    expect(minimal.stats?.().events ?? 0).toBe(0);
  });
});
