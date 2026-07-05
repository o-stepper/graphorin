/**
 * Coverage for the `stripCacheControlOnHit` policy of `withRedaction`.
 * When a hit lands inside an Anthropic prompt-cache span, the
 * `cache_control` marker MUST be stripped so the redacted prefix is
 * not replicated provider-side.
 */
import type { Provider, ProviderEvent, ProviderRequest, ProviderResponse } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import {
  type PromptRedactionViolation,
  withRedaction,
} from '../../src/middleware/with-redaction.js';

interface CapturingAdapter {
  provider: Provider;
  seen: ProviderRequest[];
}

function capturingAdapter(): CapturingAdapter {
  const seen: ProviderRequest[] = [];
  const provider: Provider = {
    name: 'capture',
    modelId: 'capture-model',
    capabilities: {
      streaming: true,
      toolCalling: false,
      parallelToolCalls: false,
      multimodal: false,
      structuredOutput: false,
      reasoning: false,
      contextWindow: 1024,
      maxOutput: 256,
    },
    async *stream(req: ProviderRequest): AsyncIterable<ProviderEvent> {
      seen.push(req);
      yield {
        type: 'finish' as const,
        finishReason: 'stop' as const,
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      };
    },
    async generate(req: ProviderRequest): Promise<ProviderResponse> {
      seen.push(req);
      return {
        text: 'ok',
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        finishReason: 'stop' as const,
      };
    },
  };
  return { provider, seen };
}

describe('withRedaction - stripCacheControlOnHit', () => {
  it('strips providerOptions.anthropic.cache_control when a regex pattern hits', async () => {
    const adapter = capturingAdapter();
    const wrapped = withRedaction({
      logger: () => undefined,
      trustClassOverride: 'public-tls',
      stripCacheControlOnHit: true,
    })(adapter.provider);
    await wrapped.generate({
      messages: [{ role: 'user', content: 'email me at user@example.com' }],
      providerOptions: {
        anthropic: { cache_control: { type: 'ephemeral' } },
      },
    });
    const opts = adapter.seen[0]?.providerOptions as
      | { anthropic?: { cache_control?: unknown } }
      | undefined;
    expect(opts?.anthropic?.cache_control).toBeUndefined();
    expect(opts?.anthropic).toBeDefined();
  });

  it('emits an `anthropic-cache-control-stripped` violation when the strip fires', async () => {
    const violations: PromptRedactionViolation[] = [];
    const adapter = capturingAdapter();
    const wrapped = withRedaction({
      logger: () => undefined,
      trustClassOverride: 'public-tls',
      stripCacheControlOnHit: true,
      onViolation: (v) => violations.push(v),
    })(adapter.provider);
    await wrapped.generate({
      messages: [{ role: 'user', content: 'leak: user@example.com' }],
      providerOptions: { anthropic: { cache_control: { type: 'ephemeral' } } },
    });
    expect(violations.some((v) => v.patternName === 'anthropic-cache-control-stripped')).toBe(true);
  });

  it('does NOT strip cache_control when no pattern fires', async () => {
    const adapter = capturingAdapter();
    const wrapped = withRedaction({
      logger: () => undefined,
      trustClassOverride: 'public-tls',
      stripCacheControlOnHit: true,
    })(adapter.provider);
    await wrapped.generate({
      messages: [{ role: 'user', content: 'all clean' }],
      providerOptions: {
        anthropic: { cache_control: { type: 'ephemeral' } },
      },
    });
    const opts = adapter.seen[0]?.providerOptions as
      | { anthropic?: { cache_control?: unknown } }
      | undefined;
    expect(opts?.anthropic?.cache_control).toEqual({ type: 'ephemeral' });
  });

  it('does NOT strip cache_control when stripCacheControlOnHit is explicitly disabled', async () => {
    const adapter = capturingAdapter();
    const wrapped = withRedaction({
      logger: () => undefined,
      trustClassOverride: 'public-tls',
      stripCacheControlOnHit: false,
    })(adapter.provider);
    await wrapped.generate({
      messages: [{ role: 'user', content: 'leak: user@example.com' }],
      providerOptions: { anthropic: { cache_control: { type: 'ephemeral' } } },
    });
    const opts = adapter.seen[0]?.providerOptions as
      | { anthropic?: { cache_control?: unknown } }
      | undefined;
    expect(opts?.anthropic?.cache_control).toEqual({ type: 'ephemeral' });
  });

  it('strips on a SecretValue brand hit (not just regex hits)', async () => {
    const adapter = capturingAdapter();
    const wrapped = withRedaction({
      logger: () => undefined,
      trustClassOverride: 'loopback',
      stripCacheControlOnHit: true,
    })(adapter.provider);
    const fakeSecret: Record<string | symbol, unknown> = {};
    fakeSecret[Symbol.for('graphorin.SecretValue')] = true;
    await wrapped.generate({
      messages: [
        {
          role: 'assistant',
          content: 'see arg',
          toolCalls: [{ toolCallId: 'c1', toolName: 't', args: { token: fakeSecret } }],
        },
      ],
      providerOptions: { anthropic: { cache_control: { type: 'ephemeral' } } },
    });
    const opts = adapter.seen[0]?.providerOptions as
      | { anthropic?: { cache_control?: unknown } }
      | undefined;
    expect(opts?.anthropic?.cache_control).toBeUndefined();
  });
});
