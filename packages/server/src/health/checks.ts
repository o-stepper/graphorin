/**
 * Per-subsystem health checks aggregated by `/v1/health`. Every check
 * resolves to `'ok' | 'warn' | 'fail'`; the aggregator promotes the
 * worst status to the top-level rollup.
 *
 * The serialized shape is **flat**: each check carries its detail
 * fields directly on the same object as the `status` discriminator
 * - no nested `detail` wrapper - matching the documented response
 * contract exactly.
 *
 * @packageDocumentation
 */

import type { GraphorinSqliteStore } from '@graphorin/store-sqlite';
import { readWalSize } from '@graphorin/store-sqlite';
import type { ConsolidatorDaemon } from '../consolidator/daemon.js';
import type { TriggersDaemon } from '../triggers/daemon.js';
import type { WorkflowTimerDaemon } from '../workflows/timer-daemon.js';

/** @stable */
export interface ReplayBufferProbe {
  /** Total events buffered across all subjects. Aggregated by the caller. */
  readonly eventsBuffered: number;
  readonly subscribers?: number;
  readonly subscriptions?: number;
}

/** @stable */
export type HealthStatus = 'ok' | 'warn' | 'fail';

/** @stable */
export type HealthRollup = 'ok' | 'degraded' | 'failing';

/**
 * Common discriminator carried on every per-subsystem check entry.
 * Concrete shapes extend this with subsystem-specific fields per the
 * documented contract.
 *
 * @stable
 */
export interface BaseHealthCheck {
  readonly status: HealthStatus;
  readonly message?: string;
}

/** @stable */
export interface StorageCheck extends BaseHealthCheck {
  readonly walSizeBytes: number;
  readonly warnThresholdBytes: number;
  readonly lastCheckpointAt?: string;
}

/** @stable */
export interface EmbedderCheck extends BaseHealthCheck {
  readonly modelLoaded: boolean;
  readonly model?: string;
}

/** @stable */
export interface SecretsCheck extends BaseHealthCheck {
  readonly activeStore: string;
}

/** @stable */
export interface EncryptionCheck extends BaseHealthCheck {
  readonly enabled: boolean;
  readonly peerDepInstalled: boolean;
}

/** @stable */
export interface ConsolidatorCheck extends BaseHealthCheck {
  readonly tier: string;
  readonly running: boolean;
  readonly paused: boolean;
  readonly queueDepth: number;
  readonly dlqSize: number;
  readonly budgetRemaining: {
    readonly tokens: number;
    readonly costUsd: number;
  };
}

/** @stable */
export interface TriggersCheck extends BaseHealthCheck {
  readonly running: boolean;
  readonly active: number;
  readonly disabled: number;
  readonly deferred: number;
  readonly lastFireAt?: string;
}

/** @stable */
export interface ReplayBufferCheck extends BaseHealthCheck {
  readonly eventsBuffered: number;
  readonly subscribers?: number;
  readonly subscriptions?: number;
}

/** @stable */
export type HealthCheck =
  | StorageCheck
  | EmbedderCheck
  | SecretsCheck
  | EncryptionCheck
  | ConsolidatorCheck
  | TriggersCheck
  | WorkflowTimersCheck
  | ReplayBufferCheck;

/** W-032: durable-timer driver health. @stable */
export interface WorkflowTimersCheck {
  readonly status: HealthStatus;
  readonly running: boolean;
  readonly sweeps: number;
  readonly fired: number;
  readonly errors: number;
  readonly lastSweepAt?: string;
  readonly nextWakeAt?: string;
  readonly message?: string;
}

/** @stable */
export interface HealthChecks {
  readonly storage?: StorageCheck;
  readonly embedder?: EmbedderCheck;
  readonly secrets?: SecretsCheck;
  readonly encryption?: EncryptionCheck;
  readonly consolidator?: ConsolidatorCheck;
  readonly triggers?: TriggersCheck;
  readonly workflowTimers?: WorkflowTimersCheck;
  readonly replayBuffer?: ReplayBufferCheck;
}

/** @stable */
export interface HealthSummary {
  readonly status: HealthRollup;
  readonly checks: HealthChecks;
}

/** @stable */
export interface HealthCheckOptions {
  readonly store?: GraphorinSqliteStore;
  readonly triggers?: TriggersDaemon;
  readonly workflowTimers?: WorkflowTimerDaemon;
  readonly consolidator?: ConsolidatorDaemon;
  readonly replayBuffer?: ReplayBufferProbe;
  readonly secretsActive?: string;
  readonly encryptionEnabled?: boolean;
  readonly cipherPeerInstalled?: boolean;
  readonly embedderModel?: string;
  readonly embedderLoaded?: boolean;
  /** Highest acceptable WAL size in bytes before warning. Default 50 MB. */
  readonly walWarnThresholdBytes?: number;
}

const DEFAULT_WAL_WARN_THRESHOLD_BYTES = 50 * 1024 * 1024;

/**
 * Build the aggregate health summary from runtime probes.
 *
 * @stable
 */
export async function collectHealth(options: HealthCheckOptions): Promise<HealthSummary> {
  const checks: {
    -readonly [K in keyof HealthChecks]?: HealthChecks[K];
  } = {};

  if (options.store !== undefined) {
    const walSize = readWalSizeSafely(options.store);
    const threshold = options.walWarnThresholdBytes ?? DEFAULT_WAL_WARN_THRESHOLD_BYTES;
    const status: HealthStatus = walSize > threshold ? 'warn' : 'ok';
    checks.storage = {
      status,
      walSizeBytes: walSize,
      warnThresholdBytes: threshold,
    };
  }

  if (options.embedderLoaded !== undefined) {
    checks.embedder = {
      status: options.embedderLoaded ? 'ok' : 'warn',
      modelLoaded: options.embedderLoaded,
      ...(options.embedderModel !== undefined ? { model: options.embedderModel } : {}),
    };
  }

  if (options.secretsActive !== undefined) {
    checks.secrets = {
      status: 'ok',
      activeStore: options.secretsActive,
    };
  }

  if (options.encryptionEnabled !== undefined) {
    // IP-1: a server that is serving this health endpoint with
    // encryption enabled has already opened the store WITH its key at
    // boot (createServer threads the resolved passphrase into
    // createSqliteStore and fails fast otherwise) - that successful
    // keyed open is the factual basis of this check. 'fail' is
    // reserved for an explicit negative cipher-peer probe; the old
    // default blamed a missing peer dep on every encrypted boot.
    const peerDepInstalled = options.cipherPeerInstalled ?? true;
    checks.encryption = {
      status: options.encryptionEnabled && peerDepInstalled === false ? 'fail' : 'ok',
      enabled: options.encryptionEnabled,
      peerDepInstalled,
    };
  }

  if (options.consolidator !== undefined) {
    try {
      const status = await options.consolidator.status();
      const overall: HealthStatus = status.dlqSize > 0 ? 'warn' : 'ok';
      checks.consolidator = {
        status: status.paused ? 'warn' : overall,
        tier: status.tier,
        running: status.running,
        paused: status.paused,
        queueDepth: status.queueDepth,
        dlqSize: status.dlqSize,
        budgetRemaining: {
          tokens: status.budget.tokensRemaining,
          costUsd: status.budget.costRemaining,
        },
      };
    } catch (err) {
      checks.consolidator = {
        status: 'fail',
        tier: 'unknown',
        running: false,
        paused: false,
        queueDepth: 0,
        dlqSize: 0,
        budgetRemaining: { tokens: 0, costUsd: 0 },
        message: err instanceof Error ? err.message : String(err),
      };
    }
  }

  if (options.triggers !== undefined) {
    try {
      const status = await options.triggers.status();
      checks.triggers = {
        status: 'ok',
        running: status.running,
        active: status.active,
        disabled: status.disabled,
        deferred: status.deferred,
        ...(status.lastFireAt !== undefined ? { lastFireAt: status.lastFireAt } : {}),
      };
    } catch (err) {
      checks.triggers = {
        status: 'fail',
        running: false,
        active: 0,
        disabled: 0,
        deferred: 0,
        message: err instanceof Error ? err.message : String(err),
      };
    }
  }

  if (options.workflowTimers !== undefined) {
    try {
      const status = await options.workflowTimers.status();
      checks.workflowTimers = {
        status: status.errors > 0 ? 'warn' : 'ok',
        running: status.running,
        sweeps: status.sweeps,
        fired: status.fired,
        errors: status.errors,
        ...(status.lastSweepAt !== undefined ? { lastSweepAt: status.lastSweepAt } : {}),
        ...(status.nextWakeAt !== undefined ? { nextWakeAt: status.nextWakeAt } : {}),
      };
    } catch (err) {
      checks.workflowTimers = {
        status: 'fail',
        running: false,
        sweeps: 0,
        fired: 0,
        errors: 0,
        message: err instanceof Error ? err.message : String(err),
      };
    }
  }

  if (options.replayBuffer !== undefined) {
    const probe = options.replayBuffer;
    checks.replayBuffer = {
      status: 'ok',
      eventsBuffered: probe.eventsBuffered,
      ...(probe.subscribers !== undefined ? { subscribers: probe.subscribers } : {}),
      ...(probe.subscriptions !== undefined ? { subscriptions: probe.subscriptions } : {}),
    };
  }

  const status = rollup(checks);
  return Object.freeze({ status, checks: Object.freeze(checks) as HealthChecks });
}

/**
 * Promote the worst per-check status to the rollup label.
 *
 * @stable
 */
export function rollup(checks: HealthChecks): HealthRollup {
  let worst: HealthRollup = 'ok';
  for (const value of Object.values(checks)) {
    if (value === undefined) continue;
    if (value.status === 'fail') return 'failing';
    if (value.status === 'warn') worst = 'degraded';
  }
  return worst;
}

function readWalSizeSafely(store: GraphorinSqliteStore): number {
  try {
    // S-09: `wal_checkpoint(PASSIVE)` reports log=-1 when the database
    // is not in WAL journal mode (e.g. disableWalHardening), which
    // would surface as a negative byte count - clamp to 0.
    return Math.max(0, readWalSize(store.connection));
  } catch {
    return 0;
  }
}
