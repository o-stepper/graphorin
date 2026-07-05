import type { SqliteConnection } from './connection.js';

/**
 * Registry row in the `embedding_meta` table. Captures every embedder
 * the database has ever indexed against - both the default and any
 * legacy / migrated peers - together with the names of the per-embedder
 * vec0 tables that store the actual vectors per memory tier.
 *
 * @stable
 */
export interface EmbeddingMetaRow {
  /** Canonical id, `'<provider>:<model>@<dim>'`. */
  readonly id: string;
  /** Adapter family - `'transformersjs'`, `'ollama'`, `'openai'`, `'custom'`, …. */
  readonly embedderKind: string;
  readonly model: string;
  readonly dim: number;
  readonly distanceMetric: 'cosine' | 'dot' | 'euclidean';
  readonly configHash: string;
  /** Lazy-created vec0 table for facts. */
  readonly vecTableFacts: string;
  /** Lazy-created vec0 table for episodes. */
  readonly vecTableEpisodes: string;
  /** Lazy-created vec0 table for session messages. */
  readonly vecTableMessages: string;
  readonly createdAt: number;
  readonly retiredAt: number | null;
  readonly notes: string | null;
}

/**
 * Lock-on-first conflict - registering a second active embedder for an
 * already-locked database fails fast with this error pointing at
 * `graphorin memory migrate` (Phase 15).
 *
 * @stable
 */
export class EmbedderLockOnFirstError extends Error {
  override readonly name = 'EmbedderLockOnFirstError';
}

/**
 * Read access for unknown `embedder_id` - the runtime fails fast on
 * any record write that references an unregistered embedder.
 *
 * @stable
 */
export class UnknownEmbedderIdError extends Error {
  override readonly name = 'UnknownEmbedderIdError';
  constructor(public readonly id: string) {
    super(
      `[graphorin/store-sqlite] unknown embedder_id '${id}'. ` +
        'Register the embedder via createMemory({ embedder, ...}) before writing memory records.',
    );
  }
}

/**
 * Multi-embedder coexistence policy. `'lock-on-first'` is the default -
 * the first registered embedder is the only writer; subsequent
 * different embedders must run a migration. `'multi-active'` allows
 * coexistence (read both, write to default). `'auto-migrate'` is a
 * Phase 16 hook (off in v0.1).
 *
 * @stable
 */
export type EmbedderPolicy = 'lock-on-first' | 'multi-active' | 'auto-migrate';

/**
 * Registry repository: one instance per `SqliteConnection`.
 *
 * @stable
 */
export class EmbeddingMetaRepository {
  #conn: SqliteConnection;
  #policy: EmbedderPolicy;
  #cache: Map<string, EmbeddingMetaRow> = new Map();

  constructor(conn: SqliteConnection, policy: EmbedderPolicy = 'lock-on-first') {
    this.#conn = conn;
    this.#policy = policy;
  }

  /** Read-through cache lookup. */
  get(id: string): EmbeddingMetaRow | null {
    const cached = this.#cache.get(id);
    if (cached !== undefined) return cached;
    const row = this.#conn.get<EmbeddingMetaRowRaw>(
      'SELECT id, embedder_kind, model, dim, distance_metric, config_hash, vec_table_facts, vec_table_episodes, vec_table_messages, created_at, retired_at, notes FROM embedding_meta WHERE id = ?',
      [id],
    );
    if (row === undefined) return null;
    const decoded = decodeRow(row);
    this.#cache.set(id, decoded);
    return decoded;
  }

  /** Snapshot of every registered embedder. */
  listAll(): readonly EmbeddingMetaRow[] {
    const rows = this.#conn.all<EmbeddingMetaRowRaw>(
      'SELECT id, embedder_kind, model, dim, distance_metric, config_hash, vec_table_facts, vec_table_episodes, vec_table_messages, created_at, retired_at, notes FROM embedding_meta ORDER BY created_at',
    );
    return rows.map(decodeRow);
  }

  /** Snapshot of every active (non-retired) embedder. */
  listActive(): readonly EmbeddingMetaRow[] {
    return this.listAll().filter((r) => r.retiredAt === null);
  }

  /**
   * Idempotent registration. Returns the existing row if one already
   * matches `(id, configHash)`; rejects the call if `lock-on-first` is
   * in effect and a different active embedder is already registered.
   */
  registerOrReturn(input: RegisterEmbedderInput): EmbeddingMetaRow {
    // PS-11: a dim of 0 (or non-finite) would create a `float[0]` vec0 table
    // and silently break vector search - most often an Ollama embedder bound
    // for an unknown model before its width was resolved. Reject it loudly.
    if (!Number.isInteger(input.dim) || input.dim <= 0) {
      throw new EmbedderLockOnFirstError(
        `[graphorin/store-sqlite] embedder '${input.id}' has an invalid dim (${String(input.dim)}). ` +
          'The output dimension must be a positive integer - pass an explicit `dim` to the embedder ' +
          '(e.g. ollamaEmbedder({ model, dim })) or resolve it from a first embed before registering.',
      );
    }
    const existing = this.get(input.id);
    if (existing !== null) {
      if (existing.configHash !== input.configHash) {
        throw new EmbedderLockOnFirstError(
          `[graphorin/store-sqlite] embedder '${input.id}' is registered with a different configHash. ` +
            'Run `graphorin memory migrate` to swap embedder, or pass a stable configHash from your embedder.',
        );
      }
      return existing;
    }

    if (this.#policy === 'lock-on-first') {
      const active = this.listActive();
      if (active.length > 0 && active.every((r) => r.id !== input.id)) {
        throw new EmbedderLockOnFirstError(
          `[graphorin/store-sqlite] cannot register embedder '${input.id}' alongside the active embedder ` +
            `'${active[0]?.id}' under the 'lock-on-first' policy. ` +
            "Run `graphorin memory migrate` to swap embedders, or set { policy: 'multi-active' } on createSqliteStore.",
        );
      }
    }

    // store F13: vec0 tables are only ever created with cosine or
    // euclidean - a 'dot' request was silently rewritten to cosine at
    // table-create while the meta kept advertising 'dot'. Persist what
    // the table actually computes, and say so.
    if (input.distanceMetric === 'dot') {
      process.stderr.write(
        `[graphorin/store-sqlite] embedder '${input.id}' requested distanceMetric 'dot', which ` +
          `sqlite-vec tables do not compute - registering as 'cosine' (identical ranking for ` +
          `L2-normalized embeddings; NOT for unnormalized ones).\n`,
      );
    }
    const slug = slugifyEmbedderId(input.id);
    const row: EmbeddingMetaRow = {
      id: input.id,
      embedderKind: input.embedderKind,
      model: input.model,
      dim: input.dim,
      distanceMetric:
        input.distanceMetric === 'dot' ? 'cosine' : (input.distanceMetric ?? 'cosine'),
      configHash: input.configHash,
      vecTableFacts: `facts_vec_${slug}`,
      vecTableEpisodes: `episodes_vec_${slug}`,
      vecTableMessages: `session_messages_vec_${slug}`,
      createdAt: Date.now(),
      retiredAt: null,
      notes: input.notes ?? null,
    };
    this.#conn.run(
      'INSERT INTO embedding_meta (id, embedder_kind, model, dim, distance_metric, config_hash, vec_table_facts, vec_table_episodes, vec_table_messages, created_at, retired_at, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)',
      [
        row.id,
        row.embedderKind,
        row.model,
        row.dim,
        row.distanceMetric,
        row.configHash,
        row.vecTableFacts,
        row.vecTableEpisodes,
        row.vecTableMessages,
        row.createdAt,
        row.notes,
      ],
    );
    this.#cache.set(row.id, row);
    return row;
  }

  /** Mark an embedder retired. Read-only after retirement. */
  retire(id: string, retiredAt: number = Date.now()): void {
    this.#conn.run('UPDATE embedding_meta SET retired_at = ? WHERE id = ?', [retiredAt, id]);
    this.#cache.delete(id);
  }

  /**
   * Verify that the given `embedder_id` is registered. Used at every
   * write boundary so unknown ids fail fast.
   */
  assertKnown(id: string): void {
    if (this.get(id) === null) {
      throw new UnknownEmbedderIdError(id);
    }
  }
}

interface EmbeddingMetaRowRaw {
  id: string;
  embedder_kind: string;
  model: string;
  dim: number;
  distance_metric: 'cosine' | 'dot' | 'euclidean';
  config_hash: string;
  vec_table_facts: string;
  vec_table_episodes: string;
  vec_table_messages: string;
  created_at: number;
  retired_at: number | null;
  notes: string | null;
}

function decodeRow(row: EmbeddingMetaRowRaw): EmbeddingMetaRow {
  return {
    id: row.id,
    embedderKind: row.embedder_kind,
    model: row.model,
    dim: row.dim,
    distanceMetric: row.distance_metric,
    configHash: row.config_hash,
    vecTableFacts: row.vec_table_facts,
    vecTableEpisodes: row.vec_table_episodes,
    vecTableMessages: row.vec_table_messages,
    createdAt: row.created_at,
    retiredAt: row.retired_at,
    notes: row.notes,
  };
}

/**
 * Input for {@link EmbeddingMetaRepository.registerOrReturn}. The
 * `embedder_id` is the canonical lookup key; `configHash` is a
 * deterministic hash over the embedder's full configuration.
 *
 * @stable
 */
export interface RegisterEmbedderInput {
  readonly id: string;
  readonly embedderKind: string;
  readonly model: string;
  readonly dim: number;
  readonly distanceMetric?: 'cosine' | 'dot' | 'euclidean';
  readonly configHash: string;
  readonly notes?: string | null;
}

/**
 * Translates an `embedder_id` like `'transformersjs:Xenova/multilingual-e5-base@768'`
 * into a SQL-safe slug used in vec0 table names. Letters / digits stay,
 * everything else becomes `_`.
 *
 * @stable
 */
export function slugifyEmbedderId(id: string): string {
  // Cap the input before the regex passes so adversarial inputs cannot
  // amplify any (linear) regex traversal - the final slug is never
  // longer than 80 chars anyway.
  const bounded = id.length > 256 ? id.slice(0, 256) : id;
  return bounded
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
}
