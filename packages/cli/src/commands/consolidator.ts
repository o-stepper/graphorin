/**
 * `graphorin consolidator` - inspect and steer the background memory
 * consolidation pipeline.
 *
 * Surface (per Phase 15 § Consolidator):
 *
 *  - `graphorin consolidator status` - current tier + pending CONFLICT-
 *    CHECK runs + DLQ size + recent run history.
 *  - `graphorin consolidator set-tier <free|cheap|standard|enterprise>`
 *    - persist the requested tier so the next process startup picks it
 *    up.
 *  - `graphorin consolidator stop` - pause the consolidator until the
 *    operator resumes it (next `graphorin start`).
 *
 * The consolidator runs **inside** the server process, so the CLI
 * cannot direct-control a live in-memory instance from a different
 * process. `status` reads the SQLite tables the running consolidator
 * writes to (`consolidator_state`, `consolidator_runs`,
 * `consolidator_failed_batches`, `conflict_check_pending`); `set-tier`
 * and `stop` honestly report UNSUPPORTED until a daemon-side control
 * channel exists - nothing polls an admin table.
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
    // W-068: read-only command - never auto-migrate a live database.
    migrationPolicy: 'check',
    ...(options.config !== undefined ? { config: options.config } : {}),
  });
  try {
    const conn = ctx.store.connection;
    const recent = conn.get<{ n: number }>(
      'SELECT COUNT(*) AS n FROM consolidator_runs WHERE started_at > ?',
      [Date.now() - 24 * 60 * 60_000],
    );
    // MCON-5: the store writes 'running' | 'completed' | 'failed' |
    // 'partial' | 'deferred' (consolidator-store.ts) - the old queries
    // asked for 'success'/'error'/'pending' and always returned 0.
    const success = conn.get<{ n: number }>(
      "SELECT COUNT(*) AS n FROM consolidator_runs WHERE status = 'completed' AND started_at > ?",
      [Date.now() - 24 * 60 * 60_000],
    );
    const failed = conn.get<{ n: number }>(
      "SELECT COUNT(*) AS n FROM consolidator_runs WHERE status = 'failed' AND started_at > ?",
      [Date.now() - 24 * 60 * 60_000],
    );
    const dlq = conn.get<{ n: number }>('SELECT COUNT(*) AS n FROM consolidator_failed_batches');
    // Pending conflict work lives in conflict_check_pending, not in
    // consolidator_runs ('pending' was never a run status).
    const pending = conn.get<{ n: number }>(
      'SELECT COUNT(*) AS n FROM conflict_check_pending WHERE resolved_at IS NULL',
    );
    const last = conn.get<{ started_at: number; status: string }>(
      'SELECT started_at, status FROM consolidator_runs ORDER BY started_at DESC LIMIT 1',
    );
    const out: ConsolidatorStatusResult = Object.freeze({
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
export async function runConsolidatorSetTier(options: ConsolidatorSetTierOptions): Promise<{
  readonly tier: ConsolidatorTier;
  readonly applied: false;
  readonly unsupported: true;
}> {
  if (!isTier(options.tier)) {
    throw new Error(
      `[graphorin/cli] invalid tier '${String(options.tier)}'. Allowed: ${VALID_TIERS.join(' | ')}.`,
    );
  }
  const ctx = await openStoreContext({
    ...(options.config !== undefined ? { config: options.config } : {}),
  });
  try {
    // IP-4: the old implementation upserted a `consolidator_admin` row
    // NOTHING polls (neither the daemon nor process startup reads it -
    // createConsolidator takes the tier from opts) and reported
    // success. Honest answer until a daemon-side control channel
    // exists: UNSUPPORTED with the working alternative.
    const result = { tier: options.tier, applied: false, unsupported: true } as const;
    emitReport(options, result, () => {
      const print = options.print ?? defaultPrintSink;
      print(
        brand(
          `runtime tier switching is not wired yet - set the tier in the server config (consolidator.tier: '${options.tier}') and restart, or use the server API when available.`,
        ),
      );
    });
    process.exitCode = EXIT_CODES.UNSUPPORTED;
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
): Promise<{ readonly stopped: false; readonly unsupported: true }> {
  const ctx = await openStoreContext({
    ...(options.config !== undefined ? { config: options.config } : {}),
  });
  try {
    // IP-4: the old implementation persisted a pause flag NOTHING
    // honoured and told the operator the daemon would stop - the worst
    // possible lie when someone is trying to stop runaway LLM spend.
    const result = { stopped: false, unsupported: true } as const;
    emitReport(options, result, () => {
      const print = options.print ?? defaultPrintSink;
      print(
        brand(
          'a CLI stop channel is not wired yet - to stop consolidation NOW, stop the server process (the consolidator runs inside it).',
        ),
      );
      print(
        brand(
          'To stay stopped across restarts set consolidator.tier to a zero-budget tier in the config.',
        ),
      );
    });
    process.exitCode = EXIT_CODES.UNSUPPORTED;
    return result;
  } finally {
    await ctx.close();
  }
}

/** One dead-letter batch as surfaced by `consolidator dlq list`. @stable */
export interface ConsolidatorDlqEntry {
  readonly id: string;
  readonly userId: string | null;
  readonly phase: string | null;
  readonly errorKind: string | null;
  readonly retryCount: number;
  readonly failedAt: string;
  /** `true` when retries are exhausted (`next_retry_at IS NULL`). */
  readonly exhausted: boolean;
}

/** @stable */
export interface ConsolidatorDlqListOptions extends ConsolidatorCommonOptions {
  /** Narrow to one user's batches (`scope_user_id`). */
  readonly user?: string;
  readonly limit?: number;
}

/**
 * Make the permanent `dead-letter queue: N` status warning
 * actionable. Operator-level (DB-wide) view, like the `dlqSize`
 * counter in `runConsolidatorStatus` - `listFailedBatches` on the
 * store is scoped to one `SessionScope.userId`, which a CLI does not
 * have; use `--user` to narrow.
 *
 * @stable
 */
export async function runConsolidatorDlqList(
  options: ConsolidatorDlqListOptions = {},
): Promise<ReadonlyArray<ConsolidatorDlqEntry>> {
  const ctx = await openStoreContext({
    // W-068: read-only command - never auto-migrate a live database.
    migrationPolicy: 'check',
    ...(options.config !== undefined ? { config: options.config } : {}),
  });
  try {
    const conn = ctx.store.connection;
    const limit = options.limit ?? 100;
    const rows =
      options.user !== undefined
        ? conn.all<DlqRow>(
            'SELECT id, scope_user_id, phase, error_kind, retry_count, failed_at, next_retry_at FROM consolidator_failed_batches WHERE scope_user_id = ? ORDER BY failed_at DESC LIMIT ?',
            [options.user, limit],
          )
        : conn.all<DlqRow>(
            'SELECT id, scope_user_id, phase, error_kind, retry_count, failed_at, next_retry_at FROM consolidator_failed_batches ORDER BY failed_at DESC LIMIT ?',
            [limit],
          );
    const out: ReadonlyArray<ConsolidatorDlqEntry> = Object.freeze(
      rows.map((row) =>
        Object.freeze({
          id: row.id,
          userId: row.scope_user_id,
          phase: row.phase,
          errorKind: row.error_kind,
          retryCount: row.retry_count,
          failedAt: new Date(row.failed_at).toISOString(),
          exhausted: row.next_retry_at === null,
        }),
      ),
    );
    emitReport(options, out, () => {
      const print = options.print ?? defaultPrintSink;
      if (out.length === 0) {
        print(brand('dead-letter queue is empty.'));
        return;
      }
      print(brand(`dead-letter queue: ${out.length} batch(es)`));
      for (const entry of out) {
        const state = entry.exhausted ? 'EXHAUSTED' : 'awaiting retry';
        print(
          `  ${entry.id}  user=${entry.userId ?? '-'}  phase=${entry.phase ?? '-'}  kind=${entry.errorKind ?? '-'}  retries=${entry.retryCount}  failedAt=${entry.failedAt}  [${state}]`,
        );
      }
    });
    return out;
  } finally {
    await ctx.close();
  }
}

/** @stable */
export interface ConsolidatorDlqClearOptions extends ConsolidatorCommonOptions {
  /**
   * Only clear EXHAUSTED batches (`next_retry_at IS NULL`). Default
   * `true` - batches still awaiting retry belong to
   * `claimReadyBatches` and are only removed with an explicit
   * `--exhausted-only=false`.
   */
  readonly exhaustedOnly?: boolean;
  /** ISO date / epoch-ms: only batches that failed before this instant. */
  readonly before?: string;
  /** Clear one batch by id. */
  readonly id?: string;
  /** Narrow to one user's batches (`scope_user_id`). */
  readonly user?: string;
}

/** @stable */
export interface ConsolidatorDlqClearResult {
  readonly removed: number;
}

/**
 * Clear dead-letter batches. Defaults are conservative:
 * exhausted-only, all users, no age bound. The batch payload (message
 * ids) is lost on delete - that is the explicit point of the command.
 *
 * @stable
 */
export async function runConsolidatorDlqClear(
  options: ConsolidatorDlqClearOptions = {},
): Promise<ConsolidatorDlqClearResult> {
  const ctx = await openStoreContext({
    ...(options.config !== undefined ? { config: options.config } : {}),
  });
  try {
    const conn = ctx.store.connection;
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (options.id !== undefined) {
      conditions.push('id = ?');
      params.push(options.id);
    }
    if (options.exhaustedOnly !== false) {
      conditions.push('next_retry_at IS NULL');
    }
    if (options.before !== undefined) {
      const ms = Number.isFinite(Number(options.before))
        ? Number(options.before)
        : Date.parse(options.before);
      if (!Number.isFinite(ms)) {
        throw new Error(
          `[graphorin/cli] --before '${options.before}' is not a valid ISO date or epoch-ms value.`,
        );
      }
      conditions.push('failed_at < ?');
      params.push(ms);
    }
    if (options.user !== undefined) {
      conditions.push('scope_user_id = ?');
      params.push(options.user);
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = conn.run(`DELETE FROM consolidator_failed_batches ${where}`, params);
    const out: ConsolidatorDlqClearResult = Object.freeze({ removed: result.changes ?? 0 });
    emitReport(options, out, () => {
      const print = options.print ?? defaultPrintSink;
      const mark = out.removed > 0 ? statusMarker('ok') : statusMarker('info');
      print(brand(`${mark} cleared ${out.removed} dead-letter batch(es).`));
    });
    return out;
  } finally {
    await ctx.close();
  }
}

interface DlqRow {
  readonly id: string;
  readonly scope_user_id: string | null;
  readonly phase: string | null;
  readonly error_kind: string | null;
  readonly retry_count: number;
  readonly failed_at: number;
  readonly next_retry_at: number | null;
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
