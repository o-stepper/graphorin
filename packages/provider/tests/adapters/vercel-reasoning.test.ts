/**
 * Coverage for the `vercelAdapter` reasoning preflight: the adapter
 * auto-detects the reasoning contract from the model id and applies
 * `applyReasoningPolicy` to outbound `req.messages` before forwarding
 * to the AI SDK.
 */
import type { AssistantMessage, ProviderRequest } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import {
  type AISDKChunk,
  type VercelRuntimeOverrides,
  vercelAdapter,
} from '../../src/adapters/vercel.js';

function chunksToStream(chunks: ReadonlyArray<AISDKChunk>): {
  fullStream: AsyncIterable<AISDKChunk>;
} {
  return {
    fullStream: (async function* () {
      for (const c of chunks) yield c;
    })(),
  };
}

function makeOverrides(args: {
  capture?: { lastArgs?: Record<string, unknown> };
}): VercelRuntimeOverrides {
  return {
    streamText: (callArgs) => {
      if (args.capture !== undefined) args.capture.lastArgs = { ...callArgs };
      return chunksToStream([]);
    },
    generateText: async (callArgs) => {
      if (args.capture !== undefined) args.capture.lastArgs = { ...callArgs };
      return { text: '' };
    },
  };
}

const ANTHROPIC_HISTORY: ProviderRequest = {
  messages: [
    { role: 'user', content: 'plan the next step' },
    {
      role: 'assistant',
      content: [
        {
          type: 'reasoning',
          text: 'thinking out loud',
          meta: { provider: 'anthropic', signature: 'sig-1' },
        },
        { type: 'text', text: 'answer' },
      ],
    } as AssistantMessage,
  ],
};

describe('vercelAdapter - reasoningContract auto-detection', () => {
  it('declares round-trip-required for Anthropic Claude models', () => {
    const adapter = vercelAdapter(
      { provider: 'fixture', modelId: 'claude-sonnet-4-5' },
      { runtimeOverrides: makeOverrides({}) },
    );
    expect(adapter.capabilities.reasoningContract).toBe('round-trip-required');
  });

  it('declares hidden for OpenAI o1 / o3 reasoning models', () => {
    const o1 = vercelAdapter(
      { provider: 'fixture', modelId: 'o1' },
      { runtimeOverrides: makeOverrides({}) },
    );
    expect(o1.capabilities.reasoningContract).toBe('hidden');
    const o3 = vercelAdapter(
      { provider: 'fixture', modelId: 'o3-pro' },
      { runtimeOverrides: makeOverrides({}) },
    );
    expect(o3.capabilities.reasoningContract).toBe('hidden');
  });

  it('declares hidden for Gemini reasoning variants', () => {
    const adapter = vercelAdapter(
      { provider: 'fixture', modelId: 'gemini-2.5-pro-preview-thinking' },
      { runtimeOverrides: makeOverrides({}) },
    );
    expect(adapter.capabilities.reasoningContract).toBe('hidden');
  });

  it('declares optional for unknown / OSS models', () => {
    const adapter = vercelAdapter(
      { provider: 'ollama', modelId: 'llama3.1:70b' },
      { runtimeOverrides: makeOverrides({}) },
    );
    expect(adapter.capabilities.reasoningContract).toBe('optional');
  });

  it('explicit reasoningContract override on capabilities wins', () => {
    const adapter = vercelAdapter(
      { provider: 'fixture', modelId: 'claude-sonnet-4-5' },
      {
        runtimeOverrides: makeOverrides({}),
        capabilities: { reasoningContract: 'optional' },
      },
    );
    expect(adapter.capabilities.reasoningContract).toBe('optional');
  });
});

describe('vercelAdapter - reasoning preflight', () => {
  it('Anthropic adapter (round-trip-required) keeps Anthropic-shaped reasoning by default', async () => {
    const capture: { lastArgs?: Record<string, unknown> } = {};
    const adapter = vercelAdapter(
      { provider: 'fixture', modelId: 'claude-sonnet-4-5' },
      { runtimeOverrides: makeOverrides({ capture }) },
    );
    for await (const _ of adapter.stream(ANTHROPIC_HISTORY)) void _;
    const messages = capture.lastArgs?.messages as ReadonlyArray<AssistantMessage> | undefined;
    const assistant = messages?.find((m) => m.role === 'assistant');
    const parts = assistant?.content as ReadonlyArray<{ type: string }>;
    expect(parts.some((p) => p.type === 'reasoning')).toBe(true);
  });

  it('o1 adapter (hidden → strip default) drops every reasoning part', async () => {
    const capture: { lastArgs?: Record<string, unknown> } = {};
    const adapter = vercelAdapter(
      { provider: 'fixture', modelId: 'o1' },
      { runtimeOverrides: makeOverrides({ capture }) },
    );
    for await (const _ of adapter.stream(ANTHROPIC_HISTORY)) void _;
    const messages = capture.lastArgs?.messages as ReadonlyArray<AssistantMessage> | undefined;
    const assistant = messages?.find((m) => m.role === 'assistant');
    const parts = assistant?.content as ReadonlyArray<{ type: string }>;
    expect(parts.some((p) => p.type === 'reasoning')).toBe(false);
  });

  it('per-request reasoningRetention=strip on an Anthropic adapter overrides the contract default', async () => {
    const capture: { lastArgs?: Record<string, unknown> } = {};
    const adapter = vercelAdapter(
      { provider: 'fixture', modelId: 'claude-sonnet-4-5' },
      { runtimeOverrides: makeOverrides({ capture }) },
    );
    for await (const _ of adapter.stream({ ...ANTHROPIC_HISTORY, reasoningRetention: 'strip' })) {
      void _;
    }
    const messages = capture.lastArgs?.messages as ReadonlyArray<AssistantMessage> | undefined;
    const assistant = messages?.find((m) => m.role === 'assistant');
    const parts = assistant?.content as ReadonlyArray<{ type: string }>;
    expect(parts.some((p) => p.type === 'reasoning')).toBe(false);
  });

  it('per-request reasoningRetention=pass-through-all on an o1 adapter preserves all reasoning', async () => {
    const capture: { lastArgs?: Record<string, unknown> } = {};
    const adapter = vercelAdapter(
      { provider: 'fixture', modelId: 'o1' },
      { runtimeOverrides: makeOverrides({ capture }) },
    );
    for await (const _ of adapter.stream({
      ...ANTHROPIC_HISTORY,
      reasoningRetention: 'pass-through-all',
    })) {
      void _;
    }
    const messages = capture.lastArgs?.messages as ReadonlyArray<AssistantMessage> | undefined;
    const assistant = messages?.find((m) => m.role === 'assistant');
    const parts = assistant?.content as ReadonlyArray<{ type: string }>;
    expect(parts.some((p) => p.type === 'reasoning')).toBe(true);
  });
});
