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
    this.#conn.execMany(
      `CREATE VIRTUAL TABLE IF NOT EXISTS ${quoteIdent(tableName)} USING vec0(${idColumn} TEXT PRIMARY KEY, embedding float[${meta.dim}]);`,
    );
    this.#created.add(tableName);
    return tableName;
  }

  /** @internal */
  knownTables(): readonly string[] {
    return [...this.#created];
  }
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

/** Quote a SQL identifier — only `[A-Za-z0-9_]` allowed. */
function quoteIdent(ident: string): string {
  if (!/^[A-Za-z0-9_]+$/.test(ident)) {
    throw new Error(`[graphorin/store-sqlite] invalid SQL identifier: ${ident}`);
  }
  return ident;
}
