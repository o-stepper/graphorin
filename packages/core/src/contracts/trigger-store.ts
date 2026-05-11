/**
 * Persisted trigger state row. Lives in the `trigger_state` table per
 * the durable-trigger contract: library and server modes share a single
 * code path.
 *
 * @stable
 */
export interface TriggerState {
  readonly id: string;
  readonly kind: 'cron' | 'interval' | 'idle' | 'event';
  readonly spec: string;
  readonly callbackRef: string;
  /** ISO-8601 of the next scheduled fire. */
  readonly nextFireAt?: string;
  /** ISO-8601 of the most recent fire. */
  readonly lastFiredAt?: string;
  /** Number of consecutive missed fires. */
  readonly missedFires: number;
  readonly disabled: boolean;
  readonly catchupPolicy: 'none' | 'last' | 'all';
  readonly maxCatchupRuns: number;
  readonly catchupWindowMs: number;
  readonly tags?: ReadonlyArray<string>;
  readonly createdAt: string;
  readonly updatedAt?: string;
}

/**
 * Pluggable persistent storage for triggers. Default impl lives in
 * `@graphorin/store-sqlite`.
 *
 * @stable
 */
export interface TriggerStore {
  upsert(state: TriggerState): Promise<void>;
  get(id: string): Promise<TriggerState | null>;
  list(): Promise<ReadonlyArray<TriggerState>>;
  remove(id: string): Promise<void>;
  recordFire(id: string, firedAt: string, nextFireAt?: string): Promise<void>;
}
