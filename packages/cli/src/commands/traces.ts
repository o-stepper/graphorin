/**
 * `graphorin traces` - operate on persisted spans.
 *
 * Surface (per Phase 15 § Traces):
 *
 *  - `graphorin traces status` - count spans + report time range.
 *  - `graphorin traces prune --before <date>` - manual retention
 *    enforcement.
 *
 * W-007: the spans live in the `spans` table (migration 024, written by
 * the `createSqliteSpanExporter` from `@graphorin/store-sqlite`). The
 * command previously targeted a `traces` table that no migration or
 * runtime ever created, making it a permanent no-op - an operator who
 * put `traces prune` in cron believed retention was handled while
 * `spans` grew without bound. This command is read + delete only; the
 * span producer is the running observability exporter.
 *
 * @packageDocumentation
 */

import { pruneSpans } from '@graphorin/store-sqlite';
import {
  brand,
  type CommonOutputOptions,
  defaultPrintSink,
  emitReport,
  statusMarker,
} from '../internal/output.js';
import { openStoreContext } from '../internal/store-context.js';

/** @stable */
export interface TracesCommonOptions extends CommonOutputOptions {
  readonly config?: string;
}

/**
 * Field names predate the spans retarget (they said `StartedAt` when the
 * command aimed at the phantom `traces` table) and are kept for JSON
 * output stability; values now come from `spans.start_unix_nano`.
 *
 * @stable
 */
export interface TracesStatusResult {
  readonly tableExists: boolean;
  readonly rows: number;
  readonly oldestStartedAt?: string;
  readonly newestStartedAt?: string;
}

/** @stable */
export async function runTracesStatus(
  options: TracesCommonOptions = {},
): Promise<TracesStatusResult> {
  const ctx = await openStoreContext({
    ...(options.config !== undefined ? { config: options.config } : {}),
  });
  try {
    const conn = ctx.store.connection;
    // After init() the migrations guarantee the table; the guard stays
    // for databases opened without init.
    const exists = tableExists(conn, 'spans');
    let out: TracesStatusResult;
    if (exists) {
      const oldest = pickIso(conn, 'SELECT MIN(start_unix_nano) AS nano FROM spans');
      const newest = pickIso(conn, 'SELECT MAX(start_unix_nano) AS nano FROM spans');
      out = Object.freeze({
        tableExists: true,
        rows: numericCount(conn, 'SELECT COUNT(*) AS n FROM spans'),
        ...(oldest !== undefined ? { oldestStartedAt: oldest } : {}),
        ...(newest !== undefined ? { newestStartedAt: newest } : {}),
      });
    } else {
      out = Object.freeze({ tableExists: false, rows: 0 });
    }
    emitReport(options, out, () => {
      const print = options.print ?? defaultPrintSink;
      if (!out.tableExists) {
        print(brand('spans table not found - run `graphorin migrate` to initialize the schema.'));
        return;
      }
      print(
        brand(
          `spans: ${out.rows} row(s) (oldest=${out.oldestStartedAt ?? '-'}, newest=${out.newestStartedAt ?? '-'})`,
        ),
      );
    });
    return out;
  } finally {
    await ctx.close();
  }
}

/** @stable */
export interface TracesPruneOptions extends TracesCommonOptions {
  /** ISO date / epoch ms cutoff. Required so the helper never silently
   * empties the table. */
  readonly before: string;
}

/** @stable */
export interface TracesPruneResult {
  readonly removed: number;
  readonly cutoff: string;
}

/**
 * Delete spans that FINISHED before the cutoff (see `pruneSpans` in
 * `@graphorin/store-sqlite` - the ms-to-ns conversion and the strict
 * `<` boundary live there, backed by the `idx_spans_end` index).
 *
 * @stable
 */
export async function runTracesPrune(options: TracesPruneOptions): Promise<TracesPruneResult> {
  const cutoffMs = parseCutoff(options.before);
  const ctx = await openStoreContext({
    ...(options.config !== undefined ? { config: options.config } : {}),
  });
  try {
    if (!tableExists(ctx.store.connection, 'spans')) {
      const out: TracesPruneResult = Object.freeze({
        removed: 0,
        cutoff: new Date(cutoffMs).toISOString(),
      });
      emitReport(options, out, () => {
        const print = options.print ?? defaultPrintSink;
        print(brand(`spans table not found; nothing to prune.`));
      });
      return out;
    }
    const removed = pruneSpans(ctx.store.connection, { beforeEpochMs: cutoffMs });
    const out: TracesPruneResult = Object.freeze({
      removed,
      cutoff: new Date(cutoffMs).toISOString(),
    });
    emitReport(options, out, () => {
      const print = options.print ?? defaultPrintSink;
      const mark = out.removed > 0 ? statusMarker('ok') : statusMarker('info');
      print(brand(`${mark} pruned ${out.removed} span row(s) (cutoff=${out.cutoff}).`));
    });
    return out;
  } finally {
    await ctx.close();
  }
}

function tableExists(
  conn: { get: <T = unknown>(s: string, p?: ReadonlyArray<unknown>) => T | undefined },
  name: string,
): boolean {
  const row = conn.get<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
    [name],
  );
  return row !== undefined;
}

function numericCount(
  conn: { get: <T = unknown>(s: string) => T | undefined },
  sql: string,
): number {
  const row = conn.get<{ n: number }>(sql);
  return typeof row?.n === 'number' ? row.n : 0;
}

function pickIso(
  conn: { get: <T = unknown>(s: string) => T | undefined },
  sql: string,
): string | undefined {
  const row = conn.get<{ nano: number | null }>(sql);
  if (row === undefined || row.nano === null) return undefined;
  return new Date(Math.floor(row.nano / 1e6)).toISOString();
}

function parseCutoff(input: string): number {
  const numeric = Number(input);
  if (Number.isFinite(numeric) && numeric > 0) return numeric;
  const ms = Date.parse(input);
  if (!Number.isFinite(ms)) {
    throw new Error(
      `[graphorin/cli] --before '${input}' is not a valid ISO date or epoch-ms value.`,
    );
  }
  return ms;
}
