/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Hand-rolled deterministic stub `Provider` for the secure-replay-agent
 * example. Each agent run consumes a pre-scripted list of turns: a turn
 * is either a tool-call batch or a final text reply, optionally with an
 * explicit `Usage` record. `stream(...)` yields the canonical provider
 * event sequence (`stream-start`, `text-delta`, the tool-call trio,
 * `finish`); `generate(...)` consumes the same cursor and returns the
 * one-shot `ProviderResponse` shape. No sockets, no child processes, no
 * disk I/O - the whole example stays offline and byte-deterministic.
 *
 * Two extras keep the stub honest and load-bearing:
 *
 * - every request is checked against the transcript well-formedness
 *   invariant real providers enforce (a dangling `tool_use` or an orphan
 *   tool message throws instead of regressing silently);
 * - `anchoredCacheLegs` on a turn are reported on the `finish` usage
 *   ONLY when the incoming request actually carries
 *   `cachePolicy: { breakpoints: 'auto' }` - proving the agent forwarded
 *   the configured cache policy on the wire (stage 3 of the demo).
 */

import type {
  Message,
  Provider,
  ProviderCapabilities,
  ProviderEvent,
  ProviderRequest,
  ProviderResponse,
  ToolCall,
  Usage,
} from '@graphorin/core';

/** One scripted model turn: a tool-call batch and/or a text reply. */
export interface ScriptedTurn {
  /** Assistant text emitted as a single `text-delta`. */
  readonly text?: string;
  /** Tool calls the "model" requests this turn. */
  readonly toolCalls?: ReadonlyArray<ToolCall>;
  /** Usage reported on `finish`. Defaults to a small non-zero record. */
  readonly usage?: Usage;
  /**
   * Prompt-cache legs reported ONLY when the request carries
   * `cachePolicy: { breakpoints: 'auto' }` (the agent's `cachePolicy`
   * is forwarded verbatim on every `ProviderRequest`). With a stub
   * provider the legs are scripted - the point is that they ride the
   * same `Usage` fields (`cacheWriteTokens` / `cachedReadTokens`) a
   * real Anthropic-path adapter would fill in.
   */
  readonly anchoredCacheLegs?: {
    readonly cachedReadTokens?: number;
    readonly cacheWriteTokens?: number;
  };
}

/** The stub `Provider` plus introspection hooks used by the demo/tests. */
export interface ScriptedProvider extends Provider {
  /** Every request the stub served, in order (post `createProvider` defaults). */
  readonly requests: ReadonlyArray<ProviderRequest>;
  /** Number of scripted turns consumed so far. */
  turnsServed(): number;
}

const STUB_CAPABILITIES: ProviderCapabilities = Object.freeze({
  streaming: true,
  toolCalling: true,
  parallelToolCalls: true,
  multimodal: false,
  structuredOutput: true,
  reasoning: false,
  contextWindow: 200_000,
  maxOutput: 8_192,
  reasoningContract: 'optional',
});

const DEFAULT_USAGE: Usage = Object.freeze({
  promptTokens: 12,
  completionTokens: 8,
  totalTokens: 20,
});

/**
 * Transcript well-formedness invariant (mirrors the discipline of the
 * framework's own mock harness): every assistant `toolCalls` entry must
 * be resolved by a later `role: 'tool'` message, and every tool message
 * must reference a previously announced `toolCallId`. Real providers
 * reject violations with a 400, so the stub must too.
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
          `scripted provider: tool message at index ${index} references toolCallId ` +
            `'${message.toolCallId}' that no preceding assistant message announced`,
        );
      }
      resolved.add(message.toolCallId);
    }
  });
  const dangling = [...announced].filter((id) => !resolved.has(id));
  if (dangling.length > 0) {
    throw new Error(
      `scripted provider: assistant tool call(s) [${dangling.join(', ')}] have no matching ` +
        'tool message (a real provider rejects this request)',
    );
  }
}

/** Build the `finish` usage for a turn, applying cache legs when anchored. */
function turnUsage(turn: ScriptedTurn, anchored: boolean): Usage {
  const base: Usage = turn.usage !== undefined ? { ...turn.usage } : { ...DEFAULT_USAGE };
  if (!anchored || turn.anchoredCacheLegs === undefined) return base;
  return {
    ...base,
    ...(turn.anchoredCacheLegs.cachedReadTokens !== undefined
      ? { cachedReadTokens: turn.anchoredCacheLegs.cachedReadTokens }
      : {}),
    ...(turn.anchoredCacheLegs.cacheWriteTokens !== undefined
      ? { cacheWriteTokens: turn.anchoredCacheLegs.cacheWriteTokens }
      : {}),
  };
}

/**
 * Build a scripted stub `Provider`. `stream(...)` and `generate(...)`
 * consume the same turn cursor, so a script drives exactly one agent
 * run regardless of which surface the loop uses.
 */
export function createScriptedProvider(
  turns: ReadonlyArray<ScriptedTurn>,
  options: { readonly modelId?: string } = {},
): ScriptedProvider {
  const modelId = options.modelId ?? 'secure-replay-stub';
  const requests: ProviderRequest[] = [];
  let cursor = 0;

  function nextTurn(req: ProviderRequest): ScriptedTurn | undefined {
    assertWellFormedTranscript(req.messages);
    requests.push(req);
    const turn = turns[cursor];
    cursor += 1;
    return turn;
  }

  const provider: Provider = {
    name: 'scripted-stub',
    modelId,
    capabilities: STUB_CAPABILITIES,
    acceptsSensitivity: ['public', 'internal', 'secret'],
    async *stream(req: ProviderRequest): AsyncIterable<ProviderEvent> {
      const turn = nextTurn(req);
      if (turn === undefined) {
        yield {
          type: 'error',
          error: {
            kind: 'unknown',
            message: `scripted provider exhausted after ${turns.length} turn(s)`,
          },
        };
        return;
      }
      yield { type: 'stream-start', metadata: { providerName: 'scripted-stub', modelId } };
      if (turn.text !== undefined && turn.text.length > 0) {
        yield { type: 'text-delta', delta: turn.text };
      }
      for (const call of turn.toolCalls ?? []) {
        yield { type: 'tool-call-start', toolCallId: call.toolCallId, toolName: call.toolName };
        yield {
          type: 'tool-call-input-delta',
          toolCallId: call.toolCallId,
          argsDelta: JSON.stringify(call.args),
        };
        yield { type: 'tool-call-end', toolCallId: call.toolCallId, finalArgs: call.args };
      }
      yield {
        type: 'finish',
        finishReason: (turn.toolCalls?.length ?? 0) > 0 ? 'tool-calls' : 'stop',
        usage: turnUsage(turn, req.cachePolicy?.breakpoints === 'auto'),
      };
    },
    async generate(req: ProviderRequest): Promise<ProviderResponse> {
      const turn = nextTurn(req);
      if (turn === undefined) {
        throw new Error(`scripted provider exhausted after ${turns.length} turn(s)`);
      }
      return {
        ...(turn.text !== undefined ? { text: turn.text } : {}),
        ...(turn.toolCalls !== undefined && turn.toolCalls.length > 0
          ? { toolCalls: turn.toolCalls.map((call) => ({ ...call })) }
          : {}),
        usage: turnUsage(turn, req.cachePolicy?.breakpoints === 'auto'),
        finishReason: (turn.toolCalls?.length ?? 0) > 0 ? 'tool-calls' : 'stop',
      };
    },
  };

  return Object.assign(provider, {
    requests,
    turnsServed: () => cursor,
  });
}
