/**
 * Coverage for `withRedaction` — pattern detection, masking, fail-closed
 * behaviour, SecretValue brand detection, per-trust-class scoping, and
 * stream-side observability scanning. All tests use the
 * `trustClassOverride` injection hook so the suite never has to fake a
 * real `acceptsSensitivity` plumbing.
 */
import type {
  AssistantMessage,
  Message,
  Provider,
  ProviderEvent,
  ProviderRequest,
  ProviderResponse,
  SystemMessage,
  ToolMessage,
  UserMessage,
} from '@graphorin/core';
import { SECRET_VALUE_BRAND } from '@graphorin/core';
import { BUILT_IN_PATTERNS } from '@graphorin/observability/redaction/patterns';
import { describe, expect, it } from 'vitest';

import { PromptRedactionError } from '../../src/errors/errors.js';
import {
  type PromptRedactionViolation,
  withRedaction,
} from '../../src/middleware/with-redaction.js';

interface CapturingAdapter {
  provider: Provider;
  seen: ProviderRequest[];
}

function capturingAdapter(events?: ReadonlyArray<ProviderEvent>): CapturingAdapter {
  const seen: ProviderRequest[] = [];
  const provider: Provider = {
    name: 'capture',
    modelId: 'capture-model',
    capabilities: {
      streaming: true,
      toolCalling: true,
      parallelToolCalls: false,
      multimodal: false,
      structuredOutput: false,
      reasoning: false,
      contextWindow: 1024,
      maxOutput: 256,
    },
    async *stream(req: ProviderRequest): AsyncIterable<ProviderEvent> {
      seen.push(req);
      const out =
        events ??
        ([
          { type: 'text-delta', delta: 'ok' },
          {
            type: 'finish',
            finishReason: 'stop',
            usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          },
        ] as ReadonlyArray<ProviderEvent>);
      for (const ev of out) yield ev;
    },
    async generate(req: ProviderRequest): Promise<ProviderResponse> {
      seen.push(req);
      return {
        text: 'ok',
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        finishReason: 'stop',
      };
    },
  };
  return { provider, seen };
}

const SYSTEM_WITH_KEY: SystemMessage = {
  role: 'system',
  content: 'support: sk-AAAAAAAAAAAAAAAAAAAAAAAAAAAA',
};
const USER_WITH_EMAIL: UserMessage = {
  role: 'user',
  content: 'email me at user@example.com please',
};
const ASSISTANT_WITH_TOOL_CALL: AssistantMessage = {
  role: 'assistant',
  content: 'see args',
  toolCalls: [
    {
      toolCallId: 'c1',
      toolName: 'lookup',
      args: { contact: 'lead@example.com', nested: { again: 'ping@example.com' } },
    },
  ],
};
const TOOL_RESPONSE: ToolMessage = {
  role: 'tool',
  toolCallId: 'c1',
  content: 'response with email leak: hello@example.com',
};

function buildReq(messages: ReadonlyArray<Message>, systemMessage?: string): ProviderRequest {
  return {
    messages,
    ...(systemMessage !== undefined ? { systemMessage } : {}),
  };
}

async function consume(stream: AsyncIterable<ProviderEvent>): Promise<ProviderEvent[]> {
  const out: ProviderEvent[] = [];
  for await (const ev of stream) out.push(ev);
  return out;
}

describe('withRedaction — default action: redact', () => {
  it('replaces email addresses with the [REDACTED <name>] mask', async () => {
    const adapter = capturingAdapter();
    const wrapped = withRedaction({
      logger: () => undefined,
      trustClassOverride: 'public-tls',
    })(adapter.provider);
    await wrapped.generate(buildReq([USER_WITH_EMAIL]));
    const userMsg = adapter.seen[0]?.messages[0];
    expect(typeof (userMsg as UserMessage).content).toBe('string');
    expect((userMsg as UserMessage).content as string).toContain('[REDACTED email]');
    expect((userMsg as UserMessage).content as string).not.toContain('user@example.com');
  });

  it('scrubs the system message in addition to user content', async () => {
    const adapter = capturingAdapter();
    const wrapped = withRedaction({
      logger: () => undefined,
      trustClassOverride: 'public-tls',
    })(adapter.provider);
    await wrapped.generate(buildReq([], SYSTEM_WITH_KEY.content));
    const systemMessage = adapter.seen[0]?.systemMessage;
    expect(systemMessage).toContain('[REDACTED openai-key]');
    expect(systemMessage).not.toContain('sk-AAAAAAAAAAAAAAAAAAAAAAAAAAAA');
  });

  it('walks nested tool-call args objects and scrubs string values', async () => {
    const adapter = capturingAdapter();
    const wrapped = withRedaction({
      logger: () => undefined,
      trustClassOverride: 'public-tls',
    })(adapter.provider);
    await wrapped.generate(buildReq([ASSISTANT_WITH_TOOL_CALL]));
    const assistant = adapter.seen[0]?.messages[0] as AssistantMessage;
    const args = assistant.toolCalls?.[0]?.args as {
      contact: string;
      nested: { again: string };
    };
    expect(args.contact).toContain('[REDACTED email]');
    expect(args.nested.again).toContain('[REDACTED email]');
  });

  it('reports violations through the onViolation hook with sanitised metadata', async () => {
    const violations: PromptRedactionViolation[] = [];
    const adapter = capturingAdapter();
    const wrapped = withRedaction({
      logger: () => undefined,
      trustClassOverride: 'public-tls',
      onViolation: (v) => violations.push(v),
    })(adapter.provider);
    await wrapped.generate(buildReq([USER_WITH_EMAIL]));
    expect(violations.length).toBeGreaterThan(0);
    const v = violations[0];
    expect(v?.patternName).toBe('email');
    expect(v?.fieldPath).toContain('messages[0].content');
    expect(v?.role).toBe('user');
    expect(v?.matchLength).toBeGreaterThan(0);
  });

  it('scrubs tool-message content', async () => {
    const adapter = capturingAdapter();
    const wrapped = withRedaction({
      logger: () => undefined,
      trustClassOverride: 'public-tls',
    })(adapter.provider);
    await wrapped.generate(buildReq([TOOL_RESPONSE]));
    const tool = adapter.seen[0]?.messages[0] as ToolMessage;
    expect(typeof tool.content).toBe('string');
    expect(tool.content as string).toContain('[REDACTED email]');
  });

  it('scrubs structured user content (text parts)', async () => {
    const adapter = capturingAdapter();
    const wrapped = withRedaction({
      logger: () => undefined,
      trustClassOverride: 'public-tls',
    })(adapter.provider);
    const msg: UserMessage = {
      role: 'user',
      content: [{ type: 'text', text: 'reach me at lead@example.com' }],
    };
    await wrapped.generate(buildReq([msg]));
    const user = adapter.seen[0]?.messages[0] as UserMessage;
    const parts = user.content as ReadonlyArray<{ type: string; text: string }>;
    expect(parts[0]?.text).toContain('[REDACTED email]');
  });
});

describe('withRedaction — failClosed', () => {
  it('throws PromptRedactionError on the first hit when failClosed: true', async () => {
    const adapter = capturingAdapter();
    const wrapped = withRedaction({
      logger: () => undefined,
      failClosed: true,
      trustClassOverride: 'public-tls',
    })(adapter.provider);
    await expect(wrapped.generate(buildReq([USER_WITH_EMAIL]))).rejects.toBeInstanceOf(
      PromptRedactionError,
    );
    expect(adapter.seen).toHaveLength(0);
  });

  it('honours per-trust-class failClosed: true override', async () => {
    const adapter = capturingAdapter();
    const wrapped = withRedaction({
      logger: () => undefined,
      byTrustClass: { 'public-tls': { failClosed: true } },
      trustClassOverride: 'public-tls',
    })(adapter.provider);
    await expect(wrapped.generate(buildReq([USER_WITH_EMAIL]))).rejects.toBeInstanceOf(
      PromptRedactionError,
    );
  });
});

describe('withRedaction — SecretValue brand detection', () => {
  it('detects an opaque SecretValue-shaped object inside tool-call args', async () => {
    const violations: PromptRedactionViolation[] = [];
    const adapter = capturingAdapter();
    const wrapped = withRedaction({
      logger: () => undefined,
      trustClassOverride: 'public-tls',
      onViolation: (v) => violations.push(v),
    })(adapter.provider);
    const fakeSecret: { [k: string]: unknown } = { reveal: () => 'x' };
    fakeSecret[SECRET_VALUE_BRAND as unknown as string] = true;
    Object.defineProperty(fakeSecret, SECRET_VALUE_BRAND, {
      value: true,
      enumerable: true,
    });
    const msg: AssistantMessage = {
      role: 'assistant',
      content: 'see secret',
      toolCalls: [{ toolCallId: 'c1', toolName: 'auth', args: { token: fakeSecret } }],
    };
    await wrapped.generate(buildReq([msg]));
    expect(violations.some((v) => v.patternName === 'graphorin-secret-value')).toBe(true);
  });
});

describe('withRedaction — loopback scope', () => {
  it('defaults loopback to secret-value-only and skips regex hits', async () => {
    const adapter = capturingAdapter();
    const wrapped = withRedaction({
      logger: () => undefined,
      trustClassOverride: 'loopback',
    })(adapter.provider);
    await wrapped.generate(buildReq([USER_WITH_EMAIL]));
    const user = adapter.seen[0]?.messages[0] as UserMessage;
    expect(user.content as string).toContain('user@example.com');
  });

  it('still detects SecretValue brands even in secret-value-only scope', async () => {
    const violations: PromptRedactionViolation[] = [];
    const adapter = capturingAdapter();
    const wrapped = withRedaction({
      logger: () => undefined,
      trustClassOverride: 'loopback',
      onViolation: (v) => violations.push(v),
    })(adapter.provider);
    const fakeSecret: { [k: string]: unknown } = {};
    Object.defineProperty(fakeSecret, SECRET_VALUE_BRAND, {
      value: true,
      enumerable: true,
    });
    const msg: AssistantMessage = {
      role: 'assistant',
      content: 'x',
      toolCalls: [{ toolCallId: 'c1', toolName: 't', args: { token: fakeSecret } }],
    };
    await wrapped.generate(buildReq([msg]));
    expect(violations.some((v) => v.patternName === 'graphorin-secret-value')).toBe(true);
  });
});

describe('withRedaction — stream-side scanning', () => {
  it('emits violations on text-delta chunks but does NOT mutate the delta', async () => {
    const violations: PromptRedactionViolation[] = [];
    const adapter = capturingAdapter([
      { type: 'text-delta', delta: 'leaked email: user@example.com' },
      {
        type: 'finish',
        finishReason: 'stop',
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      },
    ]);
    const wrapped = withRedaction({
      logger: () => undefined,
      trustClassOverride: 'public-tls',
      onViolation: (v) => violations.push(v),
    })(adapter.provider);
    const events = await consume(wrapped.stream(buildReq([])));
    const delta = events.find((e) => e.type === 'text-delta');
    expect((delta as { delta: string } | undefined)?.delta).toBe('leaked email: user@example.com');
    const responseHits = violations.filter((v) => v.fieldPath === 'response.text-delta');
    expect(responseHits.length).toBeGreaterThan(0);
    expect(responseHits[0]?.patternName).toBe('email');
  });
});

describe('withRedaction — pattern catalogue surface', () => {
  it('uses the same shared BUILT_IN_PATTERNS array exported by @graphorin/observability', () => {
    expect(Array.isArray(BUILT_IN_PATTERNS)).toBe(true);
    const names = BUILT_IN_PATTERNS.map((p) => p.name);
    expect(names).toContain('email');
    expect(names).toContain('openai-key');
  });
});
