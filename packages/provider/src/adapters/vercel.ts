/**
 * `vercelAdapter` — wraps a Vercel AI SDK `LanguageModel`-shaped value
 * into a Graphorin {@link Provider}. The adapter is the default cloud
 * path: it speaks the AI SDK's `streamText` / `generateText` API and
 * maps the resulting events onto the canonical
 * {@link import('@graphorin/core').ProviderEvent} discriminated union.
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
  Message,
  Provider,
  ProviderCapabilities,
  ProviderEvent,
  ProviderRequest,
  ProviderResponse,
  Usage,
} from '@graphorin/core';

import { ProviderHttpError, ProviderStreamParseError } from '../errors/errors.js';
import { applyReasoningPolicy } from '../reasoning/apply-policy.js';
import { inferReasoningContract } from '../reasoning/classify-contract.js';
import { resolveReasoningRetention } from '../reasoning/retention.js';

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
 * intentionally permissive — we accept anything that carries the
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
    messages: ReadonlyArray<Message>;
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
    messages: ReadonlyArray<Message>;
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
 * {@link Provider}. The adapter passes Graphorin `Message`s through
 * directly — both formats use the same role + content discriminated
 * shape — and translates the streaming chunks emitted by the AI SDK
 * onto Graphorin `ProviderEvent`s.
 *
 * The adapter auto-detects the model's
 * {@link import('@graphorin/core').ReasoningContract} from its
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
    throw new ProviderHttpError({
      providerName,
      status: 0,
      message: 'streamText() failed before yielding any chunks',
      cause,
    });
  }

  yield {
    type: 'stream-start',
    metadata: {
      providerName,
      modelId: model.modelId,
    },
  };

  let finalUsage: Usage | undefined;
  let finishReason: FinishReason = 'stop';

  for await (const chunk of stream) {
    if (req.signal?.aborted) break;
    switch (chunk.type) {
      case 'text-delta': {
        const delta = pickString(chunk.textDelta) ?? pickString(chunk.text) ?? '';
        if (delta.length > 0) {
          yield { type: 'text-delta', delta };
        }
        break;
      }
      case 'reasoning':
      case 'reasoning-delta': {
        const delta =
          pickString(chunk.textDelta) ?? pickString(chunk.delta) ?? pickString(chunk.text) ?? '';
        if (delta.length > 0) {
          yield { type: 'reasoning-delta', delta };
        }
        break;
      }
      case 'tool-call-streaming-start': {
        const toolCallId = pickString(chunk.toolCallId);
        const toolName = pickString(chunk.toolName);
        if (toolCallId !== undefined && toolName !== undefined) {
          yield {
            type: 'tool-call-start',
            toolCallId,
            toolName,
          };
        }
        break;
      }
      case 'tool-call-delta': {
        const toolCallId = pickString(chunk.toolCallId);
        const argsDelta = pickString(chunk.argsTextDelta);
        if (toolCallId !== undefined && argsDelta !== undefined && argsDelta.length > 0) {
          yield {
            type: 'tool-call-input-delta',
            toolCallId,
            argsDelta,
          };
        }
        break;
      }
      case 'tool-call': {
        const toolCallId = pickString(chunk.toolCallId);
        if (toolCallId !== undefined) {
          yield {
            type: 'tool-call-end',
            toolCallId,
            finalArgs: chunk.args,
          };
        }
        break;
      }
      case 'finish': {
        finishReason = mapFinishReason(pickString(chunk.finishReason));
        finalUsage = mapUsage(chunk.usage);
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
        yield {
          type: 'error',
          error: { kind: 'unknown', message },
        };
        break;
      }
      default:
        // Unknown chunk types are forward-compatible no-ops; we keep
        // streaming so additive AI SDK upgrades do not break callers.
        break;
    }
  }

  yield {
    type: 'finish',
    finishReason,
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
    throw new ProviderHttpError({
      providerName,
      status: 0,
      message: 'generateText() rejected',
      cause,
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
    ...(result.toolCalls !== undefined ? { toolCalls: [...result.toolCalls] } : {}),
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
  return {
    model,
    messages: req.messages,
    ...(req.systemMessage !== undefined ? { system: req.systemMessage } : {}),
    ...(req.tools !== undefined ? { tools: req.tools } : {}),
    ...(req.toolChoice !== undefined ? { toolChoice: req.toolChoice } : {}),
    ...(req.temperature !== undefined ? { temperature: req.temperature } : {}),
    ...(req.maxTokens !== undefined ? { maxTokens: req.maxTokens } : {}),
    ...(req.signal !== undefined ? { abortSignal: req.signal } : {}),
    ...(req.providerOptions !== undefined ? { providerOptions: req.providerOptions } : {}),
  } as const;
}

function pickString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
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
  };
  const promptTokens = u.promptTokens ?? u.inputTokens ?? 0;
  const completionTokens = u.completionTokens ?? u.outputTokens ?? 0;
  const totalTokens = u.totalTokens ?? promptTokens + completionTokens;
  const usage: Usage = {
    promptTokens,
    completionTokens,
    totalTokens,
    ...(u.reasoningTokens !== undefined ? { reasoningTokens: u.reasoningTokens } : {}),
  };
  return usage;
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
