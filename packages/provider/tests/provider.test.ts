/**
 * Coverage for `createProvider` — the canonical Provider wrapper.
 */
import type { Provider, ProviderRequest } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import { createProvider } from '../src/provider.js';

const REQ: ProviderRequest = { messages: [{ role: 'user', content: 'hi' }] };

function makeAdapter(args: {
  readonly acceptsSensitivity?: ReadonlyArray<'public' | 'internal' | 'secret'>;
  readonly reasoningContract?: 'hidden' | 'round-trip-required' | 'optional';
  readonly recorder?: ProviderRequest[];
  readonly hasCountTokens?: boolean;
}): Provider {
  return {
    name: 'fixture',
    modelId: 'fixture-model',
    capabilities: {
      streaming: true,
      toolCalling: false,
      parallelToolCalls: false,
      multimodal: false,
      structuredOutput: false,
      reasoning: false,
      contextWindow: 1024,
      maxOutput: 256,
      ...(args.reasoningContract !== undefined
        ? { reasoningContract: args.reasoningContract }
        : {}),
    },
    ...(args.acceptsSensitivity !== undefined
      ? { acceptsSensitivity: args.acceptsSensitivity }
      : {}),
    async *stream(req) {
      args.recorder?.push(req);
      yield {
        type: 'finish',
        finishReason: 'stop',
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      };
    },
    async generate(req) {
      args.recorder?.push(req);
      return {
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        finishReason: 'stop',
      };
    },
    ...(args.hasCountTokens === true
      ? {
          async countTokens(_req) {
            return 42;
          },
        }
      : {}),
  };
}

describe('createProvider', () => {
  it('forwards the adapter name + modelId verbatim', () => {
    const wrapped = createProvider(makeAdapter({}));
    expect(wrapped.name).toBe('fixture');
    expect(wrapped.modelId).toBe('fixture-model');
  });

  it('overrides acceptsSensitivity when supplied', () => {
    const wrapped = createProvider(makeAdapter({ acceptsSensitivity: ['public', 'internal'] }), {
      acceptsSensitivity: ['public'],
    });
    expect(wrapped.acceptsSensitivity).toEqual(['public']);
  });

  it('falls through to adapter.acceptsSensitivity when caller omits it', () => {
    const wrapped = createProvider(makeAdapter({ acceptsSensitivity: ['public', 'internal'] }));
    expect(wrapped.acceptsSensitivity).toEqual(['public', 'internal']);
  });

  it('omits acceptsSensitivity when both adapter and option are unset', () => {
    const wrapped = createProvider(makeAdapter({}));
    expect(wrapped.acceptsSensitivity).toBeUndefined();
  });

  it('merges capability overrides onto the adapter defaults', () => {
    const wrapped = createProvider(makeAdapter({}), {
      capabilities: { multimodal: true, contextWindow: 9_999 },
    });
    expect(wrapped.capabilities.multimodal).toBe(true);
    expect(wrapped.capabilities.contextWindow).toBe(9_999);
    // Untouched fields are preserved from the adapter.
    expect(wrapped.capabilities.streaming).toBe(true);
  });

  it('forwards reasoningRetention overrides onto every request', async () => {
    const recorder: ProviderRequest[] = [];
    const adapter = makeAdapter({ recorder, reasoningContract: 'optional' });
    const wrapped = createProvider(adapter, { reasoningRetention: 'pass-through-claude' });
    await wrapped.generate(REQ);
    expect(recorder[0]?.reasoningRetention).toBe('pass-through-claude');
  });

  it('respects the per-request reasoningRetention override over the createProvider default', async () => {
    const recorder: ProviderRequest[] = [];
    const adapter = makeAdapter({ recorder });
    const wrapped = createProvider(adapter, { reasoningRetention: 'strip' });
    await wrapped.generate({ ...REQ, reasoningRetention: 'pass-through-claude' });
    expect(recorder[0]?.reasoningRetention).toBe('pass-through-claude');
  });

  it('auto-resolves reasoningRetention from the adapter contract when no overrides set', async () => {
    const recorder: ProviderRequest[] = [];
    const adapter = makeAdapter({ recorder, reasoningContract: 'round-trip-required' });
    const wrapped = createProvider(adapter);
    await wrapped.generate(REQ);
    expect(recorder[0]?.reasoningRetention).toBe('pass-through-claude');
  });

  it('passes the request through unchanged when the resolved retention equals the request value', async () => {
    const recorder: ProviderRequest[] = [];
    const adapter = makeAdapter({ recorder, reasoningContract: 'hidden' });
    const wrapped = createProvider(adapter);
    const reqWithRetention: ProviderRequest = { ...REQ, reasoningRetention: 'strip' };
    await wrapped.generate(reqWithRetention);
    // Identity of req object is preserved when no defaults change.
    expect(recorder[0]).toBe(reqWithRetention);
  });

  it('exposes countTokens when the adapter declares one', async () => {
    const wrapped = createProvider(makeAdapter({ hasCountTokens: true }));
    expect(typeof wrapped.countTokens).toBe('function');
    expect(await wrapped.countTokens?.(REQ)).toBe(42);
  });

  it('omits countTokens when the adapter does not expose one', () => {
    const wrapped = createProvider(makeAdapter({}));
    expect(wrapped.countTokens).toBeUndefined();
  });
});
