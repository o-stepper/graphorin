import type { SqliteConnection } from './connection.js';
import type { EmbeddingMetaRow } from './embedding-meta-repo.js';

/**
 * Lazy-creator for per-embedder `vec0` virtual tables. The first write
 * for `(entity, embedder_id)` creates the corresponding `*_vec_<slug>`
 * virtual table; subsequent writes hit the cached existence check.
 *
 * In `'linear-fallback'` mode (sqlite-vec unavailable +
 * `onMissingSqliteVec: 'linear-fallback'`) the same table names are
 * created as PLAIN tables (`<id> TEXT PRIMARY KEY, embedding BLOB`)
 * and KNN is served by {@link VectorTableManager.linearKnn} - a
 * batched in-process cosine scan with `setImmediate` yields. A
 * database must stay in one mode: opening vec0 tables in fallback mode
 * (or plain fallback tables in vec0 mode) throws an actionable error
 * at construction.
 *
 * @stable
 */
export class VectorTableManager {
  #conn: SqliteConnection;
  #created: Set<string> = new Set();
  #mode: 'vec0' | 'linear-fallback' | 'disabled';

  constructor(conn: SqliteConnection) {
    this.#conn = conn;
    this.#mode = conn.vectorSearchMode ?? 'vec0';
    this.#hydrateExisting();
  }

  /** @internal */
  #hydrateExisting(): void {
    const rows = this.#conn.all<{ name: string; sql: string | null }>(
      "SELECT name, sql FROM sqlite_master WHERE type='table' AND (name LIKE 'facts_vec_%' OR name LIKE 'episodes_vec_%' OR name LIKE 'session_messages_vec_%')",
    );
    for (const row of rows) {
      const sql = (row.sql ?? '').toUpperCase();
      const isVirtual = sql.includes('USING VEC0');
      // A vec0 main table spawns SHADOW tables under the same prefix
      // (`_info`, `_chunks`, ...) - plain tables that are NOT sidecars.
      // Our fallback sidecars are recognisable by their exact shape.
      const isFallbackSidecar = !isVirtual && sql.includes('EMBEDDING BLOB');
      if (!isVirtual && !isFallbackSidecar) continue; // vec0 shadow table
      // Mode-mismatch guard (wave-D D5): a vec0 table is unreadable
      // without the extension, and a plain fallback table breaks MATCH
      // queries - fail loudly with the fix instead of at query time.
      if (this.#mode === 'linear-fallback' && isVirtual) {
        throw new Error(
          `[graphorin/store-sqlite] table '${row.name}' was built with sqlite-vec (vec0) but ` +
            'this connection runs in linear-fallback mode. Install the sqlite-vec peer, or ' +
            "rebuild the vectors in fallback mode via 'graphorin memory migrate'.",
        );
      }
      if (this.#mode === 'vec0' && isFallbackSidecar) {
        throw new Error(
          `[graphorin/store-sqlite] table '${row.name}' was built in linear-fallback mode (plain ` +
            'table) but this connection loaded sqlite-vec. Drop/migrate the fallback tables ' +
            "via 'graphorin memory migrate', or open with onMissingSqliteVec: 'linear-fallback'.",
        );
      }
      this.#created.add(row.name);
    }
  }

  /**
   * Ensures the per-embedder vector table for `kind` exists (vec0
   * virtual table, or a plain sidecar in linear-fallback mode).
   * Returns the concrete table name (which the caller uses in their
   * `INSERT INTO` + `SELECT` statements).
   *
   * @stable
   */
  ensureTable(kind: 'facts' | 'episodes' | 'messages', meta: EmbeddingMetaRow): string {
    const tableName = pickTableName(kind, meta);
    if (this.#created.has(tableName)) return tableName;
    const idColumn = pickIdColumn(kind);
    if (this.#mode === 'linear-fallback') {
      this.#conn.execMany(
        `CREATE TABLE IF NOT EXISTS ${quoteIdent(tableName)} (${idColumn} TEXT PRIMARY KEY, embedding BLOB NOT NULL);`,
      );
      this.#created.add(tableName);
      return tableName;
    }
    // CS-3: bind the registered distance metric to the vec0 table so KNN
    // computes the metric the meta advertises (sqlite-vec defaults to L2
    // otherwise - leaving a 'cosine'-labelled table scoring L2).
    const metric = vecMetric(meta.distanceMetric);
    this.#conn.execMany(
      `CREATE VIRTUAL TABLE IF NOT EXISTS ${quoteIdent(tableName)} USING vec0(${idColumn} TEXT PRIMARY KEY, embedding float[${meta.dim}] distance_metric=${metric});`,
    );
    this.#created.add(tableName);
    return tableName;
  }

  /** Active vector-serving mode. */
  get mode(): 'vec0' | 'linear-fallback' | 'disabled' {
    return this.#mode;
  }

  /**
   * In-process cosine KNN over a plain fallback sidecar:
   * scans the table in batches of `batchSize` rows, yielding to the
   * event loop between batches (`setImmediate`) so a large scan cannot
   * monopolise it, and keeps the `k` nearest by cosine distance
   * (`1 - cos`, the same scale vec0 reports for its cosine metric).
   *
   * @stable
   */
  async linearKnn(
    tableName: string,
    idColumn: string,
    query: Float32Array,
    k: number,
    batchSize = 500,
  ): Promise<ReadonlyArray<{ readonly id: string; readonly distance: number }>> {
    const queryNorm = Math.sqrt(dot(query, query));
    if (queryNorm === 0) return [];
    const top: Array<{ id: string; distance: number }> = [];
    let offset = 0;
    for (;;) {
      const rows = this.#conn.all<{ id: string; embedding: Buffer }>(
        `SELECT ${idColumn} AS id, embedding FROM ${quoteIdent(tableName)} ORDER BY ${idColumn} LIMIT ? OFFSET ?`,
        [batchSize, offset],
      );
      if (rows.length === 0) break;
      for (const row of rows) {
        const vector = blobToF32Local(row.embedding);
        if (vector.length !== query.length) continue;
        const norm = Math.sqrt(dot(vector, vector));
        if (norm === 0) continue;
        const cosine = dot(query, vector) / (queryNorm * norm);
        const distance = 1 - cosine;
        if (top.length < k) {
          top.push({ id: row.id, distance });
          top.sort((a, b) => a.distance - b.distance);
        } else if (distance < (top[top.length - 1]?.distance ?? Number.POSITIVE_INFINITY)) {
          top[top.length - 1] = { id: row.id, distance };
          top.sort((a, b) => a.distance - b.distance);
        }
      }
      offset += rows.length;
      if (rows.length < batchSize) break;
      // Yield between batches - the scan must not starve the loop.
      await new Promise<void>((resolveYield) => setImmediate(resolveYield));
    }
    return top;
  }

  /** @internal */
  knownTables(): readonly string[] {
    return [...this.#created];
  }

  /** @internal - drop a table this manager tracks (space reclaim). */
  dropTable(tableName: string): void {
    this.#conn.execMany(`DROP TABLE IF EXISTS ${quoteIdent(tableName)};`);
    this.#created.delete(tableName);
  }
}

function dot(a: Float32Array, b: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += (a[i] ?? 0) * (b[i] ?? 0);
  return sum;
}

/** Buffer → Float32Array view (alignment-safe copy). */
function blobToF32Local(blob: Buffer): Float32Array {
  const copy = new Uint8Array(blob.byteLength);
  copy.set(blob);
  return new Float32Array(copy.buffer, 0, Math.floor(copy.byteLength / 4));
}

/** Map the registered metric to the sqlite-vec `distance_metric` keyword. */
function vecMetric(metric: 'cosine' | 'dot' | 'euclidean'): 'cosine' | 'L2' {
  // sqlite-vec supports `cosine` and `L2` (and `L1`); 'dot' has no native
  // vec0 metric, so it falls back to cosine (the closest direction-based
  // measure for the normalized embeddings the default embedder produces).
  return metric === 'euclidean' ? 'L2' : 'cosine';
}

/**
 * Map a sqlite-vec KNN distance to a `[0, 1]` similarity score by
 * metric. Cosine distance ∈ [0, 2] (`1 - cos`) ⇒ `1 - d/2` ∈ [0, 1];
 * L2 distance ∈ [0, ∞) ⇒ `1 / (1 + d)` ∈ (0, 1].
 *
 * @stable
 */
export function scoreFromDistance(
  metric: 'cosine' | 'dot' | 'euclidean',
  distance: number,
): number {
  if (metric === 'euclidean') return 1 / (1 + Math.max(0, distance));
  // cosine + dot(→cosine)
  return Math.min(1, Math.max(0, 1 - distance / 2));
}

function pickTableName(kind: 'facts' | 'episodes' | 'messages', meta: EmbeddingMetaRow): string {
  switch (kind) {
    case 'facts':
      return meta.vecTableFacts;
    case 'episodes':
      return meta.vecTableEpisodes;
    case 'messages':
      return meta.vecTableMessages;
  }
}

/** @internal - id column for a vector sidecar kind (shared helper). */
export function pickIdColumn(kind: 'facts' | 'episodes' | 'messages'): string {
  switch (kind) {
    case 'facts':
      return 'fact_id';
    case 'episodes':
      return 'episode_id';
    case 'messages':
      return 'message_id';
  }
}

/** Quote a SQL identifier - only `[A-Za-z0-9_]` allowed. */
export function quoteIdent(ident: string): string {
  if (!/^[A-Za-z0-9_]+$/.test(ident)) {
    throw new Error(`[graphorin/store-sqlite] invalid SQL identifier: ${ident}`);
  }
  return ident;
}
