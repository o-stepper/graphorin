/**
 * Graphorin v0.6.0 — MIT License — Copyright (c) 2026 Oleksiy Stepurenko
 *
 * The `submit_expense` tool the Slack-bot stub agent invokes. The tool
 * is `'side-effecting'` (it would, in production, write a row to the
 * finance system) and gates execution behind the framework's HITL
 * approval flow when the expensed amount exceeds the configured
 * threshold (DEC-018 default: $100). Approved invocations return the
 * canonical `{ approved: true, ref: 'EXP-...' }` payload the stub
 * provider matches against to emit the final assistant message.
 */

import type { Tool, ZodLikeSchema } from '@graphorin/core';
import { tool } from '@graphorin/tools';

/** Default approval threshold (in dollars). Mirrors DEC-018. */
export const DEFAULT_APPROVAL_THRESHOLD_USD = 100 as const;

/** Result envelope returned by the approved branch. */
export interface SubmitExpenseResult {
  readonly approved: boolean;
  readonly ref: string;
  readonly amount: number;
  readonly justification: string;
}

/** Input shape accepted by the `submit_expense` tool. */
export interface SubmitExpenseInput {
  readonly amount: number;
  readonly justification: string;
}

/**
 * Hand-rolled `ZodLikeSchema` for the tool's input. Avoids a direct
 * `zod` import (the example does not declare a `zod` dependency) and
 * still satisfies the runtime's `ZodLikeSchema` contract — the agent
 * runtime only requires `parse(...)` / `safeParse(...)` plus a tiny
 * `toJSON()` duck-typed surface so the provider sees a valid JSON
 * Schema.
 */
const SubmitExpenseSchema: ZodLikeSchema<SubmitExpenseInput> & {
  toJSON(): Readonly<Record<string, unknown>>;
} = {
  parse(value) {
    const result = this.safeParse(value);
    if (!result.success) {
      throw new TypeError(`submit_expense input invalid: ${result.error.message}`);
    }
    return result.data;
  },
  safeParse(value) {
    if (typeof value !== 'object' || value === null) {
      return {
        success: false as const,
        error: makeIssue([], 'submit_expense input must be an object.'),
      };
    }
    const v = value as { readonly amount?: unknown; readonly justification?: unknown };
    if (typeof v.amount !== 'number' || !Number.isFinite(v.amount) || v.amount < 0) {
      return {
        success: false as const,
        error: makeIssue(['amount'], 'amount must be a non-negative finite number.'),
      };
    }
    if (
      typeof v.justification !== 'string' ||
      v.justification.length === 0 ||
      v.justification.length > 280
    ) {
      return {
        success: false as const,
        error: makeIssue(['justification'], 'justification must be a 1-280 character string.'),
      };
    }
    return {
      success: true as const,
      data: { amount: v.amount, justification: v.justification },
    };
  },
  toJSON() {
    return {
      type: 'object',
      properties: {
        amount: { type: 'number', minimum: 0 },
        justification: { type: 'string', minLength: 1, maxLength: 280 },
      },
      required: ['amount', 'justification'],
      additionalProperties: false,
    };
  },
};

function makeIssue(path: ReadonlyArray<string | number>, message: string) {
  return Object.freeze({
    name: 'ZodLikeError' as const,
    message,
    issues: Object.freeze([Object.freeze({ path, message })]),
  });
}

/** Inputs accepted by {@link createSubmitExpenseTool}. */
export interface CreateSubmitExpenseToolOptions {
  /** Override the auto-approve threshold. Defaults to {@link DEFAULT_APPROVAL_THRESHOLD_USD}. */
  readonly approvalThresholdUsd?: number;
  /**
   * Override the canonical reference id generator. Tests inject a
   * deterministic counter; production callers leave this off.
   */
  readonly newRef?: () => string;
}

/**
 * Build the `submit_expense` tool. The tool's execute branch is reached
 * only when (a) the amount sits below the approval threshold OR (b) the
 * agent runtime resumed with an approval directive — at the resume
 * boundary the runtime synthesizes a tool result message itself and
 * skips re-execution, so this branch only fires for low-value
 * submissions in v0.1.
 */
export function createSubmitExpenseTool(
  options: CreateSubmitExpenseToolOptions = {},
): Tool<SubmitExpenseInput, SubmitExpenseResult> {
  const threshold = options.approvalThresholdUsd ?? DEFAULT_APPROVAL_THRESHOLD_USD;
  const newRef = options.newRef ?? defaultRefFactory();
  return tool<SubmitExpenseInput, SubmitExpenseResult>({
    name: 'submit_expense',
    description:
      'Submit an expense report to the finance system. ' +
      `Submissions above $${threshold} require human approval.`,
    inputSchema: SubmitExpenseSchema,
    sideEffectClass: 'side-effecting',
    needsApproval: (input) => input.amount > threshold,
    async execute(input) {
      const ref = newRef();
      return {
        approved: true,
        ref,
        amount: input.amount,
        justification: input.justification,
      };
    },
  });
}

function defaultRefFactory(): () => string {
  let n = 1;
  return () => {
    const id = `EXP-${String(n).padStart(4, '0')}`;
    n += 1;
    return id;
  };
}
