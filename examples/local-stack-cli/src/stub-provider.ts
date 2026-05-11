/**
 * Graphorin v0.1.0 — MIT License — Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Deterministic stub `Provider` for the local-stack-cli smoke test.
 * The stub never opens a socket, never spawns a child process, and
 * never reads from disk — it inspects the inbound `ProviderRequest`,
 * finds the most recent user message, and yields a single
 * `text-delta` followed by a zero-usage `finish`. Smoke coverage
 * therefore runs without any LLM dependency. The echo prefix is
 * `'local-echo: '` so it is unambiguous which example produced the
 * output when both example test suites run in parallel.
 */

import type {
  Message,
  Provider,
  ProviderCapabilities,
  ProviderEvent,
  ProviderRequest,
  ProviderResponse,
} from '@graphorin/core';
import { zeroUsage } from '@graphorin/core';

const STUB_CAPABILITIES: ProviderCapabilities = Object.freeze({
  streaming: true,
  toolCalling: false,
  parallelToolCalls: false,
  multimodal: false,
  structuredOutput: false,
  reasoning: false,
  contextWindow: 8_192,
  maxOutput: 1_024,
  reasoningContract: 'optional',
});

/** Prefix the stub prepends to every echoed reply. */
export const STUB_ECHO_PREFIX = 'local-echo: ';

/**
 * Build the deterministic echo reply for the supplied request.
 * Exposed so the smoke test asserts on the same string the stream
 * yields.
 */
export function stubEchoReply(req: ProviderRequest): string {
  const last = lastUserText(req.messages);
  return `${STUB_ECHO_PREFIX}${last}`;
}

/**
 * Build a stub `Provider`. Every call to `stream(...)` and
 * `generate(...)` emits a single `text-delta` containing
 * `'local-echo: ' + lastUserText` followed by a zero-usage `finish`.
 */
export function createStubProvider(options: { readonly modelId?: string } = {}): Provider {
  const modelId = options.modelId ?? 'local-stack-stub';
  const provider: Provider = {
    name: 'stub',
    modelId,
    capabilities: STUB_CAPABILITIES,
    acceptsSensitivity: ['public', 'internal', 'secret'],
    async *stream(req: ProviderRequest): AsyncIterable<ProviderEvent> {
      yield { type: 'stream-start', metadata: { providerName: 'stub', modelId } };
      yield { type: 'text-delta', delta: stubEchoReply(req) };
      yield { type: 'finish', finishReason: 'stop', usage: zeroUsage() };
    },
    async generate(req: ProviderRequest): Promise<ProviderResponse> {
      return {
        text: stubEchoReply(req),
        usage: zeroUsage(),
        finishReason: 'stop',
      };
    },
  };
  return provider;
}

function lastUserText(messages: ReadonlyArray<Message>): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const m = messages[i];
    if (m === undefined || m.role !== 'user') continue;
    if (typeof m.content === 'string') return m.content;
    const parts: string[] = [];
    for (const part of m.content) {
      if (part.type === 'text') parts.push(part.text);
    }
    if (parts.length > 0) return parts.join(' ');
  }
  return '';
}
