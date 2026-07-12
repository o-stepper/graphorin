/**
 * Escalation-ladder routing (C3): turn a typed `ProactiveOutcome` into
 * a channel delivery payload, and build awakeable-parked outcomes for
 * workflow-based tasks.
 *
 * The payload shape structurally mirrors `@graphorin/channels`'
 * `DeliveryPayload` - this package deliberately takes NO dependency on
 * the channels package (the gateway is one possible sink; a bot may
 * route outcomes anywhere). Compile-time compatibility is pinned by a
 * test with the channels package as a devDependency.
 *
 * @packageDocumentation
 */

import type {
  ProactiveOutcome,
  ProactiveOutcomeOption,
  ProactiveQuestionOutcome,
  ProactiveReviewOutcome,
} from '@graphorin/core';
import { serializeAwakeableRef } from '@graphorin/workflow';

/** Structural mirror of the channels SPI identity triple. @stable */
export interface ProactiveDeliveryIdentity {
  readonly channelId: string;
  readonly accountId: string;
  readonly peerId: string;
}

/**
 * Structural mirror of `@graphorin/channels`' `DeliveryPayload` - what
 * `ChannelGateway.deliver(...)` accepts.
 *
 * @stable
 */
export interface ProactiveDeliveryPayload {
  readonly identity: ProactiveDeliveryIdentity;
  readonly text: string;
  readonly question?: {
    readonly prompt: string;
    readonly options: ReadonlyArray<{ readonly label: string; readonly value: string }>;
    readonly ref: string;
  };
}

const DEFAULT_QUESTION_OPTIONS: ReadonlyArray<ProactiveOutcomeOption> = Object.freeze([
  Object.freeze({ label: 'Approve', value: 'approve' }),
  Object.freeze({ label: 'Deny', value: 'deny' }),
]);

/**
 * Route an outcome onto a channel delivery (C3): `notify` / `act` are
 * plain text; `question` / `review` carry the HITL question block
 * whose `ref` rides into messenger callback-data. The gateway
 * outbound-sanitizes at its own boundary - this function only shapes.
 *
 * @stable
 */
export function outcomeToDelivery(
  outcome: ProactiveOutcome,
  identity: ProactiveDeliveryIdentity,
): ProactiveDeliveryPayload {
  if (outcome.kind === 'question' || outcome.kind === 'review') {
    return {
      identity,
      text: outcome.text,
      question: {
        prompt: outcome.text,
        options: outcome.options ?? DEFAULT_QUESTION_OPTIONS,
        ref: outcome.ref,
      },
    };
  }
  return { identity, text: outcome.text };
}

/**
 * Build a `question` / `review` outcome for a task parked inside a
 * durable WORKFLOW (`awaitExternal` / `requestApproval`): the resolve
 * ref is the serialized awakeable address (`wf:<workflowId>:<threadId>:
 * <name>`, decision D-1/A3), resolved through the existing
 * `POST /v1/workflows/:id/resume` route and ticked by the workflow
 * timer-daemon - this package composes with that daemon, it never
 * re-hosts it (D-9).
 *
 * @stable
 */
export function workflowAwakeableOutcome(args: {
  readonly kind: 'question' | 'review';
  readonly taskId: string;
  readonly workflowId: string;
  readonly threadId: string;
  readonly name: string;
  readonly text: string;
  readonly options?: ReadonlyArray<ProactiveOutcomeOption>;
  readonly firedAt?: string;
  readonly sessionId?: string;
}): ProactiveQuestionOutcome | ProactiveReviewOutcome {
  const ref = serializeAwakeableRef({
    workflowId: args.workflowId,
    threadId: args.threadId,
    name: args.name,
  });
  return {
    kind: args.kind,
    taskId: args.taskId,
    firedAt: args.firedAt ?? new Date().toISOString(),
    text: args.text,
    ref,
    options: args.options ?? DEFAULT_QUESTION_OPTIONS,
    ...(args.sessionId !== undefined ? { sessionId: args.sessionId } : {}),
  };
}
