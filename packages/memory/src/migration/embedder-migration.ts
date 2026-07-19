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
   * Identifier for this migration run. With a `state` store wired this
   * is the PERSISTED `migration_state` row id - a resumed run reports
   * the original id. Without one it is an
   * in-memory id and the migration does not resume across processes.
   */
  readonly migrationId: string;
  /** Phase discriminator. */
  readonly phase: 'planning' | 'running' | 'paused' | 'committed' | 'aborted';
}

/**
 * Structural view of the persisted `migration_state` cursor store.
 * The default implementation is
 * `@graphorin/store-sqlite`'s `store.embedderMigration.state`; declared
 * structurally here so this package never imports the storage package.
 *
 * @stable
 */
export interface MigrationStateStoreLike {
  findResumable(
    sourceEmbedder: string,
    targetEmbedder: string,
  ): Promise<{
    readonly id: string;
    readonly processed: number;
    readonly lastRecordId: string | null;
  } | null>;
  create(state: {
    readonly id: string;
    readonly sourceEmbedder: string;
    readonly targetEmbedder: string;
    readonly strategy: string;
    readonly totalRecords: number;
  }): Promise<void>;
  update(
    id: string,
    patch: {
      readonly processed?: number;
      readonly lastRecordId?: string | null;
      readonly status?: 'running' | 'committed' | 'aborted' | 'failed';
      readonly errorMessage?: string | null;
    },
  ): Promise<void>;
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
   * Hook that returns the next batch of rows to re-embed for a given
   * kind. `auto-migrate` throws without it. The default
   * `@graphorin/store-sqlite` adapter ships one as
   * `store.embedderMigration.nextBatch`; custom adapters
   * pass their own paging function.
   */
  readonly nextBatch?: NextBatchHook;
  /**
   * Persisted cursor store. When supplied,
   * `auto-migrate` records progress after every batch into
   * `migration_state` and RESUMES from the persisted cursor on the
   * next invocation (same source/target pair) - across process
   * restarts and kills. An explicit abort marks the row `aborted`
   * (still resumable); commit marks it `committed`.
   */
  readonly state?: MigrationStateStoreLike;
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
      "'auto-migrate' requires a `nextBatch` hook supplied by the storage adapter " +
        '(the default sqlite adapter ships one as store.embedderMigration.nextBatch).',
    );
  }

  const batchSize = options.batchSize ?? 512;
  const cap = options.maxRecordsPerKind ?? Number.POSITIVE_INFINITY;
  const kinds = ['fact', 'episode', 'message'] as const;

  // Wave-D D5 / MST-12: with a state store wired, resume from the
  // persisted composite cursor (`<kind>:<cursor>`; '<done>' marks a
  // finished kind) instead of starting over.
  let persistedId = migrationId;
  let resumeKindIndex = 0;
  let resumeCursor: string | null = null;
  let processedTotal = 0;
  if (options.state !== undefined) {
    const resumable = await options.state.findResumable(sourceId, targetId);
    if (resumable !== null) {
      persistedId = resumable.id;
      processedTotal = resumable.processed;
      const parsed = parseCompositeCursor(resumable.lastRecordId);
      if (parsed !== null) {
        const idx = kinds.indexOf(parsed.kind);
        if (idx >= 0) {
          if (parsed.cursor === DONE_CURSOR) {
            resumeKindIndex = idx + 1;
          } else {
            resumeKindIndex = idx;
            resumeCursor = parsed.cursor;
          }
        }
      }
      await options.state.update(persistedId, { status: 'running' });
    } else {
      await options.state.create({
        id: persistedId,
        sourceEmbedder: sourceId,
        targetEmbedder: targetId,
        strategy: 'auto-migrate',
        totalRecords: 0,
      });
    }
  }

  for (let kindIndex = resumeKindIndex; kindIndex < kinds.length; kindIndex++) {
    const kind = kinds[kindIndex] as (typeof kinds)[number];
    let cursor: string | null = kindIndex === resumeKindIndex ? resumeCursor : null;
    let processed = 0;
    while (processed < cap) {
      if (options.signal?.aborted === true) {
        // The persisted cursor stays where the last batch left it - an
        // aborted run resumes from there.
        await options.state?.update(persistedId, { status: 'aborted' });
        yield {
          kind,
          processed,
          total: processed,
          source: sourceId,
          target: targetId,
          migrationId: persistedId,
          phase: 'aborted',
        };
        throw new EmbedderMigrationAbortedError(persistedId);
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
      processedTotal += batch.rows.length;
      cursor = batch.nextCursor;
      await options.state?.update(persistedId, {
        processed: processedTotal,
        lastRecordId: `${kind}:${cursor ?? DONE_CURSOR}`,
      });
      yield {
        kind,
        processed,
        total: processed,
        source: sourceId,
        target: targetId,
        migrationId: persistedId,
        phase: 'running',
      };
      if (cursor === null) break;
    }
    await options.state?.update(persistedId, { lastRecordId: `${kind}:${DONE_CURSOR}` });
  }

  embeddings.retire(sourceId);
  await options.state?.update(persistedId, { status: 'committed' });
  yield {
    kind: 'fact',
    processed: 0,
    total: 0,
    source: sourceId,
    target: targetId,
    migrationId: persistedId,
    phase: 'committed',
  };
}

/** Sentinel cursor marking a fully-drained kind in the composite cursor. */
const DONE_CURSOR = '<done>';

/** Parse the persisted `<kind>:<cursor>` composite (null on junk). */
function parseCompositeCursor(
  value: string | null,
): { readonly kind: 'fact' | 'episode' | 'message'; readonly cursor: string } | null {
  if (value === null) return null;
  const sep = value.indexOf(':');
  if (sep <= 0) return null;
  const kind = value.slice(0, sep);
  if (kind !== 'fact' && kind !== 'episode' && kind !== 'message') return null;
  return { kind, cursor: value.slice(sep + 1) };
}
