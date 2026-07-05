/**
 * Configuration shapes for the replay log. The shapes mirror the
 * canonical `observability.replayLog.*` settings so consumer
 * configuration files can use a single typed structure.
 *
 * @packageDocumentation
 */

/**
 * Shape consumed by `observability.replayLog.*`.
 *
 * @stable
 */
export interface ReplayLogConfig {
  /**
   * Root directory for the JSONL trace files. Required when the
   * replay log is enabled.
   */
  readonly path: string;
  /**
   * Retention window in days. `0` keeps every file forever.
   *
   * @default 30
   */
  readonly retentionDays?: number;
  /**
   * Auto-prune hint. `enabled` + `schedule` describe a daily prune of files
   * older than `retentionDays`, but **no built-in scheduler consumes this
   * yet** (RP-19) - it is a declarative intent. Until a host wires it to a
   * trigger, callers must run `pruneTraces(...)` themselves; the default is
   * therefore `enabled: false` so the option is not an inert default-on.
   *
   * @default { enabled: false, schedule: '0 4 * * *' }
   */
  readonly autoPrune?: {
    readonly enabled: boolean;
    readonly schedule?: string;
  };
  /**
   * Encryption-at-rest toggle. `'off'` (default) writes plain JSONL;
   * the opt-in `'aes256gcm'` mode hooks into the encryption-at-rest
   * passphrase chain (Phase 16 deliverable).
   *
   * @default 'off'
   */
  readonly encryption?: 'off' | 'aes256gcm';
}

/**
 * Default values for the replay log configuration.
 *
 * @stable
 */
export const DEFAULT_REPLAY_LOG_CONFIG: Omit<Required<ReplayLogConfig>, 'path'> = Object.freeze({
  retentionDays: 30,
  autoPrune: Object.freeze({ enabled: false, schedule: '0 4 * * *' }),
  encryption: 'off' as const,
});
