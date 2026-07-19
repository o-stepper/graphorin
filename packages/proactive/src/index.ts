/**
 * `@graphorin/proactive` - the proactivity layer of the Graphorin
 * framework: a checklist-driven heartbeat runner and a cron-leg
 * task runner, both emitting the typed
 * notify / question / review / act escalation ladder from
 * `@graphorin/core`.
 *
 * Single-process by design: schedules ride `@graphorin/triggers`,
 * whose SQLite store is single-process.
 *
 * @packageDocumentation
 */

/** Canonical version constant, derived from `package.json` at build time. */
import pkg from '../package.json' with { type: 'json' };

export const VERSION: string = pkg.version;

export {
  type ActiveHours,
  isWithinActiveHours,
  validateActiveHours,
} from './active-hours.js';
export {
  type AgentApprovalRef,
  parseApprovalRef,
  serializeApprovalRef,
} from './approval-ref.js';
export {
  type CreateProactiveCronTaskOptions,
  createProactiveCronTask,
  type MemoryIngestGateEvidence,
  type ProactiveCronSchedule,
  type ProactiveCronTask,
  type ProactiveCronTaskStatus,
  type ProactiveTaskFireResult,
  type ProactiveTaskSkipReason,
  type SuspendedRunRegistryLike,
} from './cron-task.js';
export { ProactiveConfigError } from './errors.js';
export {
  type CreateHeartbeatOptions,
  createHeartbeat,
  type Heartbeat,
  type HeartbeatBeatResult,
  type HeartbeatProfile,
  type HeartbeatSchedule,
  type HeartbeatSkip,
  type HeartbeatSkipReason,
  type HeartbeatStatus,
} from './heartbeat.js';
export {
  outcomeToDelivery,
  type ProactiveDeliveryIdentity,
  type ProactiveDeliveryPayload,
  workflowAwakeableOutcome,
} from './ladder.js';
