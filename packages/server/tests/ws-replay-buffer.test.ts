import type { ServerEventFrame } from '@graphorin/protocol';
import { describe, expect, it } from 'vitest';

import { createReplayBuffer } from '../src/ws/replay-buffer.js';

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
