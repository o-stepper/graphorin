/**
 * Coverage for the per-family `inferReasoningContract` dispatcher
 * consumed by the cloud-LLM adapter (`vercelAdapter`).
 */
import { describe, expect, it } from 'vitest';

import {
  inferReasoningContract,
  REASONING_CONTRACT_RULES,
} from '../../src/reasoning/classify-contract.js';

describe('inferReasoningContract', () => {
  it.each([
    ['claude-haiku-4-5', 'round-trip-required'],
    ['claude-sonnet-4-5', 'round-trip-required'],
    ['claude-opus-4-7', 'round-trip-required'],
    ['anthropic.claude-sonnet-4-5-v1', 'round-trip-required'],
    ['anthropic.claude-opus-4-7-v1', 'round-trip-required'],
    ['o1', 'hidden'],
    ['o3-pro', 'hidden'],
    ['gemini-2.5-pro-preview-thinking', 'hidden'],
    ['gemini-flash-thinking', 'hidden'],
    ['gpt-4o', 'optional'],
    ['gpt-5.5', 'optional'],
    ['gemini-2.5-flash', 'optional'],
    ['gemini-2.5-pro', 'optional'],
    ['llama3.1:70b', 'optional'],
    ['unknown-model', 'optional'],
  ] as const)('%s → %s', (modelId, contract) => {
    expect(inferReasoningContract({ modelId })).toBe(contract);
  });

  it('honours an explicit anthropic provider hint even on a non-canonical modelId', () => {
    expect(
      inferReasoningContract({
        modelId: 'legacy-thinking-router',
        provider: 'anthropic',
      }),
    ).toBe('round-trip-required');
  });

  it('honours an explicit bedrock provider hint', () => {
    expect(inferReasoningContract({ modelId: 'custom-thinking', provider: 'bedrock' })).toBe(
      'round-trip-required',
    );
  });

  it("recognises the AI SDK's dotted provider ids (core-provider-11)", () => {
    // The AI SDK reports `model.provider` as 'anthropic.messages' /
    // 'amazon-bedrock.messages', not the bare vendor name.
    expect(
      inferReasoningContract({ modelId: 'legacy-alias', provider: 'anthropic.messages' }),
    ).toBe('round-trip-required');
    expect(
      inferReasoningContract({ modelId: 'legacy-alias', provider: 'amazon-bedrock.messages' }),
    ).toBe('round-trip-required');
  });

  it('classifies Bedrock cross-region inference-profile ids (core-provider-11)', () => {
    expect(
      inferReasoningContract({ modelId: 'us.anthropic.claude-sonnet-4-5-20250929-v1:0' }),
    ).toBe('round-trip-required');
    expect(inferReasoningContract({ modelId: 'eu.anthropic.claude-haiku-4-5-v1:0' })).toBe(
      'round-trip-required',
    );
  });

  it('returns optional for empty / non-string modelId', () => {
    expect(inferReasoningContract({ modelId: '' })).toBe('optional');
    expect(inferReasoningContract({ modelId: undefined as unknown as string })).toBe('optional');
  });

  it('strips provider prefixes via "/" and ":" but not http://', () => {
    expect(inferReasoningContract({ modelId: 'anthropic/claude-sonnet-4-5' })).toBe(
      'round-trip-required',
    );
    expect(inferReasoningContract({ modelId: 'openai:o1' })).toBe('hidden');
    expect(inferReasoningContract({ modelId: 'http://example.com/llama' })).toBe('optional');
  });

  it('exposes a frozen rule table that covers each canonical family', () => {
    expect(Object.isFrozen(REASONING_CONTRACT_RULES)).toBe(true);
    const families = new Set(REASONING_CONTRACT_RULES.map((r) => r.family));
    expect(families.has('anthropic-claude')).toBe(true);
    expect(families.has('bedrock-claude')).toBe(true);
    expect(families.has('openai-reasoning')).toBe(true);
    expect(families.has('gemini-reasoning')).toBe(true);
  });
});
