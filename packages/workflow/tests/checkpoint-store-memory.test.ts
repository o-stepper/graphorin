import type { Checkpoint, CheckpointMetadata, PendingWrite } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import { InMemoryCheckpointStore } from '../src/index.js';

function makeCheckpoint(input: {
  id: string;
  threadId?: string;
  namespace?: string;
  stepNumber?: number;
  parentId?: string;
  state?: unknown;
}): Checkpoint {
  return {
    id: input.id,
    threadId: input.threadId ?? 't1',
    namespace: input.namespace ?? 'ns',
    ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
    state: input.state ?? { v: 1 },
    channelVersions: { v: 1 },
    stepNumber: input.stepNumber ?? 0,
    createdAt: new Date(0).toISOString(),
  };
}

const META: CheckpointMetadata = Object.freeze({ source: 'sync', status: 'running' });

async function drain<T>(it: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const item of it) out.push(item);
  return out;
}

describe('InMemoryCheckpointStore', () => {
  it('round-trips a single checkpoint by id', async () => {
    const store = new InMemoryCheckpointStore();
    const cp = makeCheckpoint({ id: 'cp-1' });
    await store.put(cp.threadId, cp.namespace, cp, META);
    const tuple = await store.getTuple(cp.threadId, cp.namespace, cp.id);
    expect(tuple?.checkpoint.id).toBe('cp-1');
    expect(tuple?.metadata).toMatchObject({ source: 'sync', status: 'running' });
    expect(tuple?.pendingWrites).toBeUndefined();
  });

  it('returns the latest checkpoint when no id is supplied', async () => {
    const store = new InMemoryCheckpointStore();
    await store.put('t1', 'ns', makeCheckpoint({ id: 'a', stepNumber: 0 }), META);
    await store.put('t1', 'ns', makeCheckpoint({ id: 'b', stepNumber: 2 }), META);
    await store.put('t1', 'ns', makeCheckpoint({ id: 'c', stepNumber: 1 }), META);
    const tuple = await store.getTuple('t1', 'ns');
    expect(tuple?.checkpoint.id).toBe('b');
  });

  it('returns null when the thread is unknown', async () => {
    const store = new InMemoryCheckpointStore();
    const tuple = await store.getTuple('missing', 'ns');
    expect(tuple).toBeNull();
  });

  it('returns null when the checkpoint id does not match', async () => {
    const store = new InMemoryCheckpointStore();
    await store.put('t1', 'ns', makeCheckpoint({ id: 'a' }), META);
    const tuple = await store.getTuple('t1', 'ns', 'nope');
    expect(tuple).toBeNull();
  });

  it('preserves metadata fields including nodeName + tags', async () => {
    const store = new InMemoryCheckpointStore();
    const meta: CheckpointMetadata = {
      source: 'sync',
      status: 'suspended',
      nodeName: 'awaitApproval',
      tags: ['pause:foo'],
    };
    await store.put('t1', 'ns', makeCheckpoint({ id: 'cp' }), meta);
    const tuple = await store.getTuple('t1', 'ns');
    expect(tuple?.metadata.nodeName).toBe('awaitApproval');
    expect(tuple?.metadata.tags).toEqual(['pause:foo']);
  });

  it('captures pendingWrites and surfaces them on read', async () => {
    const store = new InMemoryCheckpointStore();
    const cp = makeCheckpoint({ id: 'cp' });
    await store.put('t1', 'ns', cp, META);
    const writes: PendingWrite[] = [
      { taskId: 'task-a', index: 0, channel: 'k', value: 1 },
      { taskId: 'task-a', index: 1, channel: 'k', value: 2 },
    ];
    await store.putWrites('t1', 'ns', cp.id, writes, 'task-a');
    const tuple = await store.getTuple('t1', 'ns');
    expect(tuple?.pendingWrites).toHaveLength(2);
    expect(tuple?.pendingWrites?.[0]).toMatchObject({ taskId: 'task-a', index: 0, value: 1 });
  });

  it('replaces a pending write with the same (taskId, index) coordinate', async () => {
    const store = new InMemoryCheckpointStore();
    const cp = makeCheckpoint({ id: 'cp' });
    await store.put('t1', 'ns', cp, META);
    await store.putWrites(
      't1',
      'ns',
      cp.id,
      [{ taskId: 'task-a', index: 0, channel: 'k', value: 'first' }],
      'task-a',
    );
    await store.putWrites(
      't1',
      'ns',
      cp.id,
      [{ taskId: 'task-a', index: 0, channel: 'k', value: 'replaced' }],
      'task-a',
    );
    const tuple = await store.getTuple('t1', 'ns');
    expect(tuple?.pendingWrites).toHaveLength(1);
    expect(tuple?.pendingWrites?.[0]?.value).toBe('replaced');
  });

  it('skips putWrites when the writes array is empty', async () => {
    const store = new InMemoryCheckpointStore();
    const cp = makeCheckpoint({ id: 'cp' });
    await store.put('t1', 'ns', cp, META);
    await store.putWrites('t1', 'ns', cp.id, [], 'task-a');
    const tuple = await store.getTuple('t1', 'ns');
    expect(tuple?.pendingWrites).toBeUndefined();
  });

  it('silently no-ops putWrites when the parent checkpoint is missing', async () => {
    const store = new InMemoryCheckpointStore();
    await store.putWrites(
      't1',
      'ns',
      'cp-missing',
      [{ taskId: 'task-a', index: 0, channel: 'k', value: 1 }],
      'task-a',
    );
    expect(await store.getTuple('t1', 'ns', 'cp-missing')).toBeNull();
  });

  it('lists checkpoints in step-descending order', async () => {
    const store = new InMemoryCheckpointStore();
    await store.put('t1', 'ns', makeCheckpoint({ id: 'a', stepNumber: 0 }), META);
    await store.put('t1', 'ns', makeCheckpoint({ id: 'b', stepNumber: 5 }), META);
    await store.put('t1', 'ns', makeCheckpoint({ id: 'c', stepNumber: 2 }), META);
    const out = await drain(store.list('t1', 'ns'));
    expect(out.map((t) => t.checkpoint.id)).toEqual(['b', 'c', 'a']);
  });

  it('honors the limit option in list', async () => {
    const store = new InMemoryCheckpointStore();
    await store.put('t1', 'ns', makeCheckpoint({ id: 'a', stepNumber: 0 }), META);
    await store.put('t1', 'ns', makeCheckpoint({ id: 'b', stepNumber: 1 }), META);
    await store.put('t1', 'ns', makeCheckpoint({ id: 'c', stepNumber: 2 }), META);
    const out = await drain(store.list('t1', 'ns', { limit: 1 }));
    expect(out).toHaveLength(1);
    expect(out[0]?.checkpoint.id).toBe('c');
  });

  it('honors the before cursor in list', async () => {
    const store = new InMemoryCheckpointStore();
    await store.put('t1', 'ns', makeCheckpoint({ id: 'a', stepNumber: 0 }), META);
    await store.put('t1', 'ns', makeCheckpoint({ id: 'b', stepNumber: 1 }), META);
    await store.put('t1', 'ns', makeCheckpoint({ id: 'c', stepNumber: 2 }), META);
    const out = await drain(store.list('t1', 'ns', { before: 'c' }));
    expect(out.map((t) => t.checkpoint.id)).toEqual(['b', 'a']);
  });

  it('honors a status filter in list', async () => {
    const store = new InMemoryCheckpointStore();
    await store.put('t1', 'ns', makeCheckpoint({ id: 'a', stepNumber: 0 }), {
      source: 'sync',
      status: 'running',
    });
    await store.put('t1', 'ns', makeCheckpoint({ id: 'b', stepNumber: 1 }), {
      source: 'sync',
      status: 'completed',
    });
    const out = await drain(store.list('t1', 'ns', { status: 'completed' }));
    expect(out.map((t) => t.checkpoint.id)).toEqual(['b']);
  });

  it('list() returns empty for unknown threads', async () => {
    const store = new InMemoryCheckpointStore();
    const out = await drain(store.list('missing', 'ns'));
    expect(out).toEqual([]);
  });

  it('isolates threads by namespace', async () => {
    const store = new InMemoryCheckpointStore();
    await store.put('t1', 'ns-a', makeCheckpoint({ id: 'a' }), META);
    await store.put('t1', 'ns-b', makeCheckpoint({ id: 'b' }), META);
    expect((await store.getTuple('t1', 'ns-a'))?.checkpoint.id).toBe('a');
    expect((await store.getTuple('t1', 'ns-b'))?.checkpoint.id).toBe('b');
  });

  it('deleteThread removes every namespace + checkpoint for the thread', async () => {
    const store = new InMemoryCheckpointStore();
    await store.put('t1', 'ns-a', makeCheckpoint({ id: 'a' }), META);
    await store.put('t1', 'ns-b', makeCheckpoint({ id: 'b' }), META);
    await store.put('t2', 'ns-a', makeCheckpoint({ id: 'c' }), META);
    expect(store.size()).toBe(3);
    await store.deleteThread('t1');
    expect(await store.getTuple('t1', 'ns-a')).toBeNull();
    expect(await store.getTuple('t1', 'ns-b')).toBeNull();
    expect((await store.getTuple('t2', 'ns-a'))?.checkpoint.id).toBe('c');
  });

  it('list yields pendingWrites alongside the checkpoint when present', async () => {
    const store = new InMemoryCheckpointStore();
    const cp = makeCheckpoint({ id: 'cp' });
    await store.put('t1', 'ns', cp, META);
    await store.putWrites(
      't1',
      'ns',
      cp.id,
      [{ taskId: 'task-a', index: 0, channel: 'k', value: 1 }],
      'task-a',
    );
    const out = await drain(store.list('t1', 'ns'));
    expect(out[0]?.pendingWrites).toHaveLength(1);
  });
});
