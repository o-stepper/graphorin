/**
 * Shared implementation backing the two OpenAI-compatible adapters
 * (`llamaCppServerAdapter` and `openAICompatibleAdapter`). The wire
 * shape is identical for the `/v1/chat/completions` endpoint, so we
 * factor the streaming + one-shot logic here and the adapters become
 * thin shells declaring trust class, defaults, and capability flags.
 *
 * @internal
 */

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
import { applyReasoningPolicy } from '../reasoning/apply-policy.js';
import { resolveReasoningRetention } from '../reasoning/retention.js';
import {
  classifyLocalProvider,
  type LocalProviderClassification,
} from '../trust/classify-local-provider.js';
import { callJsonHttp, makeStreamStartEvent, toOpenAIChatMessages } from './http.js';
import { parseEventStream } from './sse.js';
import { stripTrailingSlashes } from './url-utils.js';

/**
 * Options shared by every OpenAI-compatible adapter.
 *
 * @internal
 */
export interface OpenAIShapedOptions {
  readonly providerName: string;
  readonly model: string;
  readonly baseUrl: string;
  readonly chatPath?: string;
  readonly apiKey?: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly fetchImpl?: typeof fetch;
  readonly allowInsecureTransport?: boolean;
  readonly capabilities?: Partial<ProviderCapabilities>;
  /**
   * Time-to-response budget per request (PS-24). Default
   * `DEFAULT_REQUEST_TIMEOUT_MS` (120s); `0` disables.
   */
  readonly timeoutMs?: number;
  /**
   * Overrides the default `acceptsSensitivity` value derived from the
   * trust classifier. Loud users can opt out of the conservative
   * default, but the framework still emits one WARN per process so
   * the override is visible.
   */
  readonly acceptsSensitivity?: ReadonlyArray<Sensitivity>;
  /**
   * Optional log sink. When unset, the adapter falls back to
   * `console.warn`. Tests pass a fixture-driven sink to silence the
   * console.
   */
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

const KNOWN_LOOPBACK_OVERRIDES_WARNED = new Set<string>();

/**
 * Build a Graphorin `Provider` backed by an OpenAI-compatible HTTP
 * server. Returns the wrapped object plus the resolved trust
 * classification so the caller can attach it to span attributes if
 * desired.
 *
 * @internal
 */
export function buildOpenAIShapedProvider(opts: OpenAIShapedOptions): {
  readonly provider: Provider;
  readonly classification: LocalProviderClassification;
} {
  const classification = classifyLocalProvider(opts.baseUrl);
  if (classification.trust === 'public-cleartext' && opts.allowInsecureTransport !== true) {
    throw new LocalProviderInsecureTransportError(opts.baseUrl);
  }
  const log = opts.logger ?? defaultLogger;
  if (classification.trust === 'public-cleartext') {
    log('warn', `[${opts.providerName}] allowInsecureTransport=true accepted for ${opts.baseUrl}`, {
      baseUrl: opts.baseUrl,
    });
  } else if (classification.trust === 'public-tls') {
    log('warn', `[${opts.providerName}] public-TLS endpoint; treating as cloud-tier`, {
      baseUrl: opts.baseUrl,
    });
  } else if (classification.trust === 'private') {
    log(
      'warn',
      `[${opts.providerName}] private-network endpoint detected (${classification.reason})`,
      {
        baseUrl: opts.baseUrl,
        acceptsSensitivity: classification.acceptsSensitivity,
      },
    );
  }

  const acceptsSensitivity = opts.acceptsSensitivity ?? classification.acceptsSensitivity;
  if (
    opts.acceptsSensitivity !== undefined &&
    !sameSensitivity(opts.acceptsSensitivity, classification.acceptsSensitivity) &&
    !KNOWN_LOOPBACK_OVERRIDES_WARNED.has(opts.baseUrl)
  ) {
    KNOWN_LOOPBACK_OVERRIDES_WARNED.add(opts.baseUrl);
    log(
      'info',
      `[${opts.providerName}] sensitivity override accepted; default would be [${classification.acceptsSensitivity.join(', ')}]`,
      {
        baseUrl: opts.baseUrl,
      },
    );
  }

  const capabilities: ProviderCapabilities = {
    ...DEFAULT_CAPABILITIES,
    ...opts.capabilities,
  };
  const chatPath = opts.chatPath ?? '/v1/chat/completions';
  const url = `${stripTrailingSlashes(opts.baseUrl)}${chatPath}`;

  const provider: Provider = {
    name: opts.providerName,
    modelId: opts.model,
    capabilities,
    acceptsSensitivity,
    stream(req) {
      return streamOpenAIShaped(opts, url, applyOpenAIShapedPreflight(req, capabilities));
    },
    async generate(req) {
      return generateOpenAIShaped(opts, url, applyOpenAIShapedPreflight(req, capabilities));
    },
  };

  return { provider, classification };
}

function applyOpenAIShapedPreflight(
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

async function* streamOpenAIShaped(
  opts: OpenAIShapedOptions,
  url: string,
  req: ProviderRequest,
): AsyncIterable<ProviderEvent> {
  const body = buildBody(opts.model, req, true, opts.capabilities?.structuredOutput ?? true);
  const resp = await callJsonHttp({
    providerName: opts.providerName,
    url,
    headers: buildHeaders(opts),
    body,
    ...(req.signal !== undefined ? { signal: req.signal } : {}),
    ...(opts.fetchImpl !== undefined ? { fetchImpl: opts.fetchImpl } : {}),
    ...(opts.timeoutMs !== undefined ? { timeoutMs: opts.timeoutMs } : {}),
  });

  yield makeStreamStartEvent({ providerName: opts.providerName, modelId: opts.model });

  let finishReason: FinishReason = 'stop';
  let usage: Usage | undefined;
  const toolCallBuffer = new Map<
    number,
    { id: string; name: string; args: string; emittedStart: boolean }
  >();

  for await (const payload of parseEventStream(
    resp.body,
    req.signal !== undefined ? { signal: req.signal } : {},
  )) {
    if (req.signal?.aborted) {
      // PS-12: report the abort honestly instead of the default 'stop'.
      finishReason = 'aborted';
      break;
    }
    let parsed: OpenAIChunk;
    try {
      parsed = JSON.parse(payload) as OpenAIChunk;
    } catch (cause) {
      throw new ProviderStreamParseError(
        opts.providerName,
        `failed to parse SSE chunk as JSON: ${(cause as Error).message}`,
        cause,
      );
    }
    const choice = parsed.choices?.[0];
    if (choice === undefined) {
      if (parsed.usage !== undefined) usage = mapOpenAIUsage(parsed.usage);
      continue;
    }
    const delta = choice.delta ?? {};
    if (typeof delta.content === 'string' && delta.content.length > 0) {
      yield { type: 'text-delta', delta: delta.content };
    }
    if (typeof (delta as { reasoning_content?: unknown }).reasoning_content === 'string') {
      const r = (delta as { reasoning_content: string }).reasoning_content;
      if (r.length > 0) yield { type: 'reasoning-delta', delta: r };
    }
    if (Array.isArray(delta.tool_calls)) {
      for (const tc of delta.tool_calls) {
        const idx = tc.index ?? 0;
        const slot = toolCallBuffer.get(idx) ?? {
          id: '',
          name: '',
          args: '',
          emittedStart: false,
        };
        if (typeof tc.id === 'string' && tc.id.length > 0) slot.id = tc.id;
        if (tc.function?.name !== undefined) slot.name = tc.function.name;
        if (typeof tc.function?.arguments === 'string') slot.args += tc.function.arguments;
        toolCallBuffer.set(idx, slot);
        if (!slot.emittedStart && slot.id.length > 0 && slot.name.length > 0) {
          yield {
            type: 'tool-call-start',
            toolCallId: slot.id,
            toolName: slot.name,
          };
          slot.emittedStart = true;
        }
        if (typeof tc.function?.arguments === 'string' && tc.function.arguments.length > 0) {
          yield {
            type: 'tool-call-input-delta',
            toolCallId: slot.id,
            argsDelta: tc.function.arguments,
          };
        }
      }
    }
    if (typeof choice.finish_reason === 'string') {
      finishReason = mapFinishReason(choice.finish_reason);
      for (const slot of toolCallBuffer.values()) {
        const finalArgs = parseFinalArgs(slot.args);
        yield {
          type: 'tool-call-end',
          toolCallId: slot.id,
          finalArgs,
        };
      }
    }
    if (parsed.usage !== undefined) usage = mapOpenAIUsage(parsed.usage);
  }

  yield {
    type: 'finish',
    finishReason,
    usage: usage ?? { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
  };
}

async function generateOpenAIShaped(
  opts: OpenAIShapedOptions,
  url: string,
  req: ProviderRequest,
): Promise<ProviderResponse> {
  const body = buildBody(opts.model, req, false, opts.capabilities?.structuredOutput ?? true);
  const resp = await callJsonHttp({
    providerName: opts.providerName,
    url,
    headers: buildHeaders(opts),
    body,
    ...(req.signal !== undefined ? { signal: req.signal } : {}),
    ...(opts.fetchImpl !== undefined ? { fetchImpl: opts.fetchImpl } : {}),
    ...(opts.timeoutMs !== undefined ? { timeoutMs: opts.timeoutMs } : {}),
  });
  let json: OpenAIChunk;
  try {
    json = (await resp.json()) as OpenAIChunk;
  } catch (cause) {
    throw new ProviderStreamParseError(
      opts.providerName,
      'response body was not valid JSON',
      cause,
    );
  }
  const choice = json.choices?.[0];
  const message = choice?.message ?? {};
  const text = typeof message.content === 'string' ? message.content : undefined;
  const toolCalls = Array.isArray(message.tool_calls)
    ? message.tool_calls.map((tc) => ({
        toolCallId: tc.id ?? '',
        toolName: tc.function?.name ?? '',
        args: parseFinalArgs(
          typeof tc.function?.arguments === 'string' ? tc.function.arguments : '',
        ),
      }))
    : undefined;
  const usage = mapOpenAIUsage(json.usage) ?? {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  };
  return {
    usage,
    finishReason: mapFinishReason(choice?.finish_reason),
    ...(text !== undefined ? { text } : {}),
    ...(toolCalls !== undefined ? { toolCalls } : {}),
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
    messages: toOpenAIChatMessages(messages),
    stream,
  };
  if (stream) {
    // core-provider-09: vanilla OpenAI-shaped servers (vLLM, Together,
    // OpenAI proper) only emit the final usage chunk when asked;
    // without it streamed calls finish with {0,0,0} usage and cost
    // tracking silently zeroes. llama.cpp accepts the flag too.
    // `providerOptions` is merged last, so callers can override it for
    // servers that reject the field.
    body.stream_options = { include_usage: true };
  }
  if (req.temperature !== undefined) body.temperature = req.temperature;
  if (req.maxTokens !== undefined) body.max_tokens = req.maxTokens;
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
  if (req.toolChoice !== undefined) {
    body.tool_choice = mapToolChoice(req.toolChoice);
  }
  // PS-24: structured output finally reaches the wire — gated on the
  // declared capability so a structuredOutput:false override keeps the
  // request clean for servers that reject response_format.
  if (structuredOutput && req.outputType?.kind === 'structured') {
    body.response_format =
      req.outputType.jsonSchema !== undefined
        ? {
            type: 'json_schema',
            json_schema: { name: 'output', schema: req.outputType.jsonSchema, strict: true },
          }
        : { type: 'json_object' };
  }
  if (req.providerOptions !== undefined) {
    Object.assign(body, req.providerOptions);
  }
  return body;
}

function buildHeaders(opts: OpenAIShapedOptions): Record<string, string> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    accept: 'application/json',
    ...opts.headers,
  };
  if (opts.apiKey !== undefined && opts.apiKey.length > 0) {
    headers.authorization = `Bearer ${opts.apiKey}`;
  }
  return headers;
}

function mapToolChoice(value: unknown): unknown {
  if (value === 'auto' || value === 'none' || value === 'required') return value;
  if (typeof value === 'object' && value !== null && 'tool' in value) {
    return { type: 'function', function: { name: (value as { tool: string }).tool } };
  }
  return 'auto';
}

function mapFinishReason(value: string | null | undefined): FinishReason {
  switch (value) {
    case 'stop':
    case 'length':
    case 'content-filter':
      return value;
    // PS-12: the OpenAI wire format spells it with an underscore; the dashed
    // form alone never matched, so content-filtered completions reported 'stop'.
    case 'content_filter':
      return 'content-filter';
    case 'tool_calls':
    case 'function_call':
      return 'tool-calls';
    case null:
    case undefined:
      return 'stop';
    default:
      return 'stop';
  }
}

function mapOpenAIUsage(input: unknown): Usage | undefined {
  if (input === undefined || input === null || typeof input !== 'object') return undefined;
  const u = input as {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    reasoning_tokens?: number;
    // OpenAI reports cache reads as a SUBSET of prompt_tokens
    // (core-provider-02); there is no cache-write leg on this wire.
    prompt_tokens_details?: { cached_tokens?: number };
  };
  const promptTokens = u.prompt_tokens ?? 0;
  const completionTokens = u.completion_tokens ?? 0;
  const totalTokens = u.total_tokens ?? promptTokens + completionTokens;
  const cachedTokens = u.prompt_tokens_details?.cached_tokens;
  const usage: Usage = {
    promptTokens,
    completionTokens,
    totalTokens,
    ...(u.reasoning_tokens !== undefined ? { reasoningTokens: u.reasoning_tokens } : {}),
    ...(typeof cachedTokens === 'number' && Number.isFinite(cachedTokens) && cachedTokens > 0
      ? { cachedReadTokens: cachedTokens }
      : {}),
  };
  return usage;
}

function parseFinalArgs(raw: string): unknown {
  if (raw.length === 0) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function sameSensitivity(a: ReadonlyArray<Sensitivity>, b: ReadonlyArray<Sensitivity>): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function defaultLogger(level: 'warn' | 'info', message: string, meta?: object): void {
  const fn = level === 'warn' ? console.warn : console.info;
  if (meta !== undefined) {
    fn(`[graphorin/provider] ${message}`, meta);
  } else {
    fn(`[graphorin/provider] ${message}`);
  }
}

interface OpenAIChunk {
  readonly id?: string;
  readonly choices?: ReadonlyArray<{
    readonly delta?: {
      readonly content?: string;
      readonly tool_calls?: ReadonlyArray<{
        readonly index?: number;
        readonly id?: string;
        readonly type?: string;
        readonly function?: { readonly name?: string; readonly arguments?: string };
      }>;
      readonly reasoning_content?: string;
    };
    readonly message?: {
      readonly content?: string | null;
      readonly tool_calls?: ReadonlyArray<{
        readonly id?: string;
        readonly type?: string;
        readonly function?: { readonly name?: string; readonly arguments?: string };
      }>;
    };
    readonly finish_reason?: string | null;
  }>;
  readonly usage?: {
    readonly prompt_tokens?: number;
    readonly completion_tokens?: number;
    readonly total_tokens?: number;
    readonly reasoning_tokens?: number;
    readonly prompt_tokens_details?: { readonly cached_tokens?: number };
  };
}
