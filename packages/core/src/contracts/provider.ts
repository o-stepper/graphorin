import type { Message, ReasoningContentMeta } from '../types/message.js';
import type { Sensitivity } from '../types/sensitivity.js';
import type { ToolCall } from '../types/tool-call.js';
import type { Usage } from '../types/usage.js';
import type { ReasoningContract, ReasoningRetention } from './reasoning-retention.js';

/**
 * Vendor-neutral LLM provider interface. Concrete adapters live in
 * `@graphorin/provider` (and companion packages such as
 * `@graphorin/provider-llamacpp-node`).
 *
 * Every provider exposes a `name` (used in spans / logs), the `modelId`
 * it wraps, a static `capabilities` descriptor, and the two streaming /
 * one-shot generation methods.
 *
 * @stable
 */
export interface Provider {
  readonly name: string;
  readonly modelId: string;
  readonly capabilities: ProviderCapabilities;

  /** Returns an async stream of fine-grained provider events. */
  stream(req: ProviderRequest): AsyncIterable<ProviderEvent>;

  /** Convenience wrapper that consumes the stream into a single result. */
  generate(req: ProviderRequest): Promise<ProviderResponse>;

  /** Optional: provider-native input token counter. */
  countTokens?(req: ProviderRequest): Promise<number>;

  /**
   * Sensitivity tiers this provider is allowed to receive. Used by the
   * ContextEngine sensitivity filter and the outbound redaction
   * middleware to decide what content is safe to forward.
   */
  readonly acceptsSensitivity?: ReadonlyArray<Sensitivity>;
}

/**
 * Static capability descriptor returned by `Provider.capabilities`.
 *
 * @stable
 */
export interface ProviderCapabilities {
  readonly streaming: boolean;
  readonly toolCalling: boolean;
  readonly parallelToolCalls: boolean;
  readonly multimodal: boolean;
  readonly structuredOutput: boolean;
  readonly reasoning: boolean;
  /** Total context window in tokens. */
  readonly contextWindow: number;
  /** Maximum output tokens. */
  readonly maxOutput: number;
  /**
   * How the provider treats reasoning content across consecutive
   * `provider.stream(...)` calls. Drives the auto-detected default
   * {@link ReasoningRetention} value when the caller does not pass
   * an explicit override on the request.
   *
   * Adapters supplied with the framework declare this field; bespoke
   * adapters that omit it are treated as `'optional'` (conservative
   * `'strip'` default + WARN-once on first reasoning emission).
   */
  readonly reasoningContract?: ReasoningContract;
}

/**
 * Opt-in prompt-cache breakpoint policy.
 *
 * `breakpoints: 'auto'` asks the adapter to place provider-native cache
 * anchors around the stable request prefix: the Anthropic path (via the
 * vercel adapter) marks the first and last conversation messages with
 * `cache_control: { type: 'ephemeral' }` so tools + system + the stable
 * prefix are written once and read at ~0.1x input price on subsequent
 * steps. Providers with automatic caching (OpenAI) or no cache concept
 * ignore the policy. `ttl` maps to Anthropic's extended cache TTL.
 *
 * @stable
 */
export interface ProviderCachePolicy {
  readonly breakpoints: 'auto' | 'none';
  readonly ttl?: '5m' | '1h';
}

/**
 * Provider-call request payload.
 *
 * @stable
 */
export interface ProviderRequest {
  readonly messages: ReadonlyArray<Message>;
  readonly tools?: ReadonlyArray<ToolDefinition>;
  readonly toolChoice?: ToolChoice;
  readonly outputType?: OutputSpec;
  readonly systemMessage?: string;
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly signal?: AbortSignal;
  readonly providerOptions?: Readonly<Record<string, unknown>>;
  readonly cachePolicy?: ProviderCachePolicy;
  /**
   * Live parent span for the provider call. Like `signal`, this is a
   * runtime handle (never serialized): `withTracing` parents its
   * provider.generate/stream span under it so a run's traces form one
   * tree instead of disconnected fragments.
   */
  readonly parentSpan?: import('./tracer.js').AISpan;
  readonly metadata?: ProviderRequestMetadata;
  /**
   * Per-request override of the provider's auto-detected
   * {@link ReasoningRetention} default. Only honoured when the
   * provider declares `reasoningContract` of `'round-trip-required'`
   * or `'optional'`; hidden-chain-of-thought providers (e.g.
   * `'hidden'`) always strip and emit one WARN per process when an
   * incompatible override is supplied.
   */
  readonly reasoningRetention?: ReasoningRetention;
}

/**
 * Per-request metadata used by tracing and auditing layers.
 *
 * @stable
 */
export interface ProviderRequestMetadata {
  readonly sessionId?: string;
  readonly agentId?: string;
  readonly userId?: string;
  readonly runId?: string;
  readonly stepNumber?: number;
}

/**
 * One-shot response shape returned by `Provider.generate(...)`.
 *
 * @stable
 */
export interface ProviderResponse {
  readonly text?: string;
  /**
   * Tool invocations the model requested. Reuses the canonical
   * {@link ToolCall} (the previous inline shape was structurally
   * identical and only invited drift).
   */
  readonly toolCalls?: ReadonlyArray<ToolCall>;
  readonly usage: Usage;
  readonly finishReason: FinishReason;
  readonly providerMetadata?: Readonly<Record<string, unknown>>;
}

/**
 * Reason a provider call ended.
 *
 * @stable
 */
export type FinishReason =
  | 'stop'
  | 'length'
  | 'tool-calls'
  | 'content-filter'
  | 'error'
  | 'aborted';

/**
 * Streamed provider event. Shape matches the wire-stable subset of the
 * provider event union - adapters hide vendor specifics.
 *
 * @stable
 */
export type ProviderEvent =
  | { readonly type: 'stream-start'; readonly metadata: ResponseMetadata }
  | { readonly type: 'reasoning-delta'; readonly delta: string }
  /**
   * Closes the current reasoning block. Deltas stay textual;
   * this terminator carries the provider's opaque round-trip metadata
   * (e.g. the Anthropic thinking-block `signature`, or `data` for a
   * redacted block) so multi-step tool use with extended thinking can
   * replay the block byte-equal on the next request. Adapters without
   * per-block structure simply never emit it - consumers fall back to
   * collapsing the deltas.
   */
  | { readonly type: 'reasoning-end'; readonly meta?: ReasoningContentMeta }
  | { readonly type: 'text-delta'; readonly delta: string }
  | { readonly type: 'tool-call-start'; readonly toolCallId: string; readonly toolName: string }
  | {
      readonly type: 'tool-call-input-delta';
      readonly toolCallId: string;
      readonly argsDelta: string;
    }
  | { readonly type: 'tool-call-end'; readonly toolCallId: string; readonly finalArgs: unknown }
  | { readonly type: 'file'; readonly mimeType: string; readonly data: Uint8Array }
  | { readonly type: 'source'; readonly uri: string; readonly title?: string }
  /**
   * Terminal event. `providerMetadata` mirrors
   * {@link ProviderResponse.providerMetadata} for the streaming path:
   * an optional vendor-namespaced diagnostic payload (e.g. the Ollama
   * adapter reports `{ ollama: { loadMs, promptEvalMs, evalMs,
   * totalMs } }` from the server's timing fields, so model load,
   * prompt processing and generation are distinguishable).
   * Adapters without such a payload simply omit the field.
   */
  | {
      readonly type: 'finish';
      readonly finishReason: FinishReason;
      readonly usage: Usage;
      readonly providerMetadata?: Readonly<Record<string, unknown>>;
    }
  | { readonly type: 'error'; readonly error: ProviderError };

/**
 * Metadata attached to the first `stream-start` event of a stream.
 *
 * @stable
 */
export interface ResponseMetadata {
  readonly providerName: string;
  readonly modelId: string;
  readonly responseId?: string;
  readonly createdAt?: string;
}

/**
 * Provider-side error shape carried by `provider-error` events.
 *
 * @stable
 */
export interface ProviderError {
  readonly kind: ProviderErrorKind;
  readonly message: string;
  readonly cause?: unknown;
}

/** @stable */
export type ProviderErrorKind =
  | 'rate-limit'
  | 'capacity'
  | 'context-length'
  | 'transient'
  | 'invalid-request'
  | 'unauthorized'
  | 'content-filter'
  | 'unknown';

/**
 * Tool description shipped with a provider request. Implementations
 * convert the user's Zod schema to a JSON Schema 7 fragment.
 *
 * @stable
 */
export interface ToolDefinition {
  readonly name: string;
  readonly description?: string;
  readonly inputSchema: Readonly<Record<string, unknown>>;
  /**
   * The tool's output schema (JSON Schema), when declared. The agent runtime
   * populates it from `Tool.outputSchema`; structured-output providers and typed
   * code-mode use it to validate / type the tool's result. Absent when the tool
   * declares no output schema.
   */
  readonly outputSchema?: Readonly<Record<string, unknown>>;
  /**
   * Worked examples surfaced to the provider alongside the schema. The
   * agent runtime populates this from the tool's `examples` when they
   * are eagerly rendered (see `Tool.examplesEagerlyRendered`); it is
   * bounded to ≤5 and absent when the tool declares none or defers them.
   * Implementations MAY fold these into the model-facing tool description.
   */
  readonly examples?: ReadonlyArray<ToolDefinitionExample>;
}

/**
 * A single worked example as projected onto the provider wire contract -
 * a serializable, schema-agnostic view of a `ToolExample`. `input` /
 * `output` carry the example's already-parsed values; `comment` is the
 * optional rationale shown to the model.
 *
 * @stable
 */
export interface ToolDefinitionExample {
  readonly input: unknown;
  readonly output: unknown;
  readonly comment?: string;
}

/**
 * Tool selection strategy.
 *
 * @stable
 */
export type ToolChoice = 'auto' | 'required' | 'none' | { readonly tool: string };

/**
 * Output type specification for structured / typed responses. Concrete
 * Zod-based variants live in the runtime packages.
 *
 * @stable
 */
export interface OutputSpec {
  readonly kind: 'text' | 'structured';
  readonly description?: string;
  readonly jsonSchema?: Readonly<Record<string, unknown>>;
}

/**
 * Provider middleware: a function that wraps a `Provider` and returns a
 * new `Provider` with extra behaviour (retry, fallback, redaction, …).
 *
 * Middleware ordering is enforced by the runtime per the documented
 * inside-out chain (innermost adapter → ... → outermost retry / observer).
 *
 * @stable
 */
export type ProviderMiddleware = (next: Provider) => Provider;

/**
 * Type signature for the canonical middleware composer (the runtime
 * implementation lives in `@graphorin/provider`).
 *
 * The concrete composer guarantees a deterministic ordering - order of
 * arguments mirrors order of execution from outermost to innermost - and
 * is the only blessed entry point for chaining middleware in
 * `@graphorin/*` code (per the security-first ordering rule).
 *
 * @stable
 */
export type ComposeProviderMiddleware = (
  middlewares: ReadonlyArray<ProviderMiddleware>,
) => ProviderMiddleware;
