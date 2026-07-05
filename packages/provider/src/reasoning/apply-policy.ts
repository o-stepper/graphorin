/**
 * `applyReasoningPolicy` - given a list of `Message`s and the resolved
 * {@link ReasoningRetention}, return a transformed list with
 * `reasoning` content parts treated according to the policy:
 *
 * - `'strip'`              - drop every `reasoning` content part.
 * - `'pass-through-claude'` - keep parts that carry Anthropic-shaped
 *   metadata (`provider === 'anthropic'` OR a `signature` field);
 *   drop the rest.
 * - `'pass-through-all'`   - keep every `reasoning` content part
 *   unchanged.
 *
 * The transformation is shallow: only the `assistant` role's content
 * arrays are inspected (the only role that legitimately carries
 * reasoning blocks).
 *
 * @packageDocumentation
 */

import type {
  AssistantMessage,
  Message,
  MessageContent,
  ReasoningContent,
  ReasoningRetention,
} from '@graphorin/core';

/**
 * Inputs to {@link applyReasoningPolicy}.
 *
 * @stable
 */
export interface ApplyReasoningPolicyInput {
  readonly messages: ReadonlyArray<Message>;
  readonly retention: ReasoningRetention;
}

/**
 * Apply the resolved retention policy to the provided messages.
 *
 * @stable
 */
export function applyReasoningPolicy(input: ApplyReasoningPolicyInput): ReadonlyArray<Message> {
  if (input.retention === 'pass-through-all') return input.messages;
  return input.messages.map((msg) => {
    if (msg.role !== 'assistant') return msg;
    return rewriteAssistantMessage(msg, input.retention);
  });
}

function rewriteAssistantMessage(
  msg: AssistantMessage,
  retention: ReasoningRetention,
): AssistantMessage {
  const content = msg.content;
  if (typeof content === 'string') return msg;
  const filtered: MessageContent[] = [];
  let mutated = false;
  for (const part of content) {
    if (part.type !== 'reasoning') {
      filtered.push(part);
      continue;
    }
    if (retention === 'strip') {
      mutated = true;
      continue;
    }
    if (retention === 'pass-through-claude') {
      if (isAnthropicShapedReasoning(part)) {
        filtered.push(part);
      } else {
        mutated = true;
      }
    }
  }
  if (!mutated) return msg;
  return {
    ...msg,
    content: filtered,
  };
}

function isAnthropicShapedReasoning(part: ReasoningContent): boolean {
  const meta = part.meta;
  if (meta === undefined) return false;
  if (meta.provider === 'anthropic') return true;
  if (typeof meta.signature === 'string' && meta.signature.length > 0) return true;
  return false;
}
