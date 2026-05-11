import { describe, expect, it } from 'vitest';
import type { JsonRpcMessage } from '../src/event-store/index.js';
import { InMemoryEventStore } from '../src/event-store/index.js';

const noopMessage = (id: number): JsonRpcMessage => ({ jsonrpc: '2.0', id, method: 'tick' });

describe('InMemoryEventStore', () => {
  it('assigns monotonically-increasing event ids per store call', async () => {
    const store = new InMemoryEventStore();
    const a = await store.storeEvent('s1', noopMessage(1));
    const b = await store.storeEvent('s1', noopMessage(2));
    const c = await store.storeEvent('s2', noopMessage(3));
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
    expect(await store.size()).toBe(3);
  });

  it('replays every event after the supplied lastEventId in storage order', async () => {
    const store = new InMemoryEventStore();
    const ids: string[] = [];
    for (let i = 0; i < 5; i++) {
      ids.push(await store.storeEvent('stream-A', noopMessage(i)));
    }
    const replayed: { id: string; message: JsonRpcMessage }[] = [];
    const streamId = await store.replayEventsAfter(ids[1] as string, {
      send: async (id, message) => {
        replayed.push({ id, message });
      },
    });
    expect(streamId).toBe('stream-A');
    expect(replayed.length).toBe(3);
    expect(replayed.map((r) => r.id)).toEqual(ids.slice(2));
  });

  it('evicts the oldest events on overflow and exposes the eviction counter', async () => {
    const store = new InMemoryEventStore({ capacity: 2 });
    await store.storeEvent('stream-A', noopMessage(1));
    await store.storeEvent('stream-A', noopMessage(2));
    await store.storeEvent('stream-A', noopMessage(3));
    expect(await store.size()).toBe(2);
    expect(store.eviction('stream-A')).toBe(1);
  });

  it('clearStream drops every entry for the supplied stream', async () => {
    const store = new InMemoryEventStore();
    await store.storeEvent('stream-A', noopMessage(1));
    await store.storeEvent('stream-B', noopMessage(2));
    await store.clearStream('stream-A');
    expect(await store.size()).toBe(1);
  });

  it('replayEventsAfter rejects unknown event ids', async () => {
    const store = new InMemoryEventStore();
    await expect(
      store.replayEventsAfter('does-not-exist', { send: async () => undefined }),
    ).rejects.toThrow(/not found/i);
  });

  it('rejects non-positive capacity values at construction time', () => {
    expect(() => new InMemoryEventStore({ capacity: 0 })).toThrow(TypeError);
    expect(() => new InMemoryEventStore({ capacity: -1 })).toThrow(TypeError);
  });
});
