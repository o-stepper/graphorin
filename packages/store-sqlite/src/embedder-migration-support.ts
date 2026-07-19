/**
 * Store-side support for the `@graphorin/memory` embedder-migration
 * runner:
 *
 *  - {@link EmbedderMigrationStateRepository} revives the dead
 *    `migration_state` table (schema 001) as the persisted,
 *    cross-process-resumable cursor. No schema change: the composite
 *    `last_record_id` encodes `<kind>:<cursor>` because the runner
 *    walks the three vector kinds sequentially.
 *  - {@link createMigrationBatcher} is the `nextBatch` hook the runner
 *    always lacked (it used to throw without a caller-supplied pager):
 *    pages LIVE base rows in stable id order, re-embeds into the
 *    TARGET sidecar and deletes the SOURCE sidecar row per record.
 *  - {@link dropRetiredVectorTables} is the space-reclaim step:
 *    `retire()` only stamps `retired_at`, leaving full-size vec tables
 *    behind forever - this drops them (freed pages return via
 *    `PRAGMA incremental_vacuum` / `graphorin storage compact`).
 *
 * @packageDocumentation
 */

import type { SqliteConnection } from './connection.js';
import type { EmbeddingMetaRepository } from './embedding-meta-repo.js';
import { pickIdColumn, quoteIdent, type VectorTableManager } from './vector-table-mgr.js';

/** One persisted migration-state row (schema 001). */
export interface EmbedderMigrationStateRow {
  readonly id: string;
  readonly sourceEmbedder: string;
  readonly targetEmbedder: string;
  readonly strategy: string;
  readonly status: 'running' | 'committed' | 'aborted' | 'failed';
  readonly totalRecords: number;
  readonly processed: number;
  /** Composite resumable cursor: `<kind>:<cursor>` (kind ∈ fact|episode|message). */
  readonly lastRecordId: string | null;
  readonly startedAt: number;
  readonly finishedAt: number | null;
  readonly errorMessage: string | null;
}

/**
 * Persisted cursor store over `migration_state`. Structurally matches
 * the runner's `MigrationStateStoreLike` contract in
 * `@graphorin/memory` (the memory package never imports this class).
 *
 * @stable
 */
export class EmbedderMigrationStateRepository {
  #conn: SqliteConnection;

  constructor(conn: SqliteConnection) {
    this.#conn = conn;
  }

  /** The most recent RESUMABLE row (running/aborted) for the pair, or null. */
  async findResumable(
    sourceEmbedder: string,
    targetEmbedder: string,
  ): Promise<EmbedderMigrationStateRow | null> {
    const row = this.#conn.get<{
      id: string;
      source_embedder: string;
      target_embedder: string;
      strategy: string;
      status: string;
      total_records: number;
      processed: number;
      last_record_id: string | null;
      started_at: number;
      finished_at: number | null;
      error_message: string | null;
    }>(
      `SELECT * FROM migration_state
       WHERE source_embedder = ? AND target_embedder = ? AND status IN ('running', 'aborted')
       ORDER BY started_at DESC LIMIT 1`,
      [sourceEmbedder, targetEmbedder],
    );
    if (row === undefined) return null;
    return {
      id: row.id,
      sourceEmbedder: row.source_embedder,
      targetEmbedder: row.target_embedder,
      strategy: row.strategy,
      status: row.status as EmbedderMigrationStateRow['status'],
      totalRecords: row.total_records,
      processed: row.processed,
      lastRecordId: row.last_record_id,
      startedAt: row.started_at,
      finishedAt: row.finished_at,
      errorMessage: row.error_message,
    };
  }

  /** Insert a fresh `running` row. */
  async create(state: {
    readonly id: string;
    readonly sourceEmbedder: string;
    readonly targetEmbedder: string;
    readonly strategy: string;
    readonly totalRecords: number;
  }): Promise<void> {
    this.#conn.run(
      `INSERT INTO migration_state (
         id, source_embedder, target_embedder, strategy, status,
         total_records, processed, last_record_id, started_at, finished_at, error_message
       ) VALUES (?, ?, ?, ?, 'running', ?, 0, NULL, ?, NULL, NULL)`,
      [
        state.id,
        state.sourceEmbedder,
        state.targetEmbedder,
        state.strategy,
        state.totalRecords,
        Date.now(),
      ],
    );
  }

  /** Advance / settle the row. */
  async update(
    id: string,
    patch: {
      readonly processed?: number;
      readonly lastRecordId?: string | null;
      readonly status?: EmbedderMigrationStateRow['status'];
      readonly errorMessage?: string | null;
    },
  ): Promise<void> {
    const sets: string[] = [];
    const binds: Array<string | number | null> = [];
    if (patch.processed !== undefined) {
      sets.push('processed = ?');
      binds.push(patch.processed);
    }
    if (patch.lastRecordId !== undefined) {
      sets.push('last_record_id = ?');
      binds.push(patch.lastRecordId);
    }
    if (patch.status !== undefined) {
      sets.push('status = ?');
      binds.push(patch.status);
      if (patch.status === 'committed' || patch.status === 'failed') {
        sets.push('finished_at = ?');
        binds.push(Date.now());
      }
    }
    if (patch.errorMessage !== undefined) {
      sets.push('error_message = ?');
      binds.push(patch.errorMessage);
    }
    if (sets.length === 0) return;
    binds.push(id);
    this.#conn.run(`UPDATE migration_state SET ${sets.join(', ')} WHERE id = ?`, binds);
  }
}

/** Row shape handed to the runner (structural `MigrationRow`). */
interface BatcherRow {
  readonly id: string;
  readonly text: string;
  readonly write: (vector: Float32Array) => Promise<void>;
}

/**
 * Build the store-side `nextBatch` hook for the migration runner
 * (structural `NextBatchHook`). Semantics:
 *
 *  - `fact` pages live `facts` rows (id order), `episode` live
 *    `episodes` rows; `message` returns end-of-stream immediately -
 *    session-message vector search is not implemented, so there is
 *    nothing to migrate.
 *  - Every paged row re-embeds into the TARGET sidecar (created on
 *    demand, mode-aware) and deletes any SOURCE sidecar row, then
 *    flips the base row's `embedder_id` - so a fully-drained source
 *    can be retired and its tables dropped.
 *
 * @stable
 */
export function createMigrationBatcher(
  conn: SqliteConnection,
  embeddings: EmbeddingMetaRepository,
  vectorMgr: VectorTableManager,
): (args: {
  readonly kind: 'fact' | 'episode' | 'message';
  readonly source: string;
  readonly target: string;
  readonly batchSize: number;
  readonly cursor: string | null;
}) => Promise<{ readonly rows: ReadonlyArray<BatcherRow>; readonly nextCursor: string | null }> {
  return async ({ kind, source, target, batchSize, cursor }) => {
    if (kind === 'message') return { rows: [], nextCursor: null };
    const targetMeta = embeddings.get(target);
    const sourceMeta = embeddings.get(source);
    if (targetMeta === null) {
      throw new Error(`[graphorin/store-sqlite] target embedder '${target}' is not registered.`);
    }
    const base = kind === 'fact' ? 'facts' : 'episodes';
    const textColumn = kind === 'fact' ? 'text' : 'summary';
    const vecKind = kind === 'fact' ? ('facts' as const) : ('episodes' as const);
    const idColumn = pickIdColumn(vecKind);
    const rows = conn.all<{ id: string; text: string }>(
      `SELECT id, ${textColumn} AS text FROM ${quoteIdent(base)}
       WHERE deleted_at IS NULL AND id > ?
       ORDER BY id ASC LIMIT ?`,
      [cursor ?? '', batchSize],
    );
    const targetTable = vectorMgr.ensureTable(vecKind, targetMeta);
    const sourceTable = sourceMeta !== null ? vectorMgr.ensureTable(vecKind, sourceMeta) : null;
    const mapped: BatcherRow[] = rows.map((row) => ({
      id: row.id,
      text: row.text,
      write: async (vector: Float32Array) => {
        conn.transaction(() => {
          conn.run(
            `INSERT OR REPLACE INTO ${quoteIdent(targetTable)} (${idColumn}, embedding) VALUES (?, ?)`,
            [row.id, f32ToBlobLocal(vector)],
          );
          if (sourceTable !== null && sourceTable !== targetTable) {
            conn.run(`DELETE FROM ${quoteIdent(sourceTable)} WHERE ${idColumn} = ?`, [row.id]);
          }
          conn.run(`UPDATE ${quoteIdent(base)} SET embedder_id = ? WHERE id = ?`, [target, row.id]);
        });
      },
    }));
    const last = rows[rows.length - 1];
    return {
      rows: mapped,
      nextCursor: rows.length < batchSize ? null : (last?.id ?? null),
    };
  };
}

/**
 * Drop the vector sidecar tables of every RETIRED embedder (space
 * reclaim). Table names still referenced by an ACTIVE meta are
 * skipped defensively. Freed pages return to the OS via
 * `PRAGMA incremental_vacuum` (`graphorin storage compact`); this
 * function only drops.
 *
 * @stable
 */
export function dropRetiredVectorTables(
  conn: SqliteConnection,
  embeddings: EmbeddingMetaRepository,
  vectorMgr: VectorTableManager,
): { readonly dropped: ReadonlyArray<string> } {
  const active = new Set<string>();
  for (const meta of embeddings.listActive()) {
    active.add(meta.vecTableFacts);
    active.add(meta.vecTableEpisodes);
    active.add(meta.vecTableMessages);
  }
  const dropped: string[] = [];
  for (const meta of embeddings.listAll()) {
    if (meta.retiredAt === null) continue;
    for (const tableName of [meta.vecTableFacts, meta.vecTableEpisodes, meta.vecTableMessages]) {
      if (active.has(tableName)) continue;
      const exists = conn.get<{ one: number }>(
        "SELECT 1 AS one FROM sqlite_master WHERE type = 'table' AND name = ?",
        [tableName],
      );
      if (exists === undefined) continue;
      vectorMgr.dropTable(tableName);
      dropped.push(tableName);
    }
  }
  return { dropped };
}

/** Float32Array → BLOB (mirror of the memory-store helper). */
function f32ToBlobLocal(vector: Float32Array): Buffer {
  return Buffer.from(vector.buffer, vector.byteOffset, vector.byteLength);
}
