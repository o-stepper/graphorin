/**
 * Shared types for the trajectory scorer family. A {@link Trajectory} is
 * the recorded sequence of tool calls a harness made while attempting a
 * task, plus an optional goal-state snapshot and the final text output.
 *
 * The scorers in this folder are pure functions over a `Trajectory` — no
 * network, no model — so they can gate harness reliability in CI. Build a
 * `Trajectory` by folding an agent's `AgentEvent` stream (correlate
 * `tool.call.start` / `tool.call.end` with `tool.execute.end` /
 * `tool.execute.error` by `toolCallId`).
 *
 * @packageDocumentation
 */

/**
 * One executed tool call as observed on the `AgentEvent` stream.
 *
 * @stable
 */
export interface TrajectoryToolCall {
  readonly toolCallId: string;
  readonly toolName: string;
  /** The arguments the model emitted (the resolved `tool.call.end.finalArgs`). */
  readonly args: unknown;
  /** `'ok'` when the call returned; `'error'` when the executor surfaced a `ToolError`. */
  readonly status: 'ok' | 'error';
  /** The tool output, present when `status === 'ok'`. */
  readonly result?: unknown;
  /** The surfaced error, present when `status === 'error'`. */
  readonly error?: { readonly kind?: string; readonly message?: string };
}

/**
 * The full record of a single harness attempt at a task.
 *
 * @stable
 */
export interface Trajectory {
  readonly calls: ReadonlyArray<TrajectoryToolCall>;
  /** Goal-state snapshot compared by {@link finalStateCorrect}. */
  readonly finalState?: unknown;
  /** The assistant's final text, when the run completed. */
  readonly finalOutput?: string;
}
