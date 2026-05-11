import type { TriggerState, TriggerStore } from '@graphorin/core/contracts';
import type { SqliteConnection } from './connection.js';

/**
 * Default `TriggerStore` implementation. Backs the `@graphorin/triggers`
 * scheduler with persistent rows so cron / interval / idle / event
 * triggers survive process restarts (DEC-150).
 *
 * @stable
 */
export class SqliteTriggerStore implements TriggerStore {
  #conn: SqliteConnection;
  constructor(conn: SqliteConnection) {
    this.#conn = conn;
  }

  async upsert(state: TriggerState): Promise<void> {
    this.#conn.run(
      `INSERT OR REPLACE INTO trigger_state (
         id, kind, spec, callback_ref, next_fire_at, last_fired_at,
         missed_fires, disabled, catchup_policy, max_catchup_runs,
         catchup_window_ms, tags_json, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        state.id,
        state.kind,
        state.spec,
        state.callbackRef,
        state.nextFireAt ? Date.parse(state.nextFireAt) : null,
        state.lastFiredAt ? Date.parse(state.lastFiredAt) : null,
        state.missedFires,
        state.disabled ? 1 : 0,
        state.catchupPolicy,
        state.maxCatchupRuns,
        state.catchupWindowMs,
        state.tags ? JSON.stringify(state.tags) : null,
        Date.parse(state.createdAt),
        state.updatedAt ? Date.parse(state.updatedAt) : null,
      ],
    );
  }

  async get(id: string): Promise<TriggerState | null> {
    const row = this.#conn.get<TriggerStateRow>('SELECT * FROM trigger_state WHERE id = ?', [id]);
    return row ? rowToState(row) : null;
  }

  async list(): Promise<ReadonlyArray<TriggerState>> {
    const rows = this.#conn.all<TriggerStateRow>('SELECT * FROM trigger_state ORDER BY id');
    return rows.map(rowToState);
  }

  async remove(id: string): Promise<void> {
    this.#conn.run('DELETE FROM trigger_state WHERE id = ?', [id]);
  }

  async recordFire(id: string, firedAt: string, nextFireAt?: string): Promise<void> {
    this.#conn.run(
      `UPDATE trigger_state SET last_fired_at = ?, next_fire_at = ?, updated_at = ?, missed_fires = 0 WHERE id = ?`,
      [Date.parse(firedAt), nextFireAt ? Date.parse(nextFireAt) : null, Date.parse(firedAt), id],
    );
  }
}

interface TriggerStateRow {
  id: string;
  kind: 'cron' | 'interval' | 'idle' | 'event';
  spec: string;
  callback_ref: string;
  next_fire_at: number | null;
  last_fired_at: number | null;
  missed_fires: number;
  disabled: number;
  catchup_policy: 'none' | 'last' | 'all';
  max_catchup_runs: number;
  catchup_window_ms: number;
  tags_json: string | null;
  created_at: number;
  updated_at: number | null;
}

function rowToState(row: TriggerStateRow): TriggerState {
  return {
    id: row.id,
    kind: row.kind,
    spec: row.spec,
    callbackRef: row.callback_ref,
    ...(row.next_fire_at !== null ? { nextFireAt: new Date(row.next_fire_at).toISOString() } : {}),
    ...(row.last_fired_at !== null
      ? { lastFiredAt: new Date(row.last_fired_at).toISOString() }
      : {}),
    missedFires: row.missed_fires,
    disabled: row.disabled !== 0,
    catchupPolicy: row.catchup_policy,
    maxCatchupRuns: row.max_catchup_runs,
    catchupWindowMs: row.catchup_window_ms,
    ...(row.tags_json !== null ? { tags: JSON.parse(row.tags_json) } : {}),
    createdAt: new Date(row.created_at).toISOString(),
    ...(row.updated_at !== null ? { updatedAt: new Date(row.updated_at).toISOString() } : {}),
  };
}
