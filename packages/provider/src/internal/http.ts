/**
 * Internal HTTP helpers shared across the local-LLM adapters.
 *
 * @internal
 */

import type { ProviderEvent } from '@graphorin/core';

import { ProviderHttpError } from '../errors/errors.js';

/**
 * Conversion options for the local-adapter message converters.
 * `multimodal` mirrors the adapter instance's effective
 * `capabilities.multimodal`; `warn` receives ONE message per convert
 * call when parts were dropped (adapters dedupe it to once per
 * instance).
 *
 * @internal
 */
export interface ChatMessageConversionOptions {
  readonly multimodal: boolean;
  readonly warn?: (message: string) => void;
}

const TEXT_ONLY: ChatMessageConversionOptions = { multimodal: false };

/**
 * Convert a graphorin `Message` to the OpenAI-compatible chat-completion
 * shape. The shape is the lingua-franca of the bundled local adapters
 * (`llamaCppServerAdapter` and `openAICompatibleAdapter`); the
 * native-Ollama path uses its own conversion.
 *
 * With `opts.multimodal === true` image parts are emitted as
 * OpenAI `image_url` content parts (bytes as a data URI, `URL`s passed
 * through as strings - the server dereferences; this adapter never
 * fetches). Audio/file parts have no portable wire form on
 * OpenAI-compatible servers and are dropped LOUDLY. With
 * `multimodal: false` (the default) content flattens to a plain string
 * exactly as before, and any dropped non-text part triggers the warn.
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
  opts: ChatMessageConversionOptions = TEXT_ONLY,
): ReadonlyArray<Record<string, unknown>> {
  const dropped = new Set<string>();
  const converted = messages.map((msg) => {
    // REASONING-01: a reasoning part is present only because the effective
    // retention kept it (buildAssistantMessage). Round-trip it onto the wire's
    // reasoning slot instead of dropping it - openai-compatible servers that
    // support extended reasoning read `reasoning_content` on assistant input.
    const reasoning: string[] = [];
    const out: Record<string, unknown> = {
      role: msg.role,
      content:
        typeof msg.content === 'string'
          ? msg.content
          : opts.multimodal
            ? toOpenAIParts(msg.content, dropped, reasoning)
            : flattenContent(msg.content, dropped, reasoning),
    };
    if (reasoning.length > 0) out.reasoning_content = reasoning.join('');
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
  warnDropped(opts, dropped);
  return converted;
}

/** Build the OpenAI `content` parts array for a vision model. */
function toOpenAIParts(
  parts: ReadonlyArray<unknown>,
  dropped: Set<string>,
  reasoning?: string[],
): ReadonlyArray<Record<string, unknown>> {
  const out: Record<string, unknown>[] = [];
  for (const part of parts) {
    if (typeof part === 'string') {
      out.push({ type: 'text', text: part });
      continue;
    }
    if (typeof part !== 'object' || part === null) continue;
    const obj = part as { type?: string; text?: string; image?: unknown; mimeType?: string };
    if (obj.type === 'text' && typeof obj.text === 'string') {
      out.push({ type: 'text', text: obj.text });
      continue;
    }
    // REASONING-01: reasoning has no content-part slot; the caller lifts it
    // to the top-level `reasoning_content` field instead of dropping it.
    if (obj.type === 'reasoning' && typeof obj.text === 'string' && reasoning !== undefined) {
      reasoning.push(obj.text);
      continue;
    }
    if (obj.type === 'image') {
      const url = imageToUrl(obj.image, obj.mimeType);
      if (url !== undefined) {
        out.push({ type: 'image_url', image_url: { url } });
        continue;
      }
    }
    if (typeof obj.type === 'string') dropped.add(obj.type);
  }
  return out;
}

/**
 * Bytes become a `data:` URI (default mime `image/png`); `URL`s
 * pass through as strings - the SERVER dereferences, the adapter makes
 * no network call of its own.
 */
function imageToUrl(image: unknown, mimeType?: string): string | undefined {
  if (image instanceof URL) return image.toString();
  if (image instanceof Uint8Array) {
    const mime = mimeType ?? 'image/png';
    return `data:${mime};base64,${Buffer.from(image).toString('base64')}`;
  }
  return undefined;
}

/** One honest WARN per convert call when parts were dropped. */
function warnDropped(opts: ChatMessageConversionOptions, dropped: Set<string>): void {
  if (dropped.size === 0 || opts.warn === undefined) return;
  const kinds = [...dropped].sort().join(', ');
  opts.warn(
    opts.multimodal
      ? `content parts of kind [${kinds}] have no wire mapping on this adapter and were dropped`
      : `non-text content parts of kind [${kinds}] were dropped - this adapter instance has capabilities.multimodal=false; pass capabilities: { multimodal: true } if the model supports vision`,
  );
}

/**
 * Convert a graphorin `Message` to Ollama's **native** `/api/chat` shape.
 * Unlike the OpenAI form, Ollama's Go server expects `tool_calls`
 * with object `arguments` (a `map[string]any`, never a JSON string) and no
 * `id` / `type` fields - sending those breaks its unmarshaller and any
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
  opts: ChatMessageConversionOptions = TEXT_ONLY,
): ReadonlyArray<Record<string, unknown>> {
  const dropped = new Set<string>();
  const converted = messages.map((msg) => {
    let content: string;
    let images: string[] | undefined;
    // REASONING-01: round-trip preserved reasoning onto Ollama's native
    // `thinking` field (the same field its stream response uses) rather
    // than dropping it with a misleading multimodal warning.
    const reasoning: string[] = [];
    if (typeof msg.content === 'string') {
      content = msg.content;
    } else if (opts.multimodal) {
      // W-095: Ollama's native API takes a per-message `images` array
      // of RAW base64 strings (no data: prefix). URL images cannot be
      // inlined on this path (the adapter never fetches) - dropped
      // loudly.
      const split = toOllamaContent(msg.content, dropped, reasoning);
      content = split.text;
      images = split.images.length > 0 ? split.images : undefined;
    } else {
      content = flattenContent(msg.content, dropped, reasoning);
    }
    const out: Record<string, unknown> = { role: msg.role, content };
    if (images !== undefined) out.images = images;
    if (reasoning.length > 0) out.thinking = reasoning.join('');
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
  warnDropped(opts, dropped);
  return converted;
}

/** Split parts into flattened text + raw-base64 image payloads. */
function toOllamaContent(
  parts: ReadonlyArray<unknown>,
  dropped: Set<string>,
  reasoning?: string[],
): { readonly text: string; readonly images: string[] } {
  const buffer: string[] = [];
  const images: string[] = [];
  for (const part of parts) {
    if (typeof part === 'string') {
      buffer.push(part);
      continue;
    }
    if (typeof part !== 'object' || part === null) continue;
    const obj = part as { type?: string; text?: string; image?: unknown };
    if (obj.type === 'text' && typeof obj.text === 'string') {
      buffer.push(obj.text);
      continue;
    }
    // REASONING-01: lifted to the `thinking` field by the caller.
    if (obj.type === 'reasoning' && typeof obj.text === 'string' && reasoning !== undefined) {
      reasoning.push(obj.text);
      continue;
    }
    if (obj.type === 'image' && obj.image instanceof Uint8Array) {
      images.push(Buffer.from(obj.image).toString('base64'));
      continue;
    }
    if (obj.type === 'image') {
      dropped.add('image (URL - the native Ollama API needs inline bytes)');
      continue;
    }
    if (typeof obj.type === 'string') dropped.add(obj.type);
  }
  return { text: buffer.join(''), images };
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

function flattenContent(
  parts: ReadonlyArray<unknown>,
  dropped?: Set<string>,
  reasoning?: string[],
): string {
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
      } else if (
        obj.type === 'reasoning' &&
        typeof obj.text === 'string' &&
        reasoning !== undefined
      ) {
        // REASONING-01: captured for the wire's reasoning slot, not dropped.
        reasoning.push(obj.text);
      } else if (typeof obj.type === 'string') {
        // W-095: silently vanishing multimodal content was the bug -
        // collect the kind so the caller can WARN once.
        dropped?.add(obj.type);
      }
    }
  }
  return buffer.join('');
}

/**
 * Wrap a `fetch` call with HTTP error mapping. The helper does not
 * assume any particular streaming format - callers receive the raw
 * `Response` and dispatch on its body.
 *
 * @internal
 */
/**
 * Default per-request timeout for the baseUrl adapters. Scoped
 * to time-to-response (headers): the timer is cleared the moment the
 * server answers, so long streaming bodies are never killed - only a
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
   * Time-to-response budget. Default
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
    const headers = pickBackoffHeaders(resp.headers);
    throw new ProviderHttpError({
      providerName: args.providerName,
      status: resp.status,
      message: detail.length > 0 ? detail : resp.statusText,
      ...(headers !== undefined ? { headers } : {}),
    });
  }
  return resp;
}

/**
 * Capture the backoff-relevant response headers (`retry-after`,
 * `x-ratelimit-*`) so `withRetry`'s Retry-After hint reader can honour
 * server-provided delays. Returns `undefined` when none are present.
 */
function pickBackoffHeaders(headers: Headers): Readonly<Record<string, string>> | undefined {
  const picked: Record<string, string> = {};
  headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === 'retry-after' || lower.startsWith('x-ratelimit-')) {
      picked[lower] = value;
    }
  });
  return Object.keys(picked).length > 0 ? picked : undefined;
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
