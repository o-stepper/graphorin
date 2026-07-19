/**
 * Direct adapter for the Ollama HTTP API. The adapter speaks the
 * native Ollama streaming JSON protocol (`POST /api/chat` returning
 * newline-delimited JSON objects). For operators who prefer the
 * OpenAI-compatible variant exposed by recent Ollama releases, the
 * generic `openAICompatibleAdapter` is the better choice - both
 * adapters share the same `LocalProviderTrust` classifier and
 * {@link LocalProviderInsecureTransportError} startup behaviour.
 *
 * @packageDocumentation
 */

import { randomUUID } from 'node:crypto';
import type {
  FinishReason,
  Provider,
  ProviderCapabilities,
  ProviderEvent,
  ProviderRequest,
  ProviderResponse,
  Sensitivity,
  Usage,
} from '@graphorin/core';

import {
  LocalProviderInsecureTransportError,
  ProviderStreamParseError,
  ProviderToolChoiceUnsupportedError,
} from '../errors/errors.js';
import {
  type ChatMessageConversionOptions,
  callJsonHttp,
  makeStreamStartEvent,
  toOllamaChatMessages,
} from '../internal/http.js';
import { parseNdJsonStream } from '../internal/sse.js';
import { stripTrailingSlashes } from '../internal/url-utils.js';
import { applyReasoningPolicy } from '../reasoning/apply-policy.js';
import { resolveReasoningRetention } from '../reasoning/retention.js';
import { foldToolExamples } from '../tool-examples.js';
import {
  classifyLocalProvider,
  type LocalProviderClassification,
} from '../trust/classify-local-provider.js';

/**
 * Default Ollama base URL.
 *
 * @stable
 */
export const DEFAULT_OLLAMA_BASE_URL = 'http://127.0.0.1:11434';

/**
 * Options accepted by {@link ollamaAdapter}.
 *
 * @stable
 */
export interface OllamaAdapterOptions {
  readonly model: string;
  readonly baseUrl?: string;
  readonly chatPath?: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly fetchImpl?: typeof fetch;
  /**
   * Time-to-response budget per request. Default
   * `DEFAULT_REQUEST_TIMEOUT_MS` (120s); `0` disables.
   */
  readonly timeoutMs?: number;
  /**
   * Thinking control for reasoning-capable models. Sent as Ollama's
   * top-level `think` field: `false` disables thinking on models that
   * default to it (e.g. qwen3), `true` enables it, and
   * `'low' | 'medium' | 'high'` select an effort level on
   * models that grade it (e.g. gpt-oss). Omitted -> the model's own
   * default. Any truthy value also flips `capabilities.reasoning` to
   * `true` unless an explicit `capabilities` override says otherwise.
   * Streamed `message.thinking` chunks are normalized into
   * `reasoning-delta` events either way.
   */
  readonly think?: boolean | 'low' | 'medium' | 'high';
  /**
   * Context window to request from the Ollama server, sent as
   * `options.num_ctx` on every call. Without
   * it Ollama sizes the context itself (4096 by default) while this
   * adapter declares `capabilities.contextWindow` 8192 - three numbers
   * that silently disagree. Setting `numCtx` uses ONE value for both
   * the server request and `capabilities.contextWindow` (an explicit
   * `capabilities.contextWindow` override still wins).
   */
  readonly numCtx?: number;
  /**
   * How long the server keeps the model loaded after the request,
   * sent as Ollama's top-level `keep_alive` field (e.g. `'10m'`,
   * `-1` for indefinitely). Omitted -> the server default (5m).
   */
  readonly keepAlive?: string | number;
  readonly allowInsecureTransport?: boolean;
  readonly acceptsSensitivity?: ReadonlyArray<Sensitivity>;
  readonly capabilities?: Partial<ProviderCapabilities>;
  readonly name?: string;
  readonly logger?: (level: 'warn' | 'info', message: string, meta?: object) => void;
}

const DEFAULT_CAPABILITIES: ProviderCapabilities = {
  streaming: true,
  toolCalling: true,
  parallelToolCalls: false,
  multimodal: false,
  structuredOutput: true,
  reasoning: false,
  contextWindow: 8_192,
  maxOutput: 4_096,
  reasoningContract: 'optional',
};

/**
 * Build a Graphorin {@link Provider} backed by Ollama's native HTTP
 * API. The adapter is fail-safe by default: public-cleartext URLs
 * refuse to start with `LocalProviderInsecureTransportError`.
 *
 * @stable
 */
export function ollamaAdapter(options: OllamaAdapterOptions): Provider {
  const baseUrl = options.baseUrl ?? DEFAULT_OLLAMA_BASE_URL;
  const classification = classifyLocalProvider(baseUrl);
  if (classification.trust === 'public-cleartext' && options.allowInsecureTransport !== true) {
    throw new LocalProviderInsecureTransportError(baseUrl);
  }
  const log = options.logger ?? defaultLogger;
  emitTrustWarning(log, classification, baseUrl);
  const acceptsSensitivity = options.acceptsSensitivity ?? classification.acceptsSensitivity;
  const providerName = options.name ?? `ollama-${options.model}`;
  const capabilities: ProviderCapabilities = {
    ...DEFAULT_CAPABILITIES,
    // One source of truth for the context budget: numCtx drives both the
    // per-request options.num_ctx and the declared window.
    ...(options.numCtx !== undefined ? { contextWindow: options.numCtx } : {}),
    ...(options.think !== undefined && options.think !== false ? { reasoning: true } : {}),
    ...options.capabilities,
  };
  const chatPath = options.chatPath ?? '/api/chat';
  const url = `${stripTrailingSlashes(baseUrl)}${chatPath}`;
  return {
    name: providerName,
    modelId: options.model,
    capabilities,
    acceptsSensitivity,
    stream(req) {
      return streamOllama(options, providerName, url, applyOllamaPreflight(req, capabilities));
    },
    async generate(req) {
      return generateOllama(options, providerName, url, applyOllamaPreflight(req, capabilities));
    },
  };
}

function applyOllamaPreflight(
  req: ProviderRequest,
  capabilities: ProviderCapabilities,
): ProviderRequest {
  const retention = resolveReasoningRetention({
    ...(req.reasoningRetention !== undefined ? { requested: req.reasoningRetention } : {}),
    ...(capabilities.reasoningContract !== undefined
      ? { contract: capabilities.reasoningContract }
      : {}),
  });
  if (retention === 'pass-through-all') return req;
  const filtered = applyReasoningPolicy({ messages: req.messages, retention });
  if (filtered === req.messages) return req;
  return { ...req, messages: filtered };
}

async function* streamOllama(
  options: OllamaAdapterOptions,
  providerName: string,
  url: string,
  req: ProviderRequest,
): AsyncIterable<ProviderEvent> {
  const body = buildBody(options, providerName, req, true, conversionOptionsFor(options));
  const resp = await callJsonHttp({
    providerName,
    url,
    headers: buildHeaders(options),
    body,
    ...(req.signal !== undefined ? { signal: req.signal } : {}),
    ...(options.fetchImpl !== undefined ? { fetchImpl: options.fetchImpl } : {}),
    ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
  });
  yield makeStreamStartEvent({ providerName, modelId: options.model });
  let usage: Usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  let finishReason: FinishReason = 'stop';
  let timings: OllamaTimings | undefined;
  let sawToolCall = false;
  let finishedNaturally = false;
  for await (const line of parseNdJsonStream(
    resp.body,
    req.signal !== undefined ? { signal: req.signal } : {},
  )) {
    if (req.signal?.aborted) {
      finishReason = 'aborted'; // PS-12: honest abort reason, not 'stop'
      break;
    }
    let chunk: OllamaChatChunk;
    try {
      chunk = JSON.parse(line) as OllamaChatChunk;
    } catch (cause) {
      throw new ProviderStreamParseError(
        providerName,
        `failed to parse ndjson line: ${(cause as Error).message}`,
        cause,
      );
    }
    // Thinking models stream their chain in `message.thinking`
    // alongside (and usually before) `message.content`. Normalize it
    // into reasoning-delta events instead of dropping it on the floor
    // (audit 2026-07-16, P1-4); the agent loop collapses the deltas
    // into a single ReasoningContent part at finish.
    if (chunk.message?.thinking !== undefined && chunk.message.thinking.length > 0) {
      yield { type: 'reasoning-delta', delta: chunk.message.thinking };
    }
    if (chunk.message?.content !== undefined && chunk.message.content.length > 0) {
      yield { type: 'text-delta', delta: chunk.message.content };
    }
    if (Array.isArray(chunk.message?.tool_calls)) {
      for (const tc of chunk.message.tool_calls) {
        const toolCallId = tc.id ?? `call_${randomUUID()}`;
        const toolName = tc.function?.name ?? '';
        if (toolName.length === 0) continue;
        sawToolCall = true;
        yield { type: 'tool-call-start', toolCallId, toolName };
        yield {
          type: 'tool-call-end',
          toolCallId,
          finalArgs: tc.function?.arguments ?? {},
        };
      }
    }
    if (chunk.done === true) {
      finishReason = mapFinishReason(chunk.done_reason);
      usage = mapUsage(chunk);
      timings = mapTimings(chunk);
      finishedNaturally = true;
      break;
    }
  }
  // OLLAMA-AD-02: parseNdJsonStream ends cleanly on abort, so the
  // top-of-loop check is bypassed when the abort races the iterator's end -
  // re-check here so an aborted stream reports the honest 'aborted' reason.
  if (!finishedNaturally && req.signal?.aborted) finishReason = 'aborted';
  // OLLAMA-AD-01: Ollama's /api/chat reports done_reason 'stop' even when it
  // emitted tool_calls; surface the actionable 'tool-calls' outcome (the
  // OpenAI-compatible path against the same backend already does).
  if (sawToolCall && finishReason === 'stop') finishReason = 'tool-calls';
  yield {
    type: 'finish',
    finishReason,
    usage,
    ...(timings !== undefined ? { providerMetadata: { ollama: timings } } : {}),
  };
}

async function generateOllama(
  options: OllamaAdapterOptions,
  providerName: string,
  url: string,
  req: ProviderRequest,
): Promise<ProviderResponse> {
  const body = buildBody(options, providerName, req, false, conversionOptionsFor(options));
  const resp = await callJsonHttp({
    providerName,
    url,
    headers: buildHeaders(options),
    body,
    ...(req.signal !== undefined ? { signal: req.signal } : {}),
    ...(options.fetchImpl !== undefined ? { fetchImpl: options.fetchImpl } : {}),
    ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
  });
  let json: OllamaChatChunk;
  try {
    json = (await resp.json()) as OllamaChatChunk;
  } catch (cause) {
    throw new ProviderStreamParseError(providerName, 'response body was not valid JSON', cause);
  }
  const hasToolCalls =
    Array.isArray(json.message?.tool_calls) && json.message.tool_calls.length > 0;
  let finishReason = mapFinishReason(json.done_reason);
  // OLLAMA-AD-01: report 'tool-calls' when the turn ended requesting tools,
  // even though Ollama reports done_reason 'stop' alongside them.
  if (hasToolCalls && finishReason === 'stop') finishReason = 'tool-calls';
  const timings = mapTimings(json);
  return {
    usage: mapUsage(json),
    finishReason,
    ...(timings !== undefined ? { providerMetadata: { ollama: timings } } : {}),
    ...(typeof json.message?.content === 'string' && json.message.content.length > 0
      ? { text: json.message.content }
      : {}),
    ...(hasToolCalls
      ? {
          toolCalls: (json.message?.tool_calls ?? []).map((tc) => ({
            toolCallId: tc.id ?? `call_${randomUUID()}`,
            toolName: tc.function?.name ?? '',
            args: tc.function?.arguments ?? {},
          })),
        }
      : {}),
  };
}

function buildBody(
  adapterOptions: OllamaAdapterOptions,
  providerName: string,
  req: ProviderRequest,
  stream: boolean,
  conversion: ChatMessageConversionOptions,
): Record<string, unknown> {
  // The native /api/chat API has no tool_choice field. 'none' is
  // enforceable by withholding the tool catalogue; a forced choice is
  // not - fail fast instead of silently degrading it to 'auto'
  // (audit 2026-07-16, P1-6).
  if (req.toolChoice === 'required' || typeof req.toolChoice === 'object') {
    throw new ProviderToolChoiceUnsupportedError({
      providerName,
      toolChoice: JSON.stringify(req.toolChoice),
    });
  }
  const messages =
    req.systemMessage !== undefined
      ? [{ role: 'system' as const, content: req.systemMessage }, ...req.messages]
      : req.messages;
  const body: Record<string, unknown> = {
    model: adapterOptions.model,
    messages: toOllamaChatMessages(messages, conversion),
    stream,
  };
  if (adapterOptions.think !== undefined) body.think = adapterOptions.think;
  if (adapterOptions.keepAlive !== undefined) body.keep_alive = adapterOptions.keepAlive;
  if (
    req.temperature !== undefined ||
    req.maxTokens !== undefined ||
    adapterOptions.numCtx !== undefined
  ) {
    const optionsBlock: Record<string, unknown> = {};
    if (req.temperature !== undefined) optionsBlock.temperature = req.temperature;
    if (req.maxTokens !== undefined) optionsBlock.num_predict = req.maxTokens;
    if (adapterOptions.numCtx !== undefined) optionsBlock.num_ctx = adapterOptions.numCtx;
    body.options = optionsBlock;
  }
  if (req.tools !== undefined && req.tools.length > 0 && req.toolChoice !== 'none') {
    // C2: fold worked examples in the adapter itself (idempotent when an
    // upstream createProvider fold already ran).
    body.tools = foldToolExamples(req.tools).map((t) => ({
      type: 'function',
      function: {
        name: t.name,
        ...(t.description !== undefined ? { description: t.description } : {}),
        parameters: t.inputSchema,
      },
    }));
  }
  // PS-24: Ollama's native structured output - `format` takes a JSON
  // schema object (or 'json' for schema-less JSON mode).
  const structuredOutput = adapterOptions.capabilities?.structuredOutput ?? true;
  if (structuredOutput && req.outputType?.kind === 'structured') {
    body.format = req.outputType.jsonSchema ?? 'json';
  }
  if (req.providerOptions !== undefined) {
    // Per-request escape hatch: top-level keys override the built body,
    // but a nested `options` object MERGES into the built options block
    // instead of clobbering temperature / num_predict / num_ctx.
    const { options: extraOptions, ...rest } = req.providerOptions;
    Object.assign(body, rest);
    if (extraOptions !== undefined) {
      body.options =
        isRecord(extraOptions) && isRecord(body.options)
          ? { ...body.options, ...extraOptions }
          : extraOptions;
    }
  }
  return body;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function buildHeaders(options: OllamaAdapterOptions): Record<string, string> {
  return {
    'content-type': 'application/json',
    accept: 'application/json',
    ...options.headers,
  };
}

function mapFinishReason(value: string | null | undefined): FinishReason {
  switch (value) {
    case 'stop':
    case 'length':
      return value;
    case 'tool_calls':
      return 'tool-calls';
    default:
      return 'stop';
  }
}

function mapUsage(chunk: OllamaChatChunk): Usage {
  const promptTokens = chunk.prompt_eval_count ?? 0;
  const completionTokens = chunk.eval_count ?? 0;
  return {
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
  };
}

/**
 * Ollama server timings for one call, in milliseconds. The
 * server reports them in nanoseconds on the
 * terminal chunk; normalized here so model load, prompt processing and
 * generation are distinguishable in events and traces. Surfaced under
 * `providerMetadata.ollama` on the `finish` event / `generate()`
 * response, and stamped onto the provider span by `withTracing`.
 *
 * @stable
 */
export interface OllamaTimings {
  /** Wall clock for the whole call. */
  readonly totalMs?: number;
  /** Time spent loading the model (0 when already resident). */
  readonly loadMs?: number;
  /** Prompt-processing time. */
  readonly promptEvalMs?: number;
  /** Token-generation time. */
  readonly evalMs?: number;
}

function mapTimings(chunk: OllamaChatChunk): OllamaTimings | undefined {
  const ms = (ns: number | undefined): number | undefined =>
    typeof ns === 'number' && Number.isFinite(ns) ? Math.round(ns / 1e6) : undefined;
  const totalMs = ms(chunk.total_duration);
  const loadMs = ms(chunk.load_duration);
  const promptEvalMs = ms(chunk.prompt_eval_duration);
  const evalMs = ms(chunk.eval_duration);
  if (
    totalMs === undefined &&
    loadMs === undefined &&
    promptEvalMs === undefined &&
    evalMs === undefined
  ) {
    return undefined;
  }
  return {
    ...(totalMs !== undefined ? { totalMs } : {}),
    ...(loadMs !== undefined ? { loadMs } : {}),
    ...(promptEvalMs !== undefined ? { promptEvalMs } : {}),
    ...(evalMs !== undefined ? { evalMs } : {}),
  };
}

function emitTrustWarning(
  log: (level: 'warn' | 'info', message: string, meta?: object) => void,
  classification: LocalProviderClassification,
  baseUrl: string,
): void {
  if (classification.trust === 'public-cleartext') {
    log('warn', `[ollama] allowInsecureTransport=true accepted for ${baseUrl}`, { baseUrl });
  } else if (classification.trust === 'public-tls') {
    log('warn', `[ollama] public-TLS endpoint; treating as cloud-tier`, { baseUrl });
  } else if (classification.trust === 'private') {
    log('warn', `[ollama] private-network endpoint detected (${classification.reason})`, {
      baseUrl,
      acceptsSensitivity: classification.acceptsSensitivity,
    });
  }
}

function defaultLogger(level: 'warn' | 'info', message: string, meta?: object): void {
  const fn = level === 'warn' ? console.warn : console.info;
  if (meta !== undefined) {
    fn(`[graphorin/provider] ${message}`, meta);
  } else {
    fn(`[graphorin/provider] ${message}`);
  }
}

/** One dropped-content WARN per adapter instance. */
const droppedContentWarned = new WeakSet<object>();

function conversionOptionsFor(options: OllamaAdapterOptions): ChatMessageConversionOptions {
  const log = options.logger ?? defaultLogger;
  return {
    multimodal: options.capabilities?.multimodal ?? false,
    warn: (message) => {
      if (droppedContentWarned.has(options)) return;
      droppedContentWarned.add(options);
      log('warn', message);
    },
  };
}

interface OllamaChatChunk {
  readonly model?: string;
  readonly created_at?: string;
  readonly message?: {
    readonly role?: string;
    readonly content?: string;
    /** Chain-of-thought stream from thinking-capable models. */
    readonly thinking?: string;
    readonly tool_calls?: ReadonlyArray<{
      readonly id?: string;
      readonly function?: { readonly name?: string; readonly arguments?: unknown };
    }>;
  };
  readonly done?: boolean;
  readonly done_reason?: string;
  readonly prompt_eval_count?: number;
  readonly eval_count?: number;
  /** Server-side timings, nanoseconds; present on the terminal chunk. */
  readonly total_duration?: number;
  readonly load_duration?: number;
  readonly prompt_eval_duration?: number;
  readonly eval_duration?: number;
}
