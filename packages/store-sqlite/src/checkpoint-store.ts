import type {
  Checkpoint,
  CheckpointId,
  CheckpointMetadata,
  CheckpointStore,
  CheckpointTuple,
  ListOptions,
  PendingWrite,
} from '@graphorin/core/contracts';
import type { SqliteConnection } from './connection.js';

/**
 * Default `CheckpointStore` implementation. Workflow state is encoded
 * as JSON blobs; per-task pending writes survive partial step failure.
 *
 * @stable
 */
export class SqliteCheckpointStore implements CheckpointStore {
  #conn: SqliteConnection;
  constructor(conn: SqliteConnection) {
    this.#conn = conn;
  }

  async put(
    threadId: string,
    namespace: string,
    checkpoint: Checkpoint,
    metadata: CheckpointMetadata,
  ): Promise<CheckpointId> {
    this.#conn.run(
      `INSERT OR REPLACE INTO workflow_checkpoints (
         id, thread_id, namespace, parent_id, state_json, channel_versions_json,
         step_number, source, status, node_name, tags_json, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        Date.parse(checkpoint.createdAt),
      ],
    );
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
}

interface CheckpointRow {
  id: string;
  thread_id: string;
  namespace: string;
  parent_id: string | null;
  state_json: string;
  channel_versions_json: string;
  step_number: number;
  source: 'sync' | 'async' | 'exit';
  status: 'running' | 'suspended' | 'completed' | 'failed';
  node_name: string | null;
  tags_json: string | null;
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
    source: row.source,
    status: row.status,
    ...(row.node_name !== null ? { nodeName: row.node_name } : {}),
    ...(row.tags_json !== null ? { tags: JSON.parse(row.tags_json) } : {}),
  };
  return { checkpoint, metadata };
}
