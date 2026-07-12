/**
 * In-memory bookkeeping for in-flight agent / workflow runs. Exposes
 * a tiny CRUD surface route handlers consume to honour the
 * `GET /runs/:runId/state` and `POST /runs/:runId/abort` endpoints
 * declared in the runtime architecture.
 *
 * The full durable resume / replay path lives in Phase 14b/c on top
 * of the WebSocket layer + the consolidator daemon. Phase 14a only
 * needs enough state to:
 *   - mint a runId on every `POST /run` / `POST /stream`,
 *   - track its lifecycle (`pending` → `running` → `completed` / `failed` / `aborted`),
 *   - propagate `AbortController.signal` so handlers can cancel.
 *
 * @packageDocumentation
 */

import { toWireError } from '../internal/wire-error.js';

/**
 * Stable status discriminator for a run snapshot. Mirrors the values
 * exposed on the public REST surface.
 *
 * @stable
 */
export type RunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'aborted';

/**
 * Identifying tag for the underlying execution kind. Workflows run
 * on the durable engine in `@graphorin/workflow`; agents run on the
 * `@graphorin/agent` runtime.
 *
 * @stable
 */
export type RunKind = 'agent' | 'workflow';

/**
 * Terminal status a run can settle into (never `pending` / `running`).
 *
 * @stable
 */
export type TerminalRunStatus = Extract<RunStatus, 'completed' | 'failed' | 'aborted'>;

/**
 * IP-15: payload handed to the {@link RunStateTracker} `onTerminal` callback
 * the first time a run reaches a terminal state. The server turns this into
 * the `graphorin_agent_runs_total` counter + `graphorin_agent_run_duration_seconds`
 * summary. `durationMs` is omitted for a run that was aborted before it ever
 * started (no meaningful wall-clock).
 *
 * @stable
 */
export interface TerminalRunInfo {
  readonly status: TerminalRunStatus;
  readonly kind: RunKind;
  readonly durationMs?: number;
}

function isTerminalStatus(status: RunStatus): status is TerminalRunStatus {
  return status === 'completed' || status === 'failed' || status === 'aborted';
}

/**
 * Snapshot returned by {@link RunStateTracker.snapshot}.
 *
 * @stable
 */
export interface RunStateSnapshot {
  readonly runId: string;
  readonly kind: RunKind;
  readonly status: RunStatus;
  readonly startedAt?: number;
  readonly completedAt?: number;
  readonly error?: { readonly message: string; readonly code?: string; readonly hint?: string };
  readonly agentId?: string;
  readonly workflowId?: string;
  readonly threadId?: string;
  readonly sessionId?: string;
  readonly userId?: string;
}

/**
 * Bookkeeping descriptor recorded at run start. Either an agent run
 * (with `agentId`) or a workflow run (with `workflowId` + optional
 * `threadId`).
 *
 * @stable
 */
export type RunDescriptor =
  | {
      readonly kind: 'agent';
      readonly agentId: string;
      readonly sessionId?: string;
      readonly userId?: string;
    }
  | {
      readonly kind: 'workflow';
      readonly workflowId: string;
      readonly threadId?: string;
      readonly sessionId?: string;
      readonly userId?: string;
    };

/**
 * Activity event emitted by the tracker's optional listener (A2,
 * item 7): `run-start` when a run enters `running`, `run-end` on the
 * first terminal transition.
 *
 * @stable
 */
export interface RunActivityEvent {
  readonly kind: 'run-start' | 'run-end';
  readonly runKind: RunKind;
}

/**
 * In-flight handle returned by {@link RunStateTracker.start}. Handlers
 * pass `signal` into the underlying `agent.run / workflow.execute`
 * invocation so cancellation propagates instantly.
 *
 * @stable
 */
export interface RunHandle {
  readonly runId: string;
  readonly signal: AbortSignal;
  cancel(reason?: unknown): void;
}

interface RunRecord {
  readonly runId: string;
  readonly kind: RunKind;
  readonly descriptor: RunDescriptor;
  status: RunStatus;
  controller: AbortController;
  startedAt?: number;
  completedAt?: number;
  error?: { readonly message: string; readonly code?: string; readonly hint?: string };
}

/**
 * Pluggable tracker. The default in-memory implementation is the only
 * one shipped in Phase 14a; future phases plug in a SQLite-backed
 * variant so durable resume survives process restarts.
 *
 * @stable
 */
export class RunStateTracker {
  readonly #records: Map<string, RunRecord> = new Map();
  readonly #now: () => number;
  readonly #onTerminal: ((info: TerminalRunInfo) => void) | undefined;
  #onActivity: ((event: RunActivityEvent) => void) | undefined;

  constructor(
    options: {
      readonly now?: () => number;
      /**
       * IP-15: invoked exactly once per run, the first time it settles into a
       * terminal state. Used to drive the run-count + duration metrics. Never
       * throws into the tracker - wrap your handler if it might.
       */
      readonly onTerminal?: (info: TerminalRunInfo) => void;
    } = {},
  ) {
    this.#now = options.now ?? Date.now;
    this.#onTerminal = options.onTerminal;
  }

  /**
   * A2 (item 7): register the server-side activity listener. The
   * tracker is the single choke point every REST/WS run passes
   * through, so this is where the server bridges "a run started /
   * settled" into `scheduler.recordActivity()` (idle debounce) and
   * `consolidator.notifyActivity()` (buffer:N evaluation). One
   * listener slot - `createServer` owns it; exceptions are swallowed
   * so a bridge failure can never break run tracking.
   */
  setActivityListener(listener: ((event: RunActivityEvent) => void) | undefined): void {
    this.#onActivity = listener;
  }

  #emitActivity(event: RunActivityEvent): void {
    try {
      this.#onActivity?.(event);
    } catch {
      // The bridge must never break run tracking.
    }
  }

  #emitTerminal(record: RunRecord): void {
    if (this.#onTerminal === undefined) return;
    if (!isTerminalStatus(record.status)) return;
    const durationMs =
      record.startedAt !== undefined && record.completedAt !== undefined
        ? record.completedAt - record.startedAt
        : undefined;
    this.#onTerminal({
      status: record.status,
      kind: record.kind,
      ...(durationMs !== undefined ? { durationMs } : {}),
    });
  }

  /** Reserve a run id without taking ownership of an AbortSignal. */
  declare(runId: string, descriptor: RunDescriptor): void {
    if (this.#records.has(runId)) return;
    const controller = new AbortController();
    this.#records.set(runId, {
      runId,
      kind: descriptor.kind,
      descriptor,
      status: 'pending',
      controller,
    });
  }

  /** Promote a previously-declared run to `running` (or declare it). */
  start(runId: string, descriptor: RunDescriptor): RunHandle {
    const existing = this.#records.get(runId);
    const record: RunRecord = existing ?? {
      runId,
      kind: descriptor.kind,
      descriptor,
      status: 'pending',
      controller: new AbortController(),
    };
    record.status = 'running';
    record.startedAt = this.#now();
    this.#records.set(runId, record);
    this.#emitActivity({ kind: 'run-start', runKind: record.kind });
    return Object.freeze({
      runId,
      signal: record.controller.signal,
      cancel: (reason?: unknown) => {
        if (!record.controller.signal.aborted) {
          record.controller.abort(reason);
        }
      },
    });
  }

  /** Mark a run as terminal. */
  complete(
    runId: string,
    status: Extract<RunStatus, 'completed' | 'failed' | 'aborted'>,
    err?: unknown,
  ): void {
    const record = this.#records.get(runId);
    if (record === undefined) return;
    // IP-15: only the FIRST terminal transition counts toward the metrics -
    // a run aborted then re-completed must not double-increment.
    const wasTerminal = isTerminalStatus(record.status);
    record.status = status;
    record.completedAt = this.#now();
    if (err !== undefined) {
      // W-052: keep the machine-readable code next to the message so
      // the GET run-status surface reports it too.
      record.error = toWireError(err);
    }
    if (!wasTerminal) {
      this.#emitTerminal(record);
      this.#emitActivity({ kind: 'run-end', runKind: record.kind });
    }
  }

  /** Cancel a run via its `AbortController`. */
  abort(runId: string, reason?: unknown): boolean {
    const record = this.#records.get(runId);
    if (record === undefined) return false;
    if (!record.controller.signal.aborted) {
      record.controller.abort(reason);
    }
    if (record.status === 'pending' || record.status === 'running') {
      record.status = 'aborted';
      record.completedAt = this.#now();
      this.#emitTerminal(record);
    }
    return true;
  }

  /** Read-only snapshot, safe to JSON.stringify. */
  snapshot(runId: string): RunStateSnapshot | undefined {
    const record = this.#records.get(runId);
    if (record === undefined) return undefined;
    const base: { -readonly [K in keyof RunStateSnapshot]?: RunStateSnapshot[K] } = {
      runId: record.runId,
      kind: record.kind,
      status: record.status,
    };
    if (record.startedAt !== undefined) base.startedAt = record.startedAt;
    if (record.completedAt !== undefined) base.completedAt = record.completedAt;
    if (record.error !== undefined) base.error = record.error;
    if (record.descriptor.kind === 'agent') {
      base.agentId = record.descriptor.agentId;
    } else {
      base.workflowId = record.descriptor.workflowId;
      if (record.descriptor.threadId !== undefined) base.threadId = record.descriptor.threadId;
    }
    if (record.descriptor.sessionId !== undefined) base.sessionId = record.descriptor.sessionId;
    if (record.descriptor.userId !== undefined) base.userId = record.descriptor.userId;
    return Object.freeze(base as RunStateSnapshot);
  }

  /**
   * Number of runs currently in `pending` or `running`. Useful for
   * snapshots / metrics. Note that `pending` runs hold a reservation
   * but have not yet started any work - see {@link runningCount} for
   * the drain-blocking subset.
   */
  inflightCount(): number {
    let n = 0;
    for (const record of this.#records.values()) {
      if (record.status === 'pending' || record.status === 'running') n += 1;
    }
    return n;
  }

  /**
   * Number of runs with active work in progress (`running`). The
   * lifecycle drain blocks on this counter only - pending runs are a
   * pure reservation (e.g. an awaited WS subscription) and can be
   * aborted immediately when SIGTERM arrives.
   */
  runningCount(): number {
    let n = 0;
    for (const record of this.#records.values()) {
      if (record.status === 'running') n += 1;
    }
    return n;
  }

  /**
   * Drop every reserved-but-not-yet-started run. Called by the
   * server lifecycle at the start of `stop()` so the drain only
   * waits for actual work in flight.
   */
  abortPending(reason?: unknown): number {
    let aborted = 0;
    for (const record of this.#records.values()) {
      if (record.status === 'pending') {
        if (!record.controller.signal.aborted) record.controller.abort(reason);
        record.status = 'aborted';
        record.completedAt = this.#now();
        this.#emitTerminal(record);
        aborted += 1;
      }
    }
    return aborted;
  }

  /** Drop terminal records older than `olderThan`. */
  prune(olderThan: number): number {
    let removed = 0;
    for (const [runId, record] of this.#records) {
      if (
        record.completedAt !== undefined &&
        record.completedAt <= olderThan &&
        record.status !== 'pending' &&
        record.status !== 'running'
      ) {
        this.#records.delete(runId);
        removed += 1;
      }
    }
    return removed;
  }

  /** Cancel every in-flight run. Used during graceful shutdown. */
  abortAll(reason?: unknown): number {
    let aborted = 0;
    for (const [runId] of this.#records) {
      if (this.abort(runId, reason)) aborted += 1;
    }
    return aborted;
  }
}

/** Default cadence for the terminal-record prune sweep (IP-16). */
export const DEFAULT_RUN_PRUNE_INTERVAL_MS = 60_000;
/** Default retention for terminal run records before they are dropped. */
export const DEFAULT_RUN_RETENTION_MS = 5 * 60_000;

/**
 * IP-16: schedule a periodic prune of terminal run records. Without this the
 * tracker's `prune()` was never called, so every run / stream / workflow left
 * a `RunRecord` (each holding an `AbortController`) in memory forever - an
 * unbounded leak on a long-living server. Returns a stop function that clears
 * the timer; the timer is `unref`-ed so it never keeps the process alive.
 */
export function scheduleRunPruning(
  runs: RunStateTracker,
  now: () => number,
  opts: { readonly intervalMs?: number; readonly retentionMs?: number } = {},
): () => void {
  const intervalMs = opts.intervalMs ?? DEFAULT_RUN_PRUNE_INTERVAL_MS;
  const retentionMs = opts.retentionMs ?? DEFAULT_RUN_RETENTION_MS;
  const timer = setInterval(() => {
    runs.prune(now() - retentionMs);
  }, intervalMs);
  if (typeof (timer as { unref?: () => void }).unref === 'function') {
    (timer as { unref: () => void }).unref();
  }
  return () => clearInterval(timer);
}

/** Default cadence for the idempotency-record sweep (W-061). */
export const DEFAULT_IDEMPOTENCY_PRUNE_INTERVAL_MS = 60 * 60_000;

/**
 * W-061: schedule a periodic prune of EXPIRED idempotency records.
 * `idempotency_records` stores each keyed POST's full `response_json`
 * with an `expires_at` column, but expiry was only ever checked on the
 * READ path - the bodies accumulated on disk indefinitely. The sweep
 * passes `now()` as the cutoff, deleting exactly the records the read
 * path already refuses to replay (IETF-draft semantics unchanged).
 * Best-effort: store errors are swallowed. Same shape as
 * {@link scheduleRunPruning}: `unref`-ed timer + stop function.
 *
 * Since W-010 the standalone server drives this surface through the
 * unified retention scheduler (`config.retention.idempotency`); this
 * standalone primitive remains for embedders running the store
 * without the server.
 */
export function scheduleIdempotencyPruning(
  store: { prune(olderThan: number): Promise<number> },
  now: () => number,
  opts: { readonly intervalMs?: number } = {},
): () => void {
  const intervalMs = opts.intervalMs ?? DEFAULT_IDEMPOTENCY_PRUNE_INTERVAL_MS;
  const timer = setInterval(() => {
    void store.prune(now()).catch(() => {});
  }, intervalMs);
  if (typeof (timer as { unref?: () => void }).unref === 'function') {
    (timer as { unref: () => void }).unref();
  }
  return () => clearInterval(timer);
}

/**
 * W-107: the per-resource scope a caller must hold to touch this run.
 * `'read'` gates state inspection; `'control'` gates abort/resume.
 * Derived from the run descriptor: agent runs bind to
 * `agents:{read|invoke}:<agentId>`, workflow runs to
 * `workflows:{read|execute}:<workflowId>`. Runs without a descriptor id
 * (not produced by the current trackers) fall back to the bare scope.
 */
export function requiredRunScope(
  snapshot: Pick<RunStateSnapshot, 'agentId' | 'workflowId'>,
  action: 'read' | 'control',
): string {
  if (snapshot.workflowId !== undefined) {
    return action === 'read'
      ? `workflows:read:${snapshot.workflowId}`
      : `workflows:execute:${snapshot.workflowId}`;
  }
  if (snapshot.agentId !== undefined) {
    return action === 'read'
      ? `agents:read:${snapshot.agentId}`
      : `agents:invoke:${snapshot.agentId}`;
  }
  return action === 'read' ? 'agents:read' : 'agents:invoke';
}
