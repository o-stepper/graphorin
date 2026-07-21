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

import {
  LocalProviderInsecureTransportError,
  ProviderHttpError,
  ProviderStreamParseError,
} from '../errors/errors.js';
import { applyReasoningPolicy } from '../reasoning/apply-policy.js';
import { resolveReasoningRetention } from '../reasoning/retention.js';
import { foldToolExamples } from '../tool-examples.js';
import {
  classifyLocalProvider,
  type LocalProviderClassification,
} from '../trust/classify-local-provider.js';
import {
  type ChatMessageConversionOptions,
  callJsonHttp,
  makeStreamStartEvent,
  toOpenAIChatMessages,
} from './http.js';
import { parseEventStream } from './sse.js';
import { stripTrailingSlashes } from './url-utils.js';

/**
 * Wire name for the completion-token ceiling. The long tail of
 * OpenAI-compatible servers (llama.cpp, LM Studio, vLLM, LocalAI)
 * expects `max_tokens`; current OpenAI models (GPT-5 family,
 * o-series) reject it with HTTP 400 and require
 * `max_completion_tokens`.
 *
 * @stable
 */
export type TokenLimitParam = 'max_tokens' | 'max_completion_tokens';

/**
 * Policy for the one-shot HTTP 400 auto-recovery of model parameters
 * the server rejects (deep-retest-0.13.9 P1). `'auto'` (default): a
 * 400 naming `temperature` re-sends the request without the field,
 * and a 400 requiring `reasoning_effort` `'none'` for function tools
 * re-sends with it; the instance keeps each switch and WARNs once.
 * `'off'` disables both recoveries so the original error surfaces.
 * The `max_tokens` remap is governed by `tokenLimitParam`, not this.
 *
 * @stable
 */
export type UnsupportedParamRecovery = 'auto' | 'off';

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
  /**
   * Which wire parameter carries `ProviderRequest.maxTokens`. Default
   * `'max_tokens'`. When left unset and the server answers HTTP 400
   * naming `max_completion_tokens`, the request is re-sent once with
   * the remapped parameter and the instance keeps the switch; setting
   * the option pins the name and disables that auto-remap.
   */
  readonly tokenLimitParam?: TokenLimitParam;
  /**
   * One-shot HTTP 400 auto-recovery for `temperature` and the
   * function-tools `reasoning_effort` contract. Default `'auto'`;
   * `'off'` restores fail-loud passthrough. See
   * {@link UnsupportedParamRecovery}.
   */
  readonly unsupportedParamRecovery?: UnsupportedParamRecovery;
  readonly apiKey?: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly fetchImpl?: typeof fetch;
  readonly allowInsecureTransport?: boolean;
  readonly capabilities?: Partial<ProviderCapabilities>;
  /**
   * Time-to-response budget per request. Default
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
  const base = stripTrailingSlashes(opts.baseUrl);
  // deep-retest-0.13.6 P2-1: the ecosystem convention is a base URL that
  // already INCLUDES the /v1 prefix (api.openai.com/v1, LM Studio, vLLM,
  // groq's /openai/v1). Appending the /v1-prefixed default path to such a
  // base produced /v1/v1/chat/completions and a guaranteed 404, so the
  // default adapts to the base; an explicit chatPath always wins verbatim.
  const chatPath =
    opts.chatPath ?? (base.endsWith('/v1') ? '/chat/completions' : '/v1/chat/completions');
  const url = `${base}${chatPath}`;
  const tokenParam: TokenParamState = { pinned: opts.tokenLimitParam, learned: null };
  const paramCompat: ParamCompatState = {
    recovery: opts.unsupportedParamRecovery ?? 'auto',
    stripTemperature: false,
    toolsReasoningEffortNone: false,
  };

  const provider: Provider = {
    name: opts.providerName,
    modelId: opts.model,
    capabilities,
    acceptsSensitivity,
    stream(req) {
      return streamOpenAIShaped(
        opts,
        url,
        tokenParam,
        paramCompat,
        applyOpenAIShapedPreflight(req, capabilities),
      );
    },
    async generate(req) {
      return generateOpenAIShaped(
        opts,
        url,
        tokenParam,
        paramCompat,
        applyOpenAIShapedPreflight(req, capabilities),
      );
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

/**
 * Per-provider-instance memory for the completion-token wire name.
 * `pinned` mirrors the explicit option (never overridden); `learned`
 * flips to `'max_completion_tokens'` after the one-shot 400 remap so
 * every later request skips the doomed first attempt.
 */
interface TokenParamState {
  readonly pinned: TokenLimitParam | undefined;
  learned: TokenLimitParam | null;
}

function effectiveTokenParam(state: TokenParamState): TokenLimitParam {
  return state.pinned ?? state.learned ?? 'max_tokens';
}

/**
 * deep-retest-0.13.6 P2-2: current OpenAI models reject `max_tokens`
 * with HTTP 400 ("Use 'max_completion_tokens' instead"). The remap
 * fires only from the unpinned default, only once (learned state), and
 * only when the failed request actually carried the parameter.
 */
function shouldRemapTokenParam(
  state: TokenParamState,
  err: unknown,
  req: ProviderRequest,
): boolean {
  return (
    state.pinned === undefined &&
    state.learned === null &&
    req.maxTokens !== undefined &&
    err instanceof ProviderHttpError &&
    err.status === 400 &&
    err.message.includes('max_completion_tokens')
  );
}

function learnTokenParamRemap(opts: OpenAIShapedOptions, state: TokenParamState): void {
  state.learned = 'max_completion_tokens';
  const log = opts.logger ?? defaultLogger;
  log(
    'warn',
    `[${opts.providerName}] server rejected 'max_tokens' (HTTP 400 naming max_completion_tokens); ` +
      `re-sending with 'max_completion_tokens' and keeping it for this provider instance`,
  );
}

/**
 * Per-provider-instance memory for model parameter compatibility
 * (deep-retest-0.13.9 P1). Current OpenAI reasoning models (GPT-5
 * family, o-series) reject any non-default `temperature` with HTTP
 * 400, and reject function tools on `/v1/chat/completions` unless
 * `reasoning_effort` is explicitly `'none'` - the server applies a
 * model-side default; the adapter itself never sends the field
 * unprompted. Each recovery fires only when `recovery` is `'auto'`,
 * at most once per instance, and only when the caller did not pin
 * the field via `providerOptions` (an explicit override keeps
 * failing loudly).
 */
interface ParamCompatState {
  readonly recovery: UnsupportedParamRecovery;
  stripTemperature: boolean;
  toolsReasoningEffortNone: boolean;
}

function shouldStripTemperature(
  state: ParamCompatState,
  err: unknown,
  req: ProviderRequest,
): boolean {
  if (state.recovery === 'off' || state.stripTemperature) return false;
  if (req.temperature === undefined || req.providerOptions?.temperature !== undefined) {
    return false;
  }
  if (!(err instanceof ProviderHttpError) || err.status !== 400) return false;
  // Both live OpenAI spellings: "Unsupported value: 'temperature' does
  // not support 0 with this model." and "Unsupported parameter:
  // 'temperature' is not supported with this model."
  return (
    err.message.includes("'temperature'") &&
    (err.message.includes('does not support') || err.message.includes('nsupported'))
  );
}

function learnStripTemperature(opts: OpenAIShapedOptions, state: ParamCompatState): void {
  state.stripTemperature = true;
  const log = opts.logger ?? defaultLogger;
  log(
    'warn',
    `[${opts.providerName}] server rejected 'temperature' for model '${opts.model}' (HTTP 400); ` +
      `re-sending without it and omitting the parameter for this provider instance ` +
      `(set unsupportedParamRecovery: 'off' to fail loudly instead)`,
  );
}

function shouldForceReasoningEffortNone(
  state: ParamCompatState,
  err: unknown,
  req: ProviderRequest,
): boolean {
  if (state.recovery === 'off' || state.toolsReasoningEffortNone) return false;
  if (req.tools === undefined || req.tools.length === 0) return false;
  if (req.providerOptions?.reasoning_effort !== undefined) return false;
  return (
    err instanceof ProviderHttpError &&
    err.status === 400 &&
    err.message.includes('reasoning_effort')
  );
}

function learnReasoningEffortNone(opts: OpenAIShapedOptions, state: ParamCompatState): void {
  state.toolsReasoningEffortNone = true;
  const log = opts.logger ?? defaultLogger;
  log(
    'warn',
    `[${opts.providerName}] server requires reasoning_effort 'none' for function tools on this ` +
      `endpoint (HTTP 400); re-sending with reasoning_effort: 'none' and keeping it for this ` +
      `instance's tool requests (set unsupportedParamRecovery: 'off' to fail loudly instead)`,
  );
}

/**
 * Sends the chat request, applying each learned-parameter recovery at
 * most once. Bounded: every recoverable 400 class flips instance
 * state on its first firing and its predicate refuses thereafter, so
 * the loop iterates at most once per class plus the final attempt.
 */
async function callChatWithRecovery(
  opts: OpenAIShapedOptions,
  url: string,
  tokenState: TokenParamState,
  compat: ParamCompatState,
  req: ProviderRequest,
  stream: boolean,
): Promise<Response> {
  for (;;) {
    try {
      return await callChatHttp(opts, url, effectiveTokenParam(tokenState), compat, req, stream);
    } catch (err) {
      if (shouldRemapTokenParam(tokenState, err, req)) {
        learnTokenParamRemap(opts, tokenState);
        continue;
      }
      if (shouldStripTemperature(compat, err, req)) {
        learnStripTemperature(opts, compat);
        continue;
      }
      if (shouldForceReasoningEffortNone(compat, err, req)) {
        learnReasoningEffortNone(opts, compat);
        continue;
      }
      throw err;
    }
  }
}

function callChatHttp(
  opts: OpenAIShapedOptions,
  url: string,
  tokenParam: TokenLimitParam,
  compat: ParamCompatState,
  req: ProviderRequest,
  stream: boolean,
): Promise<Response> {
  const body = buildBody(
    opts.model,
    req,
    stream,
    opts.capabilities?.structuredOutput ?? true,
    conversionOptionsFor(opts),
    tokenParam,
    compat,
  );
  return callJsonHttp({
    providerName: opts.providerName,
    url,
    headers: buildHeaders(opts),
    body,
    ...(req.signal !== undefined ? { signal: req.signal } : {}),
    ...(opts.fetchImpl !== undefined ? { fetchImpl: opts.fetchImpl } : {}),
    ...(opts.timeoutMs !== undefined ? { timeoutMs: opts.timeoutMs } : {}),
  });
}

async function* streamOpenAIShaped(
  opts: OpenAIShapedOptions,
  url: string,
  state: TokenParamState,
  compat: ParamCompatState,
  req: ProviderRequest,
): AsyncIterable<ProviderEvent> {
  const resp = await callChatWithRecovery(opts, url, state, compat, req, true);

  yield makeStreamStartEvent({ providerName: opts.providerName, modelId: opts.model });

  let finishReason: FinishReason = 'stop';
  let finishedNaturally = false;
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
      finishedNaturally = true;
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

  // OLLAMA-AD-02: parseEventStream ends cleanly on abort, so the top-of-loop
  // check is bypassed when the abort races the iterator's end - re-check here
  // so an aborted stream reports 'aborted' instead of the default 'stop'.
  if (!finishedNaturally && req.signal?.aborted) finishReason = 'aborted';

  yield {
    type: 'finish',
    finishReason,
    usage: usage ?? { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
  };
}

async function generateOpenAIShaped(
  opts: OpenAIShapedOptions,
  url: string,
  state: TokenParamState,
  compat: ParamCompatState,
  req: ProviderRequest,
): Promise<ProviderResponse> {
  const resp = await callChatWithRecovery(opts, url, state, compat, req, false);
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
  conversion: ChatMessageConversionOptions,
  tokenParam: TokenLimitParam,
  compat: ParamCompatState,
): Record<string, unknown> {
  const messages =
    req.systemMessage !== undefined
      ? [{ role: 'system' as const, content: req.systemMessage }, ...req.messages]
      : req.messages;
  const body: Record<string, unknown> = {
    model,
    messages: toOpenAIChatMessages(messages, conversion),
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
  // deep-retest-0.13.9 P1: once the instance has learned (via HTTP
  // 400) that the model only accepts default sampling, the field is
  // omitted rather than mechanically replaced with 1 - the caller's
  // determinism intent cannot be honored, so nothing is sent.
  if (req.temperature !== undefined && !compat.stripTemperature) {
    body.temperature = req.temperature;
  }
  if (req.maxTokens !== undefined) body[tokenParam] = req.maxTokens;
  if (req.tools !== undefined && req.tools.length > 0) {
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
  if (req.toolChoice !== undefined) {
    body.tool_choice = mapToolChoice(req.toolChoice);
  }
  // PS-24: structured output finally reaches the wire - gated on the
  // declared capability so a structuredOutput:false override keeps the
  // request clean for servers that reject response_format.
  // LIVE-EVAL-01/02 (re-verified live against the Anthropic OpenAI-compat
  // endpoint, 2026-07-17): an explicit schema maps to strict
  // `json_schema`. A SCHEMA-LESS structured request sends NO
  // response_format at all - that endpoint rejects every permissive
  // spelling (`json_object`: "Input should be 'json_schema'";
  // `strict: false`: "Input should be True"; `strict: true` with
  // `additionalProperties: true`: "not supported"), so the only shape
  // that works across OpenAI, the compat endpoints, and local servers is
  // none: the AG-3 trailing JSON instruction the agent runtime already
  // appends carries the contract, and the local `schema.parse` gate
  // stays the enforcement point.
  if (structuredOutput && req.outputType?.kind === 'structured') {
    if (req.outputType.jsonSchema !== undefined) {
      body.response_format = {
        type: 'json_schema',
        json_schema: { name: 'output', schema: req.outputType.jsonSchema, strict: true },
      };
    }
  }
  if (req.providerOptions !== undefined) {
    Object.assign(body, req.providerOptions);
  }
  // deep-retest-0.13.9 P1: applied after the providerOptions merge so
  // an explicit caller reasoning_effort always wins over the learned
  // tool-contract recovery.
  if (
    compat.toolsReasoningEffortNone &&
    body.tools !== undefined &&
    body.reasoning_effort === undefined
  ) {
    body.reasoning_effort = 'none';
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

/**
 * One dropped-content WARN per adapter INSTANCE (keyed on the
 * factory's options object, following KNOWN_LOOPBACK_OVERRIDES_WARNED),
 * so a chat loop does not repeat it every call.
 */
const droppedContentWarned = new WeakSet<object>();

function conversionOptionsFor(opts: {
  readonly capabilities?: { readonly multimodal?: boolean };
  readonly logger?: (level: 'warn' | 'info', message: string, meta?: object) => void;
}): ChatMessageConversionOptions {
  const log = opts.logger ?? defaultLogger;
  return {
    multimodal: opts.capabilities?.multimodal ?? false,
    warn: (message) => {
      if (droppedContentWarned.has(opts)) return;
      droppedContentWarned.add(opts);
      log('warn', message);
    },
  };
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
