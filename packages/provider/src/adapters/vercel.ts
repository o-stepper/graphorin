/**
 * `vercelAdapter` - wraps a Vercel AI SDK `LanguageModel`-shaped value
 * into a Graphorin {@link Provider}. The adapter is the default cloud
 * path: it speaks the AI SDK's `streamText` / `generateText` API and
 * maps the resulting events onto the canonical
 * `ProviderEvent` discriminated union.
 *
 * Outbound, the adapter converts Graphorin messages / tools onto the
 * AI SDK call contract (see `vercel-messages.ts`): tool definitions
 * become a name-keyed record with `jsonSchema()`-shaped input schemas,
 * assistant `toolCalls` become `tool-call` content parts, and
 * `ToolMessage`s become `tool-result` messages - the SDK zod-validates
 * all of these and rejects the raw Graphorin shapes.
 *
 * The AI SDK is an **optional peer dependency** of `@graphorin/provider`.
 * Production callers leave `runtimeOverrides` unset and the adapter
 * dynamically imports the package on first use; test fixtures pass a
 * `runtimeOverrides` value to short-circuit the import and feed
 * fixture chunks directly. The overrides shape is intentionally
 * structural so users can supply hand-rolled stubs or any compatible
 * library.
 *
 * @packageDocumentation
 */

import type {
  FinishReason,
  Provider,
  ProviderCapabilities,
  ProviderEvent,
  ProviderRequest,
  ProviderResponse,
  Usage,
} from '@graphorin/core';

import {
  classifyHttpStatus,
  ProviderHttpError,
  ProviderStreamParseError,
} from '../errors/errors.js';
import { isAbortError } from '../internal/abort.js';
import { applyReasoningPolicy } from '../reasoning/apply-policy.js';
import { inferReasoningContract } from '../reasoning/classify-contract.js';
import { resolveReasoningRetention } from '../reasoning/retention.js';
import { foldToolExamples } from '../tool-examples.js';
import {
  applyCacheAnchors,
  toAiSdkPrompt,
  toAiSdkToolChoice,
  toAiSdkTools,
} from './vercel-messages.js';

/**
 * Structural shape the adapter expects from the AI SDK language model
 * value. The real `LanguageModelV4` matches this shape. Re-declared
 * here so we do not pin a hard dependency on `@ai-sdk/provider`.
 *
 * @stable
 */
export interface LanguageModelLike {
  readonly provider: string;
  readonly modelId: string;
  readonly specificationVersion?: string | number;
  /**
   * Optional capability flags carried by the AI SDK model. The adapter
   * forwards them onto the canonical `ProviderCapabilities` shape;
   * missing values are filled in with conservative defaults.
   */
  readonly supportedToolCallTypes?: readonly string[];
}

/**
 * Loose chunk shape emitted by the AI SDK's `streamText`. The shape is
 * intentionally permissive - we accept anything that carries the
 * fields we use and ignore the rest. This keeps the adapter tolerant
 * of additive AI SDK schema changes.
 *
 * The fields we read are normalized in the adapter via narrow helper
 * functions, so we deliberately type each as `unknown` and gate
 * access behind `typeof` checks at runtime.
 *
 * @stable
 */
export interface AISDKChunk {
  readonly type: string;
  readonly [extra: string]: unknown;
}

/**
 * Subset of the AI SDK surface used by the adapter.
 *
 * @stable
 */
export interface VercelRuntimeOverrides {
  readonly streamText: (args: {
    model: LanguageModelLike;
    /** AI SDK `ModelMessage`-shaped values (converted, NOT Graphorin `Message`s). */
    messages: ReadonlyArray<Readonly<Record<string, unknown>>>;
    system?: string;
    tools?: unknown;
    toolChoice?: unknown;
    temperature?: number;
    maxTokens?: number;
    abortSignal?: AbortSignal;
    providerOptions?: Readonly<Record<string, unknown>>;
  }) => {
    readonly fullStream: AsyncIterable<AISDKChunk>;
  };
  readonly generateText: (args: {
    model: LanguageModelLike;
    /** AI SDK `ModelMessage`-shaped values (converted, NOT Graphorin `Message`s). */
    messages: ReadonlyArray<Readonly<Record<string, unknown>>>;
    system?: string;
    tools?: unknown;
    toolChoice?: unknown;
    temperature?: number;
    maxTokens?: number;
    abortSignal?: AbortSignal;
    providerOptions?: Readonly<Record<string, unknown>>;
  }) => Promise<{
    readonly text?: string;
    readonly toolCalls?: ReadonlyArray<{
      readonly toolCallId: string;
      readonly toolName: string;
      readonly args: unknown;
    }>;
    readonly usage?: Partial<Usage> & {
      readonly inputTokens?: number;
      readonly outputTokens?: number;
      readonly totalTokens?: number;
    };
    readonly finishReason?: string;
    readonly providerMetadata?: Readonly<Record<string, unknown>>;
  }>;
}

/**
 * Options accepted by {@link vercelAdapter}.
 *
 * @stable
 */
export interface VercelAdapterOptions {
  /**
   * Fully-qualified provider name, used for span / log labelling.
   * Defaults to `${model.provider}-${model.modelId}`.
   */
  readonly name?: string;
  /**
   * Capability declaration. The adapter merges these on top of a
   * conservative defaults table (`streaming: true`, `toolCalling: true`,
   * `multimodal: true`, …); supply explicit values to narrow them.
   */
  readonly capabilities?: Partial<ProviderCapabilities>;
  /**
   * Runtime override for the AI SDK functions. When unset, the adapter
   * lazily `await import('ai')` on first call. Test suites pass a
   * fixture-driven implementation directly.
   */
  readonly runtimeOverrides?: VercelRuntimeOverrides;
}

const DEFAULT_CAPABILITIES: Omit<ProviderCapabilities, 'reasoningContract'> = {
  streaming: true,
  toolCalling: true,
  parallelToolCalls: true,
  multimodal: true,
  structuredOutput: true,
  reasoning: true,
  contextWindow: 200_000,
  maxOutput: 16_384,
};

/**
 * Wrap a Vercel AI SDK language-model value in a Graphorin
 * {@link Provider}. Outbound requests are converted onto the AI SDK
 * call contract (name-keyed tools, `tool-call` / `tool-result` content
 * parts - see `vercel-messages.ts`); the streaming chunks emitted by
 * the AI SDK are translated back onto Graphorin `ProviderEvent`s.
 *
 * The adapter auto-detects the model's
 * `ReasoningContract` from its
 * `modelId` (e.g. Anthropic Claude → `'round-trip-required'`,
 * OpenAI o1 / o3 → `'hidden'`, Gemini reasoning variants →
 * `'hidden'`, everything else → `'optional'`). Callers can override
 * the inferred value via `options.capabilities.reasoningContract`.
 *
 * @stable
 */
export function vercelAdapter(
  model: LanguageModelLike,
  options: VercelAdapterOptions = {},
): Provider {
  const name = options.name ?? `${model.provider}-${model.modelId}`;
  const inferredContract = inferReasoningContract({
    modelId: model.modelId,
    provider: model.provider,
  });
  const capabilities: ProviderCapabilities = {
    ...DEFAULT_CAPABILITIES,
    reasoningContract: inferredContract,
    ...options.capabilities,
  };
  const runtime = options.runtimeOverrides;

  return {
    name,
    modelId: model.modelId,
    capabilities,
    stream(req) {
      return streamFromVercel(model, name, capabilities, req, runtime);
    },
    async generate(req) {
      return generateFromVercel(model, name, capabilities, req, runtime);
    },
  };
}

async function* streamFromVercel(
  model: LanguageModelLike,
  providerName: string,
  capabilities: ProviderCapabilities,
  req: ProviderRequest,
  overrides: VercelRuntimeOverrides | undefined,
): AsyncIterable<ProviderEvent> {
  const sdk = await loadRuntime(overrides);
  const callArgs = buildCallArgs(model, applyRequestPreflight(req, capabilities));
  let stream: AsyncIterable<AISDKChunk>;
  try {
    const result = sdk.streamText(callArgs);
    stream = result.fullStream;
  } catch (cause) {
    const headers = headersFromCause(cause);
    throw new ProviderHttpError({
      providerName,
      status: statusFromCause(cause),
      message: 'streamText() failed before yielding any chunks',
      cause,
      ...(headers !== undefined ? { headers } : {}),
    });
  }

  // W-023: the AI SDK never throws from streamText() synchronously -
  // transport/HTTP failures (429/500/529) arrive as in-band
  // `{type:'error'}` chunks. Emitting `stream-start` eagerly made every
  // such failure post-yield, which forbids `withRetry`/`withFallback`
  // from restarting the stream (PS-1). Defer it until the first REAL
  // mapped event, so a pre-content failure can be THROWN as a typed
  // `ProviderHttpError` (retryable / fallback-eligible) instead.
  let emittedStart = false;
  const startEvent = (): ProviderEvent => {
    emittedStart = true;
    return {
      type: 'stream-start',
      metadata: {
        providerName,
        modelId: model.modelId,
      },
    };
  };

  let finalUsage: Usage | undefined;
  let finishReason: FinishReason = 'stop';
  let sawError = false;

  for await (const chunk of stream) {
    if (req.signal?.aborted) {
      // PS-12: an aborted stream must report 'aborted', not the initial 'stop'
      // - mirrors the openai-shaped and ollama adapters.
      finishReason = 'aborted';
      break;
    }
    switch (chunk.type) {
      case 'text-delta': {
        const delta = pickString(chunk.textDelta) ?? pickString(chunk.text) ?? '';
        if (delta.length > 0) {
          if (!emittedStart) yield startEvent();
          yield { type: 'text-delta', delta };
        }
        break;
      }
      case 'reasoning':
      case 'reasoning-delta': {
        const delta =
          pickString(chunk.textDelta) ?? pickString(chunk.delta) ?? pickString(chunk.text) ?? '';
        if (delta.length > 0) {
          if (!emittedStart) yield startEvent();
          yield { type: 'reasoning-delta', delta };
        }
        break;
      }
      // W-024: per-block reasoning terminators. AI SDK v4 streams a
      // separate 'reasoning-signature' chunk ({signature}) and
      // 'redacted-reasoning' ({data}); v7 closes each block with
      // 'reasoning-end' carrying providerMetadata.anthropic.signature /
      // .redactedData. All three become the Graphorin 'reasoning-end'
      // event whose meta the retention pipeline round-trips
      // ('pass-through-claude' -> providerOptions.anthropic.signature).
      case 'reasoning-signature': {
        const signature = pickString(chunk.signature);
        if (!emittedStart) yield startEvent();
        yield {
          type: 'reasoning-end',
          meta: { provider: 'anthropic', ...(signature !== undefined ? { signature } : {}) },
        };
        break;
      }
      case 'redacted-reasoning': {
        const data = pickString(chunk.data);
        if (!emittedStart) yield startEvent();
        yield {
          type: 'reasoning-end',
          meta: { provider: 'anthropic', ...(data !== undefined ? { data } : {}) },
        };
        break;
      }
      case 'reasoning-end': {
        const anthropicMeta =
          typeof chunk.providerMetadata === 'object' && chunk.providerMetadata !== null
            ? ((chunk.providerMetadata as { anthropic?: unknown }).anthropic as
                | { signature?: unknown; redactedData?: unknown }
                | undefined)
            : undefined;
        const signature = pickString(anthropicMeta?.signature);
        const data = pickString(anthropicMeta?.redactedData);
        if (!emittedStart) yield startEvent();
        yield {
          type: 'reasoning-end',
          meta: {
            provider: 'anthropic',
            ...(signature !== undefined ? { signature } : {}),
            ...(data !== undefined ? { data } : {}),
          },
        };
        break;
      }
      // PS-6 dual-shape: AI SDK v4 streams `tool-call-streaming-start` /
      // `tool-call-delta` keyed by `toolCallId`/`argsTextDelta`; v7 streams
      // `tool-input-start` / `tool-input-delta` keyed by `id`/`delta`.
      case 'tool-call-streaming-start':
      case 'tool-input-start': {
        const toolCallId = pickString(chunk.toolCallId) ?? pickString(chunk.id);
        const toolName = pickString(chunk.toolName);
        if (toolCallId !== undefined && toolName !== undefined) {
          if (!emittedStart) yield startEvent();
          yield {
            type: 'tool-call-start',
            toolCallId,
            toolName,
          };
        }
        break;
      }
      case 'tool-call-delta':
      case 'tool-input-delta': {
        const toolCallId = pickString(chunk.toolCallId) ?? pickString(chunk.id);
        const argsDelta =
          pickString(chunk.argsTextDelta) ??
          pickString(chunk.delta) ??
          pickString(chunk.inputTextDelta);
        if (toolCallId !== undefined && argsDelta !== undefined && argsDelta.length > 0) {
          if (!emittedStart) yield startEvent();
          yield {
            type: 'tool-call-input-delta',
            toolCallId,
            argsDelta,
          };
        }
        break;
      }
      case 'tool-call': {
        const toolCallId = pickString(chunk.toolCallId) ?? pickString(chunk.id);
        if (toolCallId !== undefined) {
          if (!emittedStart) yield startEvent();
          yield {
            type: 'tool-call-end',
            toolCallId,
            // v4 carries `args`; v7 carries `input`.
            finalArgs: chunk.args ?? chunk.input,
          };
        }
        break;
      }
      case 'finish': {
        finishReason = mapFinishReason(pickString(chunk.finishReason));
        // v4 carries `usage`; v7 carries `totalUsage` (zeroing the v4
        // read nulled cost tracking on streaming).
        finalUsage = mapUsage(chunk.totalUsage ?? chunk.usage);
        break;
      }
      case 'error': {
        const errorField = chunk.error;
        const message =
          typeof errorField === 'string'
            ? errorField
            : typeof errorField === 'object' && errorField !== null
              ? (pickString((errorField as { message?: unknown }).message) ?? 'unknown error')
              : 'unknown error';
        // W-023: an abort surfacing as an error chunk is a cancellation,
        // never a retryable failure (mirrors PS-12).
        if (isAbortError(errorField) || req.signal?.aborted === true) {
          finishReason = 'aborted';
          break;
        }
        const status = statusFromCause(errorField);
        if (!emittedStart) {
          // Pre-content failure: nothing was yielded, so by PS-1 the
          // middleware may restart this stream. Throw the classified
          // typed error - `withRetry` retries 429/5xx pre-yield,
          // `withFallback` switches providers, and the agent-level
          // fallback chain reads `errorKind` off the throw.
          const headers = headersFromCause(errorField);
          throw new ProviderHttpError({
            providerName,
            status,
            message,
            cause: errorField,
            ...(headers !== undefined ? { headers } : {}),
          });
        }
        // Mid-stream failure: a restart is forbidden (PS-1) - surface a
        // structural error event with the canonical kind so the
        // agent-level per-step fallback can act on rate-limit/capacity
        // instead of an inert 'unknown'. Status 0 classifies as
        // 'transient' by the PS-2 network policy.
        sawError = true;
        yield {
          type: 'error',
          error: { kind: classifyHttpStatus(status, message), message },
        };
        break;
      }
      default:
        // Unknown chunk types are forward-compatible no-ops; we keep
        // streaming so additive AI SDK upgrades do not break callers.
        break;
    }
  }

  if (!emittedStart) yield startEvent();
  yield {
    type: 'finish',
    // W-023: a stream that surfaced an error event must not end with a
    // synthetic 'stop' + zero usage - parity with llamacpp-node (PS-4).
    finishReason: sawError ? 'error' : finishReason,
    usage: finalUsage ?? { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
  };
}

async function generateFromVercel(
  model: LanguageModelLike,
  providerName: string,
  capabilities: ProviderCapabilities,
  req: ProviderRequest,
  overrides: VercelRuntimeOverrides | undefined,
): Promise<ProviderResponse> {
  const sdk = await loadRuntime(overrides);
  const callArgs = buildCallArgs(model, applyRequestPreflight(req, capabilities));
  let result: Awaited<ReturnType<VercelRuntimeOverrides['generateText']>>;
  try {
    result = await sdk.generateText(callArgs);
  } catch (cause) {
    const headers = headersFromCause(cause);
    throw new ProviderHttpError({
      providerName,
      status: statusFromCause(cause),
      message: 'generateText() rejected',
      cause,
      ...(headers !== undefined ? { headers } : {}),
    });
  }
  const usage = mapUsage(result.usage) ?? {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  };
  const finishReason = mapFinishReason(result.finishReason);
  const response: ProviderResponse = {
    usage,
    finishReason,
    ...(result.text !== undefined ? { text: result.text } : {}),
    ...(result.toolCalls !== undefined
      ? { toolCalls: result.toolCalls.map(normalizeToolCall) }
      : {}),
    ...(result.providerMetadata !== undefined ? { providerMetadata: result.providerMetadata } : {}),
  };
  return response;
}

function applyRequestPreflight(
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

function buildCallArgs(model: LanguageModelLike, req: ProviderRequest) {
  const prompt = toAiSdkPrompt(req.messages);
  // System-role transcript messages are hoisted here - the SDK rejects
  // them inside `messages`. The request-level systemMessage leads.
  const system = [req.systemMessage, prompt.system]
    .filter((s): s is string => s !== undefined && s.length > 0)
    .join('\n\n');
  const messages =
    req.cachePolicy?.breakpoints === 'auto'
      ? applyCacheAnchors(prompt.messages, req.cachePolicy.ttl)
      : prompt.messages;
  return {
    model,
    messages,
    ...(system.length > 0 ? { system } : {}),
    // C2: fold worked examples in the adapter itself, so raw-adapter use
    // (no createProvider wrapper) still puts them in front of the model.
    // Idempotent: an upstream fold already dropped the structured field.
    ...(req.tools !== undefined && req.tools.length > 0
      ? { tools: toAiSdkTools(foldToolExamples(req.tools)) }
      : {}),
    ...(req.toolChoice !== undefined ? { toolChoice: toAiSdkToolChoice(req.toolChoice) } : {}),
    ...(req.temperature !== undefined ? { temperature: req.temperature } : {}),
    // v4 reads `maxTokens`; v7 renamed it `maxOutputTokens` - send both
    // so the cap is honoured against either peer (PS-6).
    ...(req.maxTokens !== undefined
      ? { maxTokens: req.maxTokens, maxOutputTokens: req.maxTokens }
      : {}),
    ...(req.signal !== undefined ? { abortSignal: req.signal } : {}),
    ...(req.providerOptions !== undefined ? { providerOptions: req.providerOptions } : {}),
  } as const;
}

function pickString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/**
 * Normalize a generate() tool call across peers: AI SDK v4 carries
 * `args`, v7 carries `input`. The framework shape is `args`.
 */
function normalizeToolCall(tc: unknown): { toolCallId: string; toolName: string; args: unknown } {
  const t = tc as {
    toolCallId?: unknown;
    id?: unknown;
    toolName?: unknown;
    args?: unknown;
    input?: unknown;
  };
  return {
    toolCallId: pickString(t.toolCallId) ?? pickString(t.id) ?? '',
    toolName: pickString(t.toolName) ?? '',
    args: t.args ?? t.input,
  };
}

/**
 * Lift a real HTTP status from a rejected AI SDK call. The SDK's
 * `APICallError` carries a numeric `statusCode`; surfacing it lets
 * `withRetry` / `withFallback` see a genuine 429 / 5xx instead of the
 * `status: 0` network-error placeholder. Returns `0` when no status is
 * present (a true transport-level failure or an abort) - `0` is itself
 * retryable / fallback-eligible by default, while an abort is excluded by
 * the predicates via the wrapped `cause`.
 */
function statusFromCause(cause: unknown): number {
  if (cause !== null && typeof cause === 'object') {
    const c = cause as { statusCode?: unknown; status?: unknown };
    if (typeof c.statusCode === 'number' && Number.isFinite(c.statusCode)) return c.statusCode;
    if (typeof c.status === 'number' && Number.isFinite(c.status)) return c.status;
  }
  return 0;
}

/**
 * Lift backoff-relevant response headers from a rejected AI SDK call.
 * `APICallError` carries `responseHeaders: Record<string, string>`;
 * forwarding `retry-after` / `x-ratelimit-*` lets `withRetry` honour
 * server-provided delays on 429s.
 */
function headersFromCause(cause: unknown): Readonly<Record<string, string>> | undefined {
  if (cause === null || typeof cause !== 'object') return undefined;
  const raw = (cause as { responseHeaders?: unknown }).responseHeaders;
  if (raw === null || typeof raw !== 'object') return undefined;
  const picked: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const lower = key.toLowerCase();
    if (
      (lower === 'retry-after' || lower.startsWith('x-ratelimit-')) &&
      typeof value === 'string'
    ) {
      picked[lower] = value;
    }
  }
  return Object.keys(picked).length > 0 ? picked : undefined;
}

function mapFinishReason(value: string | undefined): FinishReason {
  switch (value) {
    case 'stop':
    case 'length':
    case 'tool-calls':
    case 'content-filter':
    case 'error':
      return value;
    case 'aborted':
    case 'cancelled':
      return 'aborted';
    default:
      return 'stop';
  }
}

function mapUsage(input: unknown): Usage | undefined {
  if (input === undefined || input === null || typeof input !== 'object') return undefined;
  const u = input as {
    promptTokens?: number;
    completionTokens?: number;
    inputTokens?: number;
    outputTokens?: number;
    reasoningTokens?: number;
    totalTokens?: number;
    // v7 runtime-normalized detail splits (core-provider-02): inputTokens
    // is the TOTAL including cache reads/writes; outputTokens the TOTAL
    // including reasoning.
    inputTokenDetails?: {
      cacheReadTokens?: number;
      cacheWriteTokens?: number;
      noCacheTokens?: number;
    };
    outputTokenDetails?: { reasoningTokens?: number; textTokens?: number };
  };
  const promptTokens = u.promptTokens ?? u.inputTokens ?? 0;
  const rawCompletion = u.completionTokens ?? u.outputTokens ?? 0;
  const totalTokens = u.totalTokens ?? promptTokens + rawCompletion;
  const cachedReadTokens = numberOrUndefined(u.inputTokenDetails?.cacheReadTokens);
  const cacheWriteTokens = numberOrUndefined(u.inputTokenDetails?.cacheWriteTokens);
  // The v7 detail reports reasoning as a SUBSET of outputTokens; core Usage
  // declares reasoningTokens EXCLUSIVE of completionTokens, so split the
  // total (sum unchanged). The flat field (v4/v5 peers) is already exclusive.
  const detailReasoning = numberOrUndefined(u.outputTokenDetails?.reasoningTokens);
  let completionTokens = rawCompletion;
  let reasoningTokens = u.reasoningTokens;
  if (reasoningTokens === undefined && detailReasoning !== undefined && detailReasoning > 0) {
    reasoningTokens = detailReasoning;
    completionTokens = Math.max(0, rawCompletion - detailReasoning);
  }
  const usage: Usage = {
    promptTokens,
    completionTokens,
    totalTokens,
    ...(reasoningTokens !== undefined ? { reasoningTokens } : {}),
    ...(cachedReadTokens !== undefined && cachedReadTokens > 0 ? { cachedReadTokens } : {}),
    ...(cacheWriteTokens !== undefined && cacheWriteTokens > 0 ? { cacheWriteTokens } : {}),
  };
  return usage;
}

function numberOrUndefined(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

let cachedRuntime: VercelRuntimeOverrides | null = null;

async function loadRuntime(
  overrides: VercelRuntimeOverrides | undefined,
): Promise<VercelRuntimeOverrides> {
  if (overrides !== undefined) return overrides;
  if (cachedRuntime !== null) return cachedRuntime;
  let mod: { streamText?: unknown; generateText?: unknown };
  try {
    mod = (await import('ai')) as { streamText?: unknown; generateText?: unknown };
  } catch (cause) {
    throw new ProviderStreamParseError(
      'vercel',
      "Failed to import the 'ai' peer dependency. Install it with `pnpm add ai` or pass a runtimeOverrides value.",
      cause,
    );
  }
  if (typeof mod.streamText !== 'function' || typeof mod.generateText !== 'function') {
    throw new ProviderStreamParseError(
      'vercel',
      "The installed 'ai' package does not expose streamText / generateText functions.",
    );
  }
  cachedRuntime = {
    streamText: mod.streamText as VercelRuntimeOverrides['streamText'],
    generateText: mod.generateText as VercelRuntimeOverrides['generateText'],
  };
  return cachedRuntime;
}

/**
 * Test-only hook that resets the cached AI SDK runtime. Provider tests
 * that mutate the cache (e.g. by injecting a mock then verifying the
 * default loader runs) call this between scenarios.
 *
 * @internal
 */
export function __resetVercelRuntimeCache(): void {
  cachedRuntime = null;
}
