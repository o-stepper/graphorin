/**
 * W-032: durable-timer driver integration with the server lifecycle.
 *
 * Mirrors the triggers daemon: the operator builds a
 * `createTimerDriver(...)` (from `@graphorin/workflow`) over their
 * workflows + checkpoint stores and hands it to `createServer({
 * workflowTimers: { driver } })`; the daemon binds `start()`/`stop()`
 * to the lifecycle hooks and surfaces `status()` through `/v1/health`.
 * The driver is typed STRUCTURALLY so `@graphorin/server` takes no
 * dependency on `@graphorin/workflow`.
 *
 * @packageDocumentation
 */

/**
 * Structural slice of `@graphorin/workflow`'s `TimerDriver` the daemon
 * consumes.
 *
 * @stable
 */
export interface WorkflowTimerDriverLike {
  start(): void;
  stop(): void;
  status(): {
    readonly running: boolean;
    readonly sweeps: number;
    readonly fired: number;
    readonly errors: number;
    readonly lastSweepAt?: number;
    readonly nextWakeAt?: number;
  };
  sweep(): Promise<number>;
}

/**
 * Snapshot exposed via {@link WorkflowTimerDaemon.status} + the
 * `/v1/health` aggregator.
 *
 * @stable
 */
export interface WorkflowTimerDaemonStatus {
  readonly running: boolean;
  readonly sweeps: number;
  readonly fired: number;
  readonly errors: number;
  readonly lastSweepAt?: string;
  readonly nextWakeAt?: string;
}

/** @stable */
export interface CreateWorkflowTimerDaemonOptions {
  readonly driver: WorkflowTimerDriverLike;
}

/**
 * Stateful handle returned by {@link createWorkflowTimerDaemon}.
 *
 * @stable
 */
export interface WorkflowTimerDaemon {
  start(): Promise<void>;
  stop(): Promise<void>;
  status(): Promise<WorkflowTimerDaemonStatus>;
  readonly driver: WorkflowTimerDriverLike;
}

/**
 * @stable
 */
export function createWorkflowTimerDaemon(
  options: CreateWorkflowTimerDaemonOptions,
): WorkflowTimerDaemon {
  let running = false;
  return {
    get driver() {
      return options.driver;
    },
    async start() {
      if (running) return;
      running = true;
      options.driver.start();
    },
    async stop() {
      if (!running) return;
      running = false;
      options.driver.stop();
    },
    async status() {
      const s = options.driver.status();
      return Object.freeze({
        running: s.running,
        sweeps: s.sweeps,
        fired: s.fired,
        errors: s.errors,
        ...(s.lastSweepAt !== undefined
          ? { lastSweepAt: new Date(s.lastSweepAt).toISOString() }
          : {}),
        ...(s.nextWakeAt !== undefined ? { nextWakeAt: new Date(s.nextWakeAt).toISOString() } : {}),
      });
    },
  };
}
