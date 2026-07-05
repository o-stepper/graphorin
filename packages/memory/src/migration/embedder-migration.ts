import type { EmbedderProvider } from '@graphorin/core';
import {
  EmbedderMigrationAbortedError,
  EmbedderMigrationLockedError,
  EmbedderMigrationStateError,
} from '../errors/index.js';
import { bindEmbedder } from '../internal/embedder-binding.js';
import type { EmbeddingMetaRegistryLike } from '../internal/storage-adapter.js';

/**
 * Coexistence policy for embedder swaps.
 *
 *  - `'lock-on-first'` (default) - refuses to register a second active
 *    embedder; surfaces an actionable error pointing at the planned
 *    migration runner.
 *  - `'multi-active'` - keeps both embedders alive (read union, write
 *    to active); used while a long migration is in flight.
 *  - `'auto-migrate'` - re-embeds existing rows in resumable batches
 *    until the source embedder has zero rows, then retires it.
 *
 * @stable
 */
export type EmbedderMigrationStrategy = 'lock-on-first' | 'multi-active' | 'auto-migrate';

/**
 * Per-iteration progress snapshot yielded by {@link migrateEmbedder}.
 *
 * @stable
 */
export interface MigrationProgress {
  /** `'fact'`, `'episode'`, or `'message'` - which entity is being migrated. */
  readonly kind: 'fact' | 'episode' | 'message';
  /** Number of records processed so far. */
  readonly processed: number;
  /** Total records expected for this entity (when known). */
  readonly total: number;
  /** Identifier of the source embedder (`'<adapter>:<model>@<dim>'`). */
  readonly source: string;
  /** Identifier of the target embedder. */
  readonly target: string;
  /**
   * Identifier for this migration run. MST-12: this is an in-memory id for
   * the current run - there is no persisted `migration_state` cursor today, so
   * a migration does not resume across processes.
   */
  readonly migrationId: string;
  /** Phase discriminator. */
  readonly phase: 'planning' | 'running' | 'paused' | 'committed' | 'aborted';
}

/**
 * Options accepted by {@link migrateEmbedder}.
 *
 * @stable
 */
export interface MigrateEmbedderOptions {
  /** Source embedder (currently active). */
  readonly source: EmbedderProvider;
  /** Target embedder (becomes active when migration commits). */
  readonly target: EmbedderProvider;
  /** Storage layer's embedder registry. */
  readonly embeddings: EmbeddingMetaRegistryLike;
  /** Strategy applied per `embedding_meta` row. Default `'lock-on-first'`. */
  readonly strategy?: EmbedderMigrationStrategy;
  /**
   * Threshold for `auto-migrate`. The runner streams source rows in
   * batches of `batchSize` (default `512`) and yields progress after
   * each batch.
   */
  readonly batchSize?: number;
  /** Optional cap on the number of rows to migrate per kind. */
  readonly maxRecordsPerKind?: number;
  /**
   * Hook that returns the next batch of rows to re-embed for a given kind.
   * MST-12: this is **caller-supplied** - there is no store-side helper that
   * auto-wires it today, and `auto-migrate` throws without it. Pass a paging
   * function over your source rows to drive the migration.
   */
  readonly nextBatch?: NextBatchHook;
  /** Optional abort signal - aborting yields one final progress event. */
  readonly signal?: AbortSignal;
}

/**
 * Per-batch loader. Returns up to `batchSize` rows for the supplied
 * `kind` whose `embedder_id` is the source embedder. Returning an
 * empty array signals end-of-stream.
 *
 * @stable
 */
export type NextBatchHook = (args: {
  readonly kind: 'fact' | 'episode' | 'message';
  readonly source: string;
  readonly target: string;
  readonly batchSize: number;
  readonly cursor: string | null;
}) => Promise<{ readonly rows: ReadonlyArray<MigrationRow>; readonly nextCursor: string | null }>;

/**
 * Single row exposed to the migration runner. The runner re-embeds
 * `text` with the target embedder; the storage adapter is responsible
 * for committing the new vector + updating `embedder_id`.
 *
 * @stable
 */
export interface MigrationRow {
  readonly id: string;
  readonly text: string;
  readonly write: (vector: Float32Array) => Promise<void>;
}

/**
 * Stream embedder migrations as `AsyncIterable<MigrationProgress>`.
 *
 * The function is the universal entry point for every migration
 * strategy:
 *
 *  - `'lock-on-first'`: surfaces the locked error eagerly so the
 *    operator can act before any work happens.
 *  - `'multi-active'`: registers the target alongside the source and
 *    yields a single `'committed'` progress event.
 *  - `'auto-migrate'`: streams batches until the source is fully
 *    drained, then retires the source row.
 *
 * @stable
 */
export async function* migrateEmbedder(
  options: MigrateEmbedderOptions,
): AsyncGenerator<MigrationProgress, void, unknown> {
  const { source, target, embeddings } = options;
  const strategy = options.strategy ?? 'lock-on-first';
  const sourceId = source.id();
  const targetId = target.id();
  const migrationId = `migration_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

  if (sourceId === targetId) {
    throw new EmbedderMigrationStateError(
      `source and target embedders must differ; both resolved to '${sourceId}'.`,
    );
  }

  const sourceMeta = embeddings.get(sourceId);
  if (sourceMeta === null) {
    throw new EmbedderMigrationStateError(
      `source embedder '${sourceId}' is not registered. Run createMemory({ embedder: source }) first.`,
    );
  }

  if (strategy === 'lock-on-first') {
    throw new EmbedderMigrationLockedError(sourceId, targetId);
  }

  bindEmbedder(target, embeddings);

  if (strategy === 'multi-active') {
    yield {
      kind: 'fact',
      processed: 0,
      total: 0,
      source: sourceId,
      target: targetId,
      migrationId,
      phase: 'committed',
    };
    return;
  }

  // strategy === 'auto-migrate'
  if (options.nextBatch === undefined) {
    throw new EmbedderMigrationStateError(
      "'auto-migrate' requires a `nextBatch` hook supplied by the storage adapter.",
    );
  }

  const batchSize = options.batchSize ?? 512;
  const cap = options.maxRecordsPerKind ?? Number.POSITIVE_INFINITY;

  for (const kind of ['fact', 'episode', 'message'] as const) {
    let cursor: string | null = null;
    let processed = 0;
    while (processed < cap) {
      if (options.signal?.aborted === true) {
        yield {
          kind,
          processed,
          total: processed,
          source: sourceId,
          target: targetId,
          migrationId,
          phase: 'aborted',
        };
        throw new EmbedderMigrationAbortedError(migrationId);
      }
      const batch = await options.nextBatch({
        kind,
        source: sourceId,
        target: targetId,
        batchSize,
        cursor,
      });
      if (batch.rows.length === 0) break;
      const texts = batch.rows.map((r) => r.text);
      const vectors = await target.embed(texts, {
        ...(options.signal !== undefined ? { signal: options.signal } : {}),
      });
      for (let i = 0; i < batch.rows.length; i++) {
        const row = batch.rows[i];
        const vector = vectors[i];
        if (row === undefined || vector === undefined) continue;
        await row.write(vector);
      }
      processed += batch.rows.length;
      cursor = batch.nextCursor;
      yield {
        kind,
        processed,
        total: processed,
        source: sourceId,
        target: targetId,
        migrationId,
        phase: 'running',
      };
      if (cursor === null) break;
    }
  }

  embeddings.retire(sourceId);
  yield {
    kind: 'fact',
    processed: 0,
    total: 0,
    source: sourceId,
    target: targetId,
    migrationId,
    phase: 'committed',
  };
}
