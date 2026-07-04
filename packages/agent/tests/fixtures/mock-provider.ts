import type {
  Message,
  Provider,
  ProviderEvent,
  ProviderRequest,
  ProviderResponse,
} from '@graphorin/core';

export interface MockProviderScript {
  readonly events: ReadonlyArray<ProviderEvent>;
}

/**
 * Transcript well-formedness invariant (agent-01 / tools-07 /
 * context-engine-01): a provider request is structurally valid only when
 *
 *  1. every `toolCallId` announced by an assistant message's `toolCalls`
 *     has a matching `role:'tool'` message later in the buffer (a
 *     "dangling tool_use" 400s OpenAI-compatible servers and Anthropic
 *     alike, and `invalid-request` is fallback-ineligible); and
 *  2. every `role:'tool'` message references a `toolCallId` announced by
 *     a PRECEDING assistant message (an "orphan tool message" — e.g. a
 *     compaction slice that dropped the assistant partner — is equally
 *     rejected).
 *
 * Real providers enforce this; the mock harness must too, or the loop can
 * regress silently. Throws with a precise diagnostic on violation.
 */
export function assertWellFormedTranscript(messages: ReadonlyArray<Message>): void {
  const announced = new Set<string>();
  const resolved = new Set<string>();
  messages.forEach((message, index) => {
    if (message.role === 'assistant' && message.toolCalls !== undefined) {
      for (const call of message.toolCalls) announced.add(call.toolCallId);
    } else if (message.role === 'tool') {
      if (!announced.has(message.toolCallId)) {
        throw new Error(
          `malformed transcript: tool message at index ${index} references toolCallId ` +
            `'${message.toolCallId}' that no preceding assistant message announced (orphan tool message)`,
        );
      }
      resolved.add(message.toolCallId);
    }
  });
  const dangling = [...announced].filter((id) => !resolved.has(id));
  if (dangling.length > 0) {
    throw new Error(
      `malformed transcript: assistant tool call(s) [${dangling.join(', ')}] have no ` +
        'matching tool message (dangling tool_use — a real provider rejects this request)',
    );
  }
}

/**
 * In-memory stub provider used by tests. Each call to `stream(...)`
 * pops the next script from the supplied queue and yields its
 * events. Useful for testing the agent loop's event handling +
 * usage accounting without bringing in the real Vercel adapter.
 *
 * Every request is checked against {@link assertWellFormedTranscript}
 * by default (opt out with `assertWellFormed: false` for tests that
 * deliberately construct malformed states).
 */
export function createMockProvider(args: {
  readonly modelId: string;
  readonly name?: string;
  readonly scripts: ReadonlyArray<MockProviderScript>;
  readonly contextWindow?: number;
  readonly assertWellFormed?: boolean;
}): Provider & { readonly scriptsConsumed: () => number } {
  let cursor = 0;
  const provider: Provider = {
    name: args.name ?? 'mock',
    modelId: args.modelId,
    capabilities: {
      streaming: true,
      toolCalling: true,
      parallelToolCalls: true,
      multimodal: false,
      structuredOutput: true,
      reasoning: false,
      contextWindow: args.contextWindow ?? 200000,
      maxOutput: 8192,
    },
    async *stream(req: ProviderRequest): AsyncIterable<ProviderEvent> {
      if (args.assertWellFormed !== false) assertWellFormedTranscript(req.messages);
      const idx = cursor++;
      const script = args.scripts[idx];
      if (script === undefined) {
        yield {
          type: 'error',
          error: { kind: 'unknown', message: `mock provider: no script for call #${idx}` },
        };
        return;
      }
      for (const ev of script.events) {
        yield ev;
      }
    },
    async generate(_req: ProviderRequest): Promise<ProviderResponse> {
      throw new Error('mock provider: generate(...) not implemented; use stream(...).');
    },
  };
  return Object.assign(provider, { scriptsConsumed: () => cursor });
}

export function textOnlyScript(text: string, totalTokens = 10): MockProviderScript {
  const events: ProviderEvent[] = [
    { type: 'stream-start', metadata: { providerName: 'mock', modelId: 'mock' } },
    { type: 'text-delta', delta: text },
    {
      type: 'finish',
      finishReason: 'stop',
      usage: {
        promptTokens: Math.max(1, Math.floor(totalTokens / 2)),
        completionTokens: Math.max(1, Math.floor(totalTokens / 2)),
        totalTokens,
      },
    },
  ];
  return { events };
}

export function toolCallScript(args: {
  readonly text?: string;
  readonly toolCallId: string;
  readonly toolName: string;
  readonly args: unknown;
  readonly totalTokens?: number;
}): MockProviderScript {
  const events: ProviderEvent[] = [
    { type: 'stream-start', metadata: { providerName: 'mock', modelId: 'mock' } },
  ];
  if (args.text !== undefined) {
    events.push({ type: 'text-delta', delta: args.text });
  }
  events.push(
    { type: 'tool-call-start', toolCallId: args.toolCallId, toolName: args.toolName },
    {
      type: 'tool-call-input-delta',
      toolCallId: args.toolCallId,
      argsDelta: JSON.stringify(args.args),
    },
    { type: 'tool-call-end', toolCallId: args.toolCallId, finalArgs: args.args },
    {
      type: 'finish',
      finishReason: 'tool-calls',
      usage: {
        promptTokens: Math.max(1, Math.floor((args.totalTokens ?? 10) / 2)),
        completionTokens: Math.max(1, Math.floor((args.totalTokens ?? 10) / 2)),
        totalTokens: args.totalTokens ?? 10,
      },
    },
  );
  return { events };
}

export function errorScript(args: {
  readonly kind: 'rate-limit' | 'capacity' | 'context-length' | 'transient' | 'unknown';
  readonly message?: string;
}): MockProviderScript {
  return {
    events: [
      { type: 'stream-start', metadata: { providerName: 'mock', modelId: 'mock' } },
      {
        type: 'error',
        error: { kind: args.kind, message: args.message ?? `simulated ${args.kind}` },
      },
    ],
  };
}
