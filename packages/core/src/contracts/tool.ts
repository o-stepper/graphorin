import type { MessageContent } from '../types/message.js';
import type { RunContext } from '../types/run.js';
import type {
  ContentChunk,
  InboundSanitizationPolicy,
  MemoryGuardTier,
  SandboxPolicy,
  SideEffectClass,
  ToolSource,
  ToolTrustClass,
  TruncationStrategy,
} from '../types/tool.js';
import type { ZodLikeSchema } from '../utils/validation.js';
import type { Logger } from './logger.js';
import type { ModelHint, ModelSpec } from './preferred-model.js';
import type { Tracer } from './tracer.js';

/**
 * Pluggable function call exposed to an LLM. Concrete `Tool` instances
 * are produced by the `tool({...})` factory in `@graphorin/tools` and
 * by the MCP / Skills loaders. The interface lives in core because every
 * package above the persistence layer (agent runtime, workflow engine,
 * server, sessions, observability, …) carries `Tool[]` references on
 * its public surface.
 *
 * The interface is intentionally minimal — extension fields covered by
 * later phases (per-tool `secretsAllowed` ACL, inbound sanitization
 * policy, result truncation strategy, streaming hint, …) are added
 * **additively** by their owning packages so that v0.1 consumers can
 * type their tool list against `Tool<...>` today without having to
 * worry about future fields.
 *
 * @stable
 */
export interface Tool<TInput = unknown, TOutput = unknown, TDeps = unknown> {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: ZodLikeSchema<TInput>;
  readonly outputSchema?: ZodLikeSchema<TOutput>;
  /**
   * Either a static boolean or a predicate consulted at runtime against
   * the realized input. `true` means the runtime suspends the run with a
   * `tool.approval.requested` event before the tool executes.
   */
  readonly needsApproval?:
    | boolean
    | ((input: TInput, ctx: ToolExecutionContext<TDeps>) => boolean | Promise<boolean>);
  /** Sandbox isolation level. Defaults are picked by `@graphorin/security`. */
  readonly sandboxPolicy?: SandboxPolicy;
  /** Free-form labels surfaced to operators and to the model. */
  readonly tags?: ReadonlyArray<string>;
  /**
   * Sequential execution mode hints. Tools tagged `'sequential'` are
   * never executed in parallel with each other; the executor serializes
   * them inside the per-step batch.
   *
   * @default `'parallel'`
   */
  readonly executionMode?: 'parallel' | 'sequential';
  /**
   * Per-tool secrets ACL. Tool execution is wrapped in a scope where
   * `ctx.secrets.require(...)` only resolves keys present here.
   * Empty / undefined means the tool may not request any secret.
   */
  readonly secretsAllowed?: ReadonlyArray<string>;
  /**
   * Sensitivity ceiling of the tool's input + output payload. Used by
   * the redaction validator to decide whether the result may flow to a
   * given sink (provider / exporter).
   */
  readonly sensitivity?: import('../types/sensitivity.js').Sensitivity;
  /** Memory-modification guard tier (DEC-153). */
  readonly memoryGuardTier?: MemoryGuardTier;
  /** Inbound prompt-injection sanitization policy. */
  readonly inboundSanitization?: InboundSanitizationPolicy;
  /**
   * When `true`, an inbound-sanitization hit returns `ToolError({ kind:
   * 'inbound_sanitization_blocked' })` instead of forwarding the
   * (sanitized) result. Intended for regulated deployments.
   *
   * @default `false`
   */
  readonly failClosed?: boolean;
  /**
   * Defer the tool from the per-step catalogue until the model invokes
   * the built-in `tool_search` to look it up. Tools with deferred
   * loading are not advertised to the model on every step, which keeps
   * the input-token cost bounded for installations with dozens of
   * MCP-derived tools.
   *
   * @default `false`
   */
  readonly defer_loading?: boolean;
  /**
   * Maximum number of tokens the assembled tool result may carry into
   * the conversation history. `0` disables the cap (logs a one-time
   * WARN at registration). Counted against text-shaped output and
   * text-shaped `contentParts` entries; non-text parts pass through.
   *
   * @default `16384`
   */
  readonly maxResultTokens?: number;
  /** Truncation strategy applied when `maxResultTokens` is exceeded. */
  readonly truncationStrategy?: TruncationStrategy;
  /**
   * Worked examples shown to the model alongside the tool's
   * description. Bounded `[1, 5]` — overflow emits a one-time WARN at
   * registration. Each example's `input` and `output` is validated
   * against the tool's `inputSchema` / `outputSchema`.
   */
  readonly examples?: ReadonlyArray<ToolExample<TInput, TOutput>>;
  /**
   * Render examples eagerly (every step) regardless of
   * `defer_loading`. When undefined the runtime applies the auto-rule:
   * `defer_loading: true` ⇒ `false`; `defer_loading: false` ⇒ `true`;
   * neither ⇒ `undefined` (the agent runtime decides at assembly time).
   */
  readonly examplesEagerlyRendered?: boolean;
  /**
   * REQUIRED side-effect classification. v0.1 transition mode emits a
   * one-time WARN per tool name on missing classification and applies
   * the conservative deferred default `'side-effecting'`; v0.2 may
   * promote the WARN to a registration error.
   */
  readonly sideEffectClass?: SideEffectClass;
  /**
   * Optional callback returning a deterministic dedup key per
   * `(input, ctx)` tuple. REQUIRED-by-WARN for `'side-effecting'` /
   * `'external-stateful'` tools. The framework does not validate
   * determinism — that is the operator's contract.
   */
  readonly idempotencyKey?: (
    input: TInput,
    ctx: ToolExecutionContext<TDeps>,
  ) => string | Promise<string>;
  /**
   * Opt-in flag for streaming-tool execution. The `?: true` typing
   * rejects `streamingHint: false` on purpose — absence is the
   * canonical "non-streaming" signal preserving v0.1 behaviour. When
   * `true`, `Tool.execute(...)` may call `ctx.streamContent(...)` /
   * `ctx.reportProgress(...)` and may return `Promise<void>`.
   */
  readonly streamingHint?: true;
  /**
   * Per-tool author-time model hint. Either a cost-tier vocabulary
   * literal (`'fast' | 'balanced' | 'smart'`) OR an explicit
   * `ModelSpec` that always wins over the agent-side tier mapping.
   */
  readonly preferredModel?: ModelHint | ModelSpec;
  /**
   * Execute the tool. Concrete implementations may return either a raw
   * `TOutput` or a `ToolReturn<TOutput>` envelope when extra content
   * parts (images, files, …) need to be appended to the conversation.
   * Streaming-hint tools may also return `void` once the per-chunk
   * buffer has been populated.
   */
  execute(
    input: TInput,
    ctx: ToolExecutionContext<TDeps>,
  ): Promise<TOutput | ToolReturn<TOutput> | void>;
}

/**
 * Worked example for a `Tool`. Type-parameterized on the same generics
 * as `Tool`, so a `ToolExample` for `Tool<{ q: string }, { hits: T[] }>`
 * cannot specify an `input` shape that does not match.
 *
 * @stable
 */
export interface ToolExample<TInput = unknown, TOutput = unknown> {
  readonly input: TInput;
  readonly output: TOutput | ToolReturn<TOutput>;
  readonly comment?: string;
}

/**
 * Resolved record returned by the `ToolRegistry` getter. Carries every
 * non-public registration-time field downstream layers consume
 * (sanitization, audit, retrieval, side-effect classification,
 * collision resolution, …) so consumers do not have to recompute it.
 *
 * @stable
 */
export interface ResolvedTool<TInput = unknown, TOutput = unknown, TDeps = unknown>
  extends Tool<TInput, TOutput, TDeps> {
  readonly __trustClass: ToolTrustClass;
  readonly __source: ToolSource;
  readonly __effectiveDeferLoading: boolean;
  readonly __sideEffectClass: SideEffectClass;
  readonly __hasIdempotencyKey: boolean;
  readonly __streamingHint: boolean;
  readonly __exampleCount: number;
  readonly __preferredModel?: ModelHint | ModelSpec;
}

/**
 * Optional return envelope: pairs a typed `output` (passed to the model)
 * with extra `contentParts` that are appended verbatim to the
 * conversation (images, files, audio, …).
 *
 * @stable
 */
export interface ToolReturn<TOutput = unknown> {
  readonly output: TOutput;
  readonly contentParts?: ReadonlyArray<MessageContent>;
}

/**
 * Per-call execution context handed to `Tool.execute(...)`. Carries the
 * stable `toolCallId`, the parent `RunContext`, an `AbortSignal` tied to
 * the surrounding agent run, structured tracer / logger handles, the
 * streaming progress / content emitters, and a per-call secrets accessor
 * scoped to the tool's `secretsAllowed` ACL.
 *
 * @stable
 */
export interface ToolExecutionContext<TDeps = unknown> {
  readonly toolCallId: string;
  readonly runContext: RunContext<TDeps>;
  readonly signal: AbortSignal;
  readonly tracer: Tracer;
  readonly logger: Logger;
  /**
   * Per-call secrets accessor. The accessor enforces the tool's
   * `secretsAllowed` ACL — calling `require(...)` for a key that is
   * not on the allowlist throws `SecretAccessDeniedError`.
   */
  readonly secrets: ToolSecretsAccessor;
  /**
   * Emit a progress event to subscribers of `agent.stream(...)`. No-op
   * on tools without `streamingHint: true` AND on aborted streams. The
   * counter pair `(current, total?)` is consumer-rendered as a
   * percentage when both fields are present.
   */
  reportProgress(current: number, total?: number, message?: string): void;
  /**
   * Emit one chunk of content. Concatenated into the tool's assembled
   * `output` per the buffer-becomes-output discipline. No-op on tools
   * without `streamingHint: true` AND on aborted streams.
   */
  streamContent(chunk: ContentChunk): void;
}

/**
 * Per-call secrets accessor surface. Implemented by the executor; the
 * tool author calls `require(...)` to obtain a `SecretValue` wrapper.
 *
 * The accessor is intentionally narrow — the ACL enforcement happens
 * inside `require(...)`, so the tool author never accidentally
 * unwraps a secret outside the tool's permitted set.
 *
 * @stable
 */
export interface ToolSecretsAccessor {
  /**
   * Resolve a secret by key. Throws `SecretAccessDeniedError` if the
   * key is not in the tool's `secretsAllowed` allowlist; throws
   * `SecretRequiredError` (or returns `null` when `optional: true`)
   * if the key resolves to no value.
   */
  require(
    key: string,
    options?: { readonly optional?: false },
  ): Promise<import('./secret-value.js').SecretValue>;
  require(
    key: string,
    options: { readonly optional: true },
  ): Promise<import('./secret-value.js').SecretValue | null>;
}
