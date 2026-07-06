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
 * The interface is intentionally minimal - extension fields covered by
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
  /**
   * Sandbox isolation level. Defaults are picked by
   * `@graphorin/security`. ADVISORY in the default agent build (AG-18):
   * inline `config.tools` closures cannot be serialised out-of-process,
   * so the resolved policy is surfaced on the `tool.execute` span /
   * audit but the tool runs in-process. Real isolation applies to
   * module-loadable (skill / MCP) tools.
   */
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
  /**
   * Memory-modification guard tier (DEC-153). ACTIVE when the agent is
   * created with `memory` wired (SDF-1): the runtime binds a scope-aware
   * region reader over working memory and the executor snapshots/verifies
   * the region around guarded calls. Without `memory` the guard is
   * skipped and the agent emits a one-time WARN.
   */
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
   * Naming note (W-127): the snake_case is DELIBERATE - this field
   * mirrors the wire-level `defer_loading` flag of the Anthropic
   * tool-use surface one-to-one, so grep and serialized payloads
   * match. It is the only snake_case field on `Tool` by design, not
   * an oversight.
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
   * description. Bounded `[1, 5]` - overflow emits a one-time WARN at
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
   * determinism - that is the operator's contract.
   */
  readonly idempotencyKey?: (
    input: TInput,
    ctx: ToolExecutionContext<TDeps>,
  ) => string | Promise<string>;
  /**
   * Opt-in flag for streaming-tool execution. The `?: true` typing
   * rejects `streamingHint: false` on purpose - absence is the
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
  ): Promise<TOutput | ToolReturn<TOutput> | undefined>;
}

/**
 * Existentially-typed {@link Tool} for collection seams (W-100).
 *
 * `Tool` is invariant in `TInput` (the `needsApproval` /
 * `idempotencyKey` predicate properties are contravariant in it), so a
 * concretely-typed `Tool<{ q: string }, number, D>` is NOT assignable
 * to `Tool<unknown, unknown, D>` - which forced `as unknown as Tool`
 * casts wherever tools are collected. `AnyTool` erases `TInput` /
 * `TOutput` existentially, following the `HandoffEntry` precedent in
 * `@graphorin/agent`.
 *
 * Use it on COLLECTION seams (`createAgent({ tools })`, executor
 * options, registries); implement tools against the typed `Tool` via
 * the `tool({...})` factory.
 *
 * @stable
 */
// biome-ignore lint/suspicious/noExplicitAny: existential TInput/TOutput (see above)
export type AnyTool<TDeps = unknown> = Tool<any, any, TDeps>;

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
  /**
   * W-115: envelope brand set by the {@link toolReturn} factory.
   * `Symbol.for`, so duplicate package copies agree. Prefer branding:
   * the structural fallback in the executor is deliberately narrow
   * (own keys within `{output, contentParts, taint}`), and plain data
   * that happens to be exactly `{ output: X }` is ambiguous by
   * construction - brand it (or rename the field) to disambiguate.
   */
  readonly [TOOL_RETURN_BRAND]?: true;
  readonly output: TOutput;
  readonly contentParts?: ReadonlyArray<MessageContent>;
  /**
   * C6: per-result taint override the data-flow ledger honours when
   * recording this output. Lets a FIRST-PARTY tool whose CONTENT is not
   * first-party (e.g. memory recall returning quarantined /
   * foreign-provenance facts) re-arm the taint ledger, closing the
   * cross-session poisoning leg. Flags only ever WIDEN the derived label
   * (they cannot launder an untrusted tool's output into trusted).
   */
  readonly taint?: {
    readonly untrusted?: boolean;
    readonly sensitive?: boolean;
    readonly sourceKind?: string;
  };
}

/**
 * W-115: cross-realm brand for the {@link ToolReturn} envelope
 * (`SECRET_VALUE_BRAND` precedent - `Symbol.for` survives duplicate
 * package copies).
 *
 * @stable
 */
export const TOOL_RETURN_BRAND: unique symbol = Symbol.for('graphorin.ToolReturn');

/**
 * W-115: build a BRANDED {@link ToolReturn} envelope. The executor
 * unwraps branded envelopes unconditionally; unbranded objects fall to
 * a deliberately narrow structural sniff (own keys within
 * `{output, contentParts, taint}`), so a tool legitimately returning
 * `{ output, exitCode, stderr }` is no longer silently stripped to its
 * `output` field.
 *
 * @stable
 */
export function toolReturn<TOutput>(fields: {
  readonly output: TOutput;
  readonly contentParts?: ReadonlyArray<MessageContent>;
  readonly taint?: ToolReturn<TOutput>['taint'];
}): ToolReturn<TOutput> {
  return {
    [TOOL_RETURN_BRAND]: true,
    output: fields.output,
    ...(fields.contentParts !== undefined ? { contentParts: fields.contentParts } : {}),
    ...(fields.taint !== undefined ? { taint: fields.taint } : {}),
  };
}

/**
 * W-115: the ONE guard for the ToolReturn envelope (the executor and
 * the registry example-normalizer both consume it). Brand first; the
 * structural fallback accepts only objects whose OWN enumerable keys
 * all belong to the canonical envelope shape - `{output, exitCode}`
 * style process results pass through intact.
 *
 * @stable
 */
export function isToolReturnEnvelope<TOutput = unknown>(
  value: unknown,
): value is ToolReturn<TOutput> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  if ((value as Record<PropertyKey, unknown>)[TOOL_RETURN_BRAND] === true) return true;
  if (!Object.hasOwn(value, 'output')) return false;
  for (const key of Object.keys(value)) {
    if (key !== 'output' && key !== 'contentParts' && key !== 'taint') return false;
  }
  return true;
}

/**
 * W-115: `true` when {@link isToolReturnEnvelope} matched WITHOUT the
 * brand - observability for the future deprecation of the structural
 * sniff.
 *
 * @stable
 */
export function isUnbrandedToolReturn(value: unknown): boolean {
  return (
    isToolReturnEnvelope(value) &&
    (value as unknown as Record<PropertyKey, unknown>)[TOOL_RETURN_BRAND] !== true
  );
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
   * `secretsAllowed` ACL - calling `require(...)` for a key that is
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
 * The accessor is intentionally narrow - the ACL enforcement happens
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
