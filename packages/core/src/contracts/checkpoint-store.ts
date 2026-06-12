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
  readonly source: 'sync' | 'async' | 'exit';
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
