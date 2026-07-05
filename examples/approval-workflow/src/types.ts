/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Public types for the `approval-workflow` example. Captures the
 * expense-approval state shape, the input contract accepted by
 * `runApprovalDemo(...)`, the resume-time decision payload threaded
 * through `Directive({ resume })`, plus the canonical node-name and
 * threshold constants the workflow factory references.
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
