import type { ToolCall } from './tool-call.js';

/**
 * Sandbox isolation level requested for a tool's `execute` method.
 *
 * The exact semantics live in `@graphorin/security`; downstream packages
 * type their config field as `SandboxPolicy` so they don't take a security
 * dependency just to type their inputs.
 *
 * @stable
 */
export type SandboxPolicy = 'none' | 'sandboxed' | 'isolated' | 'docker';

/**
 * Memory-modification guard tier requested for a tool's `execute` method.
 *
 * Mirrors the tier classification consumed by `@graphorin/security`'s
 * memory-modification guard so downstream packages can type their tool
 * metadata against this discriminator without a hard dependency on the
 * security package.
 *
 * - `'pure'`                     - no side effects of any kind.
 * - `'side-effecting-no-memory'` - observable side effects outside of
 *   the framework's memory tiers (e.g. external HTTP).
 * - `'memory-aware'`             - mutates the framework's memory
 *   tiers via the sanctioned `ctx.memory.*` surface only.
 * - `'unknown'`                  - no declaration; the runtime applies
 *   the audit-only baseline.
 * - `'untrusted'`                - third-party / untrusted skill code;
 *   the runtime forces the strictest snapshot policy.
 *
 * @stable
 */
export type MemoryGuardTier =
  | 'pure'
  | 'side-effecting-no-memory'
  | 'memory-aware'
  | 'unknown'
  | 'untrusted';

/**
 * Side-effect classification declared by a tool author.
 *
 * Surfaced uniformly by the tool dispatcher, downstream session
 * cassette layers, retry middleware, and approval-policy derivations.
 *
 * - `'pure'`              - deterministic; same `(input, ctx)` always
 *   yields the same output; no I/O of any kind.
 * - `'read-only'`         - queries external systems but never
 *   mutates them (e.g. database SELECT, HTTP GET).
 * - `'side-effecting'`    - mutates state inside the agent's logical
 *   boundary (e.g. memory writes, cache writes).
 * - `'external-stateful'` - mutates state outside the agent's
 *   boundary that other systems can observe (e.g. issue creation,
 *   message dispatch, payment).
 *
 * @stable
 */
export type SideEffectClass = 'pure' | 'read-only' | 'side-effecting' | 'external-stateful';

/**
 * Inbound prompt-injection sanitization policy applied to a tool's
 * result body before it reaches the conversation history.
 *
 * - `'pass-through'`              - no scan; bytes-equal forwarding
 *   (the trusted-built-in default).
 * - `'detect-and-flag'`           - scan; emit a flag span attribute
 *   + audit row but do not modify the body.
 * - `'detect-and-strip'`          - replace each match with the
 *   `[REDACTED:imperative-pattern]` literal token.
 * - `'detect-and-wrap'`           - wrap the body in the
 *   `<<<untrusted_content>>>` envelope without stripping matches.
 * - `'detect-and-strip-and-wrap'` - both strip matches and wrap the
 *   resulting body (the untrusted-source default).
 *
 * @stable
 */
export type InboundSanitizationPolicy =
  | 'pass-through'
  | 'detect-and-flag'
  | 'detect-and-strip'
  | 'detect-and-wrap'
  | 'detect-and-strip-and-wrap';

/**
 * Result-envelope truncation strategy applied to a tool's assembled
 * output before it reaches the conversation history.
 *
 * - `'middle'`         - keep head and tail; insert annotation in the
 *   middle (the default).
 * - `'tail'`           - keep the tail; insert annotation at the
 *   head.
 * - `'spill-to-file'`  - keep the head; spill the un-truncated body
 *   to a per-run artifact file; insert annotation with the artifact
 *   path.
 * - `'summarize'`      - invoke the agent's configured summarizer
 *   and replace the body with the summary.
 *
 * @stable
 */
export type TruncationStrategy = 'middle' | 'tail' | 'spill-to-file' | 'summarize';

/**
 * Trust class assigned to a registered tool. The class is computed at
 * registration time from the registration source and the declared
 * sandbox policy; downstream layers (sanitization, audit) read the
 * class to pick the right default policy.
 *
 * @stable
 */
export type ToolTrustClass =
  | 'first-party-built-in'
  | 'first-party-user-defined'
  | 'skill-trusted'
  | 'skill-untrusted'
  | 'mcp-derived'
  | 'web-search'
  | 'channel-inbound';

/**
 * Source descriptor attached to a `Tool` registration. Mirrors the
 * registration-time provenance the dispatcher uses to derive the
 * trust class and to compute the four collision audit row kinds.
 *
 * @stable
 */
export type ToolSource =
  | { readonly kind: 'first-party' }
  | { readonly kind: 'built-in'; readonly subsystem: string }
  | {
      readonly kind: 'skill';
      readonly skillName: string;
      readonly trustLevel: 'trusted' | 'untrusted';
    }
  | { readonly kind: 'mcp'; readonly serverIdentity: string }
  | { readonly kind: 'web-search'; readonly providerName: string };

/**
 * Single chunk of streamed tool content. Streaming-hint tools emit one
 * chunk per `ctx.streamContent(...)` call; the executor concatenates
 * the chunks into the assembled `output` per the buffer-becomes-output
 * discipline.
 *
 * @stable
 */
export type ContentChunk =
  | { readonly kind: 'text'; readonly text: string }
  | { readonly kind: 'json-delta'; readonly path: string; readonly value: unknown }
  | { readonly kind: 'image'; readonly data: Uint8Array; readonly mediaType: string };

// `ToolCall` is defined in `./tool-call.ts` to break the
// `message.ts <-> tool.ts` import cycle; re-exported here so existing
// `@graphorin/core` import paths keep resolving `ToolCall` from this
// module. The local import lives at the top of the file.
export type { ToolCall };

/**
 * The successful outcome of a tool invocation, returned to the model.
 *
 * @stable
 */
export interface ToolResult<TOutput = unknown> {
  readonly toolCallId: string;
  readonly toolName: string;
  readonly output: TOutput;
  /**
   * Optional content parts to append to the conversation (images, files,
   * etc.). Tools that emit binary results use this field instead of trying
   * to encode the binary into `output`.
   */
  readonly contentParts?: readonly import('./message.js').MessageContent[];
  readonly durationMs: number;
  /**
   * Set when the tool's output was large enough to be stored behind a
   * handle (the `'spill-to-file'` truncation strategy, or - later - an MCP
   * `resource_link`) instead of being inlined in full. The runtime inlines
   * only the bounded {@link ResultHandle.preview} and lets the model fetch
   * the rest on demand via the built-in `read_result` tool. Absent for
   * results that were inlined directly.
   */
  readonly resultHandle?: ResultHandle;
}

/**
 * An opaque, run-scoped reference to a large tool result that was stored
 * out of the conversation buffer rather than inlined in full. The agent
 * inlines {@link preview} (plus a retrieval hint) and registers the
 * built-in `read_result` tool so the model can page through the full
 * artifact behind {@link uri} on demand - keeping large results out of the
 * context window (P1-4).
 *
 * @stable
 */
export interface ResultHandle {
  /**
   * Opaque, run-scoped URI - e.g. `graphorin-spill:<runId>/<toolCallId>.json`
   * for a spill artifact. Never a raw filesystem path: the reader resolves
   * it within the configured artifact root, so the model cannot use it to
   * read arbitrary files.
   */
  readonly uri: string;
  /** Backing store kind. `'spill-file'` today; `'resource-link'` is reserved for MCP (WI-13). */
  readonly kind: 'spill-file' | 'resource-link';
  /** A bounded preview of the full body (already inlined alongside the handle). */
  readonly preview: string;
  /** Total byte size of the full stored artifact, when known. */
  readonly bytes?: number;
  /** MIME type of the stored artifact, when known. */
  readonly mediaType?: string;
  /**
   * Trust class of the tool that PRODUCED the stored body (TL-6).
   * `read_result` re-applies inbound sanitization and dataflow
   * provenance by this class, so an untrusted spill cannot launder to
   * trusted through the built-in reader.
   */
  readonly producerTrustClass?: ToolTrustClass;
}

/**
 * Discriminator used by `ToolError.kind`. The list is exhaustive: any new
 * kind must extend the union here and every `assertNever` switch.
 *
 * @stable
 */
export type ToolErrorKind =
  | 'approval_denied'
  | 'sandbox_violation'
  | 'timeout'
  | 'invalid_input'
  | 'invalid_output'
  | 'execution_failed'
  | 'unknown_tool'
  | 'aborted'
  | 'inbound_sanitization_blocked'
  | 'dataflow_policy_blocked'
  | 'capability_blocked'
  | 'rate_limited';

/**
 * Model-facing recovery guidance attached to a {@link ToolError} (C3).
 * Practitioner evidence converges on these two fields being what changes
 * model behaviour after a failure:
 *
 * - `'retry_later'`      - transient; the same call is expected to work
 *                          after a pause (rate limits, timeouts).
 * - `'check_input'`      - the arguments are wrong; re-read the schema
 *                          and fix them before retrying.
 * - `'try_alternative'`  - this tool/approach failed non-transiently;
 *                          try a different tool or strategy.
 * - `'report_to_user'`   - a policy/authorization stop; do not retry,
 *                          surface the situation instead.
 *
 * @stable
 */
export type RecoveryHint = 'retry_later' | 'check_input' | 'try_alternative' | 'report_to_user';

/**
 * The unsuccessful outcome of a tool invocation. The model sees a textual
 * representation of `message`; the runtime sees the typed shape.
 *
 * @stable
 */
export interface ToolError {
  readonly toolCallId: string;
  readonly toolName: string;
  readonly kind: ToolErrorKind;
  readonly message: string;
  /** Optional underlying cause (chained errors). */
  readonly cause?: unknown;
  /** Optional remediation hint for human readers. */
  readonly hint?: string;
  /**
   * Whether retrying the SAME call can plausibly succeed (C3). Stamped
   * from the error kind by the executor; the harness-side transparent
   * retry consults it together with the tool's side-effect safety.
   */
  readonly recoverable?: boolean;
  /** Model-facing recovery guidance derived from the error kind (C3). */
  readonly recoveryHint?: RecoveryHint;
}

/**
 * Either a `ToolResult` or a `ToolError`. The runtime always returns one
 * of the two - there is no implicit "tool fell through" outcome.
 *
 * @stable
 */
export type ToolOutcome<TOutput = unknown> = ToolResult<TOutput> | ToolError;

/**
 * Pending approval bookkeeping: a tool that needed human confirmation
 * before execution. Stored on `RunState.pendingApprovals` until the
 * caller resumes the run with a granted/denied decision.
 *
 * @stable
 */
export interface ToolApproval {
  readonly toolCallId: string;
  readonly toolName: string;
  readonly args: unknown;
  readonly reason?: string;
  readonly requestedAt: string;
  /**
   * E1: which permission verdict parked this approval. `'ask'` wants an
   * interactive human decision now; `'defer'` is parked for
   * asynchronous resolution (e.g. a workflow awakeable with a
   * durable-timer auto-deny) - the harness routes the two differently.
   * Absent on approvals raised by a plain `needsApproval` gate
   * (semantically `'ask'`).
   */
  readonly mode?: 'ask' | 'defer';
  /**
   * W-001: set when this approval belongs to a PARKED sub-agent run.
   * It is the PARENT's toolCallId of the parked handoff / sub-agent
   * call (the `RunState.pendingSubRuns` key), never a child-local id.
   * Operators echo it back on the matching `ApprovalDecision` so
   * resume decisions match on the composite (toolCallId,
   * subRunToolCallId) key - child-local toolCallIds of two different
   * children may collide.
   */
  readonly subRunToolCallId?: string;
}

/**
 * A `ToolCall` paired with its outcome and execution metadata. Captured
 * on `RunState.completedToolCalls` after a successful or failed run.
 *
 * @stable
 */
export interface CompletedToolCall<TOutput = unknown> {
  readonly call: ToolCall;
  readonly outcome: ToolOutcome<TOutput>;
  readonly stepNumber: number;
}
