import type { SqliteConnection } from './connection.js';

/**
 * One durably-parked agent run (`awaiting_approval`). `stateJson` is
 * the agent-serialized resumable `RunState` (the version-stamped,
 * secret-redacted `graphorin-run-state/x.y` payload produced by
 * `Agent.serializeState`); the store treats it as an opaque string.
 *
 * @stable
 */
export interface SuspendedRunRecord {
  readonly runId: string;
  readonly agentId: string;
  readonly sessionId?: string;
  readonly userId?: string;
  readonly stateJson: string;
  /** Epoch ms of the FIRST suspension - stable across re-puts. */
  readonly suspendedAt: number;
}

/**
 * Durable sidecar for the server's `RunStateTracker`: a run suspended
 * on durable HITL outlives the process, so the REST resume endpoint
 * keeps working after a restart. The `@graphorin/server` package
 * consumes this surface; the schema ships in migration 038.
 *
 * @stable
 */
export interface SuspendedRunStore {
  /**
   * Insert or refresh a suspension. A re-put for the same `runId`
   * replaces the state but keeps the original `suspendedAt`, so the
   * column always answers "how long has this approval been waiting".
   */
  put(record: SuspendedRunRecord): Promise<void>;
  get(runId: string): Promise<SuspendedRunRecord | undefined>;
  delete(runId: string): Promise<void>;
  /** Every parked run, oldest suspension first - boot hydration. */
  list(): Promise<ReadonlyArray<SuspendedRunRecord>>;
}

/**
 * Default `SuspendedRunStore` implementation.
 *
 * @stable
 */
export class SqliteSuspendedRunStore implements SuspendedRunStore {
  #conn: SqliteConnection;
  constructor(conn: SqliteConnection) {
    this.#conn = conn;
  }

  async put(record: SuspendedRunRecord): Promise<void> {
    this.#conn.run(
      `INSERT INTO suspended_runs (run_id, agent_id, session_id, user_id, state_json, suspended_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(run_id) DO UPDATE SET
         agent_id = excluded.agent_id,
         session_id = excluded.session_id,
         user_id = excluded.user_id,
         state_json = excluded.state_json`,
      [
        record.runId,
        record.agentId,
        record.sessionId ?? null,
        record.userId ?? null,
        record.stateJson,
        record.suspendedAt,
      ],
    );
  }

  async get(runId: string): Promise<SuspendedRunRecord | undefined> {
    const row = this.#conn.get<SuspendedRunRow>('SELECT * FROM suspended_runs WHERE run_id = ?', [
      runId,
    ]);
    return row === undefined ? undefined : toRecord(row);
  }

  async delete(runId: string): Promise<void> {
    this.#conn.run('DELETE FROM suspended_runs WHERE run_id = ?', [runId]);
  }

  async list(): Promise<ReadonlyArray<SuspendedRunRecord>> {
    const rows = this.#conn.all<SuspendedRunRow>(
      'SELECT * FROM suspended_runs ORDER BY suspended_at ASC, run_id ASC',
    );
    return rows.map(toRecord);
  }
}

interface SuspendedRunRow {
  readonly run_id: string;
  readonly agent_id: string;
  readonly session_id: string | null;
  readonly user_id: string | null;
  readonly state_json: string;
  readonly suspended_at: number;
}

function toRecord(row: SuspendedRunRow): SuspendedRunRecord {
  return {
    runId: row.run_id,
    agentId: row.agent_id,
    ...(row.session_id !== null ? { sessionId: row.session_id } : {}),
    ...(row.user_id !== null ? { userId: row.user_id } : {}),
    stateJson: row.state_json,
    suspendedAt: row.suspended_at,
  };
}
