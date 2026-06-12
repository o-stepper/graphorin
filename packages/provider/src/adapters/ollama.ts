/**
 * Direct adapter for the Ollama HTTP API. The adapter speaks the
 * native Ollama streaming JSON protocol (`POST /api/chat` returning
 * newline-delimited JSON objects). For operators who prefer the
 * OpenAI-compatible variant exposed by recent Ollama releases, the
 * generic {@link openAICompatibleAdapter} is the better choice — both
 * adapters share the same {@link LocalProviderTrust} classifier and
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

import { LocalProviderInsecureTransportError, ProviderStreamParseError } from '../errors/errors.js';
import { callJsonHttp, makeStreamStartEvent, toOllamaChatMessages } from '../internal/http.js';
import { parseNdJsonStream } from '../internal/sse.js';
import { stripTrailingSlashes } from '../internal/url-utils.js';
import { applyReasoningPolicy } from '../reasoning/apply-policy.js';
import { resolveReasoningRetention } from '../reasoning/retention.js';
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
   * Time-to-response budget per request (PS-24). Default
   * `DEFAULT_REQUEST_TIMEOUT_MS` (120s); `0` disables.
   */
  readonly timeoutMs?: number;
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
  const body = buildBody(options.model, req, true, options.capabilities?.structuredOutput ?? true);
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
  for await (const line of parseNdJsonStream(
    resp.body,
    req.signal !== undefined ? { signal: req.signal } : {},
  )) {
    if (req.signal?.aborted) break;
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
    if (chunk.message?.content !== undefined && chunk.message.content.length > 0) {
      yield { type: 'text-delta', delta: chunk.message.content };
    }
    if (Array.isArray(chunk.message?.tool_calls)) {
      for (const tc of chunk.message.tool_calls) {
        const toolCallId = tc.id ?? `call_${randomUUID()}`;
        const toolName = tc.function?.name ?? '';
        if (toolName.length === 0) continue;
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
      break;
    }
  }
  yield { type: 'finish', finishReason, usage };
}

async function generateOllama(
  options: OllamaAdapterOptions,
  providerName: string,
  url: string,
  req: ProviderRequest,
): Promise<ProviderResponse> {
  const body = buildBody(options.model, req, false, options.capabilities?.structuredOutput ?? true);
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
  return {
    usage: mapUsage(json),
    finishReason: mapFinishReason(json.done_reason),
    ...(typeof json.message?.content === 'string' && json.message.content.length > 0
      ? { text: json.message.content }
      : {}),
    ...(Array.isArray(json.message?.tool_calls) && json.message.tool_calls.length > 0
      ? {
          toolCalls: json.message.tool_calls.map((tc) => ({
            toolCallId: tc.id ?? `call_${randomUUID()}`,
            toolName: tc.function?.name ?? '',
            args: tc.function?.arguments ?? {},
          })),
        }
      : {}),
  };
}

function buildBody(
  model: string,
  req: ProviderRequest,
  stream: boolean,
  structuredOutput: boolean,
): Record<string, unknown> {
  const messages =
    req.systemMessage !== undefined
      ? [{ role: 'system' as const, content: req.systemMessage }, ...req.messages]
      : req.messages;
  const body: Record<string, unknown> = {
    model,
    messages: toOllamaChatMessages(messages),
    stream,
  };
  if (req.temperature !== undefined || req.maxTokens !== undefined) {
    const optionsBlock: Record<string, unknown> = {};
    if (req.temperature !== undefined) optionsBlock.temperature = req.temperature;
    if (req.maxTokens !== undefined) optionsBlock.num_predict = req.maxTokens;
    body.options = optionsBlock;
  }
  if (req.tools !== undefined && req.tools.length > 0) {
    body.tools = req.tools.map((t) => ({
      type: 'function',
      function: {
        name: t.name,
        ...(t.description !== undefined ? { description: t.description } : {}),
        parameters: t.inputSchema,
      },
    }));
  }
  // PS-24: Ollama's native structured output — `format` takes a JSON
  // schema object (or 'json' for schema-less JSON mode).
  if (structuredOutput && req.outputType?.kind === 'structured') {
    body.format = req.outputType.jsonSchema ?? 'json';
  }
  if (req.providerOptions !== undefined) {
    Object.assign(body, req.providerOptions);
  }
  return body;
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

interface OllamaChatChunk {
  readonly model?: string;
  readonly created_at?: string;
  readonly message?: {
    readonly role?: string;
    readonly content?: string;
    readonly tool_calls?: ReadonlyArray<{
      readonly id?: string;
      readonly function?: { readonly name?: string; readonly arguments?: unknown };
    }>;
  };
  readonly done?: boolean;
  readonly done_reason?: string;
  readonly prompt_eval_count?: number;
  readonly eval_count?: number;
}
