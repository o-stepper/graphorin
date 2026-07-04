/**
 * Opaque identifier for a single workflow checkpoint. Treated as a string
 * by every consumer so adapters can pick whatever encoding they prefer
 * (ULID, UUID, snowflake-like, …).
 *
 * @stable
 */
export type CheckpointId = string;

/**
 * Serialized snapshot of workflow state, written after every execution
 * step.
 *
 * @stable
 */
export interface Checkpoint {
  readonly id: CheckpointId;
  readonly threadId: string;
  readonly namespace: string;
  readonly parentId?: CheckpointId;
  /** Serialized state blob — adapter-specific encoding (JSON / superjson / …). */
  readonly state: unknown;
  /** Per-channel monotonic versions used by the workflow scheduler. */
  readonly channelVersions: Readonly<Record<string, number>>;
  readonly stepNumber: number;
  readonly createdAt: string;
}

/**
 * Metadata associated with a checkpoint write. Adapters store this in a
 * sidecar table for efficient listing.
 *
 * @stable
 */
export interface CheckpointMetadata {
  /**
   * Durability mode that produced this write. The legacy `'async'`
   * value was removed (workflow-14 / WF-7 — it was byte-identical to
   * `'sync'`); adapters normalize legacy persisted rows to `'sync'` at
   * read time.
   */
  readonly source: 'sync' | 'exit';
  readonly status: 'running' | 'suspended' | 'completed' | 'failed' | 'aborted';
  readonly nodeName?: string;
  readonly tags?: ReadonlyArray<string>;
}

/**
 * A checkpoint paired with its sidecar metadata. Returned by
 * `CheckpointStore.getTuple(...)` and the `list(...)` iterator.
 *
 * @stable
 */
export interface CheckpointTuple {
  readonly checkpoint: Checkpoint;
  readonly metadata: CheckpointMetadata;
  readonly pendingWrites?: ReadonlyArray<PendingWrite>;
}

/**
 * Per-task pending write. Captured when a task in an execution step
 * succeeds while a sibling task fails: the next resume attempt skips the
 * already-completed work.
 *
 * @stable
 */
export interface PendingWrite {
  readonly taskId: string;
  readonly index: number;
  readonly channel: string;
  /** Serialized value blob — adapter-specific encoding. */
  readonly value: unknown;
}

/**
 * Optional listing range for `CheckpointStore.list(...)`.
 *
 * @stable
 */
export interface ListOptions {
  readonly limit?: number;
  readonly before?: CheckpointId;
  readonly status?: CheckpointMetadata['status'];
}

/**
 * Optional atomicity contract for {@link CheckpointStore.put} (D1 /
 * workflow-01). When `expectedLatestId` is supplied, the store MUST
 * perform the latest-checkpoint comparison and the insert atomically
 * (single transaction / synchronous critical section) and throw
 * {@link CheckpointConflictError} on mismatch — closing the TOCTOU
 * window an engine-level read-then-write cannot. `null` means "expect
 * no checkpoint for this thread yet"; `undefined` (or a store that
 * ignores the argument) preserves the unguarded legacy behaviour, which
 * the engine backstops with its own pre-check.
 *
 * @stable
 */
export interface CheckpointPutOptions {
  readonly expectedLatestId?: CheckpointId | null;
}

/**
 * Thrown by a {@link CheckpointStore.put} honouring
 * {@link CheckpointPutOptions.expectedLatestId} when another writer
 * advanced the thread in between. The workflow engine maps it to its
 * `checkpoint-version-conflict` error.
 *
 * @stable
 */
export class CheckpointConflictError extends Error {
  readonly threadId: string;
  readonly expectedLatestId: CheckpointId | null;
  readonly actualLatestId: CheckpointId | null;

  constructor(threadId: string, expected: CheckpointId | null, actual: CheckpointId | null) {
    super(
      `checkpoint conflict on thread "${threadId}": expected latest ${expected ?? '<none>'}, found ${actual ?? '<none>'}`,
    );
    this.name = 'CheckpointConflictError';
    this.threadId = threadId;
    this.expectedLatestId = expected;
    this.actualLatestId = actual;
  }
}

/**
 * Pluggable checkpoint storage interface. The default implementation
 * lives in `@graphorin/store-sqlite`.
 *
 * @stable
 */
export interface CheckpointStore {
  put(
    threadId: string,
    namespace: string,
    checkpoint: Checkpoint,
    metadata: CheckpointMetadata,
    opts?: CheckpointPutOptions,
  ): Promise<CheckpointId>;

  putWrites(
    threadId: string,
    namespace: string,
    checkpointId: CheckpointId,
    writes: ReadonlyArray<PendingWrite>,
    taskId: string,
  ): Promise<void>;

  getTuple(
    threadId: string,
    namespace: string,
    checkpointId?: CheckpointId,
  ): Promise<CheckpointTuple | null>;

  list(threadId: string, namespace: string, opts?: ListOptions): AsyncIterable<CheckpointTuple>;

  deleteThread(threadId: string): Promise<void>;
}
