/**
 * `graphorin consolidator` — inspect and steer the background memory
 * consolidation pipeline.
 *
 * Surface (per Phase 15 § Consolidator):
 *
 *  - `graphorin consolidator status` — current tier + pending CONFLICT-
 *    CHECK runs + DLQ size + recent run history.
 *  - `graphorin consolidator set-tier <free|cheap|standard|enterprise>`
 *    — persist the requested tier so the next process startup picks it
 *    up.
 *  - `graphorin consolidator stop` — pause the consolidator until the
 *    operator resumes it (next `graphorin start`).
 *
 * The consolidator runs **inside** the server process, so the CLI
 * cannot direct-control a live in-memory instance from a different
 * process. Instead, the CLI reads the SQLite tables that the running
 * consolidator writes to (`consolidator_state`, `consolidator_runs`,
 * `consolidator_failed_batches`) and persists the tier override into a
 * lightweight `consolidator_admin` table the running daemon polls at
 * its next scheduled iteration.
 *
 * @packageDocumentation
 */

import type { ConsolidatorTier } from '@graphorin/memory';

import { EXIT_CODES } from '../internal/exit.js';
import {
  brand,
  type CommonOutputOptions,
  defaultPrintSink,
  emitReport,
  statusMarker,
} from '../internal/output.js';
import { openStoreContext } from '../internal/store-context.js';

const VALID_TIERS: ReadonlyArray<ConsolidatorTier> = Object.freeze([
  'free',
  'cheap',
  'standard',
  'full',
  'custom',
] as const);

/** @stable */
export interface ConsolidatorCommonOptions extends CommonOutputOptions {
  readonly config?: string;
}

/** @stable */
export interface ConsolidatorStatusResult {
  readonly tierHint?: ConsolidatorTier;
  readonly recentRuns: number;
  readonly successfulRuns: number;
  readonly failedRuns: number;
  readonly dlqSize: number;
  readonly pendingConflicts: number;
  readonly lastRunAt?: string;
  readonly lastRunStatus?: string;
}

/** @stable */
export async function runConsolidatorStatus(
  options: ConsolidatorCommonOptions = {},
): Promise<ConsolidatorStatusResult> {
  const ctx = await openStoreContext({
    ...(options.config !== undefined ? { config: options.config } : {}),
  });
  try {
    ensureAdminTable(ctx.store.connection);
    const conn = ctx.store.connection;
    const recent = conn.get<{ n: number }>(
      'SELECT COUNT(*) AS n FROM consolidator_runs WHERE started_at > ?',
      [Date.now() - 24 * 60 * 60_000],
    );
    const success = conn.get<{ n: number }>(
      "SELECT COUNT(*) AS n FROM consolidator_runs WHERE status = 'success' AND started_at > ?",
      [Date.now() - 24 * 60 * 60_000],
    );
    const failed = conn.get<{ n: number }>(
      "SELECT COUNT(*) AS n FROM consolidator_runs WHERE status = 'error' AND started_at > ?",
      [Date.now() - 24 * 60 * 60_000],
    );
    const dlq = conn.get<{ n: number }>('SELECT COUNT(*) AS n FROM consolidator_failed_batches');
    const pending = conn.get<{ n: number }>(
      "SELECT COUNT(*) AS n FROM consolidator_runs WHERE status = 'pending'",
    );
    const last = conn.get<{ started_at: number; status: string }>(
      'SELECT started_at, status FROM consolidator_runs ORDER BY started_at DESC LIMIT 1',
    );
    const tierRow = conn.get<{ tier: string }>(
      "SELECT value AS tier FROM consolidator_admin WHERE key = 'tier' LIMIT 1",
    );
    const out: ConsolidatorStatusResult = Object.freeze({
      ...(tierRow !== undefined && isTier(tierRow.tier) ? { tierHint: tierRow.tier } : {}),
      recentRuns: recent?.n ?? 0,
      successfulRuns: success?.n ?? 0,
      failedRuns: failed?.n ?? 0,
      dlqSize: dlq?.n ?? 0,
      pendingConflicts: pending?.n ?? 0,
      ...(last !== undefined ? { lastRunAt: new Date(last.started_at).toISOString() } : {}),
      ...(last !== undefined ? { lastRunStatus: last.status } : {}),
    });
    emitReport(options, out, () => {
      const print = options.print ?? defaultPrintSink;
      const tier = out.tierHint ?? '<from running config>';
      print(brand(`consolidator status (tier hint: ${tier})`));
      print(
        `  ${statusMarker('ok')} runs in last 24h: ${out.recentRuns} (${out.successfulRuns} success, ${out.failedRuns} error)`,
      );
      print(`  ${statusMarker(out.dlqSize > 0 ? 'warn' : 'ok')} dead-letter queue: ${out.dlqSize}`);
      print(
        `  ${statusMarker(out.pendingConflicts > 0 ? 'warn' : 'ok')} pending CONFLICT-CHECK runs: ${out.pendingConflicts}`,
      );
      if (out.lastRunAt !== undefined) {
        print(`  last run: ${out.lastRunAt} (${out.lastRunStatus})`);
      }
    });
    return out;
  } finally {
    await ctx.close();
  }
}

/** @stable */
export interface ConsolidatorSetTierOptions extends ConsolidatorCommonOptions {
  readonly tier: ConsolidatorTier;
}

/** @stable */
export async function runConsolidatorSetTier(
  options: ConsolidatorSetTierOptions,
): Promise<{ readonly tier: ConsolidatorTier }> {
  if (!isTier(options.tier)) {
    throw new Error(
      `[graphorin/cli] invalid tier '${String(options.tier)}'. Allowed: ${VALID_TIERS.join(' | ')}.`,
    );
  }
  const ctx = await openStoreContext({
    ...(options.config !== undefined ? { config: options.config } : {}),
  });
  try {
    ensureAdminTable(ctx.store.connection);
    ctx.store.connection.run(
      `INSERT INTO consolidator_admin (key, value, updated_at) VALUES ('tier', ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      [options.tier, Date.now()],
    );
    const result = { tier: options.tier } as const;
    emitReport(options, result, () => {
      const print = options.print ?? defaultPrintSink;
      print(brand(`consolidator tier hint persisted: ${options.tier}`));
      print(brand(`The running daemon picks up the new tier at the next scheduled iteration.`));
    });
    return result;
  } finally {
    await ctx.close();
  }
}

/** @stable */
export interface ConsolidatorStopOptions extends ConsolidatorCommonOptions {}

/** @stable */
export async function runConsolidatorStop(
  options: ConsolidatorStopOptions = {},
): Promise<{ readonly stopped: true }> {
  const ctx = await openStoreContext({
    ...(options.config !== undefined ? { config: options.config } : {}),
  });
  try {
    ensureAdminTable(ctx.store.connection);
    ctx.store.connection.run(
      `INSERT INTO consolidator_admin (key, value, updated_at) VALUES ('paused', '1', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      [Date.now()],
    );
    const result = { stopped: true } as const;
    emitReport(options, result, () => {
      const print = options.print ?? defaultPrintSink;
      print(brand('consolidator pause flag persisted; the daemon honours it on the next tick.'));
      print(
        brand("Resume with 'graphorin consolidator set-tier <tier>' or by restarting the server."),
      );
    });
    return result;
  } finally {
    await ctx.close();
  }
}

function ensureAdminTable(conn: { exec(sql: string): void }): void {
  conn.exec(
    `CREATE TABLE IF NOT EXISTS consolidator_admin (
       key TEXT PRIMARY KEY,
       value TEXT NOT NULL,
       updated_at INTEGER NOT NULL
     ) WITHOUT ROWID;`,
  );
}

function isTier(value: unknown): value is ConsolidatorTier {
  return typeof value === 'string' && (VALID_TIERS as ReadonlyArray<string>).includes(value);
}

/**
 * Exit code emitted when a tier value fails validation. Re-exported
 * so the binary can surface the same code to downstream callers.
 *
 * @stable
 */
export const CONSOLIDATOR_INVALID_TIER_EXIT = EXIT_CODES.RECOVERABLE_FAILURE;
