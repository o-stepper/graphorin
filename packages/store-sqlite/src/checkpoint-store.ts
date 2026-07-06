import type {
  Checkpoint,
  CheckpointId,
  CheckpointMetadata,
  CheckpointPutOptions,
  CheckpointStoreExt,
  CheckpointTuple,
  ListOptions,
  PendingWrite,
  PruneThreadsOptions,
} from '@graphorin/core/contracts';
import { CheckpointConflictError } from '@graphorin/core/contracts';
import type { SqliteConnection } from './connection.js';

/**
 * Default `CheckpointStore` implementation (including the W-009
 * `CheckpointStoreExt` retention primitives). Workflow state is
 * encoded as JSON blobs; per-task pending writes survive partial step
 * failure.
 *
 * @stable
 */
export class SqliteCheckpointStore implements CheckpointStoreExt {
  #conn: SqliteConnection;
  constructor(conn: SqliteConnection) {
    this.#conn = conn;
  }

  async put(
    threadId: string,
    namespace: string,
    checkpoint: Checkpoint,
    metadata: CheckpointMetadata,
    opts?: CheckpointPutOptions,
  ): Promise<CheckpointId> {
    // D1 / workflow-01: the compare-and-set runs inside one synchronous
    // better-sqlite3 transaction, so the latest-checkpoint read and the
    // insert are atomic in-process AND serialized cross-process by
    // SQLite's writer lock.
    if (opts?.expectedLatestId !== undefined) {
      this.#conn.transaction(() => {
        const latest = this.#conn.get<{ id: string }>(
          'SELECT id FROM workflow_checkpoints WHERE thread_id = ? AND namespace = ? ORDER BY step_number DESC LIMIT 1',
          [threadId, namespace],
        );
        const latestId = latest?.id ?? null;
        if (latestId !== opts.expectedLatestId) {
          throw new CheckpointConflictError(threadId, opts.expectedLatestId ?? null, latestId);
        }
        this.#insertCheckpoint(threadId, namespace, checkpoint, metadata);
      });
      return checkpoint.id;
    }
    this.#insertCheckpoint(threadId, namespace, checkpoint, metadata);
    return checkpoint.id;
  }

  #insertCheckpoint(
    threadId: string,
    namespace: string,
    checkpoint: Checkpoint,
    metadata: CheckpointMetadata,
  ): void {
    this.#conn.run(
      `INSERT OR REPLACE INTO workflow_checkpoints (
         id, thread_id, namespace, parent_id, state_json, channel_versions_json,
         step_number, source, status, node_name, tags_json, session_id, wake_at, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        checkpoint.id,
        threadId,
        namespace,
        checkpoint.parentId ?? null,
        JSON.stringify(checkpoint.state),
        JSON.stringify(checkpoint.channelVersions),
        checkpoint.stepNumber,
        metadata.source,
        metadata.status,
        metadata.nodeName ?? null,
        metadata.tags ? JSON.stringify(metadata.tags) : null,
        metadata.sessionId ?? null,
        metadata.wakeAt ?? null,
        Date.parse(checkpoint.createdAt),
      ],
    );
  }

  async putWrites(
    threadId: string,
    namespace: string,
    checkpointId: CheckpointId,
    writes: ReadonlyArray<PendingWrite>,
    taskId: string,
  ): Promise<void> {
    if (writes.length === 0) return;
    this.#conn.transaction(() => {
      for (const w of writes) {
        this.#conn.run(
          `INSERT OR REPLACE INTO workflow_pending_writes (
             thread_id, namespace, checkpoint_id, task_id, write_index, channel, value_json
           ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [threadId, namespace, checkpointId, taskId, w.index, w.channel, JSON.stringify(w.value)],
        );
        void w.taskId; // taskId from PendingWrite is the "owner" key; stored separately
      }
    });
  }

  async getTuple(
    threadId: string,
    namespace: string,
    checkpointId?: CheckpointId,
  ): Promise<CheckpointTuple | null> {
    const row =
      checkpointId !== undefined
        ? this.#conn.get<CheckpointRow>(
            'SELECT * FROM workflow_checkpoints WHERE thread_id = ? AND namespace = ? AND id = ?',
            [threadId, namespace, checkpointId],
          )
        : this.#conn.get<CheckpointRow>(
            `SELECT * FROM workflow_checkpoints WHERE thread_id = ? AND namespace = ? ORDER BY step_number DESC LIMIT 1`,
            [threadId, namespace],
          );
    if (row === undefined) return null;
    const tuple = rowToTuple(row);
    const writes = this.#conn.all<PendingWriteRow>(
      'SELECT task_id, write_index, channel, value_json FROM workflow_pending_writes WHERE thread_id = ? AND namespace = ? AND checkpoint_id = ? ORDER BY task_id, write_index',
      [threadId, namespace, row.id],
    );
    if (writes.length > 0) {
      return {
        ...tuple,
        pendingWrites: writes.map((w) => ({
          taskId: w.task_id,
          index: w.write_index,
          channel: w.channel,
          value: JSON.parse(w.value_json),
        })),
      };
    }
    return tuple;
  }

  /**
   * W-032: enumerate threads whose LATEST checkpoint in `namespace` is
   * suspended with a due `wake_at`. Latest-per-thread is decided by max
   * step_number (the same policy as `getTuple`), so a thread whose
   * newest checkpoint moved on (resumed / completed) never fires.
   */
  async listSuspended(
    namespace: string,
    opts?: { readonly dueBefore?: number; readonly limit?: number },
  ): Promise<ReadonlyArray<{ readonly threadId: string; readonly wakeAt: number }>> {
    const dueBefore = opts?.dueBefore ?? Number.MAX_SAFE_INTEGER;
    const limit = opts?.limit ?? -1;
    const rows = this.#conn.all<{ thread_id: string; wake_at: number }>(
      `SELECT c.thread_id, c.wake_at
         FROM workflow_checkpoints c
         JOIN (
           SELECT thread_id, MAX(step_number) AS max_step
             FROM workflow_checkpoints
            WHERE namespace = ?
            GROUP BY thread_id
         ) latest
           ON latest.thread_id = c.thread_id AND latest.max_step = c.step_number
        WHERE c.namespace = ?
          AND c.status = 'suspended'
          AND c.wake_at IS NOT NULL
          AND c.wake_at <= ?
        ORDER BY c.wake_at ASC
        LIMIT ?`,
      [namespace, namespace, dueBefore, limit],
    );
    return rows.map((r) => ({ threadId: r.thread_id, wakeAt: r.wake_at }));
  }

  async *list(
    threadId: string,
    namespace: string,
    opts?: ListOptions,
  ): AsyncIterable<CheckpointTuple> {
    const limit = opts?.limit ?? 100;
    const conditions = ['thread_id = ?', 'namespace = ?'];
    const params: unknown[] = [threadId, namespace];
    if (opts?.before !== undefined) {
      conditions.push('step_number < (SELECT step_number FROM workflow_checkpoints WHERE id = ?)');
      params.push(opts.before);
    }
    if (opts?.status !== undefined) {
      conditions.push('status = ?');
      params.push(opts.status);
    }
    const rows = this.#conn.all<CheckpointRow>(
      `SELECT * FROM workflow_checkpoints WHERE ${conditions.join(' AND ')} ORDER BY step_number DESC LIMIT ?`,
      [...params, limit],
    );
    for (const row of rows) yield rowToTuple(row);
  }

  async deleteThread(threadId: string): Promise<void> {
    this.#conn.transaction(() => {
      this.#conn.run('DELETE FROM workflow_pending_writes WHERE thread_id = ?', [threadId]);
      this.#conn.run('DELETE FROM workflow_checkpoints WHERE thread_id = ?', [threadId]);
    });
  }

  /**
   * W-009 retention sweep. Policy: a `(thread_id, namespace)` pair
   * qualifies when its LATEST checkpoint (by step_number) is older than
   * the cutoff and - unless `onlyTerminal: false` - terminal
   * ('completed' / 'failed' / 'aborted'); suspended pairs hold live
   * HITL approvals / awakeables and are protected by default.
   *
   * CRITICAL: never delegates to `deleteThread` - that primitive is
   * namespace-blind, and with a reused threadId (e.g. a sessionId used
   * by two workflows) pruning workflow A's terminal thread would erase
   * workflow B's suspended checkpoints, breaking the onlyTerminal
   * guarantee. Each qualifying pair is deleted with namespace-scoped
   * statements in its own transaction so a long sweep never holds the
   * writer lock across the whole table.
   */
  async pruneThreads(opts: PruneThreadsOptions): Promise<number> {
    const onlyTerminal = opts.onlyTerminal !== false;
    const pairs = this.#conn.all<{ thread_id: string; namespace: string }>(
      `SELECT thread_id, namespace FROM (
         SELECT thread_id, namespace, status, created_at,
                ROW_NUMBER() OVER (
                  PARTITION BY thread_id, namespace ORDER BY step_number DESC
                ) AS rn
         FROM workflow_checkpoints
       )
       WHERE rn = 1 AND created_at < ?${
         onlyTerminal ? " AND status IN ('completed', 'failed', 'aborted')" : ''
       }`,
      [opts.beforeEpochMs],
    );
    for (const pair of pairs) {
      this.#conn.transaction(() => {
        this.#conn.run(
          'DELETE FROM workflow_pending_writes WHERE thread_id = ? AND namespace = ?',
          [pair.thread_id, pair.namespace],
        );
        this.#conn.run('DELETE FROM workflow_checkpoints WHERE thread_id = ? AND namespace = ?', [
          pair.thread_id,
          pair.namespace,
        ]);
      });
    }
    return pairs.length;
  }

  /**
   * W-009 compaction: keep only the `keepLast` newest checkpoints (by
   * step_number) of one `(thread_id, namespace)` pair. Resume reads the
   * latest tuple, so `keepLast >= 1` never breaks resumability; the
   * oldest surviving checkpoint's parent_id may point at a deleted row,
   * which getTuple/list never resolve and the CAS compares only the
   * latest id - safe, but time-travel/fork targets are gone.
   */
  async compactThread(threadId: string, namespace: string, keepLast: number): Promise<number> {
    const keep = Math.max(1, Math.floor(keepLast));
    let deleted = 0;
    this.#conn.transaction(() => {
      const victims = this.#conn.all<{ id: string }>(
        `SELECT id FROM workflow_checkpoints
         WHERE thread_id = ? AND namespace = ?
         ORDER BY step_number DESC
         LIMIT -1 OFFSET ?`,
        [threadId, namespace, keep],
      );
      for (const victim of victims) {
        this.#conn.run(
          'DELETE FROM workflow_pending_writes WHERE thread_id = ? AND namespace = ? AND checkpoint_id = ?',
          [threadId, namespace, victim.id],
        );
        this.#conn.run(
          'DELETE FROM workflow_checkpoints WHERE thread_id = ? AND namespace = ? AND id = ?',
          [threadId, namespace, victim.id],
        );
      }
      deleted = victims.length;
    });
    return deleted;
  }
}

interface CheckpointRow {
  id: string;
  thread_id: string;
  namespace: string;
  parent_id: string | null;
  state_json: string;
  channel_versions_json: string;
  step_number: number;
  // Legacy persisted rows may still carry 'async' (removed from the
  // contract union, workflow-14); reads normalize it to 'sync'.
  source: 'sync' | 'async' | 'exit';
  status: 'running' | 'suspended' | 'completed' | 'failed' | 'aborted';
  node_name: string | null;
  tags_json: string | null;
  session_id: string | null;
  wake_at: number | null;
  created_at: number;
}

interface PendingWriteRow {
  task_id: string;
  write_index: number;
  channel: string;
  value_json: string;
}

function rowToTuple(row: CheckpointRow): CheckpointTuple {
  const checkpoint: Checkpoint = {
    id: row.id,
    threadId: row.thread_id,
    namespace: row.namespace,
    ...(row.parent_id !== null ? { parentId: row.parent_id } : {}),
    state: JSON.parse(row.state_json),
    channelVersions: JSON.parse(row.channel_versions_json),
    stepNumber: row.step_number,
    createdAt: new Date(row.created_at).toISOString(),
  };
  const metadata: CheckpointMetadata = {
    source: row.source === 'async' ? 'sync' : row.source,
    status: row.status,
    ...(row.node_name !== null ? { nodeName: row.node_name } : {}),
    ...(row.tags_json !== null ? { tags: JSON.parse(row.tags_json) } : {}),
    ...(row.session_id !== null && row.session_id !== undefined
      ? { sessionId: row.session_id }
      : {}),
    ...(row.wake_at !== null && row.wake_at !== undefined ? { wakeAt: row.wake_at } : {}),
  };
  return { checkpoint, metadata };
}
