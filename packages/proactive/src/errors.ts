/**
 * Typed error surface for `@graphorin/proactive`. Match structurally
 * by `err.name` (the framework-wide convention).
 *
 * @packageDocumentation
 */

/**
 * Thrown by `createProactiveCronTask(...)` / `createHeartbeat(...)` on
 * a fail-closed configuration violation: an `act` grant without ingest
 * gate evidence, a scheduling tool on a task that was not granted
 * recursive scheduling, or a malformed declaration.
 *
 * @stable
 */
export class ProactiveConfigError extends Error {
  override readonly name = 'ProactiveConfigError';
  constructor(
    public readonly taskId: string,
    public readonly rule: 'act-requires-ingest-gate' | 'recursive-scheduling' | 'invalid-options',
    message: string,
  ) {
    super(`[graphorin/proactive] ${message}`);
  }
}
