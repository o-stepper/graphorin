import type { SqliteConnection } from './connection.js';
import type { EmbeddingMetaRow } from './embedding-meta-repo.js';

/**
 * Lazy-creator for per-embedder `vec0` virtual tables. The first write
 * for `(entity, embedder_id)` creates the corresponding `*_vec_<slug>`
 * virtual table; subsequent writes hit the cached existence check.
 *
 * @stable
 */
export class VectorTableManager {
  #conn: SqliteConnection;
  #created: Set<string> = new Set();

  constructor(conn: SqliteConnection) {
    this.#conn = conn;
    this.#hydrateExisting();
  }

  /** @internal */
  #hydrateExisting(): void {
    const rows = this.#conn.all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND (name LIKE 'facts_vec_%' OR name LIKE 'episodes_vec_%' OR name LIKE 'session_messages_vec_%')",
    );
    for (const row of rows) this.#created.add(row.name);
  }

  /**
   * Ensures the per-embedder vec0 table for `kind` exists. Returns the
   * concrete table name (which the caller uses in their `INSERT INTO`
   * + `SELECT` statements).
   *
   * @stable
   */
  ensureTable(kind: 'facts' | 'episodes' | 'messages', meta: EmbeddingMetaRow): string {
    const tableName = pickTableName(kind, meta);
    if (this.#created.has(tableName)) return tableName;
    const idColumn = pickIdColumn(kind);
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

  /** @internal */
  knownTables(): readonly string[] {
    return [...this.#created];
  }
}

/** Map the registered metric to the sqlite-vec `distance_metric` keyword. */
function vecMetric(metric: 'cosine' | 'dot' | 'euclidean'): 'cosine' | 'L2' {
  // sqlite-vec supports `cosine` and `L2` (and `L1`); 'dot' has no native
  // vec0 metric, so it falls back to cosine (the closest direction-based
  // measure for the normalized embeddings the default embedder produces).
  return metric === 'euclidean' ? 'L2' : 'cosine';
}

/**
 * Map a sqlite-vec KNN distance to a `[0, 1]` similarity score by metric
 * (CS-3). Cosine distance ∈ [0, 2] (`1 - cos`) ⇒ `1 - d/2` ∈ [0, 1];
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

function pickIdColumn(kind: 'facts' | 'episodes' | 'messages'): string {
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
function quoteIdent(ident: string): string {
  if (!/^[A-Za-z0-9_]+$/.test(ident)) {
    throw new Error(`[graphorin/store-sqlite] invalid SQL identifier: ${ident}`);
  }
  return ident;
}
