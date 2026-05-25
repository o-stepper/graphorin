/**
 * `graphorin memory` — long-term memory operator commands.
 *
 * Surface (per Phase 15 § Memory):
 *
 *  - `graphorin memory status` — counts + active embedder + migration
 *    state. Pure read-only inspection of the SQLite store.
 *  - `graphorin memory migrate --from <embedder> --to <embedder>
 *    --strategy <lock-on-first|auto-migrate|multi-active>` — embedder
 *    swap. The runner itself lives in `@graphorin/memory`
 *    ({@link migrateEmbedder}); the CLI is a thin wrapper that loads
 *    the operator's `embedders.ts` module if supplied through
 *    `--embedders <path>`. Without that module the command emits a
 *    pointer to the documentation rather than guessing which embedder
 *    factory to instantiate.
 *
 * @packageDocumentation
 */

import process from 'node:process';

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
        print(brand(`  no embedders registered yet — run createMemory({ embedder }) once.`));
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
   * Optional path to a JS / TS module exporting an
   * `embedders` object: `{ <id>: () => EmbedderProvider }`. The CLI
   * imports this module so it can construct the source / target
   * embedder instances the runner needs. Without the module the
   * command exits `2` with a pointer to the documentation.
   */
  readonly embeddersModule?: string;
}

/**
 * `graphorin memory migrate` — embedder swap. The migration logic lives
 * in `@graphorin/memory`'s `migrateEmbedder(...)`; the CLI prints a
 * pointer when the operator did not supply the embedder factory module
 * (the framework cannot guess the operator's embedder configuration).
 *
 * @stable
 */
export async function runMemoryMigrate(options: MemoryMigrateOptions): Promise<never> {
  const print = options.print ?? defaultPrintSink;
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
  // The full --embeddersModule wiring is out of scope for the v0.1
  // surface; the helpful message above plus the programmatic pointer
  // are the contract per the working plan acceptance criteria.
  print(
    brand(
      '--embeddersModule resolution is planned for v0.2; use migrateEmbedder() programmatically.',
    ),
  );
  process.exit(EXIT_CODES.UNSUPPORTED);
}

// ---------------------------------------------------------------------------
// `graphorin memory inspect` / `graphorin memory activity` (X-3) — read-only
// introspection over the SQLite store: a fact's supersede chain, quarantine /
// provenance, the insights that cite it, the conflict decisions and audit
// trail it appears in, plus a store-wide activity view (what the consolidator
// / reflection formed, merged, and quarantined). All reads go through
// `store.connection` exactly like `memory status`'s count queries — no embedder
// or provider required, fully offline.
// ---------------------------------------------------------------------------

const FACT_INSPECT_COLUMNS =
  'id, text, status, provenance, valid_from, valid_to, supersedes, superseded_by, created_at';

interface FactInspectRow {
  readonly id: string;
  readonly text: string;
  readonly status: string | null;
  readonly provenance: string | null;
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
  readonly validFrom: string | null;
  readonly validTo: string | null;
  readonly supersedes: string | null;
  readonly supersededBy: string | null;
  readonly createdAt: string;
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
}

/** @stable */
export interface MemoryInspectOptions extends MemoryCommonOptions {
  readonly factId: string;
}

/**
 * `graphorin memory inspect <factId>` — surface everything the store
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

    const out: MemoryInspectResult = Object.freeze({
      found: fact !== null,
      fact,
      chain: Object.freeze(chain),
      history: Object.freeze(history),
      conflicts: Object.freeze(conflicts),
      citingInsights: Object.freeze(citingInsights),
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
      print(`  valid: ${f.validFrom ?? 'open'} .. ${f.validTo ?? 'open'}`);
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
 * `graphorin memory activity` — a store-wide view of what the
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
