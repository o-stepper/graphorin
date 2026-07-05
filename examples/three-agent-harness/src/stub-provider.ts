/**
 * Graphorin v0.6.0 — MIT License — Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Deterministic stub `Provider` for the three-agent-harness smoke
 * test. The same `Provider` instance powers all three roles
 * (Planner / Generator / Evaluator) — it dispatches on the system
 * prompt's role marker, fans the response out per role, and yields
 * a single `text-delta` followed by a zero-usage `finish`. No
 * sockets, no child processes, no disk I/O.
 *
 * The role-specific replies are tuned so the
 * `evaluatorOptimizer({...})` self-revision loop converges on
 * iteration 1 (Evaluator returns `{ score: 9, pass: true }`) and the
 * Generator's text matches `LRU_FIXTURE_SOURCE` byte-for-byte so the
 * smoke test can assert end-to-end.
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
import { LRU_FIXTURE_SOURCE } from './lru-fixture.js';

const STUB_CAPABILITIES: ProviderCapabilities = Object.freeze({
  streaming: true,
  toolCalling: false,
  parallelToolCalls: false,
  multimodal: false,
  structuredOutput: false,
  reasoning: false,
  contextWindow: 8_192,
  maxOutput: 4_096,
  reasoningContract: 'optional',
});

/** Marker substrings the stub looks for inside the system prompt. */
export const ROLE_MARKERS = Object.freeze({
  planner: '[role:planner]',
  generator: '[role:generator]',
  evaluator: '[role:evaluator]',
  webSearch: '[role:web-search]',
  comparisonJudge: '[role:comparison-judge]',
});

/** Canonical Planner reply emitted by the stub. */
export const PLANNER_REPLY = 'PLAN: 1) define LRU interface; 2) implement; 3) test';

/** Canonical Evaluator reply (parses to `{ score: 9, pass: true }`). */
export const EVALUATOR_REPLY = '{"score": 9, "critique": "OK", "pass": true}';

/** Canonical Comparison-judge reply for the research-and-decide variant. */
export const COMPARISON_JUDGE_REPLY =
  'Per-key reentrant locks scale better than a global mutex. ' +
  'Reads can interleave per shard while writes still serialize per key. ' +
  'A global mutex serializes throughput linearly with contention.';

/** Canonical Generator reply: matches `LRU_FIXTURE_SOURCE`. */
export const GENERATOR_REPLY = LRU_FIXTURE_SOURCE;

/** Per-role canonical web-search snippets for the fan-out variant. */
export const WEB_SEARCH_REPLIES: ReadonlyArray<string> = Object.freeze([
  'Source A: per-key locks reduce contention in concurrent caches.',
  'Source B: a global mutex serializes all reads; throughput drops linearly with cores.',
  'Source C: per-key reentrant locks combine the best of both worlds.',
]);

/**
 * Pick the role for a request by inspecting the system prompt for a
 * `[role:*]` marker. Falls back to `'generator'` (the most common
 * one in the harness) when nothing matches.
 */
export function classifyRequest(req: ProviderRequest): keyof typeof ROLE_MARKERS {
  const sys = systemPrompt(req.messages);
  if (sys.includes(ROLE_MARKERS.planner)) return 'planner';
  if (sys.includes(ROLE_MARKERS.evaluator)) return 'evaluator';
  if (sys.includes(ROLE_MARKERS.webSearch)) return 'webSearch';
  if (sys.includes(ROLE_MARKERS.comparisonJudge)) return 'comparisonJudge';
  return 'generator';
}

/**
 * Build the deterministic reply for the supplied request. Exposed
 * so callers can assert on the same string the stream yields.
 */
export function stubReply(req: ProviderRequest): string {
  const role = classifyRequest(req);
  switch (role) {
    case 'planner':
      return PLANNER_REPLY;
    case 'generator':
      return GENERATOR_REPLY;
    case 'evaluator':
      return EVALUATOR_REPLY;
    case 'comparisonJudge':
      return COMPARISON_JUDGE_REPLY;
    case 'webSearch': {
      const idx = pickWebSearchIndex(req.messages);
      return WEB_SEARCH_REPLIES[idx % WEB_SEARCH_REPLIES.length] as string;
    }
    default: {
      const _exhaustive: never = role;
      void _exhaustive;
      return '';
    }
  }
}

/**
 * Build a stub `Provider`. Every call to `stream(...)` and
 * `generate(...)` emits a single `text-delta` containing the
 * role-appropriate reply followed by a zero-usage `finish`.
 */
export function createStubProvider(options: { readonly modelId?: string } = {}): Provider {
  const modelId = options.modelId ?? 'three-agent-harness-stub';
  const provider: Provider = {
    name: 'stub',
    modelId,
    capabilities: STUB_CAPABILITIES,
    acceptsSensitivity: ['public', 'internal', 'secret'],
    async *stream(req: ProviderRequest): AsyncIterable<ProviderEvent> {
      yield { type: 'stream-start', metadata: { providerName: 'stub', modelId } };
      yield { type: 'text-delta', delta: stubReply(req) };
      yield { type: 'finish', finishReason: 'stop', usage: zeroUsage() };
    },
    async generate(req: ProviderRequest): Promise<ProviderResponse> {
      return {
        text: stubReply(req),
        usage: zeroUsage(),
        finishReason: 'stop',
      };
    },
  };
  return provider;
}

function systemPrompt(messages: ReadonlyArray<Message>): string {
  for (const m of messages) {
    if (m.role === 'system') return m.content;
  }
  return '';
}

/**
 * Pick a deterministic-but-distinct index for each `[child:N]`
 * marker carried in the user message. Lets the harness fan out
 * three sibling web-search agents and have each one return a
 * different snippet from {@link WEB_SEARCH_REPLIES}.
 */
function pickWebSearchIndex(messages: ReadonlyArray<Message>): number {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const m = messages[i];
    if (m === undefined || m.role !== 'user') continue;
    const text = typeof m.content === 'string' ? m.content : '';
    const match = text.match(/\[child:(\d+)\]/);
    if (match !== null && match[1] !== undefined) {
      return Number.parseInt(match[1], 10);
    }
  }
  return 0;
}
