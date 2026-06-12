/**
 * Internal HTTP helpers shared across the local-LLM adapters.
 *
 * @internal
 */

import type { ProviderEvent } from '@graphorin/core';

import { ProviderHttpError } from '../errors/errors.js';

/**
 * Convert a graphorin `Message` to the OpenAI-compatible chat-completion
 * shape. The shape is the lingua-franca of the bundled local adapters
 * (`llamaCppServerAdapter` and `openAICompatibleAdapter`); the
 * native-Ollama path uses its own conversion.
 *
 * @internal
 */
export function toOpenAIChatMessages(
  messages: ReadonlyArray<{
    readonly role: 'system' | 'user' | 'assistant' | 'tool';
    readonly content: string | ReadonlyArray<unknown>;
    readonly toolCalls?: ReadonlyArray<{
      readonly toolCallId: string;
      readonly toolName: string;
      readonly args: unknown;
    }>;
    readonly toolCallId?: string;
  }>,
): ReadonlyArray<Record<string, unknown>> {
  return messages.map((msg) => {
    const out: Record<string, unknown> = {
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content : flattenContent(msg.content),
    };
    if (msg.toolCalls !== undefined && msg.toolCalls.length > 0) {
      out.tool_calls = msg.toolCalls.map((tc) => ({
        id: tc.toolCallId,
        type: 'function',
        function: {
          name: tc.toolName,
          arguments: typeof tc.args === 'string' ? tc.args : JSON.stringify(tc.args),
        },
      }));
    }
    if (msg.role === 'tool' && msg.toolCallId !== undefined) {
      out.tool_call_id = msg.toolCallId;
    }
    return out;
  });
}

/**
 * Convert a graphorin `Message` to Ollama's **native** `/api/chat` shape
 * (PS-13). Unlike the OpenAI form, Ollama's Go server expects `tool_calls`
 * with object `arguments` (a `map[string]any`, never a JSON string) and no
 * `id` / `type` fields — sending those breaks its unmarshaller and any
 * multi-turn replay of assistant tool calls.
 *
 * @internal
 */
export function toOllamaChatMessages(
  messages: ReadonlyArray<{
    readonly role: 'system' | 'user' | 'assistant' | 'tool';
    readonly content: string | ReadonlyArray<unknown>;
    readonly toolCalls?: ReadonlyArray<{
      readonly toolCallId: string;
      readonly toolName: string;
      readonly args: unknown;
    }>;
    readonly toolCallId?: string;
  }>,
): ReadonlyArray<Record<string, unknown>> {
  return messages.map((msg) => {
    const out: Record<string, unknown> = {
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content : flattenContent(msg.content),
    };
    if (msg.toolCalls !== undefined && msg.toolCalls.length > 0) {
      out.tool_calls = msg.toolCalls.map((tc) => ({
        function: {
          name: tc.toolName,
          arguments: toArgsObject(tc.args),
        },
      }));
    }
    return out;
  });
}

/**
 * Coerce a tool-call `args` value into the object map Ollama expects. Strings
 * (e.g. an OpenAI-style JSON blob produced upstream) are parsed leniently;
 * anything that isn't a JSON object becomes `{}`.
 */
function toArgsObject(args: unknown): Record<string, unknown> {
  if (typeof args === 'string') {
    try {
      const parsed: unknown = JSON.parse(args);
      return typeof parsed === 'object' && parsed !== null
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }
  return typeof args === 'object' && args !== null ? (args as Record<string, unknown>) : {};
}

function flattenContent(parts: ReadonlyArray<unknown>): string {
  const buffer: string[] = [];
  for (const part of parts) {
    if (typeof part === 'string') {
      buffer.push(part);
      continue;
    }
    if (typeof part === 'object' && part !== null) {
      const obj = part as { type?: string; text?: string };
      if (obj.type === 'text' && typeof obj.text === 'string') {
        buffer.push(obj.text);
      }
    }
  }
  return buffer.join('');
}

/**
 * Wrap a `fetch` call with HTTP error mapping. The helper does not
 * assume any particular streaming format — callers receive the raw
 * `Response` and dispatch on its body.
 *
 * @internal
 */
/**
 * Default per-request timeout for the baseUrl adapters (PS-24). Scoped
 * to time-to-response (headers): the timer is cleared the moment the
 * server answers, so long streaming bodies are never killed — only a
 * hung server that never responds. Generous because a cold local
 * llama-server can take tens of seconds to load a model.
 *
 * @stable
 */
export const DEFAULT_REQUEST_TIMEOUT_MS = 120_000;

export async function callJsonHttp(args: {
  readonly providerName: string;
  readonly url: string;
  readonly headers: Record<string, string>;
  readonly body: unknown;
  readonly signal?: AbortSignal;
  readonly fetchImpl?: typeof fetch;
  /**
   * Time-to-response budget (PS-24). Default
   * {@link DEFAULT_REQUEST_TIMEOUT_MS}; `0` disables.
   */
  readonly timeoutMs?: number;
}): Promise<Response> {
  const fetchImpl = args.fetchImpl ?? globalThis.fetch.bind(globalThis);
  const timeoutMs = args.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  const timeoutCtl = timeoutMs > 0 ? new AbortController() : undefined;
  const timer =
    timeoutCtl !== undefined ? setTimeout(() => timeoutCtl.abort(), timeoutMs) : undefined;
  const signal =
    args.signal !== undefined && timeoutCtl !== undefined
      ? AbortSignal.any([args.signal, timeoutCtl.signal])
      : (args.signal ?? timeoutCtl?.signal);
  let resp: Response;
  try {
    resp = await fetchImpl(args.url, {
      method: 'POST',
      headers: args.headers,
      body: JSON.stringify(args.body),
      ...(signal !== undefined ? { signal } : {}),
    });
  } catch (cause) {
    if (timeoutCtl?.signal.aborted === true && args.signal?.aborted !== true) {
      throw new ProviderHttpError({
        providerName: args.providerName,
        status: 0,
        message: `request timed out after ${timeoutMs}ms reaching ${args.url}`,
        cause,
      });
    }
    throw new ProviderHttpError({
      providerName: args.providerName,
      status: 0,
      message: `network error reaching ${args.url}`,
      cause,
    });
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
  if (!resp.ok) {
    const detail = await safeReadText(resp);
    throw new ProviderHttpError({
      providerName: args.providerName,
      status: resp.status,
      message: detail.length > 0 ? detail : resp.statusText,
    });
  }
  return resp;
}

async function safeReadText(resp: Response): Promise<string> {
  try {
    return await resp.text();
  } catch {
    return '';
  }
}

/**
 * Yield a `stream-start` `ProviderEvent` for an HTTP adapter.
 *
 * @internal
 */
export function makeStreamStartEvent(args: {
  readonly providerName: string;
  readonly modelId: string;
  readonly responseId?: string;
}): ProviderEvent {
  return {
    type: 'stream-start',
    metadata: {
      providerName: args.providerName,
      modelId: args.modelId,
      ...(args.responseId !== undefined ? { responseId: args.responseId } : {}),
      createdAt: new Date().toISOString(),
    },
  };
}
