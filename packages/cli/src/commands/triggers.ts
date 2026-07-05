/**
 * `graphorin triggers` - operate on the durable trigger registry.
 *
 * Surface (per Phase 15 § Triggers):
 *
 *  - `graphorin triggers list` - every persisted trigger.
 *  - `graphorin triggers status <id>` - single-trigger detail.
 *  - `graphorin triggers fire <id>` - operator-fired side-effect (admin
 *    only). The CLI persists a fire-now signal into `trigger_admin`
 *    that the running scheduler picks up; library-mode triggers
 *    can also be fired by re-running the host process.
 *  - `graphorin triggers disable <id>` - flip the `disabled` column.
 *  - `graphorin triggers prune` - drop orphan rows whose callbackRef
 *    no longer exists in the running registry. Without a running
 *    server the CLI cannot tell which triggers are orphans, so the
 *    helper deletes only triggers whose `disabled` column is true and
 *    whose `lastFiredAt` is older than the cutoff supplied via
 *    `--before <ISO>`.
 *
 * @packageDocumentation
 */

import type { TriggerState } from '@graphorin/core/contracts';

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
export interface TriggersCommonOptions extends CommonOutputOptions {
  readonly config?: string;
}

/** @stable */
export async function runTriggersList(
  options: TriggersCommonOptions = {},
): Promise<ReadonlyArray<TriggerState>> {
  const ctx = await openStoreContext({
    // W-068: read-only command - never auto-migrate a live database.
    migrationPolicy: 'check',
    ...(options.config !== undefined ? { config: options.config } : {}),
  });
  try {
    const list = await ctx.store.triggers.list();
    emitReport(options, list, () => {
      const print = options.print ?? defaultPrintSink;
      if (list.length === 0) {
        print(brand('no triggers persisted.'));
        return;
      }
      print(brand(`${list.length} trigger(s):`));
      for (const t of list) {
        const mark = t.disabled ? statusMarker('warn') : statusMarker('ok');
        print(
          `  ${mark} ${t.id} (kind=${t.kind}, spec=${t.spec}, next=${t.nextFireAt ?? '-'}, missed=${t.missedFires})`,
        );
      }
    });
    return list;
  } finally {
    await ctx.close();
  }
}

/** @stable */
export interface TriggersStatusOptions extends TriggersCommonOptions {
  readonly id: string;
}

/** @stable */
export async function runTriggersStatus(
  options: TriggersStatusOptions,
): Promise<TriggerState | null> {
  const ctx = await openStoreContext({
    ...(options.config !== undefined ? { config: options.config } : {}),
  });
  try {
    const state = await ctx.store.triggers.get(options.id);
    emitReport(options, state, () => {
      const print = options.print ?? defaultPrintSink;
      if (state === null) {
        print(brand(`trigger '${options.id}' not found.`));
        return;
      }
      print(brand(`trigger ${state.id}`));
      print(`  kind: ${state.kind}`);
      print(`  spec: ${state.spec}`);
      print(`  disabled: ${state.disabled}`);
      print(`  catchupPolicy: ${state.catchupPolicy}`);
      print(`  nextFireAt: ${state.nextFireAt ?? '-'}`);
      print(`  lastFiredAt: ${state.lastFiredAt ?? '-'}`);
      print(`  missedFires: ${state.missedFires}`);
    });
    // W-002: exit code independent of --json (see runAuditVerify).
    if (state === null) process.exitCode = EXIT_CODES.RECOVERABLE_FAILURE;
    return state;
  } finally {
    await ctx.close();
  }
}

/** @stable */
export interface TriggersFireOptions extends TriggersCommonOptions {
  readonly id: string;
}

/** @stable */
export async function runTriggersFire(
  options: TriggersFireOptions,
): Promise<{ readonly fired: false; readonly unsupported: true }> {
  const ctx = await openStoreContext({
    ...(options.config !== undefined ? { config: options.config } : {}),
  });
  try {
    const state = await ctx.store.triggers.get(options.id);
    if (state === null) {
      throw new Error(`[graphorin/cli] trigger '${options.id}' not found.`);
    }
    // IP-4: the old implementation queued a row into a `trigger_admin`
    // table NOTHING polled and reported success - the fire never
    // happened. Until a daemon-side poll exists, the honest answer is
    // UNSUPPORTED with the working alternative.
    const result = { fired: false, unsupported: true } as const;
    emitReport(options, result, () => {
      const print = options.print ?? defaultPrintSink;
      print(
        brand(
          `direct CLI fire is not wired yet - use the running server: POST /v1/triggers/${options.id}/fire (scope triggers:fire).`,
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
export interface TriggersDisableOptions extends TriggersCommonOptions {
  readonly id: string;
}

/** @stable */
export async function runTriggersDisable(
  options: TriggersDisableOptions,
): Promise<TriggerState | null> {
  const ctx = await openStoreContext({
    ...(options.config !== undefined ? { config: options.config } : {}),
  });
  try {
    const existing = await ctx.store.triggers.get(options.id);
    if (existing === null) {
      throw new Error(`[graphorin/cli] trigger '${options.id}' not found.`);
    }
    const next: TriggerState = {
      ...existing,
      disabled: true,
      updatedAt: new Date().toISOString(),
    };
    await ctx.store.triggers.upsert(next);
    emitReport(options, next, () => {
      const print = options.print ?? defaultPrintSink;
      print(brand(`trigger '${options.id}' disabled.`));
    });
    return next;
  } finally {
    await ctx.close();
  }
}

/** @stable */
export interface TriggersPruneOptions extends TriggersCommonOptions {
  /**
   * ISO date / epoch ms - drop disabled triggers whose `lastFiredAt`
   * (or `createdAt`, when never fired) is older than this cutoff.
   */
  readonly before?: string;
}

/** @stable */
export interface TriggersPruneResult {
  readonly removed: ReadonlyArray<string>;
}

/** @stable */
export async function runTriggersPrune(
  options: TriggersPruneOptions = {},
): Promise<TriggersPruneResult> {
  const cutoff = options.before === undefined ? 0 : parseCutoff(options.before);
  const ctx = await openStoreContext({
    ...(options.config !== undefined ? { config: options.config } : {}),
  });
  try {
    const all = await ctx.store.triggers.list();
    const removed: string[] = [];
    for (const t of all) {
      if (!t.disabled) continue;
      const lastTouched = t.lastFiredAt ?? t.createdAt;
      const lastTouchedMs = Date.parse(lastTouched);
      if (Number.isFinite(lastTouchedMs) && lastTouchedMs >= cutoff) continue;
      await ctx.store.triggers.remove(t.id);
      removed.push(t.id);
    }
    const out: TriggersPruneResult = Object.freeze({ removed: Object.freeze(removed) });
    emitReport(options, out, () => {
      const print = options.print ?? defaultPrintSink;
      if (out.removed.length === 0) {
        print(brand('no orphan triggers found.'));
        return;
      }
      print(brand(`pruned ${out.removed.length} orphan trigger(s):`));
      for (const id of out.removed) print(`  - ${id}`);
    });
    return out;
  } finally {
    await ctx.close();
  }
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
