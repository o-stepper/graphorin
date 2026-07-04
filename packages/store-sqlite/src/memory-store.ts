import type {
  Block,
  EntityRole,
  Episode,
  Fact,
  GraphEntity,
  Insight,
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
  SessionMessageWithMetadata,
  SharedMemoryStore,
  WorkingMemoryStore,
} from '@graphorin/core/contracts';
import { SqliteConflictStore } from './conflict-store.js';
import type { SqliteConnection } from './connection.js';
import { SqliteConsolidatorStateStore } from './consolidator-store.js';
import type { EmbeddingMetaRepository } from './embedding-meta-repo.js';
import { scoreFromDistance, VectorTableManager } from './vector-table-mgr.js';

/**
 * Point-in-time (`asOf`) WHERE fragments. Facts use the bi-temporal
 * validity interval; episodes have no close column so they match once
 * they have started. Each `?` is bound with the same epoch.
 *
 * memory-retrieval-01: default fact reads (no explicit `asOf`) behave
 * as `asOf = now`, so superseded / validity-expired facts no longer
 * surface as current — exactly what the `fact_supersede` tool
 * promises. Callers opt back into the full history with
 * `includeSuperseded: true` (the inspector / audit path). An explicit
 * `asOf` always wins.
 */
const FACT_VALIDITY_CLAUSE =
  'AND (f.valid_from IS NULL OR f.valid_from <= ?) AND (f.valid_to IS NULL OR f.valid_to > ?)';
const EPISODE_VALIDITY_CLAUSE = 'AND e.started_at <= ?';

/**
 * Resolve the validity epoch for a fact read (memory-retrieval-01):
 * explicit `asOf` wins; otherwise default reads evaluate the validity
 * interval at NOW unless the caller asked for superseded rows. Returns
 * `null` when no validity filtering should apply.
 */
function resolveFactValidityEpoch(
  asOf: string | undefined,
  includeSuperseded: boolean | undefined,
): number | null {
  if (asOf !== undefined) return toEpoch(asOf);
  return includeSuperseded === true ? null : Date.now();
}

/**
 * MRET-9 / store-03: the vec0 k-nearest slice is GLOBAL (no user
 * partition) and every scope / validity / quarantine filter applies
 * AFTER the cut — a minority user could be starved to zero by a
 * dominant user's vectors. Over-fetch and widen iteratively until
 * `topK` rows survive the filters or the table is exhausted. Shared by
 * the fact and episode KNN paths.
 */
function widenKnn<Row>(
  runKnn: (k: number) => ReadonlyArray<Row>,
  topK: number,
  total: number,
): ReadonlyArray<Row> {
  if (total === 0) return [];
  let k = Math.min(Math.max(topK * 4, topK + 16), total);
  let rows = runKnn(k);
  while (rows.length < topK && k < total) {
    k = Math.min(k * 2, total);
    rows = runKnn(k);
  }
  return rows.slice(0, topK);
}

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
const INSIGHT_NOT_QUARANTINED = "AND i.status != 'quarantined'";

/**
 * MRET-4: any-of tags predicate against the `tags_json` array column.
 * Rows without tags never match. The caller appends one bind per tag.
 */
function factTagsPredicate(tagCount: number): string {
  const placeholders = Array.from({ length: tagCount }, () => '?').join(', ');
  return `AND EXISTS (
    SELECT 1 FROM json_each(COALESCE(f.tags_json, '[]'))
    WHERE json_each.value IN (${placeholders}))`;
}

/**
 * MRET-4: episode/date-range overlap — an episode matches when its
 * `[started_at, ended_at]` span intersects `[from, to]` (missing bounds
 * are open). The caller appends `from` / `to` epoch binds in order.
 */
function episodeDateRangePredicate(from: number | null, to: number | null): string {
  let sql = '';
  if (from !== null) sql += 'AND e.ended_at >= ? ';
  if (to !== null) sql += 'AND e.started_at <= ? ';
  return sql;
}

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
  /**
   * Contextual-retrieval index text (P1-3). When supplied, the FTS5 row
   * is indexed against this (context-prepended) text instead of the
   * canonical `fact.text`, so a terse fact stays findable by a
   * vaguely-worded query. The persisted `facts.text` column — the value
   * shown to the user / audit trail — is always the canonical text; only
   * the lexical index is affected. The caller's `embedding.vector` should
   * be computed from the same index text so the vector and FTS surfaces
   * agree. Absent ⇒ the FTS row uses `fact.text` (pre-P1-3 behaviour).
   */
  readonly indexText?: string;
}

/**
 * Default `MemoryStore` implementation backed by SQLite + sqlite-vec.
 *
 * @stable
 */
export class SqliteMemoryStore implements MemoryStore {
  #conn: SqliteConnection;
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
  /** Reflection insight surface (P1-1). FTS-only; no per-embedder vec0 table. */
  readonly insights: SqliteInsightStore;
  /** Lightweight relation-graph surface (P2-1): entities + one-hop CTE. */
  readonly graph: SqliteGraphStore;

  constructor(conn: SqliteConnection, embeddings: EmbeddingMetaRepository) {
    this.#conn = conn;
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
    this.insights = new SqliteInsightStore(conn);
    this.graph = new SqliteGraphStore(conn);
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

  /**
   * store-04: retention prune for the `memory_history` audit trail —
   * without one the table grows unboundedly (every supersede /
   * quarantine transition appends). Deletes rows older than
   * `olderThanMs`; returns the number pruned. Operators call this from
   * their own maintenance schedule; nothing prunes automatically.
   *
   * @stable
   */
  async pruneHistory(olderThanMs: number): Promise<number> {
    const cutoff = Date.now() - Math.max(0, olderThanMs);
    // Inclusive boundary: a row aged exactly `olderThanMs` is pruned.
    return this.#conn.run('DELETE FROM memory_history WHERE created_at <= ?', [cutoff]).changes;
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
    const id = generateId();
    const createdAt = Date.now();
    // CS-9: the MAX+1 read, the message INSERT, and the FTS INSERT run in one
    // transaction so a crash never leaves a committed message without its FTS
    // row (silently unsearchable), and the UNIQUE(scope_session_id, sequence)
    // constraint (migration 022) is evaluated atomically with the read — a
    // cross-process race that recomputes the same sequence fails loudly here
    // instead of minting a duplicate.
    let sequence = 1;
    this.#conn.transaction(() => {
      const sequenceRow = this.#conn.get<{ next: number }>(
        'SELECT COALESCE(MAX(sequence), 0) + 1 AS next FROM session_messages WHERE scope_session_id = ?',
        [scope.sessionId],
      );
      sequence = sequenceRow?.next ?? 1;
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
    });
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

  /**
   * RP-5: like {@link list}, but each message carries its persisted identity
   * (stored id, sequence, `createdAt`) so an exporter preserves message identity
   * + chronology rather than fabricating fresh ids / the export wall-clock.
   */
  async listWithMetadata(
    scope: SessionScope,
    opts: SessionListOptions = {},
  ): Promise<ReadonlyArray<SessionMessageWithMetadata>> {
    if (scope.sessionId === undefined) {
      throw new Error(
        '[graphorin/store-sqlite] SessionMemoryStore.listWithMetadata requires scope.sessionId',
      );
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
    return rows.reverse().map((row) => ({
      message: rowToMessage(row),
      messageId: row.id,
      sequence: row.sequence,
      createdAt: new Date(row.created_at).toISOString(),
    }));
  }

  /**
   * Count the live messages in the scoped session (CE-5) — a `COUNT(*)`, never
   * materialising rows. Returns `0` for a user-only scope (no session to count).
   */
  async count(scope: SessionScope): Promise<number> {
    if (scope.sessionId === undefined) return 0;
    const row = this.#conn.get<{ n: number }>(
      'SELECT COUNT(*) AS n FROM session_messages WHERE scope_session_id = ? AND deleted_at IS NULL',
      [scope.sessionId],
    );
    return row?.n ?? 0;
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
    // MRET-4: dateRange filter (declared on MemorySearchOptions,
    // previously ignored) — overlap semantics on [started_at, ended_at].
    const from = opts.dateRange?.from !== undefined ? toEpoch(opts.dateRange.from) : null;
    const to = opts.dateRange?.to !== undefined ? toEpoch(opts.dateRange.to) : null;
    const binds: Array<string | number> = [escapeFtsQuery(opts.query), scope.userId];
    if (asOf !== null) binds.push(asOf);
    if (from !== null) binds.push(from);
    if (to !== null) binds.push(to);
    binds.push(topK);
    const rows = this.#conn.all<EpisodeRow & { bm25_score: number }>(
      `SELECT e.*, bm25(episodes_fts) AS bm25_score
       FROM episodes_fts
       JOIN episodes e ON e.rowid = episodes_fts.rowid
       WHERE episodes_fts MATCH ? AND e.scope_user_id = ? AND e.deleted_at IS NULL
         AND e.archived = 0
         ${opts.includeQuarantined === true ? '' : EPISODE_NOT_QUARANTINED}
         ${asOf !== null ? EPISODE_VALIDITY_CLAUSE : ''}
         ${episodeDateRangePredicate(from, to)}
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
   * Most-recent episodes by `ended_at` (newest first), with no FTS / vector
   * query — recency, not relevance (MCON-1). Powers the deep-phase reflection
   * gate and `EpisodicMemory.recent()`, both of which previously probed with a
   * `'*'` FTS query that matches zero rows on real SQLite.
   */
  async listRecent(
    scope: SessionScope,
    limit: number,
    opts: { includeQuarantined?: boolean } = {},
  ): Promise<ReadonlyArray<Episode>> {
    const rows = this.#conn.all<EpisodeRow>(
      `SELECT e.* FROM episodes e
       WHERE e.scope_user_id = ? AND e.deleted_at IS NULL
         ${opts.includeQuarantined === true ? '' : EPISODE_NOT_QUARANTINED}
       ORDER BY e.ended_at DESC
       LIMIT ?`,
      [scope.userId, limit],
    );
    return rows.map(rowToEpisode);
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
    const runKnn = (k: number): ReadonlyArray<EpisodeRow & { distance: number }> => {
      const binds: Array<Buffer | string | number> = [
        Buffer.from(embedding.buffer),
        k,
        scope.userId,
        embedderId,
      ];
      if (asOfEpoch !== null) binds.push(asOfEpoch);
      return this.#conn.all<EpisodeRow & { distance: number }>(
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
    };
    // store-03: the MRET-9 over-fetch loop, ported from the fact side —
    // the vec0 k-nearest slice is GLOBAL, so a minority user on a
    // multi-user (or heavily archived) store could be starved to zero
    // by the post-KNN filters. Widen until `topK` rows survive.
    const total =
      this.#conn.get<{ n: number }>(`SELECT COUNT(*) AS n FROM ${quoteIdent(tableName)}`)?.n ?? 0;
    const rows = widenKnn(runKnn, topK, total);
    return rows.map((row) => ({
      record: rowToEpisode(row),
      score: scoreFromDistance(meta.distanceMetric, row.distance),
      signals: { vector: scoreFromDistance(meta.distanceMetric, row.distance) },
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

  /**
   * Promote / demote an episode's retrieval-trust `status` (MCON-2) and write a
   * `memory_history` audit row. Mirrors `setStatus` on facts — a retrieval gate
   * only. Powers {@link EpisodicMemory.validate} so a quarantined (auto-formed)
   * episode can be promoted into default recall.
   */
  async setStatus(id: string, status: MemoryStatus, reason?: string): Promise<void> {
    this.#conn.transaction(() => {
      this.#conn.run('UPDATE episodes SET status = ?, updated_at = ? WHERE id = ?', [
        status,
        Date.now(),
        id,
      ]);
      this.#conn.run(
        `INSERT INTO memory_history (memory_kind, memory_id, prev_value, new_value, event, source, message_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'episode',
          id,
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
   * Count the recall-eligible episodes for the scope (CE-5) — a `COUNT(*)`
   * with the same default filters as the FTS search (live, non-quarantined).
   */
  async count(scope: SessionScope): Promise<number> {
    const row = this.#conn.get<{ n: number }>(
      "SELECT COUNT(*) AS n FROM episodes WHERE scope_user_id = ? AND deleted_at IS NULL AND status != 'quarantined'",
      [scope.userId],
    );
    return row?.n ?? 0;
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
           importance, strength, last_accessed_at,
           created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           text = excluded.text,
           subject = excluded.subject,
           predicate = excluded.predicate,
           object = excluded.object,
           confidence = excluded.confidence,
           sensitivity = excluded.sensitivity,
           tags_json = excluded.tags_json,
           valid_from = excluded.valid_from,
           valid_to = excluded.valid_to,
           supersedes = excluded.supersedes,
           superseded_by = excluded.superseded_by,
           provenance = excluded.provenance,
           status = excluded.status,
           importance = excluded.importance,
           -- CS-5: adopt the new embedder_id only when this write actually
           -- carries an embedding (excluded.embedder_id IS NOT NULL). A
           -- no-embedding re-remember (e.g. supersede()'s re-write of the new
           -- fact) keeps the existing embedder_id so a previously-embedded
           -- fact is not silently hidden from vector search.
           embedder_id = CASE
             WHEN excluded.embedder_id IS NOT NULL THEN excluded.embedder_id
             ELSE facts.embedder_id
           END,
           updated_at = excluded.updated_at`,
        [
          fact.id,
          fact.userId,
          fact.sessionId ?? null,
          fact.agentId ?? null,
          fact.text,
          // P2-1: carry the s/p/o triple instead of dropping it. The
          // columns + `idx_facts_subject_predicate` have existed since
          // migration 001; this stops the write path nulling them so the
          // relation graph (entities / one-hop expansion) has a substrate.
          fact.subject ?? null,
          fact.predicate ?? null,
          fact.object ?? null,
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
          fact.importance ?? null,
          1.0,
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
        // P1-3: index the contextual text when supplied; `facts.text`
        // (persisted above) stays canonical for display / audit.
        [fact.id, options.indexText ?? fact.text],
      );
    });
  }

  async search(
    scope: SessionScope,
    opts: MemorySearchOptions,
  ): Promise<ReadonlyArray<MemoryHit<Fact>>> {
    const topK = opts.topK ?? 10;
    // memory-retrieval-01: default reads evaluate validity at NOW so
    // superseded / expired facts stop surfacing as current.
    const asOf = resolveFactValidityEpoch(opts.asOf, opts.includeSuperseded);
    // MRET-4: tags filter (declared on MemorySearchOptions, previously
    // ignored). A fact matches when it carries AT LEAST ONE of the
    // requested tags; rows without tags never match a tag filter.
    const tags = opts.tags !== undefined && opts.tags.length > 0 ? [...opts.tags] : null;
    const binds: Array<string | number> = [escapeFtsQuery(opts.query), scope.userId];
    if (asOf !== null) binds.push(asOf, asOf);
    if (tags !== null) binds.push(...tags);
    binds.push(topK);
    const rows = this.#conn.all<FactRow & { bm25_score: number }>(
      `SELECT f.*, bm25(facts_fts) AS bm25_score
       FROM facts_fts
       JOIN facts f ON f.rowid = facts_fts.rowid
       WHERE facts_fts MATCH ? AND f.scope_user_id = ? AND f.deleted_at IS NULL AND f.archived = 0
         ${opts.includeQuarantined === true ? '' : FACT_NOT_QUARANTINED}
         ${asOf !== null ? FACT_VALIDITY_CLAUSE : ''}
         ${tags !== null ? factTagsPredicate(tags.length) : ''}
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
    includeSuperseded?: boolean,
  ): Promise<ReadonlyArray<MemoryHit<Fact>>> {
    const meta = this.#embeddings.get(embedderId);
    if (meta === null) return [];
    if (embedding.length !== meta.dim) {
      throw new Error(
        `[graphorin/store-sqlite] embedding dim mismatch: expected ${meta.dim}, got ${embedding.length}`,
      );
    }
    const tableName = this.#vectorMgr.ensureTable('facts', meta);
    // memory-retrieval-01: default reads evaluate validity at NOW.
    const asOfEpoch = resolveFactValidityEpoch(asOf, includeSuperseded);
    const runKnn = (k: number): ReadonlyArray<FactRow & { distance: number }> => {
      const binds: Array<Buffer | string | number> = [
        Buffer.from(embedding.buffer),
        k,
        scope.userId,
        embedderId,
      ];
      if (asOfEpoch !== null) binds.push(asOfEpoch, asOfEpoch);
      return this.#conn.all<FactRow & { distance: number }>(
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
    };
    // MRET-9: over-fetch + widen via the shared helper (see widenKnn).
    const total =
      this.#conn.get<{ n: number }>(`SELECT COUNT(*) AS n FROM ${quoteIdent(tableName)}`)?.n ?? 0;
    const rows = widenKnn(runKnn, topK, total);
    return rows.map((row) => ({
      record: rowToFact(row),
      score: scoreFromDistance(meta.distanceMetric, row.distance),
      signals: { vector: scoreFromDistance(meta.distanceMetric, row.distance) },
    }));
  }

  async supersede(oldId: string, newFact: Fact, reason?: string): Promise<void> {
    const now = Date.now();
    // Bi-temporal supersede (P0-3): close the old fact's validity interval
    // so point-in-time (`asOf`) queries stop returning it once the new
    // version takes effect — previously only `superseded_by` was set, which
    // left the old interval open forever and broke `asOf(now)`. The interval
    // closes at the new fact's `validFrom` (the instant the replacement takes
    // effect) so the hand-off is seamless. `COALESCE` makes it idempotent and
    // never clobbers an interval the caller already closed explicitly.
    const closeAt = newFact.validFrom ? toEpoch(newFact.validFrom) : now;
    // CS-12: write the successor FIRST, then close the old fact in the same
    // call. `remember()` opens its own transaction, so it cannot be nested
    // inside the close transaction; inverting the order makes the close
    // depend on a durable successor instead of the reverse. A crash between
    // the two steps leaves the old fact fully intact (open interval, no
    // `superseded_by`) — recoverable — rather than closed in favour of, and
    // pointing at, a row that was never written.
    await this.remember(newFact);
    this.#conn.transaction(() => {
      this.#conn.run(
        'UPDATE facts SET superseded_by = ?, valid_to = COALESCE(valid_to, ?), updated_at = ? WHERE id = ?',
        [newFact.id, closeAt, now, oldId],
      );
      this.#conn.run(
        `INSERT INTO memory_history (memory_kind, memory_id, prev_value, new_value, event, source, message_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['fact', oldId, null, newFact.text, 'SUPERSEDE', 'agent', null, now],
      );
    });
    void reason;
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
    // MRET-9: a tombstoned fact must not keep occupying k-nearest slots —
    // dead embeddings crowd the GLOBAL vec0 slice and starve live hits.
    // The tombstone is terminal for recall, so the vector goes with it
    // (purge already did this; forget leaked).
    for (const tableName of this.#vectorMgr.knownTables()) {
      if (tableName.startsWith('facts_vec_')) {
        this.#conn.run(`DELETE FROM ${tableName} WHERE fact_id = ?`, [id]);
      }
    }
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
   * Count the recall-eligible facts for the scope (CE-5) — a `COUNT(*)` with
   * the same default filters as the FTS search (live, non-archived,
   * non-quarantined). Replaces the old `search({ query: '*', topK: 1 })` probe
   * that returned at most 1 and was deterministically 0 on real SQLite.
   */
  async count(scope: SessionScope): Promise<number> {
    const row = this.#conn.get<{ n: number }>(
      "SELECT COUNT(*) AS n FROM facts WHERE scope_user_id = ? AND deleted_at IS NULL AND archived = 0 AND status != 'quarantined'",
      [scope.userId],
    );
    return row?.n ?? 0;
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
    opts: { readonly includeArchived?: boolean } = {},
  ): Promise<
    ReadonlyArray<{
      readonly id: string;
      readonly text: string;
      readonly strength: number;
      readonly lastAccessedAt: number | null;
      readonly createdAt: number;
      readonly archived: boolean;
      readonly importance: number | null;
      readonly status: string;
      readonly provenance: string | null;
    }>
  > {
    // MCON-6: archived facts never receive access bumps, so they pin the
    // LRU head forever and saturate the window — after ~LIMIT archived
    // rows every light pass would see only them and live facts would stop
    // decaying. The decay window therefore excludes archived rows by
    // default; inspection paths opt in via `includeArchived`.
    const archivedPredicate = opts.includeArchived === true ? '' : 'AND archived = 0';
    const rows = this.#conn.all<{
      id: string;
      text: string;
      strength: number;
      last_accessed_at: number | null;
      created_at: number;
      archived: number;
      importance: number | null;
      status: string;
      provenance: string | null;
    }>(
      `SELECT id, text, strength, last_accessed_at, created_at, archived,
              importance, status, provenance
       FROM facts
       WHERE scope_user_id = ? AND deleted_at IS NULL ${archivedPredicate}
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
      importance: row.importance,
      status: row.status,
      provenance: row.provenance,
    }));
  }

  /**
   * Record a retrieval access for the given facts (MRET-7): stamps
   * `last_accessed_at` and bumps `strength` by 0.1 per access, capped
   * at 2.0 (the decay model reads `tauMs * max(0.5, strength)`, so the
   * cap bounds how far reinforcement can stretch retention). Failures
   * here must never break the read path — callers wrap in try/catch.
   *
   * @stable
   */
  async markAccessed(ids: ReadonlyArray<string>, accessedAt?: number): Promise<void> {
    if (ids.length === 0) return;
    const at = accessedAt ?? Date.now();
    const placeholders = ids.map(() => '?').join(', ');
    this.#conn.run(
      `UPDATE facts
       SET last_accessed_at = ?, strength = MIN(2.0, strength + 0.1)
       WHERE id IN (${placeholders})`,
      [at, ...ids],
    );
  }

  /**
   * Narrow decay-column read for exactly the given fact ids (MRET-8).
   * Replaces the per-search 1000-row LRU-window scan.
   *
   * @stable
   */
  async listDecaySignals(ids: ReadonlyArray<string>): Promise<
    ReadonlyArray<{
      readonly id: string;
      readonly strength: number;
      readonly lastAccessedAt: number | null;
      readonly createdAt: number;
    }>
  > {
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => '?').join(', ');
    const rows = this.#conn.all<{
      id: string;
      strength: number;
      last_accessed_at: number | null;
      created_at: number;
    }>(
      `SELECT id, strength, last_accessed_at, created_at FROM facts WHERE id IN (${placeholders})`,
      [...ids],
    );
    return rows.map((row) => ({
      id: row.id,
      strength: row.strength,
      lastAccessedAt: row.last_accessed_at,
      createdAt: row.created_at,
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
      const row = this.#conn.get<{ rowid: number; text: string }>(
        'SELECT rowid AS rowid, text FROM facts WHERE id = ?',
        [id],
      );
      // store-04: hard-deleted fact CONTENT must not survive in the
      // audit trail — history rows are scrubbed to the event skeleton
      // inside the same transaction. Two sweeps: (a) every row keyed
      // to this id, and (b) every row VALUE-matching this fact's text
      // (a SUPERSEDE row carries the new fact's text on the OLD
      // fact's id). The PURGE row below is written after the scrub so
      // its reason survives.
      this.#conn.run(
        `UPDATE memory_history SET prev_value = NULL, new_value = NULL
         WHERE memory_kind = 'fact' AND memory_id = ?`,
        [id],
      );
      if (row !== undefined) {
        this.#conn.run(
          `UPDATE memory_history SET prev_value = NULL
           WHERE memory_kind = 'fact' AND prev_value = ?`,
          [row.text],
        );
        this.#conn.run(
          `UPDATE memory_history SET new_value = NULL
           WHERE memory_kind = 'fact' AND new_value = ?`,
          [row.text],
        );
      }
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
      // CS-1: drop the graph links before the fact row. `fact_entities.fact_id`
      // references `facts(id)` with no ON DELETE, and the connection runs with
      // `foreign_keys = ON`, so deleting a linked fact would otherwise raise
      // FOREIGN KEY constraint failed and roll back the whole purge (including
      // the PURGE audit row). The canonical `entities` are shared data and are
      // intentionally left intact — only this fact's links are removed.
      this.#conn.run('DELETE FROM fact_entities WHERE fact_id = ?', [id]);
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
         priority, sensitivity, tags_json, created_at,
         steps_json, variables_json, success_criteria_json, provenance, status
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        rule.steps ? JSON.stringify(rule.steps) : null,
        rule.variables ? JSON.stringify(rule.variables) : null,
        rule.successCriteria ? JSON.stringify(rule.successCriteria) : null,
        rule.provenance ?? null,
        rule.status ?? null,
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

  /**
   * Promote / demote a procedural rule's retrieval-trust `status` (MCON-2) and
   * write a `memory_history` audit row. Mirrors `setStatus` on facts — a
   * retrieval gate only, never touching content. Powers
   * {@link ProceduralMemory.validate} so an induced (quarantined) procedure can
   * be promoted into `activate()`.
   */
  async setStatus(id: string, status: MemoryStatus, reason?: string): Promise<void> {
    this.#conn.transaction(() => {
      this.#conn.run('UPDATE rules SET status = ?, updated_at = ? WHERE id = ?', [
        status,
        Date.now(),
        id,
      ]);
      this.#conn.run(
        `INSERT INTO memory_history (memory_kind, memory_id, prev_value, new_value, event, source, message_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'rule',
          id,
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
   * Record one demonstrated successful reuse of a rule (MCON-2 part 4,
   * migration 020) and return the new counter value. Feeds
   * promotion-by-demonstrated-success for quarantined induced
   * procedures.
   *
   * @stable
   */
  async recordSuccess(id: string): Promise<number> {
    this.#conn.run(
      'UPDATE rules SET success_count = success_count + 1, updated_at = ? WHERE id = ?',
      [Date.now(), id],
    );
    const row = this.#conn.get<{ success_count: number }>(
      'SELECT success_count FROM rules WHERE id = ?',
      [id],
    );
    return row?.success_count ?? 0;
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

/**
 * `SqliteInsightStore` — owns the `insights` + `insights_fts` tables
 * shipped in migration 014 (P1-1). Implements the structural
 * `InsightMemoryStoreExt` surface defined in
 * `@graphorin/memory/internal/storage-adapter.ts`.
 *
 * Search is FTS5-only — insights are a soft, rank-capped inspector
 * surface, not primary recall, so no per-embedder vec0 table is
 * created. Pruning (the ExpeL forgetting step) is a soft-delete
 * (`deleted_at`), never a hard purge, so pruned insights remain
 * auditable.
 *
 * @stable
 */
export class SqliteInsightStore {
  #conn: SqliteConnection;
  constructor(conn: SqliteConnection) {
    this.#conn = conn;
  }

  async insert(insight: Insight): Promise<void> {
    this.#conn.transaction(() => {
      this.#conn.run(
        `INSERT INTO insights (
           id, scope_user_id, scope_session_id, scope_agent_id, text, cites_json, salience,
           provenance, status, embedder_id, sensitivity, tags_json, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           text = excluded.text,
           cites_json = excluded.cites_json,
           salience = excluded.salience,
           provenance = excluded.provenance,
           status = excluded.status,
           updated_at = excluded.updated_at,
           tags_json = excluded.tags_json`,
        [
          insight.id,
          insight.userId,
          insight.sessionId ?? null,
          insight.agentId ?? null,
          insight.text,
          JSON.stringify(insight.cites ?? []),
          insight.salience,
          insight.provenance ?? 'reflection',
          insight.status ?? 'quarantined',
          null,
          insight.sensitivity,
          insight.tags ? JSON.stringify(insight.tags) : null,
          toEpoch(insight.createdAt),
          insight.updatedAt ? toEpoch(insight.updatedAt) : null,
        ],
      );
      this.#conn.run(
        `INSERT OR REPLACE INTO insights_fts (rowid, text) VALUES ((SELECT rowid FROM insights WHERE id = ?), ?)`,
        [insight.id, insight.text],
      );
    });
  }

  async list(
    scope: SessionScope,
    opts: { readonly limit?: number; readonly includeQuarantined?: boolean } = {},
  ): Promise<ReadonlyArray<Insight>> {
    const limit = opts.limit ?? 50;
    const rows = this.#conn.all<InsightRow>(
      `SELECT * FROM insights
       WHERE scope_user_id = ? AND deleted_at IS NULL
         ${opts.includeQuarantined === true ? '' : "AND status != 'quarantined'"}
       ORDER BY created_at DESC
       LIMIT ?`,
      [scope.userId, limit],
    );
    return rows.map(rowToInsight);
  }

  async search(
    scope: SessionScope,
    query: string,
    opts: { readonly topK?: number; readonly includeQuarantined?: boolean } = {},
  ): Promise<ReadonlyArray<MemoryHit<Insight>>> {
    const topK = opts.topK ?? 10;
    const rows = this.#conn.all<InsightRow & { bm25_score: number }>(
      `SELECT i.*, bm25(insights_fts) AS bm25_score
       FROM insights_fts
       JOIN insights i ON i.rowid = insights_fts.rowid
       WHERE insights_fts MATCH ? AND i.scope_user_id = ? AND i.deleted_at IS NULL
         ${opts.includeQuarantined === true ? '' : INSIGHT_NOT_QUARANTINED}
       ORDER BY bm25_score
       LIMIT ?`,
      [escapeFtsQuery(query), scope.userId, topK],
    );
    return rows.map((row) => ({
      record: rowToInsight(row),
      score: -row.bm25_score,
      signals: { bm25: row.bm25_score },
    }));
  }

  async get(id: string): Promise<Insight | null> {
    const row = this.#conn.get<InsightRow>(
      'SELECT * FROM insights WHERE id = ? AND deleted_at IS NULL',
      [id],
    );
    return row ? rowToInsight(row) : null;
  }

  /**
   * Promote / demote an insight's retrieval-trust `status` (MCON-2) and write a
   * `memory_history` audit row. Mirrors `setStatus` on facts — a retrieval gate
   * only. Powers {@link InsightMemory.validate} so a quarantined (reflection)
   * insight can be promoted out of quarantine.
   */
  async setStatus(id: string, status: MemoryStatus, reason?: string): Promise<void> {
    this.#conn.transaction(() => {
      this.#conn.run(
        'UPDATE insights SET status = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL',
        [status, Date.now(), id],
      );
      this.#conn.run(
        `INSERT INTO memory_history (memory_kind, memory_id, prev_value, new_value, event, source, message_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'insight',
          id,
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
   * Adjust an insight's ExpeL salience by `delta`, clamped at 0 (the
   * floor at which `prune` removes it). Never touches content / cites —
   * salience is the only mutable field.
   */
  async bumpSalience(id: string, delta: number, reason?: string): Promise<void> {
    void reason;
    this.#conn.run(
      'UPDATE insights SET salience = MAX(0, salience + ?), updated_at = ? WHERE id = ? AND deleted_at IS NULL',
      [delta, Date.now(), id],
    );
  }

  /**
   * Soft-delete every salience-0 insight for the scope (the ExpeL
   * forgetting step). Returns the number pruned. Tombstone only — the
   * row stays for audit.
   */
  async prune(scope: SessionScope): Promise<number> {
    const now = Date.now();
    const res = this.#conn.run(
      'UPDATE insights SET deleted_at = ?, updated_at = ? WHERE scope_user_id = ? AND salience <= 0 AND deleted_at IS NULL',
      [now, now, scope.userId],
    );
    return res.changes;
  }
}

interface EntityRow {
  id: string;
  scope_user_id: string;
  name: string;
  normalized_name: string;
  embedding: Buffer | Uint8Array | null;
  embedder_id: string | null;
  merged_into: string | null;
  created_at: number;
  updated_at: number | null;
}

interface EntityMergeRow {
  id: string;
  scope_user_id: string;
  kind: string;
  from_entity_id: string;
  into_entity_id: string | null;
  reason: string | null;
  created_at: number;
}

/** Find-or-create payload for {@link SqliteGraphStore.upsertEntity}. */
interface SqliteEntityUpsertInput {
  readonly name: string;
  readonly normalizedName: string;
  readonly vector?: Float32Array;
  readonly embedderId?: string;
}

/** A canonical entity returned with its name embedding for dedup. */
interface SqliteEntityWithEmbedding extends GraphEntity {
  readonly vector: Float32Array | null;
  readonly embedderId: string | null;
}

/** One row of the append-only merge / unmerge audit ledger. */
interface SqliteEntityMergeRecord {
  readonly id: string;
  readonly userId: string;
  readonly kind: 'merge' | 'unmerge';
  readonly fromEntityId: string;
  readonly intoEntityId: string | null;
  readonly reason?: string;
  readonly createdAt: string;
}

/**
 * Lightweight in-SQLite relation-graph store (P2-1). Owns the canonical
 * `entities` table, the `fact_entities` mapping, and the append-only
 * `entity_merges` ledger. Entity *resolution* (lexical + embedding dedup,
 * optional LLM adjudication) lives in `@graphorin/memory`; this class is
 * the pure persistence + the one-hop recursive-CTE traversal. Exposed on
 * {@link SqliteMemoryStore.graph} and picked up structurally as the
 * memory adapter's optional `graph` capability.
 *
 * @stable
 */
export class SqliteGraphStore {
  #conn: SqliteConnection;
  constructor(conn: SqliteConnection) {
    this.#conn = conn;
  }

  /**
   * Find-or-create the canonical (root) entity for `normalizedName` in
   * the scope. Returns the existing root's id when one exists (back-filling
   * its embedding if it had none), else inserts and returns a new root.
   */
  async upsertEntity(scope: SessionScope, input: SqliteEntityUpsertInput): Promise<string> {
    return this.#conn.transaction(() => {
      const existing = this.#conn.get<EntityRow>(
        'SELECT * FROM entities WHERE scope_user_id = ? AND normalized_name = ? AND merged_into IS NULL',
        [scope.userId, input.normalizedName],
      );
      const now = Date.now();
      if (existing !== undefined) {
        if (
          existing.embedding === null &&
          input.vector !== undefined &&
          input.embedderId !== undefined
        ) {
          this.#conn.run(
            'UPDATE entities SET embedding = ?, embedder_id = ?, updated_at = ? WHERE id = ?',
            [f32ToBlob(input.vector), input.embedderId, now, existing.id],
          );
        }
        return existing.id;
      }
      const id = generateId();
      this.#conn.run(
        `INSERT INTO entities (id, scope_user_id, name, normalized_name, embedding, embedder_id, merged_into, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, NULL, ?, NULL)`,
        [
          id,
          scope.userId,
          input.name,
          input.normalizedName,
          input.vector !== undefined ? f32ToBlob(input.vector) : null,
          input.embedderId ?? null,
          now,
        ],
      );
      return id;
    });
  }

  /** Link a fact's subject / object to a canonical entity (idempotent). */
  async linkFactEntity(factId: string, entityId: string, role: EntityRole): Promise<void> {
    this.#conn.run(
      'INSERT OR IGNORE INTO fact_entities (fact_id, entity_id, role, created_at) VALUES (?, ?, ?, ?)',
      [factId, entityId, role, Date.now()],
    );
  }

  /** Candidate entities for the resolver (roots only unless `includeMerged`). */
  async listEntities(
    scope: SessionScope,
    opts: { readonly includeMerged?: boolean; readonly limit?: number } = {},
  ): Promise<ReadonlyArray<SqliteEntityWithEmbedding>> {
    const limit = opts.limit ?? 1000;
    const rows = this.#conn.all<EntityRow>(
      `SELECT * FROM entities
       WHERE scope_user_id = ? ${opts.includeMerged === true ? '' : 'AND merged_into IS NULL'}
       ORDER BY created_at DESC
       LIMIT ?`,
      [scope.userId, limit],
    );
    return rows.map((r) => ({
      ...rowToGraphEntity(r),
      vector: blobToF32(r.embedding),
      embedderId: r.embedder_id,
    }));
  }

  /**
   * Uncapped indexed lookup of the canonical root for an exact normalized
   * name. Backed by the partial-unique index on `(scope_user_id,
   * normalized_name) WHERE merged_into IS NULL`, so the resolver dedups an
   * exact alias of an arbitrarily-old entity without paging the bounded
   * {@link listEntities} candidate window or deserializing its BLOBs (CS-11).
   */
  async findEntityByNormalizedName(
    scope: SessionScope,
    normalizedName: string,
  ): Promise<SqliteEntityWithEmbedding | null> {
    const row = this.#conn.get<EntityRow>(
      'SELECT * FROM entities WHERE scope_user_id = ? AND normalized_name = ? AND merged_into IS NULL',
      [scope.userId, normalizedName],
    );
    return row !== undefined
      ? { ...rowToGraphEntity(row), vector: blobToF32(row.embedding), embedderId: row.embedder_id }
      : null;
  }

  /** Lookup one entity by id (any merge state). */
  async getEntity(scope: SessionScope, id: string): Promise<GraphEntity | null> {
    const row = this.#conn.get<EntityRow>(
      'SELECT * FROM entities WHERE id = ? AND scope_user_id = ?',
      [id, scope.userId],
    );
    return row !== undefined ? rowToGraphEntity(row) : null;
  }

  /** Follow `merged_into` to the canonical root id (cycle-guarded). */
  async resolveCanonical(scope: SessionScope, id: string): Promise<string> {
    let current = id;
    for (let i = 0; i < 16; i++) {
      const row = this.#conn.get<{ merged_into: string | null }>(
        'SELECT merged_into FROM entities WHERE id = ? AND scope_user_id = ?',
        [current, scope.userId],
      );
      if (row === undefined || row.merged_into === null) return current;
      current = row.merged_into;
    }
    return current;
  }

  /**
   * Merge `fromId` into `intoId` (resolved to its root). Sets
   * `from.merged_into` and re-points `from`'s children to keep the
   * pointer single-level, then records a `'merge'` audit row.
   * `fact_entities` are never rewritten — reads canonicalise via
   * `merged_into`. A self-merge is a no-op.
   */
  async mergeEntities(
    scope: SessionScope,
    fromId: string,
    intoId: string,
    reason?: string,
  ): Promise<void> {
    this.#conn.transaction(() => {
      const intoRow = this.#conn.get<{ merged_into: string | null }>(
        'SELECT merged_into FROM entities WHERE id = ? AND scope_user_id = ?',
        [intoId, scope.userId],
      );
      const intoRoot = intoRow?.merged_into ?? intoId;
      if (fromId === intoRoot) return;
      const now = Date.now();
      this.#conn.run(
        'UPDATE entities SET merged_into = ?, updated_at = ? WHERE id = ? AND scope_user_id = ?',
        [intoRoot, now, fromId, scope.userId],
      );
      this.#conn.run(
        'UPDATE entities SET merged_into = ?, updated_at = ? WHERE merged_into = ? AND scope_user_id = ?',
        [intoRoot, now, fromId, scope.userId],
      );
      this.#conn.run(
        `INSERT INTO entity_merges (id, scope_user_id, kind, from_entity_id, into_entity_id, reason, created_at)
         VALUES (?, ?, 'merge', ?, ?, ?, ?)`,
        [generateId(), scope.userId, fromId, intoRoot, reason ?? null, now],
      );
    });
  }

  /**
   * Reverse a merge: clear `id.merged_into` (making it a root again) and
   * record an `'unmerge'` audit row. Restores the entity as a root; the
   * pre-merge child topology is not reconstructed.
   */
  async unmergeEntity(scope: SessionScope, id: string, reason?: string): Promise<void> {
    this.#conn.transaction(() => {
      const now = Date.now();
      this.#conn.run(
        'UPDATE entities SET merged_into = NULL, updated_at = ? WHERE id = ? AND scope_user_id = ?',
        [now, id, scope.userId],
      );
      this.#conn.run(
        `INSERT INTO entity_merges (id, scope_user_id, kind, from_entity_id, into_entity_id, reason, created_at)
         VALUES (?, ?, 'unmerge', ?, NULL, ?, ?)`,
        [generateId(), scope.userId, id, reason ?? null, now],
      );
    });
  }

  /** The append-only merge / unmerge audit ledger, newest first. */
  async listMerges(
    scope: SessionScope,
    opts: { readonly limit?: number } = {},
  ): Promise<ReadonlyArray<SqliteEntityMergeRecord>> {
    const limit = opts.limit ?? 100;
    const rows = this.#conn.all<EntityMergeRow>(
      'SELECT * FROM entity_merges WHERE scope_user_id = ? ORDER BY created_at DESC, id DESC LIMIT ?',
      [scope.userId, limit],
    );
    return rows.map((r) => ({
      id: r.id,
      userId: r.scope_user_id,
      kind: r.kind === 'unmerge' ? 'unmerge' : 'merge',
      fromEntityId: r.from_entity_id,
      intoEntityId: r.into_entity_id,
      ...(r.reason !== null ? { reason: r.reason } : {}),
      createdAt: new Date(r.created_at).toISOString(),
    }));
  }

  /**
   * Expand `seedFactIds` to neighbouring facts that share a canonical
   * entity, up to `maxHops` (default 1), via a recursive CTE over
   * `fact_entities`. Entities are canonicalised through `merged_into` in
   * the join, so a merge transparently connects both sides. Excludes the
   * seeds themselves and honours soft-delete / archive / quarantine /
   * `asOf` exactly like {@link SemanticMemoryStore.search}.
   */
  async expandOneHop(
    scope: SessionScope,
    seedFactIds: ReadonlyArray<string>,
    opts: {
      readonly maxHops?: number;
      readonly limit?: number;
      readonly includeQuarantined?: boolean;
      readonly asOf?: string;
      readonly includeSuperseded?: boolean;
    } = {},
  ): Promise<ReadonlyArray<Fact>> {
    if (seedFactIds.length === 0) return [];
    const maxHops = opts.maxHops ?? 1;
    const limit = opts.limit ?? 60;
    const incQ = opts.includeQuarantined === true ? 1 : 0;
    // memory-retrieval-01: default reads evaluate validity at NOW.
    const asOf = resolveFactValidityEpoch(opts.asOf, opts.includeSuperseded);
    const seedsJson = JSON.stringify([...seedFactIds]);
    const rows = this.#conn.all<FactRow>(
      // CS-15: the recursive step only bridges THROUGH a fact that is itself
      // visible to the caller (in-scope, not tombstoned/archived/quarantined,
      // valid at `asOf`) — joining `facts fb ON fb.id = w.fact_id` with the
      // same predicates. Without it a tombstoned/quarantined intermediate fact
      // silently conducts a link between two otherwise-unrelated records at
      // maxHops > 1. Seeds are also intersected with the caller scope so a
      // foreign fact id can't be used as a traversal root.
      `WITH RECURSIVE
         seed_ids(fact_id) AS (
           SELECT f.id FROM facts f
           JOIN json_each(?) j ON j.value = f.id
           WHERE f.scope_user_id = ?
         ),
         walk(fact_id, depth) AS (
             SELECT fact_id, 0 FROM seed_ids
           UNION
             SELECT fe2.fact_id, w.depth + 1
             FROM walk w
             JOIN facts fb ON fb.id = w.fact_id
               AND fb.scope_user_id = ?
               AND fb.deleted_at IS NULL
               AND fb.archived = 0
               AND (? = 1 OR fb.status != 'quarantined')
               AND (? IS NULL OR ((fb.valid_from IS NULL OR fb.valid_from <= ?) AND (fb.valid_to IS NULL OR fb.valid_to > ?)))
             JOIN fact_entities fe1 ON fe1.fact_id = w.fact_id
             JOIN entities e1 ON e1.id = fe1.entity_id
             JOIN entities e2 ON COALESCE(e2.merged_into, e2.id) = COALESCE(e1.merged_into, e1.id)
             JOIN fact_entities fe2 ON fe2.entity_id = e2.id
             WHERE w.depth < ?
         )
       SELECT f.* FROM facts f
       WHERE f.id IN (SELECT DISTINCT fact_id FROM walk WHERE depth > 0)
         AND f.id NOT IN (SELECT fact_id FROM seed_ids)
         AND f.scope_user_id = ?
         AND f.deleted_at IS NULL
         AND f.archived = 0
         AND (? = 1 OR f.status != 'quarantined')
         AND (? IS NULL OR ((f.valid_from IS NULL OR f.valid_from <= ?) AND (f.valid_to IS NULL OR f.valid_to > ?)))
       ORDER BY f.created_at DESC
       LIMIT ?`,
      [
        seedsJson,
        scope.userId,
        scope.userId,
        incQ,
        asOf,
        asOf,
        asOf,
        maxHops,
        scope.userId,
        incQ,
        asOf,
        asOf,
        asOf,
        limit,
      ],
    );
    return rows.map(rowToFact);
  }
}

function f32ToBlob(vec: Float32Array): Buffer {
  return Buffer.from(vec.buffer, vec.byteOffset, vec.byteLength);
}

function blobToF32(blob: Buffer | Uint8Array | null): Float32Array | null {
  if (blob === null) return null;
  // better-sqlite3 returns a Buffer whose byteOffset may not be 4-aligned
  // for a Float32Array view, so copy into a fresh aligned buffer.
  const copy = new Uint8Array(blob.byteLength);
  copy.set(blob);
  return new Float32Array(copy.buffer, 0, Math.floor(copy.byteLength / 4));
}

function rowToGraphEntity(row: EntityRow): GraphEntity {
  return {
    id: row.id,
    userId: row.scope_user_id,
    name: row.name,
    normalizedName: row.normalized_name,
    mergedInto: row.merged_into ?? undefined,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: row.updated_at !== null ? new Date(row.updated_at).toISOString() : undefined,
  } as GraphEntity;
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
  importance: number | null;
  strength: number;
  last_accessed_at: number | null;
  created_at: number;
  updated_at: number | null;
  deleted_at: number | null;
  archived: number;
}

interface InsightRow {
  id: string;
  scope_user_id: string;
  scope_session_id: string | null;
  scope_agent_id: string | null;
  text: string;
  cites_json: string;
  salience: number;
  provenance: string | null;
  status: string;
  embedder_id: string | null;
  sensitivity: 'public' | 'internal' | 'secret';
  tags_json: string | null;
  created_at: number;
  updated_at: number | null;
  deleted_at: number | null;
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
  // P2-2: induced-procedure payload (migration 017). NULL on author rules.
  steps_json: string | null;
  variables_json: string | null;
  success_criteria_json: string | null;
  provenance: string | null;
  status: string | null;
  // MCON-2 part 4: demonstrated-success counter (migration 020).
  success_count: number;
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

function parseCites(json: string): ReadonlyArray<string> {
  try {
    const parsed: unknown = JSON.parse(json);
    if (Array.isArray(parsed)) {
      return parsed.filter((x): x is string => typeof x === 'string');
    }
  } catch {
    // Malformed JSON ⇒ treat as no citations (defensive).
  }
  return [];
}

function rowToInsight(row: InsightRow): Insight {
  return {
    id: row.id,
    kind: 'insight',
    userId: row.scope_user_id,
    sessionId: row.scope_session_id ?? undefined,
    agentId: row.scope_agent_id ?? undefined,
    text: row.text,
    cites: parseCites(row.cites_json),
    salience: row.salience,
    provenance: (row.provenance ?? undefined) as MemoryProvenance | undefined,
    status: row.status as MemoryStatus,
    sensitivity: row.sensitivity,
    tags: row.tags_json ? (JSON.parse(row.tags_json) as readonly string[]) : undefined,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: row.updated_at !== null ? new Date(row.updated_at).toISOString() : undefined,
    deletedAt: row.deleted_at !== null ? new Date(row.deleted_at).toISOString() : undefined,
  } as Insight;
}

function rowToFact(row: FactRow): Fact {
  return {
    id: row.id,
    kind: 'semantic',
    userId: row.scope_user_id,
    sessionId: row.scope_session_id ?? undefined,
    agentId: row.scope_agent_id ?? undefined,
    text: row.text,
    // P2-1: surface the s/p/o triple (no longer inert).
    subject: row.subject ?? undefined,
    predicate: row.predicate ?? undefined,
    object: row.object ?? undefined,
    confidence: row.confidence ?? undefined,
    importance: row.importance ?? undefined,
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
    // P2-2: induced-procedure payload (migration 017). NULL ⇒ undefined.
    steps: row.steps_json ? (JSON.parse(row.steps_json) as readonly string[]) : undefined,
    variables: row.variables_json
      ? (JSON.parse(row.variables_json) as readonly string[])
      : undefined,
    successCriteria: row.success_criteria_json
      ? (JSON.parse(row.success_criteria_json) as readonly string[])
      : undefined,
    provenance: row.provenance !== null ? (row.provenance as MemoryProvenance) : undefined,
    status: row.status !== null ? (row.status as MemoryStatus) : undefined,
    // MCON-2 part 4 (migration 020): absent on legacy snapshots ⇒ 0.
    successCount: row.success_count ?? 0,
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
  // Tokenise on whitespace and quote each token independently, joined with the
  // FTS5 `OR` operator. Per-token double-quoting still neutralises operator
  // characters and reserved keywords (user input cannot inject FTS5 syntax),
  // but OR-ing the tokens restores lexical recall for multi-word natural-
  // language queries: a single whole-query phrase only matches a verbatim,
  // adjacent run of the same tokens, so reordered or non-adjacent terms scored
  // zero. Whitespace-only input falls back to the prior (empty) phrase form.
  const tokens = query.split(/\s+/).filter((token) => token.length > 0);
  if (tokens.length === 0) {
    return `"${query.replace(/"/g, '""')}"`;
  }
  return tokens.map((token) => `"${token.replace(/"/g, '""')}"`).join(' OR ');
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
