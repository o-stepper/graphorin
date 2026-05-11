/**
 * `graphorin traces` — operate on the local trace cache.
 *
 * Surface (per Phase 15 § Traces):
 *
 *  - `graphorin traces status` — count rows + report TTL config.
 *  - `graphorin traces prune [--before <date>]` — manual TTL
 *    enforcement.
 *
 * The trace cache lives in the SQLite store under the `traces` table
 * (registered in Phase 04). This command is read + delete only — the
 * trace producer is the running `@graphorin/observability` exporter.
 *
 * @packageDocumentation
 */

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

/** @stable */
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
    const exists = tableExists(conn, 'traces');
    let out: TracesStatusResult;
    if (exists) {
      const oldest = pickIso(conn, 'SELECT MIN(started_at) AS started_at FROM traces');
      const newest = pickIso(conn, 'SELECT MAX(started_at) AS started_at FROM traces');
      out = Object.freeze({
        tableExists: true,
        rows: numericCount(conn, 'SELECT COUNT(*) AS n FROM traces'),
        ...(oldest !== undefined ? { oldestStartedAt: oldest } : {}),
        ...(newest !== undefined ? { newestStartedAt: newest } : {}),
      });
    } else {
      out = Object.freeze({ tableExists: false, rows: 0 });
    }
    emitReport(options, out, () => {
      const print = options.print ?? defaultPrintSink;
      if (!out.tableExists) {
        print(
          brand('traces table not found — the observability exporter has not initialized it yet.'),
        );
        return;
      }
      print(
        brand(
          `traces: ${out.rows} row(s) (oldest=${out.oldestStartedAt ?? '-'}, newest=${out.newestStartedAt ?? '-'})`,
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

/** @stable */
export async function runTracesPrune(options: TracesPruneOptions): Promise<TracesPruneResult> {
  const cutoffMs = parseCutoff(options.before);
  const ctx = await openStoreContext({
    ...(options.config !== undefined ? { config: options.config } : {}),
  });
  try {
    if (!tableExists(ctx.store.connection, 'traces')) {
      const out: TracesPruneResult = Object.freeze({
        removed: 0,
        cutoff: new Date(cutoffMs).toISOString(),
      });
      emitReport(options, out, () => {
        const print = options.print ?? defaultPrintSink;
        print(brand(`traces table not found; nothing to prune.`));
      });
      return out;
    }
    const result = ctx.store.connection.run('DELETE FROM traces WHERE started_at < ?', [cutoffMs]);
    const out: TracesPruneResult = Object.freeze({
      removed: result.changes,
      cutoff: new Date(cutoffMs).toISOString(),
    });
    emitReport(options, out, () => {
      const print = options.print ?? defaultPrintSink;
      const mark = out.removed > 0 ? statusMarker('ok') : statusMarker('info');
      print(brand(`${mark} pruned ${out.removed} trace row(s) (cutoff=${out.cutoff}).`));
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
  const row = conn.get<{ started_at: number | null }>(sql);
  if (row === undefined || row.started_at === null) return undefined;
  return new Date(row.started_at).toISOString();
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
