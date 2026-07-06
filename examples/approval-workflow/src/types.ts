/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Public types for the `approval-workflow` example. Captures the
 * expense-approval state shape, the input contract accepted by
 * `runApprovalDemo(...)`, the resume-time decision payload threaded
 * through `Directive({ resume })`, plus the canonical node-name and
 * threshold constants the workflow factory references. Also carries
 * the types of the companion `expense-settlement` workflow - the
 * durable-primitives stage built on `sleepFor(...)` (durable timer)
 * and `awaitExternal(...)` (awakeable).
 */

/** Submission inputs accepted by the workflow's first execute call. */
export interface ExpenseInput {
  readonly amount: number;
  readonly submitter: string;
  readonly justification?: string;
}

/**
 * Workflow state shape carried across every checkpoint. `amount` and
 * `submitter` echo the operator-supplied input; `approved`, `reason`,
 * and `processedAt` are populated by the runtime as the pipeline
 * progresses; `notifications` is an append-only audit log driven by a
 * `listAggregate` channel.
 */
export interface ExpenseState {
  amount: number;
  submitter: string;
  justification?: string;
  approved?: boolean;
  reason?: string;
  processedAt?: string;
  notifications: ReadonlyArray<string>;
}

/**
 * Resume payload delivered to the paused `auto-approve-or-pause` node
 * via `new Directive({ resume: { ... } })`. The same shape doubles as
 * the auto-approve fast-path return value, so a single typed branch
 * inside `decide.run` handles both paths.
 */
export interface ApprovalDecision {
  readonly approved: boolean;
  readonly reason: string;
}

/** Pause payload emitted when the workflow suspends for manual review. */
export interface ManualReviewPause {
  readonly reason: 'manual-review';
  readonly amount: number;
  readonly submitter: string;
}

/** Canonical node names - referenced by edges, tests, and README docs. */
export const NODE_NAMES = {
  receive: 'receive',
  decide: 'auto-approve-or-pause',
  process: 'process-approved',
  notify: 'notify',
} as const;

export type NodeName = (typeof NODE_NAMES)[keyof typeof NODE_NAMES];

/** Auto-approve fast-path threshold (in dollars). */
export const AUTO_APPROVE_THRESHOLD = 100 as const;

/** Submission input accepted by the settlement workflow's execute call. */
export interface SettlementInput {
  readonly batchId: string;
}

/**
 * State carried by the `expense-settlement` workflow - the durable-
 * primitives stage. `batchId` echoes the input; `settledAt`,
 * `confirmedBy`, and `reference` are populated by the `hold-for-
 * settlement` node once the durable timer has fired and the awakeable
 * has been resolved; `log` mirrors the approval pipeline's append-only
 * audit trail.
 */
export interface SettlementState {
  batchId: string;
  settledAt?: string;
  confirmedBy?: string;
  reference?: string;
  log: ReadonlyArray<string>;
}

/**
 * Payload an external system (the demo's stand-in payment provider)
 * delivers via `workflow.resolveAwakeable(threadId,
 * SETTLEMENT_AWAKEABLE, confirmation)`. The suspended
 * `awaitExternal(...)` call inside `hold-for-settlement` returns it
 * verbatim as the call's value.
 */
export interface SettlementConfirmation {
  readonly confirmedBy: string;
  readonly reference: string;
}

/** Canonical node names of the settlement workflow. */
export const SETTLEMENT_NODE_NAMES = {
  hold: 'hold-for-settlement',
  archive: 'archive-batch',
} as const;

export type SettlementNodeName = (typeof SETTLEMENT_NODE_NAMES)[keyof typeof SETTLEMENT_NODE_NAMES];

/** Awakeable name the external settlement confirmation resolves. */
export const SETTLEMENT_AWAKEABLE = 'settlement-confirmed' as const;

/**
 * Durable-timer hold applied before a settlement batch may be
 * confirmed. Deliberately short: the CLI demo and the smoke test wait
 * the timer out for real (it is durable, not mocked) while keeping the
 * added wall time well under a second.
 */
export const SETTLEMENT_HOLD_MS = 80 as const;
