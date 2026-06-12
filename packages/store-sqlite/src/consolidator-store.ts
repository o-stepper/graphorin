/**
 * `SqliteConsolidatorStateStore` — owns the `consolidator_state`,
 * `consolidator_runs`, and `consolidator_failed_batches` tables
 * shipped in Phase 05's migration 009. The class implements the
 * structural `ConsolidatorMemoryStoreExt` surface defined in
 * `@graphorin/memory/internal/storage-adapter.ts`.
 *
 * No `@graphorin/memory` import lives here — the storage side stays
 * dependency-free per the layered architecture.
 *
 * @packageDocumentation
 */

import type { SessionScope } from '@graphorin/core';
import type { SqliteConnection } from './connection.js';

/**
 * Persisted state row mirrored byte-for-byte by
 * `@graphorin/memory`'s `ConsolidatorStateRow`.
 *
 * @stable
 */
export interface ConsolidatorStateRow {
  readonly scope: SessionScope;
  readonly lastProcessedMessageId: string | null;
  readonly lastPhase: 'light' | 'standard' | 'deep' | null;
  readonly lastCompletedAt: number | null;
  readonly nextEligibleAt: number | null;
  readonly activeLockHeldBy: string | null;
  readonly activeLockAcquiredAt: number | null;
  /**
   * `ended_at` (epoch ms) of the newest episode the deep-phase reflection
   * pass has already reflected on (MCON-13). A later pass accumulates
   * importance only from strictly-newer episodes; `null` ⇒ nothing reflected
   * yet.
   */
  readonly reflectionWatermark: number | null;
}

/** @stable */
export interface ConsolidatorStatePatch {
  readonly lastProcessedMessageId?: string | null;
  readonly lastPhase?: 'light' | 'standard' | 'deep' | null;
  readonly lastCompletedAt?: number | null;
  readonly nextEligibleAt?: number | null;
  readonly activeLockHeldBy?: string | null;
  readonly activeLockAcquiredAt?: number | null;
  readonly reflectionWatermark?: number | null;
}

/** @stable */
export interface ConsolidatorRunInput {
  readonly id: string;
  readonly scope: SessionScope;
  readonly triggerKind: 'turn' | 'idle' | 'cron' | 'event' | 'budget' | 'manual';
  readonly phase: 'light' | 'standard' | 'deep';
  readonly startedAt: number;
}

/** @stable */
export interface ConsolidatorRunFinish {
  readonly id: string;
  readonly finishedAt: number;
  readonly status: 'completed' | 'failed' | 'deferred' | 'partial';
  readonly llmTokensUsed?: number;
  readonly llmCostUsd?: number | null;
  readonly factsCreated?: number;
  readonly factsUpdated?: number;
  readonly conflictsResolved?: number;
  readonly noiseFilteredCount?: number;
  readonly emptyExtractions?: number;
  /** Episodes auto-formed by the run (P1-2 / MCON-17). */
  readonly episodesFormed?: number;
  /** Insights synthesized by the run's reflection pass (P1-1 / MCON-17). */
  readonly insightsCreated?: number;
  readonly errorMessage?: string | null;
  readonly retryCount?: number;
}

/** @stable */
export interface DlqBatchInput {
  readonly id: string;
  readonly consolidatorRunId: string | null;
  readonly scope: SessionScope;
  readonly messageIds: ReadonlyArray<string>;
  readonly errorKind: string;
  readonly errorMessage: string;
  readonly failedAt: number;
  readonly nextRetryAt: number;
  readonly retryCount: number;
  /** Phase that failed (MCON-10); `null`/absent ⇒ legacy 'standard' replay. */
  readonly phase?: 'light' | 'standard' | 'deep' | null;
}

/** @stable */
export interface DlqBatchRow {
  readonly id: string;
  readonly consolidatorRunId: string | null;
  readonly scope: SessionScope;
  readonly messageIds: ReadonlyArray<string>;
  readonly errorKind: string;
  readonly errorMessage: string;
  readonly failedAt: number;
  readonly nextRetryAt: number | null;
  readonly retryCount: number;
  /** Phase that failed (MCON-10); `null` ⇒ legacy row. */
  readonly phase?: 'light' | 'standard' | 'deep' | null;
}

interface StateRowDb {
  scope_user_id: string;
  scope_session_id: string | null;
  scope_agent_id: string | null;
  last_processed_message_id: string | null;
  last_phase: 'light' | 'standard' | 'deep' | null;
  last_completed_at: number | null;
  next_eligible_at: number | null;
  active_lock_held_by: string | null;
  active_lock_acquired_at: number | null;
  reflection_watermark: number | null;
}

interface RunRowDb {
  id: string;
  phase: 'light' | 'standard' | 'deep';
  status: string;
  started_at: number;
  finished_at: number | null;
  llm_cost_usd: number | null;
  llm_tokens_used: number;
  facts_created: number;
  facts_updated: number;
}

interface DlqRowDb {
  id: string;
  consolidator_run_id: string | null;
  scope_user_id: string;
  message_ids_json: string;
  error_kind: string;
  error_message: string;
  failed_at: number;
  next_retry_at: number | null;
  retry_count: number;
  phase: string | null;
}

/**
 * SQLite-backed consolidator state store. Constructed by
 * {@link SqliteMemoryStore}; never instantiated directly by
 * application code.
 *
 * @stable
 */
export class SqliteConsolidatorStateStore {
  readonly #conn: SqliteConnection;

  constructor(conn: SqliteConnection) {
    this.#conn = conn;
  }

  async getState(scope: SessionScope): Promise<ConsolidatorStateRow | null> {
    const row = this.#conn.get<StateRowDb>(
      `SELECT * FROM consolidator_state
       WHERE scope_user_id = ?
         AND scope_session_id = ?
         AND scope_agent_id = ?`,
      [scope.userId, scope.sessionId ?? '', scope.agentId ?? ''],
    );
    return row === undefined ? null : rowToState(row);
  }

  async upsertState(
    scope: SessionScope,
    patch: ConsolidatorStatePatch,
  ): Promise<ConsolidatorStateRow> {
    const existing = await this.getState(scope);
    const merged: ConsolidatorStateRow = {
      scope,
      lastProcessedMessageId:
        patch.lastProcessedMessageId !== undefined
          ? patch.lastProcessedMessageId
          : (existing?.lastProcessedMessageId ?? null),
      lastPhase: patch.lastPhase !== undefined ? patch.lastPhase : (existing?.lastPhase ?? null),
      lastCompletedAt:
        patch.lastCompletedAt !== undefined
          ? patch.lastCompletedAt
          : (existing?.lastCompletedAt ?? null),
      nextEligibleAt:
        patch.nextEligibleAt !== undefined
          ? patch.nextEligibleAt
          : (existing?.nextEligibleAt ?? null),
      activeLockHeldBy:
        patch.activeLockHeldBy !== undefined
          ? patch.activeLockHeldBy
          : (existing?.activeLockHeldBy ?? null),
      activeLockAcquiredAt:
        patch.activeLockAcquiredAt !== undefined
          ? patch.activeLockAcquiredAt
          : (existing?.activeLockAcquiredAt ?? null),
      reflectionWatermark:
        patch.reflectionWatermark !== undefined
          ? patch.reflectionWatermark
          : (existing?.reflectionWatermark ?? null),
    };
    // Sentinel-empty-string keying — SQLite treats NULLs as distinct
    // in the composite primary key, so we collapse undefined session
    // / agent ids to '' before insert. The reverse mapping in
    // `rowToState` converts '' back to `undefined`.
    this.#conn.run(
      `INSERT INTO consolidator_state (
         scope_user_id, scope_session_id, scope_agent_id,
         last_processed_message_id, last_phase, last_completed_at,
         next_eligible_at, active_lock_held_by, active_lock_acquired_at,
         reflection_watermark
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(scope_user_id, scope_session_id, scope_agent_id) DO UPDATE SET
         last_processed_message_id = excluded.last_processed_message_id,
         last_phase = excluded.last_phase,
         last_completed_at = excluded.last_completed_at,
         next_eligible_at = excluded.next_eligible_at,
         active_lock_held_by = excluded.active_lock_held_by,
         active_lock_acquired_at = excluded.active_lock_acquired_at,
         reflection_watermark = excluded.reflection_watermark`,
      [
        merged.scope.userId,
        merged.scope.sessionId ?? '',
        merged.scope.agentId ?? '',
        merged.lastProcessedMessageId,
        merged.lastPhase,
        merged.lastCompletedAt,
        merged.nextEligibleAt,
        merged.activeLockHeldBy,
        merged.activeLockAcquiredAt,
        merged.reflectionWatermark,
      ],
    );
    return merged;
  }

  async acquireLock(
    scope: SessionScope,
    runId: string,
    now: number,
    maxAgeMs: number,
  ): Promise<boolean> {
    const existing = await this.getState(scope);
    if (existing === null || existing.activeLockHeldBy === null) {
      await this.upsertState(scope, {
        activeLockHeldBy: runId,
        activeLockAcquiredAt: now,
      });
      return true;
    }
    if (existing.activeLockHeldBy === runId) return true;
    if (
      maxAgeMs > 0 &&
      existing.activeLockAcquiredAt !== null &&
      now - existing.activeLockAcquiredAt > maxAgeMs
    ) {
      await this.upsertState(scope, {
        activeLockHeldBy: runId,
        activeLockAcquiredAt: now,
      });
      return true;
    }
    return false;
  }

  async releaseLock(scope: SessionScope, runId: string): Promise<void> {
    const existing = await this.getState(scope);
    if (existing !== null && existing.activeLockHeldBy === runId) {
      await this.upsertState(scope, {
        activeLockHeldBy: null,
        activeLockAcquiredAt: null,
      });
    }
  }

  async recordRunStart(input: ConsolidatorRunInput): Promise<void> {
    this.#conn.run(
      `INSERT INTO consolidator_runs (
         id, scope_user_id, scope_session_id, trigger_kind, phase, started_at, status
       ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        input.id,
        input.scope.userId,
        input.scope.sessionId ?? null,
        input.triggerKind,
        input.phase,
        input.startedAt,
        'running',
      ],
    );
  }

  async recordRunFinish(finish: ConsolidatorRunFinish): Promise<void> {
    this.#conn.run(
      `UPDATE consolidator_runs
       SET finished_at = ?, status = ?,
           llm_tokens_used = ?, llm_cost_usd = ?,
           facts_created = ?, facts_updated = ?, conflicts_resolved = ?,
           noise_filtered_count = ?, empty_extractions = ?,
           episodes_formed = ?, insights_created = ?,
           error_message = ?, retry_count = ?
       WHERE id = ?`,
      [
        finish.finishedAt,
        finish.status,
        finish.llmTokensUsed ?? 0,
        finish.llmCostUsd ?? null,
        finish.factsCreated ?? 0,
        finish.factsUpdated ?? 0,
        finish.conflictsResolved ?? 0,
        finish.noiseFilteredCount ?? 0,
        finish.emptyExtractions ?? 0,
        finish.episodesFormed ?? 0,
        finish.insightsCreated ?? 0,
        finish.errorMessage ?? null,
        finish.retryCount ?? 0,
        finish.id,
      ],
    );
  }

  async listRecentRuns(
    scope: SessionScope,
    limit = 50,
  ): Promise<
    ReadonlyArray<{
      readonly id: string;
      readonly phase: 'light' | 'standard' | 'deep';
      readonly status: string;
      readonly startedAt: number;
      readonly finishedAt: number | null;
      readonly llmCostUsd: number | null;
      readonly llmTokensUsed: number;
      readonly factsCreated: number;
      readonly factsUpdated: number;
    }>
  > {
    const rows = this.#conn.all<RunRowDb>(
      `SELECT id, phase, status, started_at, finished_at,
              llm_cost_usd, llm_tokens_used, facts_created, facts_updated
       FROM consolidator_runs
       WHERE scope_user_id = ?
       ORDER BY started_at DESC
       LIMIT ?`,
      [scope.userId, limit],
    );
    return rows.map((row) => ({
      id: row.id,
      phase: row.phase,
      status: row.status,
      startedAt: row.started_at,
      finishedAt: row.finished_at,
      llmCostUsd: row.llm_cost_usd,
      llmTokensUsed: row.llm_tokens_used,
      factsCreated: row.facts_created,
      factsUpdated: row.facts_updated,
    }));
  }

  async enqueueFailedBatch(input: DlqBatchInput): Promise<void> {
    this.#conn.run(
      `INSERT INTO consolidator_failed_batches (
         id, consolidator_run_id, scope_user_id,
         message_ids_json, error_kind, error_message,
         failed_at, next_retry_at, retry_count, phase
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.id,
        input.consolidatorRunId,
        input.scope.userId,
        JSON.stringify([...input.messageIds]),
        input.errorKind,
        input.errorMessage,
        input.failedAt,
        input.nextRetryAt,
        input.retryCount,
        input.phase ?? null,
      ],
    );
  }

  async claimReadyBatches(
    scope: SessionScope,
    now: number,
    limit = 50,
  ): Promise<ReadonlyArray<DlqBatchRow>> {
    const rows = this.#conn.all<DlqRowDb>(
      `SELECT * FROM consolidator_failed_batches
       WHERE scope_user_id = ?
         AND next_retry_at IS NOT NULL
         AND next_retry_at <= ?
       ORDER BY failed_at ASC
       LIMIT ?`,
      [scope.userId, now, limit],
    );
    return rows.map((row) => rowToDlq(row, scope));
  }

  async markBatchSucceeded(id: string): Promise<void> {
    this.#conn.run('DELETE FROM consolidator_failed_batches WHERE id = ?', [id]);
  }

  async rescheduleBatch(id: string, retryCount: number, nextRetryAt: number): Promise<void> {
    this.#conn.run(
      `UPDATE consolidator_failed_batches
       SET retry_count = ?, next_retry_at = ?
       WHERE id = ?`,
      [retryCount, nextRetryAt, id],
    );
  }

  async markBatchExhausted(id: string, errorMessage: string, retryCount?: number): Promise<void> {
    if (retryCount === undefined) {
      this.#conn.run(
        `UPDATE consolidator_failed_batches
         SET error_message = ?, next_retry_at = NULL
         WHERE id = ?`,
        [errorMessage, id],
      );
      return;
    }
    this.#conn.run(
      `UPDATE consolidator_failed_batches
       SET error_message = ?, next_retry_at = NULL, retry_count = ?
       WHERE id = ?`,
      [errorMessage, retryCount, id],
    );
  }

  async listFailedBatches(scope: SessionScope, limit = 100): Promise<ReadonlyArray<DlqBatchRow>> {
    const rows = this.#conn.all<DlqRowDb>(
      `SELECT * FROM consolidator_failed_batches
       WHERE scope_user_id = ?
       ORDER BY failed_at DESC
       LIMIT ?`,
      [scope.userId, limit],
    );
    return rows.map((row) => rowToDlq(row, scope));
  }
}

function rowToState(row: StateRowDb): ConsolidatorStateRow {
  return {
    scope: {
      userId: row.scope_user_id,
      ...(row.scope_session_id !== null && row.scope_session_id !== ''
        ? { sessionId: row.scope_session_id }
        : {}),
      ...(row.scope_agent_id !== null && row.scope_agent_id !== ''
        ? { agentId: row.scope_agent_id }
        : {}),
    },
    lastProcessedMessageId: row.last_processed_message_id,
    lastPhase: row.last_phase,
    lastCompletedAt: row.last_completed_at,
    nextEligibleAt: row.next_eligible_at,
    activeLockHeldBy: row.active_lock_held_by,
    activeLockAcquiredAt: row.active_lock_acquired_at,
    reflectionWatermark: row.reflection_watermark,
  };
}

function rowToDlq(row: DlqRowDb, scope: SessionScope): DlqBatchRow {
  let messageIds: ReadonlyArray<string> = [];
  try {
    const parsed: unknown = JSON.parse(row.message_ids_json);
    if (Array.isArray(parsed)) {
      messageIds = parsed.filter((v): v is string => typeof v === 'string');
    }
  } catch {
    // Corrupt payload — fall through with an empty list so callers
    // can still surface the failed row to the operator.
  }
  return {
    id: row.id,
    consolidatorRunId: row.consolidator_run_id,
    scope: { userId: scope.userId },
    messageIds,
    errorKind: row.error_kind,
    errorMessage: row.error_message,
    failedAt: row.failed_at,
    nextRetryAt: row.next_retry_at,
    retryCount: row.retry_count,
    phase:
      row.phase === 'light' || row.phase === 'standard' || row.phase === 'deep' ? row.phase : null,
  };
}
