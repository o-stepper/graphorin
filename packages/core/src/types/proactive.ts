/**
 * Proactive-task outcome ladder. A proactive fire (heartbeat
 * beat, cron-leg task) ends in exactly one rung of a four-step
 * escalation ladder; the framework routes each rung differently
 * (notify -> channel delivery; question / review -> HITL parking;
 * act -> side effects already happened inside the run, gated by an
 * explicit per-task grant).
 *
 * The types live in `@graphorin/core` so the proactive runner, the
 * channel gateway and the server can share them without depending on
 * each other. They are deliberately JSON-safe data - no callbacks, no
 * class instances - so an outcome can ride an event stream or a
 * persisted journal verbatim.
 *
 * @packageDocumentation
 */

/**
 * The four rungs of the proactive escalation ladder, in escalation
 * order. `notify` is fire-and-forget delivery; `question` asks the
 * user for input the task needs; `review` asks the user to approve a
 * proposed action before anything happens; `act` means the task was
 * granted the right to perform side effects without asking first.
 *
 * @stable
 */
export type ProactiveOutcomeKind = 'notify' | 'question' | 'review' | 'act';

/**
 * The ladder in escalation order - the single source for rung
 * comparisons (`indexOf` semantics; see
 * {@link proactiveOutcomeWithinGrant}).
 *
 * @stable
 */
export const PROACTIVE_OUTCOME_LADDER: ReadonlyArray<ProactiveOutcomeKind> = Object.freeze([
  'notify',
  'question',
  'review',
  'act',
]);

/**
 * Maximum rung a proactive task may produce. A task declares its grant
 * once (default `'notify'`); the runner clamps or rejects outcomes
 * above it. `'act'` additionally requires the memory ingest gate to be
 * active (fail-closed config check in the proactive runner).
 *
 * @stable
 */
export type ProactiveGrant = ProactiveOutcomeKind;

/**
 * `true` when `kind` sits at or below `grant` on the ladder.
 * Deterministic, pure - the ladder routing policy helper.
 *
 * @stable
 */
export function proactiveOutcomeWithinGrant(
  kind: ProactiveOutcomeKind,
  grant: ProactiveGrant,
): boolean {
  return PROACTIVE_OUTCOME_LADDER.indexOf(kind) <= PROACTIVE_OUTCOME_LADDER.indexOf(grant);
}

/**
 * One choice offered to the user alongside a `question` / `review`
 * outcome. Mirrors the channel SPI's delivery-question option shape
 * (`{ label, value }`) so a messenger keyboard renders it directly.
 *
 * @stable
 */
export interface ProactiveOutcomeOption {
  /** Human-readable button label. */
  readonly label: string;
  /** Opaque value posted back on selection. */
  readonly value: string;
}

/** Fields shared by every rung. @stable */
export interface ProactiveOutcomeBase {
  /** Id of the proactive task (heartbeat id, cron task id) that fired. */
  readonly taskId: string;
  /** ISO-8601 instant of the fire that produced this outcome. */
  readonly firedAt: string;
  /**
   * The outbound text: the notification body, the question / review
   * context, or the act report. Outbound sanitization happens at the
   * delivery boundary, not here.
   */
  readonly text: string;
  /** Agent run id behind the outcome, when a run happened. */
  readonly runId?: string;
  /** Session the run executed in, when a run happened. */
  readonly sessionId?: string;
}

/** Fire-and-forget delivery - the default rung. @stable */
export interface ProactiveNotifyOutcome extends ProactiveOutcomeBase {
  readonly kind: 'notify';
}

/**
 * The task needs user input to continue. `ref` is the opaque HITL
 * resolve reference carried into messenger callback-data: a serialized
 * workflow awakeable address (`serializeAwakeableRef` from
 * `@graphorin/workflow`) or a serialized agent approval reference.
 *
 * @stable
 */
export interface ProactiveQuestionOutcome extends ProactiveOutcomeBase {
  readonly kind: 'question';
  readonly ref: string;
  readonly options?: ReadonlyArray<ProactiveOutcomeOption>;
}

/**
 * The task proposes an action and parks until the user approves or
 * rejects it - same resolve plumbing as `question`, different intent:
 * nothing has happened yet.
 *
 * @stable
 */
export interface ProactiveReviewOutcome extends ProactiveOutcomeBase {
  readonly kind: 'review';
  readonly ref: string;
  readonly options?: ReadonlyArray<ProactiveOutcomeOption>;
}

/**
 * The task acted on its own authority - side effects already happened
 * inside the run. Reachable only for tasks with an explicit
 * `grant: 'act'` AND an active memory ingest gate (both enforced
 * fail-closed by the proactive runner's config check).
 *
 * @stable
 */
export interface ProactiveActOutcome extends ProactiveOutcomeBase {
  readonly kind: 'act';
}

/**
 * Discriminated union over the four rungs - what a proactive fire
 * reports to `onOutcome` observers and what the ladder router consumes.
 *
 * @stable
 */
export type ProactiveOutcome =
  | ProactiveNotifyOutcome
  | ProactiveQuestionOutcome
  | ProactiveReviewOutcome
  | ProactiveActOutcome;
