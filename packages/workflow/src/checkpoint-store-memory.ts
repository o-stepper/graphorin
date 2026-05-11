/**
 * In-memory {@link CheckpointStore} adapter. Useful in tests, REPL
 * sessions, and small examples where SQLite would be overkill. The
 * production-grade adapter lives in `@graphorin/store-sqlite`.
 *
 * @packageDocumentation
 */

import type {
  Checkpoint,
  CheckpointId,
  CheckpointMetadata,
  CheckpointStore,
  CheckpointTuple,
  ListOptions,
  PendingWrite,
} from '@graphorin/core';

interface StoredCheckpoint {
  readonly checkpoint: Checkpoint;
  readonly metadata: CheckpointMetadata;
  pendingWrites: PendingWrite[];
}

/**
 * Pure in-memory {@link CheckpointStore} implementation. Thread-safe
 * within a single Node.js event loop because every mutation is
 * synchronous; concurrent runs that share the same instance will see
 * a consistent view.
 *
 * @stable
 */
export class InMemoryCheckpointStore implements CheckpointStore {
  #checkpoints = new Map<string, StoredCheckpoint>();
  #threadIndex = new Map<string, string[]>();

  async put(
    threadId: string,
    namespace: string,
    checkpoint: Checkpoint,
    metadata: CheckpointMetadata,
  ): Promise<CheckpointId> {
    const key = makeKey(threadId, namespace, checkpoint.id);
    const existing = this.#checkpoints.get(key);
    this.#checkpoints.set(key, {
      checkpoint,
      metadata,
      pendingWrites: existing ? [...existing.pendingWrites] : [],
    });
    const indexKey = `${threadId}::${namespace}`;
    const ids = this.#threadIndex.get(indexKey) ?? [];
    if (!ids.includes(checkpoint.id)) {
      ids.push(checkpoint.id);
      this.#threadIndex.set(indexKey, ids);
    }
    return checkpoint.id;
  }

  async putWrites(
    threadId: string,
    namespace: string,
    checkpointId: CheckpointId,
    writes: ReadonlyArray<PendingWrite>,
    taskId: string,
  ): Promise<void> {
    if (writes.length === 0) return;
    const key = makeKey(threadId, namespace, checkpointId);
    const stored = this.#checkpoints.get(key);
    if (!stored) return;
    for (const write of writes) {
      const annotated: PendingWrite = { ...write, taskId };
      stored.pendingWrites = [
        ...stored.pendingWrites.filter(
          (w) => !(w.taskId === annotated.taskId && w.index === annotated.index),
        ),
        annotated,
      ];
    }
  }

  async getTuple(
    threadId: string,
    namespace: string,
    checkpointId?: CheckpointId,
  ): Promise<CheckpointTuple | null> {
    const indexKey = `${threadId}::${namespace}`;
    const ids = this.#threadIndex.get(indexKey);
    if (!ids || ids.length === 0) return null;

    const stored =
      checkpointId !== undefined
        ? this.#checkpoints.get(makeKey(threadId, namespace, checkpointId))
        : this.#latestStored(threadId, namespace, ids);
    if (!stored) return null;

    return stored.pendingWrites.length > 0
      ? {
          checkpoint: stored.checkpoint,
          metadata: stored.metadata,
          pendingWrites: [...stored.pendingWrites],
        }
      : { checkpoint: stored.checkpoint, metadata: stored.metadata };
  }

  async *list(
    threadId: string,
    namespace: string,
    opts?: ListOptions,
  ): AsyncIterable<CheckpointTuple> {
    const indexKey = `${threadId}::${namespace}`;
    const ids = this.#threadIndex.get(indexKey) ?? [];
    const ordered = [...ids]
      .map((id) => this.#checkpoints.get(makeKey(threadId, namespace, id)))
      .filter((s): s is StoredCheckpoint => s !== undefined)
      .sort((a, b) => b.checkpoint.stepNumber - a.checkpoint.stepNumber);

    let beforeStep: number | null = null;
    if (opts?.before !== undefined) {
      const cursor = this.#checkpoints.get(makeKey(threadId, namespace, opts.before));
      beforeStep = cursor ? cursor.checkpoint.stepNumber : null;
    }

    let yielded = 0;
    const limit = opts?.limit ?? Number.POSITIVE_INFINITY;

    for (const stored of ordered) {
      if (yielded >= limit) return;
      if (beforeStep !== null && stored.checkpoint.stepNumber >= beforeStep) continue;
      if (opts?.status !== undefined && stored.metadata.status !== opts.status) continue;
      yielded += 1;
      yield stored.pendingWrites.length > 0
        ? {
            checkpoint: stored.checkpoint,
            metadata: stored.metadata,
            pendingWrites: [...stored.pendingWrites],
          }
        : { checkpoint: stored.checkpoint, metadata: stored.metadata };
    }
  }

  async deleteThread(threadId: string): Promise<void> {
    for (const key of [...this.#threadIndex.keys()]) {
      if (key.startsWith(`${threadId}::`)) {
        const ids = this.#threadIndex.get(key) ?? [];
        const namespace = key.slice(threadId.length + 2);
        for (const id of ids) {
          this.#checkpoints.delete(makeKey(threadId, namespace, id));
        }
        this.#threadIndex.delete(key);
      }
    }
  }

  /**
   * Test-only helper that exposes the raw count of stored checkpoints
   * — handy for assertions like "the runtime wrote exactly N
   * checkpoints across the run".
   */
  size(): number {
    return this.#checkpoints.size;
  }

  #latestStored(
    threadId: string,
    namespace: string,
    ids: ReadonlyArray<string>,
  ): StoredCheckpoint | undefined {
    let latest: StoredCheckpoint | undefined;
    for (const id of ids) {
      const stored = this.#checkpoints.get(makeKey(threadId, namespace, id));
      if (!stored) continue;
      if (!latest || stored.checkpoint.stepNumber > latest.checkpoint.stepNumber) {
        latest = stored;
      }
    }
    return latest;
  }
}

function makeKey(threadId: string, namespace: string, id: string): string {
  return `${threadId}::${namespace}::${id}`;
}
