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
   * Auto-prune toggle. When enabled, the framework runs a daily
   * background job that deletes files older than `retentionDays`.
   * The job is wired through `@graphorin/triggers` (Phase 05) /
   * `@graphorin/server` (Phase 14); in library mode the consumer
   * must run `pruneTraces(...)` manually.
   *
   * @default { enabled: true, schedule: '0 4 * * *' }
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
  autoPrune: Object.freeze({ enabled: true, schedule: '0 4 * * *' }),
  encryption: 'off' as const,
});
