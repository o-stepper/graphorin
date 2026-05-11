/**
 * Coverage for the `applyReasoningPolicy` filter applied by every
 * adapter at request preflight.
 */
import type { AssistantMessage, Message } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import { applyReasoningPolicy } from '../../src/reasoning/apply-policy.js';

const ANTHROPIC_REASONING: AssistantMessage = {
  role: 'assistant',
  content: [
    { type: 'reasoning', text: 'thought-a', meta: { provider: 'anthropic', signature: 'sig-1' } },
    { type: 'text', text: 'final answer' },
  ],
};

const BARE_REASONING: AssistantMessage = {
  role: 'assistant',
  content: [
    { type: 'reasoning', text: 'thought-b' },
    { type: 'text', text: 'plain answer' },
  ],
};

const ASSISTANT_STRING: AssistantMessage = {
  role: 'assistant',
  content: 'plain string content',
};

describe('applyReasoningPolicy', () => {
  it('strip → drops every reasoning content part on assistant messages', () => {
    const out = applyReasoningPolicy({
      messages: [ANTHROPIC_REASONING, BARE_REASONING],
      retention: 'strip',
    });
    for (const msg of out) {
      if (msg.role !== 'assistant') continue;
      if (typeof msg.content === 'string') continue;
      expect(msg.content.some((p) => p.type === 'reasoning')).toBe(false);
    }
  });

  it('pass-through-claude → keeps Anthropic-shaped reasoning, drops bare reasoning', () => {
    const out = applyReasoningPolicy({
      messages: [ANTHROPIC_REASONING, BARE_REASONING],
      retention: 'pass-through-claude',
    });
    const first = out[0] as AssistantMessage;
    const firstParts = first.content as ReadonlyArray<{ type: string }>;
    expect(firstParts.some((p) => p.type === 'reasoning')).toBe(true);
    const second = out[1] as AssistantMessage;
    const secondParts = second.content as ReadonlyArray<{ type: string }>;
    expect(secondParts.some((p) => p.type === 'reasoning')).toBe(false);
  });

  it('pass-through-all → returns the input unchanged (referential equality)', () => {
    const messages: ReadonlyArray<Message> = [ANTHROPIC_REASONING, BARE_REASONING];
    const out = applyReasoningPolicy({ messages, retention: 'pass-through-all' });
    expect(out).toBe(messages);
  });

  it('leaves non-assistant messages untouched', () => {
    const messages: ReadonlyArray<Message> = [
      { role: 'user', content: 'hi' },
      { role: 'tool', toolCallId: 'c1', content: 'r' },
    ];
    const out = applyReasoningPolicy({ messages, retention: 'strip' });
    expect(out).toEqual(messages);
  });

  it('leaves assistant messages with string content untouched', () => {
    const out = applyReasoningPolicy({
      messages: [ASSISTANT_STRING],
      retention: 'strip',
    });
    expect(out[0]).toEqual(ASSISTANT_STRING);
  });

  it('treats reasoning with only `data` (no provider, no signature) as bare', () => {
    const ambiguous: AssistantMessage = {
      role: 'assistant',
      content: [{ type: 'reasoning', text: 'ambiguous', meta: { data: 'x' } }],
    };
    const out = applyReasoningPolicy({
      messages: [ambiguous],
      retention: 'pass-through-claude',
    });
    const parts = (out[0] as AssistantMessage).content as ReadonlyArray<{ type: string }>;
    expect(parts.some((p) => p.type === 'reasoning')).toBe(false);
  });
});
