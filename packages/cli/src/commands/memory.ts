/**
 * `graphorin memory` - long-term memory operator commands.
 *
 * Surface (per Phase 15 § Memory):
 *
 *  - `graphorin memory status` - counts + registered embedders. Pure
 *    read-only inspection of the SQLite store.
 *  - `graphorin memory migrate --from <embedder> --to <embedder>
 *    --strategy <lock-on-first|auto-migrate|multi-active>` - embedder
 *    swap. The runner itself lives in `@graphorin/memory`
 *    ({@link migrateEmbedder}); the CLI is a thin wrapper that loads
 *    the operator's `embedders.ts` module if supplied through
 *    `--embedders <path>`. Without that module the command emits a
 *    pointer to the documentation rather than guessing which embedder
 *    factory to instantiate.
 *
 * @packageDocumentation
 */

import { resolve } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

import type { EmbedderProvider } from '@graphorin/core';
import { createMemory, migrateEmbedder } from '@graphorin/memory';
import { createSqliteStore } from '@graphorin/store-sqlite';
import { EXIT_CODES } from '../internal/exit.js';
import {
  brand,
  type CommonOutputOptions,
  defaultPrintSink,
  emitReport,
  statusMarker,
} from '../internal/output.js';
import { openStoreContext } from '../internal/store-context.js';

/** @stable */
export interface MemoryCommonOptions extends CommonOutputOptions {
  readonly config?: string;
}

/** @stable */
export interface MemoryStatusEmbedder {
  readonly id: string;
  readonly model: string;
  readonly dim: number;
  readonly distanceMetric: string;
  readonly retired: boolean;
  readonly createdAt: string;
  readonly retiredAt?: string;
}

/** @stable */
export interface MemoryStatusResult {
  readonly storagePath: string;
  readonly embedders: ReadonlyArray<MemoryStatusEmbedder>;
  readonly counts: {
    readonly facts: number;
    readonly episodes: number;
    readonly sessionMessages: number;
    readonly procedures: number;
  };
}

/** @stable */
export async function runMemoryStatus(
  options: MemoryCommonOptions = {},
): Promise<MemoryStatusResult> {
  const ctx = await openStoreContext({
    ...(options.config !== undefined ? { config: options.config } : {}),
  });
  try {
    const embedders = ctx.store.embeddings.listAll().map(
      (row): MemoryStatusEmbedder =>
        Object.freeze({
          id: row.id,
          model: row.model,
          dim: row.dim,
          distanceMetric: row.distanceMetric,
          retired: row.retiredAt !== null,
          createdAt: new Date(row.createdAt).toISOString(),
          ...(row.retiredAt !== null ? { retiredAt: new Date(row.retiredAt).toISOString() } : {}),
        }),
    );
    const counts = await readMemoryCounts(ctx.store);
    const out: MemoryStatusResult = Object.freeze({
      storagePath: ctx.config.storage.path,
      embedders: Object.freeze(embedders),
      counts: Object.freeze(counts),
    });
    emitReport(options, out, () => {
      const print = options.print ?? defaultPrintSink;
      print(brand(`memory status (${out.storagePath})`));
      if (out.embedders.length === 0) {
        print(brand(`  no embedders registered yet - run createMemory({ embedder }) once.`));
      } else {
        print(brand(`  embedders (${out.embedders.length}):`));
        for (const e of out.embedders) {
          const status = e.retired ? statusMarker('warn') : statusMarker('ok');
          print(`    ${status} ${e.id} (model=${e.model}, dim=${e.dim}, retired=${e.retired})`);
        }
      }
      print(
        brand(
          `  counts: facts=${out.counts.facts}, episodes=${out.counts.episodes}, sessionMessages=${out.counts.sessionMessages}, procedures=${out.counts.procedures}`,
        ),
      );
    });
    return out;
  } finally {
    await ctx.close();
  }
}

/** @stable */
export interface MemoryMigrateOptions extends MemoryCommonOptions {
  readonly from: string;
  readonly to: string;
  readonly strategy: 'lock-on-first' | 'auto-migrate' | 'multi-active';
  /**
   * Path to a JS module exporting an `embedders` object keyed by
   * canonical embedder id, each value a zero-arg factory returning an
   * `EmbedderProvider` (sync or promise). The CLI imports this module
   * so it can construct the source / target embedder instances the
   * runner needs (DEC-154: the framework never downloads models
   * implicitly). Without the module the command exits `2` with a
   * pointer.
   */
  readonly embeddersModule?: string;
  /** Rows per re-embed batch. Default `512`. */
  readonly batchSize?: number;
  /**
   * After a committed migration, drop the RETIRED embedders' vector
   * sidecar tables and run `PRAGMA incremental_vacuum` (space
   * reclaim). Default `false`.
   */
  readonly reclaim?: boolean;
}

/** @stable */
export interface MemoryMigrateResult {
  readonly migrationId: string;
  readonly status: 'committed';
  readonly processed: number;
  /** Vector tables dropped by `--reclaim` (empty without the flag). */
  readonly reclaimedTables: ReadonlyArray<string>;
}

/**
 * `graphorin memory migrate` - embedder swap. Loads the operator's
 * `--embedders` factory module, opens the configured store, and
 * drives `@graphorin/memory`'s `migrateEmbedder(...)` with the
 * store-side pager + the PERSISTED `migration_state` cursor - so a
 * killed / aborted migration resumes from where it stopped on the
 * next invocation. `--reclaim` additionally drops retired vector
 * tables and compacts free pages.
 *
 * @stable
 */
export async function runMemoryMigrate(
  options: MemoryMigrateOptions,
): Promise<MemoryMigrateResult> {
  const print = options.print ?? defaultPrintSink;
  // CLI-03: validate --strategy before doing anything. A typo used to fall
  // through to the destructive auto-migrate branch (all facts re-embedded,
  // the source embedder retired) with exit 0.
  const VALID_STRATEGIES = ['lock-on-first', 'auto-migrate', 'multi-active'] as const;
  if (!(VALID_STRATEGIES as readonly string[]).includes(options.strategy)) {
    print(
      brand(
        `invalid --strategy '${options.strategy}'. Expected one of: ${VALID_STRATEGIES.join(', ')}.`,
      ),
    );
    process.exit(EXIT_CODES.UNSUPPORTED);
  }
  if (options.embeddersModule === undefined) {
    print(
      brand(
        `'graphorin memory migrate' requires an --embedders module (a JS / TS file exporting { embedders: { '${options.from}': () => EmbedderProvider, '${options.to}': () => EmbedderProvider } }).`,
      ),
    );
    print(
      brand(
        'The CLI cannot guess which embedder factory to instantiate; the framework intentionally avoids implicit network downloads (DEC-154).',
      ),
    );
    print(
      brand(
        `For programmatic migrations call migrateEmbedder({ source, target, embeddings, strategy: '${options.strategy}' }) from @graphorin/memory directly.`,
      ),
    );
    process.exit(EXIT_CODES.UNSUPPORTED);
  }
  const moduleUrl = pathToFileURL(resolve(process.cwd(), options.embeddersModule)).href;
  const imported = (await import(moduleUrl)) as {
    embedders?: Record<string, () => unknown | Promise<unknown>>;
    default?: { embedders?: Record<string, () => unknown | Promise<unknown>> };
  };
  const embedders = imported.embedders ?? imported.default?.embedders;
  if (embedders === undefined || typeof embedders !== 'object') {
    print(
      brand(
        `--embedders module '${options.embeddersModule}' does not export an { embedders } object.`,
      ),
    );
    process.exit(EXIT_CODES.UNSUPPORTED);
  }
  const resolveFactory = async (id: string): Promise<EmbedderProvider> => {
    const factory = embedders[id];
    if (typeof factory !== 'function') {
      print(
        brand(
          `--embedders module has no factory for '${id}'. Available: ${Object.keys(embedders).join(', ') || '(none)'}.`,
        ),
      );
      process.exit(EXIT_CODES.UNSUPPORTED);
    }
    return (await factory()) as EmbedderProvider;
  };
  const source = await resolveFactory(options.from);
  const target = await resolveFactory(options.to);

  const ctx = await openStoreContext({
    ...(options.config !== undefined ? { config: options.config } : {}),
    // A migration necessarily has two live embedders in flight - the
    // default lock-on-first policy would refuse to register the target.
    storeFactory: (storeOpts) =>
      createSqliteStore({ ...storeOpts, embedderPolicy: 'multi-active' }),
  });
  try {
    let migrationId = '';
    let processed = 0;
    const progress = migrateEmbedder({
      source,
      target,
      embeddings: ctx.store.embeddings,
      strategy: options.strategy,
      ...(options.batchSize !== undefined ? { batchSize: options.batchSize } : {}),
      nextBatch: ctx.store.embedderMigration.nextBatch,
      state: ctx.store.embedderMigration.state,
    });
    for await (const event of progress) {
      migrationId = event.migrationId;
      if (event.phase === 'running') {
        processed += 0; // running events report per-kind counts below
        print(
          brand(
            `migrate: kind=${event.kind} processed=${event.processed} (${event.source} -> ${event.target})`,
          ),
        );
        processed = Math.max(processed, event.processed);
      } else {
        print(brand(`migrate: phase=${event.phase}`));
      }
    }
    const reclaimedTables: string[] = [];
    if (options.reclaim === true) {
      const { dropped } = ctx.store.embedderMigration.dropRetiredVectorTables();
      reclaimedTables.push(...dropped);
      // Freed pages return via incremental_vacuum on auto_vacuum=2
      // databases; older databases keep the high-water mark (see the
      // storage runbook).
      const autoVacuum = ctx.store.connection.pragma('auto_vacuum', { simple: true }) as number;
      if (autoVacuum === 2) {
        ctx.store.connection.pragma('wal_checkpoint(TRUNCATE)');
        ctx.store.connection.pragma('incremental_vacuum');
        print(brand(`reclaim: dropped ${dropped.length} table(s), free pages returned.`));
      } else {
        print(
          brand(
            `reclaim: dropped ${dropped.length} table(s); auto_vacuum is off for this database, so the file keeps its high-water size ('graphorin storage compact' explains the options).`,
          ),
        );
      }
    }
    const out: MemoryMigrateResult = {
      migrationId,
      status: 'committed',
      processed,
      reclaimedTables,
    };
    emitReport(options, out, () => {
      print(
        brand(
          `${statusMarker('ok')} migration ${out.migrationId} committed (processed=${out.processed}${out.reclaimedTables.length > 0 ? `, reclaimed=${out.reclaimedTables.length}` : ''}).`,
        ),
      );
    });
    return out;
  } finally {
    await ctx.close();
  }
}

// ---------------------------------------------------------------------------
// `graphorin memory inspect` / `graphorin memory activity` (X-3) - read-only
// introspection over the SQLite store: a fact's supersede chain, quarantine /
// provenance, the insights that cite it, the conflict decisions and audit
// trail it appears in, plus a store-wide activity view (what the consolidator
// / reflection formed, merged, and quarantined). All reads go through
// `store.connection` exactly like `memory status`'s count queries - no embedder
// or provider required, fully offline.
// ---------------------------------------------------------------------------

const FACT_INSPECT_COLUMNS =
  'id, text, status, provenance, importance, valid_from, valid_to, supersedes, superseded_by, created_at';

interface FactInspectRow {
  readonly id: string;
  readonly text: string;
  readonly status: string | null;
  readonly provenance: string | null;
  /** Per-fact salience hint (migration 015). */
  readonly importance: number | null;
  readonly valid_from: number | null;
  readonly valid_to: number | null;
  readonly supersedes: string | null;
  readonly superseded_by: string | null;
  readonly created_at: number;
}

/** @stable */
export interface MemoryInspectFact {
  readonly id: string;
  readonly text: string;
  readonly status: string;
  readonly provenance: string | null;
  /** Per-fact importance (salience hint), if set (migration 015). */
  readonly importance: number | null;
  readonly validFrom: string | null;
  readonly validTo: string | null;
  readonly supersedes: string | null;
  readonly supersededBy: string | null;
  readonly createdAt: string;
}

/**
 * A canonical entity a fact links to (migration 016). `name` follows
 * `merged_into` to the surviving entity, so a merged link shows its canonical.
 *
 * @stable
 */
export interface MemoryInspectEntity {
  readonly entityId: string;
  readonly name: string;
  readonly role: string;
  /** Set when the linked entity was merged into `entityId`/`name`. */
  readonly mergedFrom: string | null;
}

/** @stable */
export interface MemoryHistoryEntry {
  readonly event: string;
  readonly source: string;
  readonly createdAt: string;
}

/** @stable */
export interface MemoryConflictEntry {
  readonly candidateId: string;
  readonly existingId: string | null;
  readonly decision: string;
  readonly stage: string;
  readonly similarity: number | null;
  readonly detectedAt: string;
}

/** @stable */
export interface MemoryCitingInsight {
  readonly id: string;
  readonly text: string;
  readonly status: string;
  readonly salience: number;
}

/** @stable */
export interface MemoryInspectResult {
  readonly found: boolean;
  readonly fact: MemoryInspectFact | null;
  readonly chain: ReadonlyArray<MemoryInspectFact>;
  readonly history: ReadonlyArray<MemoryHistoryEntry>;
  readonly conflicts: ReadonlyArray<MemoryConflictEntry>;
  readonly citingInsights: ReadonlyArray<MemoryCitingInsight>;
  /** Canonical entities this fact links to (migration 016). */
  readonly linkedEntities: ReadonlyArray<MemoryInspectEntity>;
}

/** @stable */
export interface MemoryInspectOptions extends MemoryCommonOptions {
  readonly factId: string;
}

/**
 * `graphorin memory inspect <factId>` - surface everything the store
 * knows about one fact: its retrieval-trust status + provenance, the
 * full bi-temporal supersede chain it belongs to, the audit-log events
 * recorded against it, the conflict decisions that referenced it, and
 * the (quarantined) insights that cite it. Pure read-only inspection.
 *
 * @stable
 */
export async function runMemoryInspect(
  options: MemoryInspectOptions,
): Promise<MemoryInspectResult> {
  const ctx = await openStoreContext({
    // W-068: read-only command - never auto-migrate a live database.
    migrationPolicy: 'check',
    ...(options.config !== undefined ? { config: options.config } : {}),
  });
  try {
    const conn = ctx.store.connection;
    const factRow = conn.get<FactInspectRow>(
      `SELECT ${FACT_INSPECT_COLUMNS} FROM facts WHERE id = ?`,
      [options.factId],
    );
    const fact = factRow !== undefined ? toInspectFact(factRow) : null;
    const chain = factRow !== undefined ? readSupersedeChain(conn, options.factId) : [];
    const history = conn
      .all<{ event: string; source: string; created_at: number }>(
        'SELECT event, source, created_at FROM memory_history WHERE memory_id = ? ORDER BY created_at ASC, id ASC',
        [options.factId],
      )
      .map(
        (r): MemoryHistoryEntry =>
          Object.freeze({
            event: r.event,
            source: r.source,
            createdAt: epochToIso(r.created_at) ?? '',
          }),
      );
    const conflicts = conn
      .all<{
        candidate_id: string;
        existing_id: string | null;
        decision: string;
        stage: string;
        similarity: number | null;
        detected_at: number;
      }>(
        'SELECT candidate_id, existing_id, decision, stage, similarity, detected_at FROM fact_conflicts WHERE candidate_id = ? OR existing_id = ? ORDER BY id DESC',
        [options.factId, options.factId],
      )
      .map(
        (r): MemoryConflictEntry =>
          Object.freeze({
            candidateId: r.candidate_id,
            existingId: r.existing_id,
            decision: r.decision,
            stage: r.stage,
            similarity: r.similarity,
            detectedAt: epochToIso(r.detected_at) ?? '',
          }),
      );
    const citingInsights = conn
      .all<{ id: string; text: string; status: string; salience: number }>(
        'SELECT id, text, status, salience FROM insights WHERE deleted_at IS NULL AND cites_json LIKE ? ORDER BY salience DESC, created_at DESC',
        [`%"${options.factId}"%`],
      )
      .map(
        (r): MemoryCitingInsight =>
          Object.freeze({ id: r.id, text: r.text, status: r.status, salience: r.salience }),
      );

    // IP-22: a fact's canonical-entity links (migration 016). Each link is
    // followed through `entities.merged_into` so a link to a merged entity
    // shows its surviving canonical.
    const linkedEntities =
      fact === null
        ? []
        : conn
            .all<{ entity_id: string; name: string; role: string; merged_from: string | null }>(
              `SELECT canon.id AS entity_id, canon.name AS name, fe.role AS role,
                      CASE WHEN e.merged_into IS NULL THEN NULL ELSE e.id END AS merged_from
               FROM fact_entities fe
               JOIN entities e ON e.id = fe.entity_id
               JOIN entities canon ON canon.id = COALESCE(e.merged_into, e.id)
               WHERE fe.fact_id = ?
               ORDER BY fe.role, canon.name`,
              [options.factId],
            )
            .map(
              (r): MemoryInspectEntity =>
                Object.freeze({
                  entityId: r.entity_id,
                  name: r.name,
                  role: r.role,
                  mergedFrom: r.merged_from,
                }),
            );

    const out: MemoryInspectResult = Object.freeze({
      found: fact !== null,
      fact,
      chain: Object.freeze(chain),
      history: Object.freeze(history),
      conflicts: Object.freeze(conflicts),
      citingInsights: Object.freeze(citingInsights),
      linkedEntities: Object.freeze(linkedEntities),
    });

    emitReport(options, out, () => {
      const print = options.print ?? defaultPrintSink;
      print(brand(`memory inspect ${options.factId}`));
      if (out.fact === null) {
        print(`  ${statusMarker('fail')} fact not found`);
        return;
      }
      const f = out.fact;
      print(
        `  ${statusMarker(f.status === 'quarantined' ? 'warn' : 'ok')} status=${f.status} provenance=${f.provenance ?? 'user (first-party)'}`,
      );
      print(`  text: ${f.text}`);
      print(
        `  importance: ${f.importance !== null ? f.importance.toFixed(2) : '(unset - neutral salience)'}`,
      );
      print(`  valid: ${f.validFrom ?? 'open'} .. ${f.validTo ?? 'open'}`);
      if (out.linkedEntities.length > 0) {
        print(brand(`  linked entities (${out.linkedEntities.length}):`));
        for (const e of out.linkedEntities) {
          const merged = e.mergedFrom !== null ? ` (merged from ${e.mergedFrom})` : '';
          print(`    ${statusMarker('info')} ${e.role}: ${e.name} [${e.entityId}]${merged}`);
        }
      }
      if (out.chain.length > 1) {
        print(brand(`  supersede chain (${out.chain.length}, oldest -> newest):`));
        for (const c of out.chain) {
          const mark = c.id === options.factId ? '*' : '-';
          print(
            `    ${mark} ${c.id} [${c.status}] ${c.validFrom ?? 'open'} .. ${c.validTo ?? 'open'}`,
          );
        }
      }
      print(brand(`  audit history (${out.history.length}):`));
      for (const h of out.history) {
        print(`    ${statusMarker('info')} ${h.event} by ${h.source} @ ${h.createdAt}`);
      }
      print(brand(`  conflict decisions (${out.conflicts.length}):`));
      for (const c of out.conflicts) {
        const sim = c.similarity !== null ? ` sim=${c.similarity.toFixed(3)}` : '';
        print(
          `    ${c.decision}/${c.stage}${sim} ${c.candidateId} -> ${c.existingId ?? '-'} @ ${c.detectedAt}`,
        );
      }
      print(brand(`  citing insights (${out.citingInsights.length}):`));
      for (const i of out.citingInsights) {
        print(
          `    ${statusMarker(i.status === 'quarantined' ? 'warn' : 'ok')} ${i.id} (salience=${i.salience}, ${i.status}) ${i.text}`,
        );
      }
    });
    return out;
  } finally {
    await ctx.close();
  }
}

/** @stable */
export interface MemoryActivityEvent {
  readonly memoryKind: string;
  readonly memoryId: string;
  readonly event: string;
  readonly source: string;
  readonly createdAt: string;
}

/** @stable */
export interface MemoryActivityConflict {
  readonly candidateId: string;
  readonly existingId: string | null;
  readonly decision: string;
  readonly stage: string;
  readonly detectedAt: string;
}

/** @stable */
export interface MemoryActivityResult {
  readonly quarantine: {
    readonly facts: number;
    readonly episodes: number;
    readonly insights: number;
  };
  readonly recentHistory: ReadonlyArray<MemoryActivityEvent>;
  readonly recentConflicts: ReadonlyArray<MemoryActivityConflict>;
}

/** @stable */
export interface MemoryActivityOptions extends MemoryCommonOptions {
  /** Cap on the recent-history / recent-conflict rows returned. Default 20. */
  readonly limit?: number;
}

/**
 * `graphorin memory activity` - a store-wide view of what the
 * consolidator and reflection passes have been doing: how many facts /
 * episodes / insights currently sit in quarantine, the most recent
 * audit-log events (supersede / validate / quarantine / archive), and
 * the most recent conflict decisions. Pure read-only inspection.
 *
 * @stable
 */
export async function runMemoryActivity(
  options: MemoryActivityOptions = {},
): Promise<MemoryActivityResult> {
  const limit = Math.max(1, options.limit ?? 20);
  const ctx = await openStoreContext({
    // W-068: read-only command - never auto-migrate a live database.
    migrationPolicy: 'check',
    ...(options.config !== undefined ? { config: options.config } : {}),
  });
  try {
    const conn = ctx.store.connection;
    const quarantine = Object.freeze({
      facts: countQuarantined(conn, 'facts'),
      episodes: countQuarantined(conn, 'episodes'),
      insights: countQuarantined(conn, 'insights'),
    });
    const recentHistory = conn
      .all<{
        memory_kind: string;
        memory_id: string;
        event: string;
        source: string;
        created_at: number;
      }>(
        'SELECT memory_kind, memory_id, event, source, created_at FROM memory_history ORDER BY id DESC LIMIT ?',
        [limit],
      )
      .map(
        (r): MemoryActivityEvent =>
          Object.freeze({
            memoryKind: r.memory_kind,
            memoryId: r.memory_id,
            event: r.event,
            source: r.source,
            createdAt: epochToIso(r.created_at) ?? '',
          }),
      );
    const recentConflicts = conn
      .all<{
        candidate_id: string;
        existing_id: string | null;
        decision: string;
        stage: string;
        detected_at: number;
      }>(
        'SELECT candidate_id, existing_id, decision, stage, detected_at FROM fact_conflicts ORDER BY id DESC LIMIT ?',
        [limit],
      )
      .map(
        (r): MemoryActivityConflict =>
          Object.freeze({
            candidateId: r.candidate_id,
            existingId: r.existing_id,
            decision: r.decision,
            stage: r.stage,
            detectedAt: epochToIso(r.detected_at) ?? '',
          }),
      );

    const out: MemoryActivityResult = Object.freeze({
      quarantine,
      recentHistory: Object.freeze(recentHistory),
      recentConflicts: Object.freeze(recentConflicts),
    });

    emitReport(options, out, () => {
      const print = options.print ?? defaultPrintSink;
      print(brand('memory activity'));
      const q = out.quarantine;
      const qMarker =
        q.facts + q.episodes + q.insights > 0 ? statusMarker('warn') : statusMarker('ok');
      print(
        `  ${qMarker} quarantined: facts=${q.facts}, episodes=${q.episodes}, insights=${q.insights}`,
      );
      print(brand(`  recent history (${out.recentHistory.length}):`));
      for (const h of out.recentHistory) {
        print(
          `    ${statusMarker('info')} ${h.event} ${h.memoryKind}:${h.memoryId} by ${h.source} @ ${h.createdAt}`,
        );
      }
      print(brand(`  recent conflict decisions (${out.recentConflicts.length}):`));
      for (const c of out.recentConflicts) {
        print(
          `    ${c.decision}/${c.stage} ${c.candidateId} -> ${c.existingId ?? '-'} @ ${c.detectedAt}`,
        );
      }
    });
    return out;
  } finally {
    await ctx.close();
  }
}

// ---------------------------------------------------------------------------
// `graphorin memory why` (RP-17 / X-3) - "why was this recalled?" Decodes the
// `memory.search.semantic.explain` attribute the memory search records on each
// `memory.search.semantic` span (now durable via the RP-17 `spans` table) into
// the per-fact ranking signals (FTS bm25, vector similarity, fused RRF, decay).
// ---------------------------------------------------------------------------

/** A single decoded recall explanation surfaced by `graphorin memory why`. */
export interface MemoryWhyRecall {
  readonly spanId: string;
  /** Span start time (unix nanos) of the recall. */
  readonly at: number;
  readonly results: ReadonlyArray<{
    readonly id: string;
    readonly rank: number;
    readonly score: number;
    readonly signals: Readonly<Record<string, number>>;
  }>;
}

/** @stable */
export interface MemoryWhyResult {
  readonly recalls: ReadonlyArray<MemoryWhyRecall>;
}

/** @stable */
export interface MemoryWhyOptions extends MemoryCommonOptions {
  /** Restrict to one session's recall spans. */
  readonly sessionId?: string;
  /** Cap on the most-recent recall spans returned. Default 5. */
  readonly limit?: number;
}

interface SpanExplainRow {
  readonly span_id: string;
  readonly start_unix_nano: number;
  readonly attributes_json: string;
}

/**
 * `graphorin memory why` - explain why facts were recalled, by decoding the
 * `memory.search.semantic.explain` attribute off the persisted recall spans.
 * Pure read-only inspection; requires the SQLite span exporter to have recorded
 * spans. Empty when nothing was recorded.
 *
 * @stable
 */
export async function runMemoryWhy(options: MemoryWhyOptions): Promise<MemoryWhyResult> {
  const ctx = await openStoreContext({
    // MEMORY-CL-01 / W-068: read-only command - never auto-migrate a live
    // database (matches inspect/activity; a newer CLI must not silently
    // upgrade a schema owned by a running older server).
    migrationPolicy: 'check',
    ...(options.config !== undefined ? { config: options.config } : {}),
  });
  try {
    const conn = ctx.store.connection;
    const limit = options.limit ?? 5;
    const rows =
      options.sessionId !== undefined
        ? conn.all<SpanExplainRow>(
            `SELECT span_id, start_unix_nano, attributes_json FROM spans
             WHERE type = 'memory.search.semantic' AND session_id = ?
             ORDER BY start_unix_nano DESC LIMIT ?`,
            [options.sessionId, limit],
          )
        : conn.all<SpanExplainRow>(
            `SELECT span_id, start_unix_nano, attributes_json FROM spans
             WHERE type = 'memory.search.semantic'
             ORDER BY start_unix_nano DESC LIMIT ?`,
            [limit],
          );
    const recalls = rows.map((r): MemoryWhyRecall => {
      let results: MemoryWhyRecall['results'] = [];
      try {
        const attrs = JSON.parse(r.attributes_json) as Record<string, unknown>;
        const raw = attrs['memory.search.semantic.explain'];
        const parsed: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (Array.isArray(parsed)) {
          results = Object.freeze(parsed) as MemoryWhyRecall['results'];
        }
      } catch {
        // Malformed attribute payload - surface an empty recall, not a throw.
      }
      return Object.freeze({ spanId: r.span_id, at: r.start_unix_nano, results });
    });
    const out: MemoryWhyResult = Object.freeze({ recalls: Object.freeze(recalls) });
    emitReport(options, out, () => {
      const print = options.print ?? defaultPrintSink;
      print(brand('memory why'));
      if (recalls.length === 0) {
        print(
          `  ${statusMarker('info')} no recorded memory.search.semantic spans ` +
            `(wire createSqliteSpanExporter into the tracer to record recall explanations)`,
        );
        return;
      }
      for (const rc of recalls) {
        print(brand(`  recall @ ${rc.at} (span ${rc.spanId}):`));
        for (const item of rc.results) {
          const signals = Object.entries(item.signals)
            .map(([k, v]) => `${k}=${v.toFixed(3)}`)
            .join(', ');
          print(
            `    ${statusMarker('info')} #${item.rank} ${item.id} ` +
              `score=${item.score.toFixed(3)} [${signals}]`,
          );
        }
      }
    });
    return out;
  } finally {
    await ctx.close();
  }
}

// ---------------------------------------------------------------------------
// `graphorin memory review` (MCON-2) - list what the consolidator left in
// quarantine across every tier, and promote a reviewed item out of it. The
// promote path runs through the tier's `validate(...)`, so an injection-flagged
// memory is refused unless the operator passes `--force` after review.
// ---------------------------------------------------------------------------

/** A single quarantined memory row surfaced by `graphorin memory review`. */
export interface MemoryReviewItem {
  readonly id: string;
  readonly text: string;
  readonly provenance: string | null;
}

/** @stable */
export interface MemoryReviewResult {
  /** Set when `--promote <id>` succeeded. */
  readonly promoted?: { readonly id: string; readonly type: string };
  /**
   * Set when a `--promote <id>` request failed. Carried on the
   * payload so `--json` consumers receive a structured failure on stdout
   * instead of an empty document; the process exit code is the machine signal.
   */
  readonly error?: { readonly code: string; readonly message: string };
  readonly facts: ReadonlyArray<MemoryReviewItem>;
  readonly episodes: ReadonlyArray<MemoryReviewItem>;
  readonly insights: ReadonlyArray<MemoryReviewItem>;
  readonly procedures: ReadonlyArray<MemoryReviewItem>;
}

/** @stable */
export interface MemoryReviewOptions extends MemoryCommonOptions {
  /** Cap on the rows listed per type. Default 20. */
  readonly limit?: number;
  /** Promote this id out of quarantine instead of listing. */
  readonly promote?: string;
  /** Audit reason recorded with the promotion. */
  readonly reason?: string;
  /** Override the injection-refusal gate (operator action, after review). */
  readonly force?: boolean;
}

const EMPTY_REVIEW: MemoryReviewResult = Object.freeze({
  facts: Object.freeze([]),
  episodes: Object.freeze([]),
  insights: Object.freeze([]),
  procedures: Object.freeze([]),
});

/**
 * `graphorin memory review` - list the facts / episodes / insights / induced
 * procedures the consolidator left in quarantine (read-only), or promote a
 * reviewed item out of quarantine with `--promote <id>`. The promote path runs
 * through the tier `validate(...)`, so an injection-flagged memory is refused
 * unless `--force` is supplied after review.
 *
 * @stable
 */
export async function runMemoryReview(
  options: MemoryReviewOptions = {},
): Promise<MemoryReviewResult> {
  const limit = Math.max(1, options.limit ?? 20);
  const ctx = await openStoreContext({
    // MEMORY-CL-01 / W-068: the listing path is read-only and must not
    // auto-migrate a live database. `--promote` is an explicit write and
    // keeps the default (migrate) policy since it needs the current schema.
    ...(options.promote === undefined ? { migrationPolicy: 'check' as const } : {}),
    ...(options.config !== undefined ? { config: options.config } : {}),
  });
  try {
    const conn = ctx.store.connection;
    const print = options.print ?? defaultPrintSink;

    if (options.promote !== undefined) {
      const located = locateQuarantined(conn, options.promote);
      if (located === null) {
        // MEMORY-CL-02: set the exit code before emitReport (W-002) and route
        // the failure through emitReport so `--json` gets a structured error on
        // stdout instead of nothing.
        process.exitCode = EXIT_CODES.RECOVERABLE_FAILURE;
        const out: MemoryReviewResult = Object.freeze({
          ...EMPTY_REVIEW,
          error: Object.freeze({
            code: 'not-quarantined',
            message: `'${options.promote}' is not a quarantined memory.`,
          }),
        });
        emitReport(options, out, () => {
          print(`${statusMarker('warn')} '${options.promote}' is not a quarantined memory.`);
        });
        return out;
      }
      const memory = createMemory({ store: ctx.store.memory, embeddings: ctx.store.embeddings });
      const scope = { userId: located.userId };
      const validateOpts = options.force === true ? ({ force: true } as const) : undefined;
      try {
        await promoteByType(
          memory,
          located.type,
          scope,
          options.promote,
          options.reason,
          validateOpts,
        );
      } catch (err) {
        if (err instanceof Error && err.name === 'QuarantinePromotionRefusedError') {
          // MEMORY-CL-02: same structured-failure contract as the not-found path.
          process.exitCode = EXIT_CODES.RECOVERABLE_FAILURE;
          const out: MemoryReviewResult = Object.freeze({
            ...EMPTY_REVIEW,
            error: Object.freeze({
              code: 'injection-refused',
              message: `'${options.promote}' trips the injection heuristics; re-run with --force from a trusted operator context.`,
            }),
          });
          emitReport(options, out, () => {
            print(
              `${statusMarker('warn')} refused: '${options.promote}' trips the injection heuristics.`,
            );
            print('  Review it, then re-run with --force from a trusted operator context.');
          });
          return out;
        }
        throw err;
      }
      const out: MemoryReviewResult = Object.freeze({
        ...EMPTY_REVIEW,
        promoted: Object.freeze({ id: options.promote, type: located.type }),
      });
      emitReport(options, out, () => {
        print(
          `${statusMarker('ok')} promoted ${located.type} ${options.promote} out of quarantine.`,
        );
      });
      return out;
    }

    const out: MemoryReviewResult = Object.freeze({
      facts: listQuarantined(conn, 'facts', 'text', limit),
      episodes: listQuarantined(conn, 'episodes', 'summary', limit),
      insights: listQuarantined(conn, 'insights', 'text', limit),
      procedures: listQuarantined(conn, 'rules', 'text', limit),
    });
    emitReport(options, out, () => {
      print(brand('memory review - quarantined'));
      printReviewItems(print, 'facts', out.facts);
      printReviewItems(print, 'episodes', out.episodes);
      printReviewItems(print, 'insights', out.insights);
      printReviewItems(print, 'procedures', out.procedures);
      const total =
        out.facts.length + out.episodes.length + out.insights.length + out.procedures.length;
      if (total === 0) {
        print(`  ${statusMarker('ok')} nothing in quarantine.`);
      } else {
        print('  promote with: graphorin memory review --promote <id> [--reason <text>] [--force]');
      }
    });
    return out;
  } finally {
    await ctx.close();
  }
}

function printReviewItems(
  print: (line: string) => void,
  label: string,
  items: ReadonlyArray<MemoryReviewItem>,
): void {
  print(brand(`  ${label} (${items.length}):`));
  for (const item of items) {
    const snippet = item.text.length > 80 ? `${item.text.slice(0, 77)}...` : item.text;
    const prov = item.provenance !== null ? ` [${item.provenance}]` : '';
    print(`    ${statusMarker('warn')} ${item.id}${prov} ${snippet}`);
  }
}

function listQuarantined(
  conn: { all<T>(q: string, p?: ReadonlyArray<unknown>): T[] },
  table: 'facts' | 'episodes' | 'insights' | 'rules',
  textColumn: 'text' | 'summary',
  limit: number,
): ReadonlyArray<MemoryReviewItem> {
  const rows = conn.all<{ id: string; text: string; provenance: string | null }>(
    `SELECT id, ${textColumn} AS text, provenance FROM ${table} WHERE status = 'quarantined' AND deleted_at IS NULL ORDER BY created_at DESC LIMIT ?`,
    [limit],
  );
  return Object.freeze(
    rows.map((r) => Object.freeze({ id: r.id, text: r.text, provenance: r.provenance ?? null })),
  );
}

type QuarantineType = 'fact' | 'episode' | 'insight' | 'rule';

function locateQuarantined(
  conn: { get<T>(q: string, p?: ReadonlyArray<unknown>): T | undefined },
  id: string,
): { type: QuarantineType; userId: string } | null {
  const tables: ReadonlyArray<{ table: string; type: QuarantineType }> = [
    { table: 'facts', type: 'fact' },
    { table: 'episodes', type: 'episode' },
    { table: 'insights', type: 'insight' },
    { table: 'rules', type: 'rule' },
  ];
  for (const { table, type } of tables) {
    const row = conn.get<{ uid: string }>(
      `SELECT scope_user_id AS uid FROM ${table} WHERE id = ? AND status = 'quarantined' AND deleted_at IS NULL`,
      [id],
    );
    if (row !== undefined) return { type, userId: row.uid };
  }
  return null;
}

async function promoteByType(
  memory: ReturnType<typeof createMemory>,
  type: QuarantineType,
  scope: { userId: string },
  id: string,
  reason: string | undefined,
  opts: { readonly force: true } | undefined,
): Promise<void> {
  switch (type) {
    case 'fact':
      return memory.semantic.validate(scope, id, reason, opts);
    case 'episode':
      return memory.episodic.validate(scope, id, reason, opts);
    case 'insight':
      return memory.insights.validate(scope, id, reason, opts);
    case 'rule':
      return memory.procedural.validate(scope, id, reason, opts);
  }
}

/** Walk the bi-temporal supersede chain `factId` belongs to, oldest -> newest. */
function readSupersedeChain(
  conn: {
    get<T>(q: string, p?: ReadonlyArray<unknown>): T | undefined;
    all<T>(q: string, p?: ReadonlyArray<unknown>): T[];
  },
  factId: string,
): MemoryInspectFact[] {
  const seen = new Set<string>();
  const queue: string[] = [factId];
  const rows: FactInspectRow[] = [];
  while (queue.length > 0) {
    const id = queue.shift();
    if (id === undefined || seen.has(id)) continue;
    seen.add(id);
    const row = conn.get<FactInspectRow>(`SELECT ${FACT_INSPECT_COLUMNS} FROM facts WHERE id = ?`, [
      id,
    ]);
    if (row === undefined) continue;
    rows.push(row);
    if (row.supersedes !== null) queue.push(row.supersedes);
    if (row.superseded_by !== null) queue.push(row.superseded_by);
    for (const linked of conn.all<{ id: string }>(
      'SELECT id FROM facts WHERE supersedes = ? OR superseded_by = ?',
      [id, id],
    )) {
      queue.push(linked.id);
    }
  }
  rows.sort((a, b) => (a.valid_from ?? a.created_at) - (b.valid_from ?? b.created_at));
  return rows.map(toInspectFact);
}

function toInspectFact(row: FactInspectRow): MemoryInspectFact {
  return Object.freeze({
    id: row.id,
    text: row.text,
    status: row.status ?? 'active',
    provenance: row.provenance,
    importance: row.importance,
    validFrom: epochToIso(row.valid_from),
    validTo: epochToIso(row.valid_to),
    supersedes: row.supersedes,
    supersededBy: row.superseded_by,
    createdAt: epochToIso(row.created_at) ?? new Date(0).toISOString(),
  });
}

function countQuarantined(
  conn: { get<T>(q: string, p?: ReadonlyArray<unknown>): T | undefined },
  table: string,
): number {
  try {
    const row = conn.get<{ n: number }>(
      `SELECT COUNT(*) AS n FROM ${table} WHERE status = 'quarantined' AND deleted_at IS NULL`,
    );
    return typeof row?.n === 'number' ? row.n : 0;
  } catch {
    return 0;
  }
}

function epochToIso(epoch: number | null | undefined): string | null {
  if (epoch === null || epoch === undefined) return null;
  return new Date(epoch).toISOString();
}

async function readMemoryCounts(
  store: Awaited<ReturnType<typeof openStoreContext>>['store'],
): Promise<MemoryStatusResult['counts']> {
  const conn = store.connection;
  return Object.freeze({
    facts: countTable(conn, 'facts'),
    episodes: countTable(conn, 'episodes'),
    sessionMessages: countTable(conn, 'session_messages'),
    procedures: countTable(conn, 'rules'),
  });
}

function countTable(
  conn: { readonly get: <T = unknown>(query: string) => T | undefined },
  table: string,
): number {
  try {
    const row = conn.get<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}`);
    return typeof row?.n === 'number' ? row.n : 0;
  } catch {
    return 0;
  }
}

/** @stable */
export interface MemoryPruneHistoryOptions extends MemoryCommonOptions {
  /**
   * Age threshold: a duration (`'30d'`, `'12h'`, `'45m'`, `'30s'`) or
   * an ISO date / `YYYY-MM-DD` strictly in the past. Mandatory - the
   * command is destructive by design and must never default.
   */
  readonly olderThan: string;
}

/** @stable */
export interface MemoryPruneHistoryResult {
  readonly deleted: number;
  /** The resolved AGE in milliseconds passed to `pruneHistory`. */
  readonly olderThanMs: number;
}

/**
 * `graphorin memory prune-history --older-than <duration|date>`
 * - the supported surface over `MemoryStoreExt.pruneHistory`.
 * `memory_history` grows by design (every supersede / quarantine
 * transition appends) and `purge()` already scrubs sensitive text;
 * this is the storage-cost hygiene lever.
 *
 * @stable
 */
export async function runMemoryPruneHistory(
  options: MemoryPruneHistoryOptions,
): Promise<MemoryPruneHistoryResult> {
  const olderThanMs = resolveOlderThanMs(options.olderThan);
  const ctx = await openStoreContext({
    ...(options.config !== undefined ? { config: options.config } : {}),
  });
  try {
    // UNIT SEMANTICS: pruneHistory takes an AGE in ms (the store
    // computes `cutoff = now - age`). An ISO date therefore converts
    // as `now - date`, NEVER as the raw epoch value - passing an epoch
    // here would be a silent near-no-op.
    const deleted = await ctx.store.memory.pruneHistory(olderThanMs);
    const out: MemoryPruneHistoryResult = Object.freeze({ deleted, olderThanMs });
    emitReport(options, out, () => {
      const print = options.print ?? defaultPrintSink;
      print(
        brand(
          `pruned ${deleted} memory_history row(s) older than ${options.olderThan} (age ${olderThanMs} ms).`,
        ),
      );
    });
    return out;
  } finally {
    await ctx.close();
  }
}

/** Resolve `--older-than` into an AGE in ms; fail fast on nonsense. */
function resolveOlderThanMs(input: string): number {
  const raw = input.trim();
  const duration = /^(\d+)\s*([smhd])$/i.exec(raw);
  if (duration !== null) {
    const value = Number.parseInt(duration[1] as string, 10);
    switch ((duration[2] as string).toLowerCase()) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60_000;
      case 'h':
        return value * 3_600_000;
      default:
        return value * 86_400_000;
    }
  }
  const date = new Date(raw);
  if (!Number.isNaN(date.getTime())) {
    const age = Date.now() - date.getTime();
    if (age <= 0) {
      throw new Error(
        `[graphorin/cli] --older-than '${input}' is not in the past - refusing (a future date would prune the entire history).`,
      );
    }
    return age;
  }
  throw new Error(
    `[graphorin/cli] invalid --older-than '${input}'. Use '<number><s|m|h|d>' (e.g. 30d) or a past ISO date.`,
  );
}
