/**
 * Trajectory scorers: pure-code, offline scorers over a {@link Trajectory}
 * (the recorded sequence of tool calls a harness made for a task). They
 * measure *harness reliability* - tool selection, argument validity,
 * redundant work, error recovery, and goal-state correctness - and gate
 * regressions in CI without a model or network.
 *
 * @packageDocumentation
 */

export {
  type ArgumentValidityOptions,
  argumentValidity,
  type SchemaLike,
} from './argument-validity.js';
export {
  type CorrectToolSelectedOptions,
  correctToolSelected,
} from './correct-tool-selected.js';
export { type FinalStateCorrectOptions, finalStateCorrect } from './final-state-correct.js';
export {
  type RecoveryAfterErrorOptions,
  recoveryAfterError,
} from './recovery-after-error.js';
export {
  type RedundantCallDetectionOptions,
  redundantCallDetection,
} from './redundant-call-detection.js';
export type { Trajectory, TrajectoryToolCall } from './types.js';
