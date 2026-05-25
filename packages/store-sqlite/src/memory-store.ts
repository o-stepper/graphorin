import type {
  Block,
  Episode,
  Fact,
  MemoryHit,
  MemoryProvenance,
  MemoryRecord,
  MemorySearchOptions,
  MemoryStatus,
  Message,
  Rule,
  SessionScope,
} from '@graphorin/core';
import type {
  EpisodicMemoryStore,
  MemoryStore,
  MessageRef,
  ProceduralMemoryStore,
  SemanticMemoryStore,
  SessionListOptions,
  SessionMemoryStore,
  SharedMemoryStore,
  WorkingMemoryStore,
} from '@graphorin/core/contracts';
import { SqliteConflictStore } from './conflict-store.js';
import type { SqliteConnection } from './connection.js';
import { SqliteConsolidatorStateStore } from './consolidator-store.js';
import type { EmbeddingMetaRepository } from './embedding-meta-repo.js';
import { VectorTableManager } from './vector-table-mgr.js';

/**
 * Point-in-time (`asOf`) WHERE fragments. Appended only when an
 * `asOf` epoch is supplied; absent ⇒ the query is byte-identical to
 * the pre-feature SQL, so default reads are unaffected. Facts use the
 * bi-temporal validity interval; episodes have no close column so they
 * match once they have started. Each `?` is bound with the same epoch.
 */
const FACT_VALIDITY_CLAUSE =
  'AND (f.valid_from IS NULL OR f.valid_from <= ?) AND (f.valid_to IS NULL OR f.valid_to > ?)';
const EPISODE_VALIDITY_CLAUSE = 'AND e.started_at <= ?';

/**
 * Quarantine retrieval-gate fragments (P1-4). Appended to default
 * reads so `status = 'quarantined'` rows never surface in
 * action-driving recall; omitted only when the caller passes
 * `includeQuarantined` (the validation / inspector path). Each is a
 * literal predicate with no bind parameter, so it can be injected
 * without disturbing the surrounding `?` ordering.
 */
const FACT_NOT_QUARANTINED = "AND f.status != 'quarantined'";
const EPISODE_NOT_QUARANTINED = "AND e.status != 'quarantined'";

/**
 * Optional embedding payload attached to a memory write. The
 * `embedder_id` must already be registered in `embedding_meta`; the
 * `vector` length must match the registered `dim`.
 *
 * @stable
 */
export interface EmbeddingPayload {
  readonly embedderId: string;
  readonly vector: Float32Array;
}

/**
 * Extended write surface for fact / episode / message writes. The base
 * `SemanticMemoryStore.remember(...)` / `EpisodicMemoryStore.put(...)`
 * methods leave embeddings out — {@link SqliteMemoryStore} accepts an
 * optional embedding through these helpers.
 *
 * @stable
 */
export interface SqliteMemoryWriteOptions {
  readonly embedding?: EmbeddingPayload;
}

/**
 * Default `MemoryStore` implementation backed by SQLite + sqlite-vec.
 *
 * @stable
 */
export class SqliteMemoryStore implements MemoryStore {
  #embeddings: EmbeddingMetaRepository;
  #vectorMgr: VectorTableManager;
  #initialized = false;

  readonly working: WorkingMemoryStore;
  readonly session: SessionMemoryStore;
  readonly episodic: EpisodicMemoryStore;
  readonly semantic: SemanticMemoryStore;
  readonly procedural: ProceduralMemoryStore;
  readonly shared: SharedMemoryStore;
  readonly conflicts: SqliteConflictStore;
  readonly consolidator: SqliteConsolidatorStateStore;

  constructor(conn: SqliteConnection, embeddings: EmbeddingMetaRepository) {
    this.#embeddings = embeddings;
    this.#vectorMgr = new VectorTableManager(conn);
    this.working = new WorkingMemoryStoreImpl(conn);
    this.session = new SessionMemoryStoreImpl(conn, embeddings, this.#vectorMgr);
    this.episodic = new EpisodicMemoryStoreImpl(conn, embeddings, this.#vectorMgr);
    this.semantic = new SemanticMemoryStoreImpl(conn, embeddings, this.#vectorMgr);
    this.procedural = new ProceduralMemoryStoreImpl(conn);
    this.shared = new SharedMemoryStoreImpl(conn);
    this.conflicts = new SqliteConflictStore(conn);
    this.consolidator = new SqliteConsolidatorStateStore(conn);
  }

  async init(): Promise<void> {
    if (this.#initialized) return;
    this.#initialized = true;
  }

  async close(): Promise<void> {
    // Connection is closed by the parent factory.
  }

  /** Surfaced for tests and the consolidator. */
  vectorTableManager(): VectorTableManager {
    return this.#vectorMgr;
  }

  /** Surfaced for tests and the consolidator. */
  embeddingMetaRepository(): EmbeddingMetaRepository {
    return this.#embeddings;
  }
}

class WorkingMemoryStoreImpl implements WorkingMemoryStore {
  #conn: SqliteConnection;
  constructor(conn: SqliteConnection) {
    this.#conn = conn;
  }
  async list(scope: SessionScope): Promise<ReadonlyArray<Block>> {
    const rows = this.#conn.all<WorkingBlockRow>(
      "SELECT * FROM working_blocks WHERE scope_user_id = ? AND COALESCE(scope_session_id, '') = COALESCE(?, '') AND COALESCE(scope_agent_id, '') = COALESCE(?, '') AND deleted_at IS NULL ORDER BY label",
      [scope.userId, scope.sessionId ?? null, scope.agentId ?? null],
    );
    return rows.map(rowToBlock);
  }
  async get(scope: SessionScope, label: string): Promise<Block | null> {
    const row = this.#conn.get<WorkingBlockRow>(
      "SELECT * FROM working_blocks WHERE scope_user_id = ? AND COALESCE(scope_session_id, '') = COALESCE(?, '') AND COALESCE(scope_agent_id, '') = COALESCE(?, '') AND label = ? AND deleted_at IS NULL",
      [scope.userId, scope.sessionId ?? null, scope.agentId ?? null, label],
    );
    return row ? rowToBlock(row) : null;
  }
  async upsert(scope: SessionScope, block: Block): Promise<void> {
    const now = block.updatedAt ?? block.createdAt;
    this.#conn.run(
      `INSERT INTO working_blocks (
         id, scope_user_id, scope_session_id, scope_agent_id, label, description, value,
         char_limit, read_only, sensitivity, tags_json, created_at, updated_at, deleted_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
       ON CONFLICT(scope_user_id, scope_session_id, scope_agent_id, label) DO UPDATE SET
         value = excluded.value,
         description = excluded.description,
         char_limit = excluded.char_limit,
         read_only = excluded.read_only,
         sensitivity = excluded.sensitivity,
         tags_json = excluded.tags_json,
         updated_at = excluded.updated_at,
         deleted_at = NULL`,
      [
        block.id,
        scope.userId,
        scope.sessionId ?? null,
        scope.agentId ?? null,
        block.label,
        block.description ?? null,
        block.value,
        block.charLimit,
        block.readOnly ? 1 : 0,
        block.sensitivity,
        block.tags ? JSON.stringify(block.tags) : null,
        toEpoch(block.createdAt),
        toEpoch(now),
      ],
    );
  }
  async delete(scope: SessionScope, label: string, reason?: string): Promise<void> {
    this.#conn.run(
      "UPDATE working_blocks SET deleted_at = ? WHERE scope_user_id = ? AND COALESCE(scope_session_id, '') = COALESCE(?, '') AND COALESCE(scope_agent_id, '') = COALESCE(?, '') AND label = ?",
      [Date.now(), scope.userId, scope.sessionId ?? null, scope.agentId ?? null, label],
    );
    void reason;
  }
}

class SessionMemoryStoreImpl implements SessionMemoryStore {
  #conn: SqliteConnection;
  #embeddings: EmbeddingMetaRepository;
  #vectorMgr: VectorTableManager;
  constructor(
    conn: SqliteConnection,
    embeddings: EmbeddingMetaRepository,
    vectorMgr: VectorTableManager,
  ) {
    this.#conn = conn;
    this.#embeddings = embeddings;
    this.#vectorMgr = vectorMgr;
  }

  async push(scope: SessionScope, message: Message): Promise<MessageRef> {
    if (scope.sessionId === undefined) {
      throw new Error('[graphorin/store-sqlite] SessionMemoryStore.push requires scope.sessionId');
    }
    const sequenceRow = this.#conn.get<{ next: number }>(
      'SELECT COALESCE(MAX(sequence), 0) + 1 AS next FROM session_messages WHERE scope_session_id = ?',
      [scope.sessionId],
    );
    const sequence = sequenceRow?.next ?? 1;
    const id = generateId();
    const createdAt = Date.now();
    this.#conn.run(
      `INSERT INTO session_messages (
         id, scope_user_id, scope_session_id, scope_agent_id, agent_id, role,
         content_json, tool_calls_json, tool_call_id, sequence, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        scope.userId,
        scope.sessionId,
        scope.agentId ?? null,
        readAgentId(message),
        message.role,
        JSON.stringify(messageToContentJson(message)),
        readToolCalls(message),
        readToolCallId(message),
        sequence,
        createdAt,
      ],
    );
    const text = renderMessageForFts(message);
    if (text.length > 0) {
      this.#conn.run(
        'INSERT INTO session_messages_fts (rowid, text) VALUES ((SELECT rowid FROM session_messages WHERE id = ?), ?)',
        [id, text],
      );
    }
    return {
      messageId: id,
      sequence,
      persistedAt: new Date(createdAt).toISOString(),
    };
  }

  async list(scope: SessionScope, opts: SessionListOptions = {}): Promise<ReadonlyArray<Message>> {
    if (scope.sessionId === undefined) {
      throw new Error('[graphorin/store-sqlite] SessionMemoryStore.list requires scope.sessionId');
    }
    const conditions = ['scope_session_id = ?', 'deleted_at IS NULL'];
    const params: unknown[] = [scope.sessionId];
    if (opts.agentId !== undefined) {
      conditions.push('agent_id = ?');
      params.push(opts.agentId);
    }
    if (opts.role !== undefined) {
      conditions.push('role = ?');
      params.push(opts.role);
    }
    if (opts.sinceMessageId !== undefined) {
      conditions.push('sequence > (SELECT sequence FROM session_messages WHERE id = ?)');
      params.push(opts.sinceMessageId);
    }
    const limit = opts.lastN ?? 1000;
    const rows = this.#conn.all<SessionMessageRow>(
      `SELECT * FROM session_messages WHERE ${conditions.join(' AND ')} ORDER BY sequence DESC LIMIT ?`,
      [...params, limit],
    );
    return rows.reverse().map(rowToMessage);
  }

  async search(
    scope: SessionScope,
    query: string,
    opts?: MemorySearchOptions,
  ): Promise<ReadonlyArray<MemoryHit>> {
    if (scope.sessionId === undefined) {
      throw new Error(
        '[graphorin/store-sqlite] SessionMemoryStore.search requires scope.sessionId',
      );
    }
    const topK = opts?.topK ?? 10;
    const rows = this.#conn.all<SessionMessageFtsRow>(
      `SELECT m.id AS id, m.role AS role, m.content_json AS content_json, m.created_at AS created_at,
              m.sequence AS sequence, m.scope_user_id AS scope_user_id, m.scope_session_id AS scope_session_id,
              bm25(session_messages_fts) AS bm25_score
       FROM session_messages_fts
       JOIN session_messages m ON m.rowid = session_messages_fts.rowid
       WHERE session_messages_fts MATCH ? AND m.scope_session_id = ?
       ORDER BY bm25_score
       LIMIT ?`,
      [escapeFtsQuery(query), scope.sessionId, topK],
    );
    return rows.map((row) => {
      const record: MemoryRecord = {
        id: row.id,
        kind: 'session',
        userId: row.scope_user_id,
        sessionId: row.scope_session_id,
        sensitivity: 'internal',
        createdAt: new Date(row.created_at).toISOString(),
      };
      return {
        record,
        score: -row.bm25_score,
        signals: { bm25: row.bm25_score },
      };
    });
  }

  /** Test/integration helper — exposes the manager so writers can opt in to vector indexing. */
  vectorTableManager(): VectorTableManager {
    return this.#vectorMgr;
  }

  /** Test/integration helper — exposes the registry. */
  embeddingMetaRepository(): EmbeddingMetaRepository {
    return this.#embeddings;
  }

  /**
   * Cursor-aware reader used by the Phase 10c consolidator. Returns
   * the messages whose sequence is strictly greater than the
   * supplied `lastMessageId` cursor, oldest-first, capped at `limit`.
   * `lastMessageId === null` reads from the start of the session.
   *
   * @stable
   */
  async listMessagesSince(
    scope: SessionScope,
    lastMessageId: string | null,
    limit: number,
  ): Promise<
    ReadonlyArray<{
      readonly id: string;
      readonly sequence: number;
      readonly createdAt: string;
      readonly tokenCount: number | null;
      readonly message: Message;
    }>
  > {
    if (scope.sessionId === undefined) {
      throw new Error(
        '[graphorin/store-sqlite] SessionMemoryStore.listMessagesSince requires scope.sessionId',
      );
    }
    const conditions = ['scope_session_id = ?', 'deleted_at IS NULL'];
    const params: unknown[] = [scope.sessionId];
    if (lastMessageId !== null) {
      conditions.push('sequence > (SELECT sequence FROM session_messages WHERE id = ?)');
      params.push(lastMessageId);
    }
    const rows = this.#conn.all<SessionMessageRow>(
      `SELECT * FROM session_messages
       WHERE ${conditions.join(' AND ')}
       ORDER BY sequence ASC
       LIMIT ?`,
      [...params, limit],
    );
    return rows.map((row) => ({
      id: row.id,
      sequence: row.sequence,
      createdAt: new Date(row.created_at).toISOString(),
      tokenCount: row.token_count,
      message: rowToMessage(row),
    }));
  }

  /**
   * Sum of `session_messages.token_count` for the supplied scope.
   * Returns `null` when no row in the scope has a populated
   * `token_count` cache so callers (`@graphorin/memory`) can fall
   * back to a heuristic. Surfaced per DEC-131.
   *
   * @stable
   */
  async totalCachedTokens(scope: SessionScope): Promise<number | null> {
    if (scope.sessionId === undefined) {
      throw new Error(
        '[graphorin/store-sqlite] SessionMemoryStore.totalCachedTokens requires scope.sessionId',
      );
    }
    const row = this.#conn.get<{
      total: number | bigint | null;
      populated: number | bigint | null;
    }>(
      `SELECT
         COALESCE(SUM(token_count), 0) AS total,
         SUM(CASE WHEN token_count IS NOT NULL THEN 1 ELSE 0 END) AS populated
       FROM session_messages
       WHERE scope_session_id = ? AND deleted_at IS NULL`,
      [scope.sessionId],
    );
    if (row === undefined) return null;
    const populated = Number(row.populated ?? 0);
    if (populated === 0) return null;
    return Number(row.total ?? 0);
  }
}

class EpisodicMemoryStoreImpl implements EpisodicMemoryStore {
  #conn: SqliteConnection;
  #embeddings: EmbeddingMetaRepository;
  #vectorMgr: VectorTableManager;
  constructor(
    conn: SqliteConnection,
    embeddings: EmbeddingMetaRepository,
    vectorMgr: VectorTableManager,
  ) {
    this.#conn = conn;
    this.#embeddings = embeddings;
    this.#vectorMgr = vectorMgr;
  }

  async put(episode: Episode): Promise<void> {
    return this.putWithEmbedding(episode);
  }

  /**
   * Extended write — accepts an optional embedding payload. The
   * embedder must already be registered (`embedding_meta`) and the
   * vector dimension must match.
   *
   * @stable
   */
  async putWithEmbedding(episode: Episode, options: SqliteMemoryWriteOptions = {}): Promise<void> {
    const embedderId = options.embedding?.embedderId ?? null;
    if (embedderId !== null) {
      this.#embeddings.assertKnown(embedderId);
    }
    this.#conn.transaction(() => {
      this.#conn.run(
        `INSERT INTO episodes (
           id, scope_user_id, scope_session_id, scope_agent_id, summary, started_at, ended_at,
           importance, embedder_id, source_message_ids_json, sensitivity, tags_json,
           provenance, status, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           summary = excluded.summary,
           ended_at = excluded.ended_at,
           importance = excluded.importance,
           embedder_id = excluded.embedder_id,
           provenance = excluded.provenance,
           status = excluded.status,
           updated_at = excluded.updated_at,
           tags_json = excluded.tags_json`,
        [
          episode.id,
          episode.userId,
          episode.sessionId ?? null,
          episode.agentId ?? null,
          episode.summary,
          toEpoch(episode.startedAt),
          toEpoch(episode.endedAt),
          episode.importance ?? null,
          embedderId,
          null,
          episode.sensitivity,
          episode.tags ? JSON.stringify(episode.tags) : null,
          episode.provenance ?? null,
          episode.status ?? 'active',
          toEpoch(episode.createdAt),
          episode.updatedAt ? toEpoch(episode.updatedAt) : null,
        ],
      );
      if (options.embedding !== undefined) {
        const meta = this.#embeddings.get(options.embedding.embedderId);
        if (meta === null) throw new Error('embedder unexpectedly missing');
        if (options.embedding.vector.length !== meta.dim) {
          throw new Error(
            `[graphorin/store-sqlite] embedding dim mismatch: expected ${meta.dim}, got ${options.embedding.vector.length}`,
          );
        }
        const tableName = this.#vectorMgr.ensureTable('episodes', meta);
        this.#conn.run(
          `INSERT OR REPLACE INTO ${tableName} (episode_id, embedding) VALUES (?, ?)`,
          [episode.id, Buffer.from(options.embedding.vector.buffer)],
        );
      }
      this.#conn.run(
        `INSERT OR REPLACE INTO episodes_fts (rowid, summary) VALUES ((SELECT rowid FROM episodes WHERE id = ?), ?)`,
        [episode.id, episode.summary],
      );
    });
  }

  async search(
    scope: SessionScope,
    opts: MemorySearchOptions,
  ): Promise<ReadonlyArray<MemoryHit<Episode>>> {
    const topK = opts.topK ?? 10;
    const asOf = opts.asOf !== undefined ? toEpoch(opts.asOf) : null;
    const binds: Array<string | number> = [escapeFtsQuery(opts.query), scope.userId];
    if (asOf !== null) binds.push(asOf);
    binds.push(topK);
    const rows = this.#conn.all<EpisodeRow & { bm25_score: number }>(
      `SELECT e.*, bm25(episodes_fts) AS bm25_score
       FROM episodes_fts
       JOIN episodes e ON e.rowid = episodes_fts.rowid
       WHERE episodes_fts MATCH ? AND e.scope_user_id = ? AND e.deleted_at IS NULL
         ${opts.includeQuarantined === true ? '' : EPISODE_NOT_QUARANTINED}
         ${asOf !== null ? EPISODE_VALIDITY_CLAUSE : ''}
       ORDER BY bm25_score
       LIMIT ?`,
      binds,
    );
    return rows.map((row) => ({
      record: rowToEpisode(row),
      score: -row.bm25_score,
      signals: { bm25: row.bm25_score },
    }));
  }

  async get(id: string): Promise<Episode | null> {
    const row = this.#conn.get<EpisodeRow>(
      'SELECT * FROM episodes WHERE id = ? AND deleted_at IS NULL',
      [id],
    );
    return row ? rowToEpisode(row) : null;
  }

  /**
   * KNN search against the per-embedder vec0 table for episodes.
   * Joins back to the canonical `episodes` row + applies the
   * `WHERE embedder_id = ?` guard from ADR-023 / DEC-116.
   *
   * @stable
   */
  async searchVector(
    scope: SessionScope,
    embedding: Float32Array,
    embedderId: string,
    topK: number,
    asOf?: string,
    includeQuarantined?: boolean,
  ): Promise<ReadonlyArray<MemoryHit<Episode>>> {
    const meta = this.#embeddings.get(embedderId);
    if (meta === null) return [];
    if (embedding.length !== meta.dim) {
      throw new Error(
        `[graphorin/store-sqlite] embedding dim mismatch: expected ${meta.dim}, got ${embedding.length}`,
      );
    }
    const tableName = this.#vectorMgr.ensureTable('episodes', meta);
    const asOfEpoch = asOf !== undefined ? toEpoch(asOf) : null;
    const binds: Array<Buffer | string | number> = [
      Buffer.from(embedding.buffer),
      topK,
      scope.userId,
      embedderId,
    ];
    if (asOfEpoch !== null) binds.push(asOfEpoch);
    const rows = this.#conn.all<EpisodeRow & { distance: number }>(
      `SELECT e.*, v.distance AS distance
       FROM ${quoteIdent(tableName)} v
       JOIN episodes e ON e.id = v.episode_id
       WHERE v.embedding MATCH ?
         AND v.k = ?
         AND e.scope_user_id = ?
         AND e.embedder_id = ?
         AND e.deleted_at IS NULL
         AND e.archived = 0
         ${includeQuarantined === true ? '' : EPISODE_NOT_QUARANTINED}
         ${asOfEpoch !== null ? EPISODE_VALIDITY_CLAUSE : ''}
       ORDER BY v.distance`,
      binds,
    );
    return rows.map((row) => ({
      record: rowToEpisode(row),
      score: 1 - row.distance,
      signals: { vector: 1 - row.distance },
    }));
  }

  /**
   * Soft-archive an episode by setting `archived = 1`. Distinct from
   * the soft-delete tombstone (`deleted_at`): archived episodes
   * remain queryable by id but are filtered out of the default
   * `search(...)` results. Surfaced through the
   * `EpisodicMemoryStoreExt` extension on `@graphorin/memory`.
   *
   * @stable
   */
  async archive(id: string, reason?: string): Promise<void> {
    void reason;
    this.#conn.run('UPDATE episodes SET archived = 1, updated_at = ? WHERE id = ?', [
      Date.now(),
      id,
    ]);
  }
}

class SemanticMemoryStoreImpl implements SemanticMemoryStore {
  #conn: SqliteConnection;
  #embeddings: EmbeddingMetaRepository;
  #vectorMgr: VectorTableManager;
  constructor(
    conn: SqliteConnection,
    embeddings: EmbeddingMetaRepository,
    vectorMgr: VectorTableManager,
  ) {
    this.#conn = conn;
    this.#embeddings = embeddings;
    this.#vectorMgr = vectorMgr;
  }

  async remember(fact: Fact): Promise<void> {
    return this.rememberWithEmbedding(fact);
  }

  /**
   * Extended write — accepts an optional embedding payload. The
   * embedder must already be registered (`embedding_meta`) and the
   * vector dimension must match.
   *
   * @stable
   */
  async rememberWithEmbedding(fact: Fact, options: SqliteMemoryWriteOptions = {}): Promise<void> {
    const embedderId = options.embedding?.embedderId ?? null;
    if (embedderId !== null) {
      this.#embeddings.assertKnown(embedderId);
    }
    this.#conn.transaction(() => {
      this.#conn.run(
        `INSERT INTO facts (
           id, scope_user_id, scope_session_id, scope_agent_id, text,
           subject, predicate, object, confidence, sensitivity, tags_json,
           embedder_id, source_message_ids_json,
           valid_from, valid_to, supersedes, superseded_by, provenance, status,
           strength, last_accessed_at,
           hash, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           text = excluded.text,
           confidence = excluded.confidence,
           sensitivity = excluded.sensitivity,
           tags_json = excluded.tags_json,
           valid_from = excluded.valid_from,
           valid_to = excluded.valid_to,
           supersedes = excluded.supersedes,
           superseded_by = excluded.superseded_by,
           provenance = excluded.provenance,
           status = excluded.status,
           updated_at = excluded.updated_at`,
        [
          fact.id,
          fact.userId,
          fact.sessionId ?? null,
          fact.agentId ?? null,
          fact.text,
          null,
          null,
          null,
          fact.confidence ?? null,
          fact.sensitivity,
          fact.tags ? JSON.stringify(fact.tags) : null,
          embedderId,
          null,
          fact.validFrom ? toEpoch(fact.validFrom) : null,
          fact.validTo ? toEpoch(fact.validTo) : null,
          fact.supersedes ?? null,
          fact.supersededBy ?? null,
          fact.provenance ?? null,
          fact.status ?? 'active',
          1.0,
          null,
          null,
          toEpoch(fact.createdAt),
          fact.updatedAt ? toEpoch(fact.updatedAt) : null,
        ],
      );
      if (options.embedding !== undefined) {
        const meta = this.#embeddings.get(options.embedding.embedderId);
        if (meta === null) throw new Error('embedder unexpectedly missing');
        if (options.embedding.vector.length !== meta.dim) {
          throw new Error(
            `[graphorin/store-sqlite] embedding dim mismatch: expected ${meta.dim}, got ${options.embedding.vector.length}`,
          );
        }
        const tableName = this.#vectorMgr.ensureTable('facts', meta);
        this.#conn.run(`INSERT OR REPLACE INTO ${tableName} (fact_id, embedding) VALUES (?, ?)`, [
          fact.id,
          Buffer.from(options.embedding.vector.buffer),
        ]);
      }
      this.#conn.run(
        `INSERT OR REPLACE INTO facts_fts (rowid, text) VALUES ((SELECT rowid FROM facts WHERE id = ?), ?)`,
        [fact.id, fact.text],
      );
    });
  }

  async search(
    scope: SessionScope,
    opts: MemorySearchOptions,
  ): Promise<ReadonlyArray<MemoryHit<Fact>>> {
    const topK = opts.topK ?? 10;
    const asOf = opts.asOf !== undefined ? toEpoch(opts.asOf) : null;
    const binds: Array<string | number> = [escapeFtsQuery(opts.query), scope.userId];
    if (asOf !== null) binds.push(asOf, asOf);
    binds.push(topK);
    const rows = this.#conn.all<FactRow & { bm25_score: number }>(
      `SELECT f.*, bm25(facts_fts) AS bm25_score
       FROM facts_fts
       JOIN facts f ON f.rowid = facts_fts.rowid
       WHERE facts_fts MATCH ? AND f.scope_user_id = ? AND f.deleted_at IS NULL AND f.archived = 0
         ${opts.includeQuarantined === true ? '' : FACT_NOT_QUARANTINED}
         ${asOf !== null ? FACT_VALIDITY_CLAUSE : ''}
       ORDER BY bm25_score
       LIMIT ?`,
      binds,
    );
    return rows.map((row) => ({
      record: rowToFact(row),
      score: -row.bm25_score,
      signals: { bm25: row.bm25_score },
    }));
  }

  /**
   * KNN search against the per-embedder vec0 table for facts. Joins
   * back to the canonical `facts` row + applies the
   * `WHERE embedder_id = ?` guard from ADR-023 / DEC-116 so multi-active
   * migrations never bleed cross-embedder hits.
   *
   * Returns `MemoryHit<Fact>` with `score` populated as
   * `1 - distance` (cosine distance → cosine similarity).
   *
   * @stable
   */
  async searchVector(
    scope: SessionScope,
    embedding: Float32Array,
    embedderId: string,
    topK: number,
    asOf?: string,
    includeQuarantined?: boolean,
  ): Promise<ReadonlyArray<MemoryHit<Fact>>> {
    const meta = this.#embeddings.get(embedderId);
    if (meta === null) return [];
    if (embedding.length !== meta.dim) {
      throw new Error(
        `[graphorin/store-sqlite] embedding dim mismatch: expected ${meta.dim}, got ${embedding.length}`,
      );
    }
    const tableName = this.#vectorMgr.ensureTable('facts', meta);
    const asOfEpoch = asOf !== undefined ? toEpoch(asOf) : null;
    const binds: Array<Buffer | string | number> = [
      Buffer.from(embedding.buffer),
      topK,
      scope.userId,
      embedderId,
    ];
    if (asOfEpoch !== null) binds.push(asOfEpoch, asOfEpoch);
    const rows = this.#conn.all<FactRow & { distance: number }>(
      `SELECT f.*, v.distance AS distance
       FROM ${quoteIdent(tableName)} v
       JOIN facts f ON f.id = v.fact_id
       WHERE v.embedding MATCH ?
         AND v.k = ?
         AND f.scope_user_id = ?
         AND f.embedder_id = ?
         AND f.deleted_at IS NULL
         AND f.archived = 0
         ${includeQuarantined === true ? '' : FACT_NOT_QUARANTINED}
         ${asOfEpoch !== null ? FACT_VALIDITY_CLAUSE : ''}
       ORDER BY v.distance`,
      binds,
    );
    return rows.map((row) => ({
      record: rowToFact(row),
      score: 1 - row.distance,
      signals: { vector: 1 - row.distance },
    }));
  }

  async supersede(oldId: string, newFact: Fact, reason?: string): Promise<void> {
    this.#conn.transaction(() => {
      this.#conn.run('UPDATE facts SET superseded_by = ?, updated_at = ? WHERE id = ?', [
        newFact.id,
        Date.now(),
        oldId,
      ]);
      this.#conn.run(
        `INSERT INTO memory_history (memory_kind, memory_id, prev_value, new_value, event, source, message_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['fact', oldId, null, newFact.text, 'SUPERSEDE', 'agent', null, Date.now()],
      );
    });
    void reason;
    await this.remember(newFact);
  }

  /**
   * Walk the supersede chain in both directions from `factId` and
   * return every fact in it, ordered by `valid_from` ascending
   * (oldest → newest, falling back to `created_at`). Unlike
   * {@link search}, this deliberately surfaces superseded /
   * soft-deleted / archived rows so callers can answer "how did this
   * fact change over time". Traversal follows `supersedes` /
   * `superseded_by` plus inbound edges (so a half-linked chain still
   * resolves), is scope-guarded, and is cycle-safe. Returns `[]` for
   * an unknown id.
   *
   * @stable
   */
  async historyOf(scope: SessionScope, factId: string): Promise<ReadonlyArray<Fact>> {
    const seen = new Set<string>();
    const queue: string[] = [factId];
    const rows: FactRow[] = [];
    while (queue.length > 0) {
      const id = queue.shift();
      if (id === undefined || seen.has(id)) continue;
      seen.add(id);
      const row = this.#conn.get<FactRow>(
        'SELECT * FROM facts WHERE id = ? AND scope_user_id = ?',
        [id, scope.userId],
      );
      if (!row) continue;
      rows.push(row);
      if (row.supersedes !== null) queue.push(row.supersedes);
      if (row.superseded_by !== null) queue.push(row.superseded_by);
      const inbound = this.#conn.all<{ id: string }>(
        'SELECT id FROM facts WHERE scope_user_id = ? AND (supersedes = ? OR superseded_by = ?)',
        [scope.userId, id, id],
      );
      for (const r of inbound) queue.push(r.id);
    }
    rows.sort((a, b) => {
      const av = a.valid_from ?? a.created_at;
      const bv = b.valid_from ?? b.created_at;
      return av !== bv ? av - bv : a.created_at - b.created_at;
    });
    return rows.map(rowToFact);
  }

  async forget(id: string, reason?: string): Promise<void> {
    this.#conn.run('UPDATE facts SET deleted_at = ?, archived = 1 WHERE id = ?', [Date.now(), id]);
    void reason;
  }

  /**
   * Set a fact's retrieval-trust `status` (P1-4) and write a
   * `memory_history` audit row. Quarantine is a retrieval gate, so this
   * touches neither the row's content nor its embedding / tombstone —
   * it only flips eligibility for default recall. Promotion
   * (`'active'`) is logged as a `VALIDATE` event; demotion
   * (`'quarantined'`) as `QUARANTINE`. Surfaced through
   * `SemanticMemoryStoreExt.setStatus`.
   *
   * @stable
   */
  async setStatus(factId: string, status: MemoryStatus, reason?: string): Promise<void> {
    this.#conn.transaction(() => {
      this.#conn.run('UPDATE facts SET status = ?, updated_at = ? WHERE id = ?', [
        status,
        Date.now(),
        factId,
      ]);
      this.#conn.run(
        `INSERT INTO memory_history (memory_kind, memory_id, prev_value, new_value, event, source, message_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'fact',
          factId,
          null,
          reason ?? status,
          status === 'active' ? 'VALIDATE' : 'QUARANTINE',
          'agent',
          null,
          Date.now(),
        ],
      );
    });
  }

  /**
   * Decay-aware reader surfaced for the Phase 10c light phase.
   * Returns the columns the consolidator needs to compute the
   * Ebbinghaus retention curve (`strength` + `last_accessed_at`)
   * + the `archived` flag so already-archived facts are skipped.
   *
   * @stable
   */
  async listForDecay(
    scope: SessionScope,
    limit = 1000,
  ): Promise<
    ReadonlyArray<{
      readonly id: string;
      readonly text: string;
      readonly strength: number;
      readonly lastAccessedAt: number | null;
      readonly createdAt: number;
      readonly archived: boolean;
    }>
  > {
    const rows = this.#conn.all<{
      id: string;
      text: string;
      strength: number;
      last_accessed_at: number | null;
      created_at: number;
      archived: number;
    }>(
      `SELECT id, text, strength, last_accessed_at, created_at, archived
       FROM facts
       WHERE scope_user_id = ? AND deleted_at IS NULL
       ORDER BY COALESCE(last_accessed_at, created_at) ASC
       LIMIT ?`,
      [scope.userId, limit],
    );
    return rows.map((row) => ({
      id: row.id,
      text: row.text,
      strength: row.strength,
      lastAccessedAt: row.last_accessed_at,
      createdAt: row.created_at,
      archived: row.archived === 1,
    }));
  }

  /**
   * Soft-archive a fact — sets `archived = 1` and writes a
   * `memory_history` audit row. Distinct from {@link forget}: this
   * does not set `deleted_at`, so search results can still surface
   * the fact when explicit archive-aware queries are issued.
   *
   * @stable
   */
  async archiveFact(id: string, reason?: string): Promise<void> {
    this.#conn.transaction(() => {
      this.#conn.run('UPDATE facts SET archived = 1, updated_at = ? WHERE id = ?', [
        Date.now(),
        id,
      ]);
      this.#conn.run(
        `INSERT INTO memory_history (memory_kind, memory_id, prev_value, new_value, event, source, message_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['fact', id, null, reason ?? null, 'ARCHIVE', 'consolidator', null, Date.now()],
      );
    });
  }

  /**
   * Lookup a single fact by id (excludes soft-deleted rows). Surfaced
   * through the `SemanticMemoryStoreExt` extension on
   * `@graphorin/memory` so consumers can chase a specific fact id
   * without round-tripping through `search(...)`.
   *
   * @stable
   */
  async get(id: string): Promise<Fact | null> {
    const row = this.#conn.get<FactRow>('SELECT * FROM facts WHERE id = ? AND deleted_at IS NULL', [
      id,
    ]);
    return row ? rowToFact(row) : null;
  }

  /**
   * Hard-delete a fact (GDPR path). The row is removed from
   * `facts` + `facts_fts` + every per-embedder vec0 table; the
   * `memory_history` audit trail records the purge. Distinct from
   * {@link forget} (soft-delete with a tombstone).
   *
   * @stable
   */
  async purge(id: string, reason?: string): Promise<void> {
    this.#conn.transaction(() => {
      const row = this.#conn.get<{ rowid: number }>(
        'SELECT rowid AS rowid FROM facts WHERE id = ?',
        [id],
      );
      this.#conn.run(
        `INSERT INTO memory_history (memory_kind, memory_id, prev_value, new_value, event, source, message_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['fact', id, null, reason ?? null, 'PURGE', 'agent', null, Date.now()],
      );
      if (row !== undefined) {
        this.#conn.run('DELETE FROM facts_fts WHERE rowid = ?', [row.rowid]);
      }
      for (const tableName of this.#vectorMgr.knownTables()) {
        if (tableName.startsWith('facts_vec_')) {
          this.#conn.run(`DELETE FROM ${tableName} WHERE fact_id = ?`, [id]);
        }
      }
      this.#conn.run('DELETE FROM facts WHERE id = ?', [id]);
    });
  }
}

class ProceduralMemoryStoreImpl implements ProceduralMemoryStore {
  #conn: SqliteConnection;
  constructor(conn: SqliteConnection) {
    this.#conn = conn;
  }
  async add(rule: Rule): Promise<void> {
    this.#conn.run(
      `INSERT INTO rules (
         id, scope_user_id, scope_session_id, scope_agent_id, text, condition,
         priority, sensitivity, tags_json, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        rule.id,
        rule.userId,
        rule.sessionId ?? null,
        rule.agentId ?? null,
        rule.text,
        rule.condition ?? null,
        rule.priority,
        rule.sensitivity,
        rule.tags ? JSON.stringify(rule.tags) : null,
        toEpoch(rule.createdAt),
      ],
    );
  }
  async list(scope: SessionScope): Promise<ReadonlyArray<Rule>> {
    const rows = this.#conn.all<RuleRow>(
      'SELECT * FROM rules WHERE scope_user_id = ? AND deleted_at IS NULL ORDER BY priority DESC, created_at',
      [scope.userId],
    );
    return rows.map(rowToRule);
  }
  async remove(id: string, reason?: string): Promise<void> {
    this.#conn.run('UPDATE rules SET deleted_at = ? WHERE id = ?', [Date.now(), id]);
    void reason;
  }
}

class SharedMemoryStoreImpl implements SharedMemoryStore {
  #conn: SqliteConnection;
  constructor(conn: SqliteConnection) {
    this.#conn = conn;
  }
  async attach(recordId: string, agentId: string): Promise<void> {
    this.#conn.run(
      `INSERT OR IGNORE INTO shared_attachments (record_id, agent_id, attached_at) VALUES (?, ?, ?)`,
      [recordId, agentId, Date.now()],
    );
  }
  async detach(recordId: string, agentId: string): Promise<void> {
    this.#conn.run('DELETE FROM shared_attachments WHERE record_id = ? AND agent_id = ?', [
      recordId,
      agentId,
    ]);
  }
  async listFor(agentId: string): Promise<ReadonlyArray<MemoryRecord>> {
    const rows = this.#conn.all<{ record_id: string; attached_at: number }>(
      'SELECT record_id, attached_at FROM shared_attachments WHERE agent_id = ? ORDER BY attached_at DESC',
      [agentId],
    );
    return rows.map((row) => ({
      id: row.record_id,
      kind: 'shared',
      userId: '',
      sensitivity: 'internal',
      createdAt: new Date(row.attached_at).toISOString(),
    }));
  }
}

interface WorkingBlockRow {
  id: string;
  scope_user_id: string;
  scope_session_id: string | null;
  scope_agent_id: string | null;
  label: string;
  description: string | null;
  value: string;
  char_limit: number;
  read_only: number;
  sensitivity: 'public' | 'internal' | 'secret';
  tags_json: string | null;
  created_at: number;
  updated_at: number | null;
  deleted_at: number | null;
}

interface SessionMessageRow {
  id: string;
  scope_user_id: string;
  scope_session_id: string;
  scope_agent_id: string | null;
  agent_id: string | null;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content_json: string;
  tool_calls_json: string | null;
  tool_call_id: string | null;
  user_message_id: string | null;
  token_count: number | null;
  tokenizer_version: string | null;
  embedder_id: string | null;
  sequence: number;
  created_at: number;
  deleted_at: number | null;
}

interface SessionMessageFtsRow {
  id: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content_json: string;
  created_at: number;
  sequence: number;
  scope_user_id: string;
  scope_session_id: string;
  bm25_score: number;
}

interface EpisodeRow {
  id: string;
  scope_user_id: string;
  scope_session_id: string | null;
  scope_agent_id: string | null;
  summary: string;
  started_at: number;
  ended_at: number;
  importance: number | null;
  embedder_id: string | null;
  source_message_ids_json: string | null;
  sensitivity: 'public' | 'internal' | 'secret';
  tags_json: string | null;
  provenance: string | null;
  status: string;
  created_at: number;
  updated_at: number | null;
  deleted_at: number | null;
  archived: number;
}

interface FactRow {
  id: string;
  scope_user_id: string;
  scope_session_id: string | null;
  scope_agent_id: string | null;
  text: string;
  subject: string | null;
  predicate: string | null;
  object: string | null;
  confidence: number | null;
  sensitivity: 'public' | 'internal' | 'secret';
  tags_json: string | null;
  embedder_id: string | null;
  source_message_ids_json: string | null;
  valid_from: number | null;
  valid_to: number | null;
  supersedes: string | null;
  superseded_by: string | null;
  provenance: string | null;
  status: string;
  strength: number;
  last_accessed_at: number | null;
  hash: string | null;
  created_at: number;
  updated_at: number | null;
  deleted_at: number | null;
  archived: number;
}

interface RuleRow {
  id: string;
  scope_user_id: string;
  scope_session_id: string | null;
  scope_agent_id: string | null;
  text: string;
  condition: string | null;
  priority: number;
  sensitivity: 'public' | 'internal' | 'secret';
  tags_json: string | null;
  created_at: number;
  updated_at: number | null;
  deleted_at: number | null;
}

function rowToBlock(row: WorkingBlockRow): Block {
  return {
    id: row.id,
    kind: 'working',
    userId: row.scope_user_id,
    sessionId: row.scope_session_id ?? undefined,
    agentId: row.scope_agent_id ?? undefined,
    label: row.label,
    description: row.description ?? undefined,
    value: row.value,
    charLimit: row.char_limit,
    readOnly: row.read_only !== 0,
    sensitivity: row.sensitivity,
    tags: row.tags_json ? (JSON.parse(row.tags_json) as readonly string[]) : undefined,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: row.updated_at !== null ? new Date(row.updated_at).toISOString() : undefined,
    deletedAt: row.deleted_at !== null ? new Date(row.deleted_at).toISOString() : undefined,
  } as Block;
}

function rowToMessage(row: SessionMessageRow): Message {
  const content = JSON.parse(row.content_json) as Message['content'];
  switch (row.role) {
    case 'system':
      return {
        role: 'system',
        content: typeof content === 'string' ? content : '',
      };
    case 'user':
      return { role: 'user', content };
    case 'assistant':
      return {
        role: 'assistant',
        content,
        ...(row.agent_id !== null ? { agentId: row.agent_id } : {}),
        ...(row.tool_calls_json !== null ? { toolCalls: JSON.parse(row.tool_calls_json) } : {}),
      };
    case 'tool':
      return {
        role: 'tool',
        toolCallId: row.tool_call_id ?? '',
        content,
      };
  }
}

function rowToEpisode(row: EpisodeRow): Episode {
  return {
    id: row.id,
    kind: 'episodic',
    userId: row.scope_user_id,
    sessionId: row.scope_session_id ?? undefined,
    agentId: row.scope_agent_id ?? undefined,
    summary: row.summary,
    startedAt: new Date(row.started_at).toISOString(),
    endedAt: new Date(row.ended_at).toISOString(),
    importance: row.importance ?? undefined,
    provenance: (row.provenance ?? undefined) as MemoryProvenance | undefined,
    status: row.status as MemoryStatus,
    sensitivity: row.sensitivity,
    tags: row.tags_json ? (JSON.parse(row.tags_json) as readonly string[]) : undefined,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: row.updated_at !== null ? new Date(row.updated_at).toISOString() : undefined,
    deletedAt: row.deleted_at !== null ? new Date(row.deleted_at).toISOString() : undefined,
  } as Episode;
}

function rowToFact(row: FactRow): Fact {
  return {
    id: row.id,
    kind: 'semantic',
    userId: row.scope_user_id,
    sessionId: row.scope_session_id ?? undefined,
    agentId: row.scope_agent_id ?? undefined,
    text: row.text,
    confidence: row.confidence ?? undefined,
    sensitivity: row.sensitivity,
    tags: row.tags_json ? (JSON.parse(row.tags_json) as readonly string[]) : undefined,
    validFrom: row.valid_from !== null ? new Date(row.valid_from).toISOString() : undefined,
    validTo: row.valid_to !== null ? new Date(row.valid_to).toISOString() : undefined,
    supersedes: row.supersedes ?? undefined,
    supersededBy: row.superseded_by ?? undefined,
    provenance: (row.provenance ?? undefined) as MemoryProvenance | undefined,
    status: row.status as MemoryStatus,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: row.updated_at !== null ? new Date(row.updated_at).toISOString() : undefined,
    deletedAt: row.deleted_at !== null ? new Date(row.deleted_at).toISOString() : undefined,
  } as Fact;
}

function rowToRule(row: RuleRow): Rule {
  return {
    id: row.id,
    kind: 'procedural',
    userId: row.scope_user_id,
    sessionId: row.scope_session_id ?? undefined,
    agentId: row.scope_agent_id ?? undefined,
    text: row.text,
    condition: row.condition ?? undefined,
    priority: row.priority,
    sensitivity: row.sensitivity,
    tags: row.tags_json ? (JSON.parse(row.tags_json) as readonly string[]) : undefined,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: row.updated_at !== null ? new Date(row.updated_at).toISOString() : undefined,
    deletedAt: row.deleted_at !== null ? new Date(row.deleted_at).toISOString() : undefined,
  } as Rule;
}

function readAgentId(message: Message): string | null {
  if (message.role === 'assistant' && message.agentId !== undefined) return message.agentId;
  return null;
}

function readToolCalls(message: Message): string | null {
  if (message.role === 'assistant' && message.toolCalls !== undefined) {
    return JSON.stringify(message.toolCalls);
  }
  return null;
}

function readToolCallId(message: Message): string | null {
  if (message.role === 'tool') return message.toolCallId;
  return null;
}

function messageToContentJson(message: Message): unknown {
  return message.content;
}

function renderMessageForFts(message: Message): string {
  const c = message.content;
  if (typeof c === 'string') return c;
  const parts: string[] = [];
  for (const part of c) {
    if (part.type === 'text') parts.push(part.text);
    if (part.type === 'reasoning') parts.push(part.text);
  }
  return parts.join(' ').slice(0, 8192);
}

function escapeFtsQuery(query: string): string {
  // Wrap in double quotes and escape any internal double quotes — yields
  // a phrase query that survives operator characters in user input.
  return `"${query.replace(/"/g, '""')}"`;
}

/** Quote a SQL identifier — only `[A-Za-z0-9_]` allowed. */
function quoteIdent(ident: string): string {
  if (!/^[A-Za-z0-9_]+$/.test(ident)) {
    throw new Error(`[graphorin/store-sqlite] invalid SQL identifier: ${ident}`);
  }
  return ident;
}

function toEpoch(iso: string): number {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) {
    throw new Error(`[graphorin/store-sqlite] invalid ISO-8601 timestamp: ${iso}`);
  }
  return t;
}

let idCounter = 0;
function generateId(): string {
  idCounter = (idCounter + 1) & 0xffffff;
  return `${Date.now().toString(36)}-${idCounter.toString(36).padStart(5, '0')}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}
