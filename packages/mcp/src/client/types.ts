/**
 * Public types for {@link createMCPClient} and the {@link MCPClient}
 * surface.
 *
 * @packageDocumentation
 */

import type {
  InboundSanitizationPolicy,
  ModelHint,
  ModelSpec,
  SideEffectClass,
  Tool,
  TruncationStrategy,
} from '@graphorin/core';
import type { CollisionStrategy } from '@graphorin/tools/registry';

import type { OAuthAuthorizationProvider } from '../oauth/bridge.js';
import type { MCPTransportConfig, ServerIdentity } from '../transport/types.js';

/**
 * Options accepted by {@link createMCPClient}.
 *
 * @stable
 */
export interface CreateMCPClientOptions {
  readonly transport: MCPTransportConfig;
  /**
   * Pre-built OAuth provider that resolves the bearer header on every
   * request. Mutually exclusive with {@link bearerToken}.
   */
  readonly authProvider?: OAuthAuthorizationProvider;
  /** Pre-shared bearer token (rare; prefer {@link authProvider}). */
  readonly bearerToken?: string;
  /**
   * Per-client default for the strategy-aware tool registry. Falls
   * through to the per-call value on {@link MCPClient.toTools}.
   *
   * @default `'auto-prefix'`
   */
  readonly collisionStrategy?: CollisionStrategy;
  /** Per-client priority value used by the `'priority'` strategy. */
  readonly priority?: number;
  /** Operator-supplied server identity overrides. */
  readonly serverInfoName?: string;
  /** Operator-supplied logger. */
  readonly logger?: (
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    fields?: Record<string, unknown>,
  ) => void;
  /** Operator-supplied client name advertised to the server on `initialize`. */
  readonly clientName?: string;
  /** Operator-supplied client version advertised to the server on `initialize`. */
  readonly clientVersion?: string;
  /**
   * Skip the deprecated-transport WARN log. Useful for tests + the
   * standalone server's startup banner.
   *
   * @default `false`
   */
  readonly suppressDeprecatedTransportWarning?: boolean;
  /**
   * Handler for server-initiated **elicitation** (`elicitation/create`)
   * requests - the server asks the human for structured input mid-call
   * (WI-13 / P2-2). When provided, the client advertises the
   * `elicitation` capability and routes requests here; back it with a
   * HITL surface (e.g. a CLI prompt or the agent's approval channel).
   * When omitted, the capability is **not** advertised and a conforming
   * server will not elicit (gated; no implicit prompting).
   *
   * Note: an elicitation arrives while a `callTool(...)` JSON-RPC request
   * is in flight, so the handler resolves in-process - it does not
   * durably suspend a Graphorin run. Durable-suspend elicitation across
   * the request lifetime is a follow-up.
   */
  readonly elicitation?: MCPElicitationHandler;
  /**
   * Handler for server-initiated **sampling** (`sampling/createMessage`)
   * requests - the server asks the client's model to generate a
   * completion (WI-13 / P2-2). When provided, the client advertises the
   * `sampling` capability and routes requests here; back it with a
   * `Provider`. The request messages are **MCP-derived (untrusted)**, so
   * the backing provider should apply the usual sensitivity/redaction
   * middleware. When omitted, the capability is **not** advertised
   * (gated).
   */
  readonly sampling?: MCPSamplingHandler;
  /**
   * mcp-skills-10: called when the underlying transport closes (a
   * stdio child dying, an HTTP session dropping beyond the SDK's SSE
   * resume). Without it a disconnect is observable only as
   * `MCPProtocolError`s on subsequent calls. The client does NOT
   * auto-reconnect - rebuild it via `createMCPClient(...)` (and re-run
   * `toTools()` for the drift diff) when this fires, or use the W-080
   * `createManagedMCPClient(...)` wrapper, which does exactly that
   * automatically (there the operator callback fires only when the
   * wrapper's reconnect attempts are exhausted).
   */
  readonly onTransportClose?: (info: { readonly server: string }) => void;
  /** mcp-skills-10: called on transport-level errors (see {@link onTransportClose}). */
  readonly onTransportError?: (error: Error, info: { readonly server: string }) => void;
}

/**
 * Server-initiated elicitation request surfaced to the operator's HITL
 * handler.
 *
 * @stable
 */
export interface MCPElicitationRequest {
  /** Human-readable prompt the server wants answered. */
  readonly message: string;
  /** JSON-Schema-like shape (`{ type: 'object', properties, required? }`) for the requested input. */
  readonly requestedSchema: Readonly<Record<string, unknown>>;
}

/**
 * Operator response to an {@link MCPElicitationRequest}. `accept` returns
 * the collected flat values; `decline`/`cancel` carry no content.
 *
 * @stable
 */
export type MCPElicitationResult =
  | {
      readonly action: 'accept';
      readonly content?: Readonly<
        Record<string, string | number | boolean | ReadonlyArray<string>>
      >;
    }
  | { readonly action: 'decline' }
  | { readonly action: 'cancel' };

/** Handler for server-initiated elicitation requests. */
export type MCPElicitationHandler = (
  request: MCPElicitationRequest,
  opts: { readonly signal?: AbortSignal },
) => MCPElicitationResult | Promise<MCPElicitationResult>;

/** A single content block carried by a sampling message or result. */
export type MCPSamplingContent =
  | { readonly type: 'text'; readonly text: string }
  | { readonly type: 'image'; readonly data: string; readonly mimeType: string }
  | { readonly type: 'audio'; readonly data: string; readonly mimeType: string };

/** A message in a sampling conversation. */
export interface MCPSamplingMessage {
  readonly role: 'user' | 'assistant';
  /**
   * Every content block of the SDK message (MC-13) - previously only
   * the FIRST block survived, silently dropping e.g. the image in a
   * text+image message before it reached the operator's handler.
   */
  readonly content: ReadonlyArray<MCPSamplingContent>;
}

/**
 * Server-initiated sampling request surfaced to the operator's handler
 * (typically backed by a `Provider`).
 *
 * @stable
 */
export interface MCPSamplingRequest {
  readonly messages: ReadonlyArray<MCPSamplingMessage>;
  readonly systemPrompt?: string;
  readonly maxTokens: number;
  readonly temperature?: number;
  readonly stopSequences?: ReadonlyArray<string>;
  readonly modelPreferences?: {
    readonly hints?: ReadonlyArray<{ readonly name?: string }>;
    readonly costPriority?: number;
    readonly speedPriority?: number;
    readonly intelligencePriority?: number;
  };
  readonly includeContext?: 'none' | 'thisServer' | 'allServers';
}

/**
 * Operator response to an {@link MCPSamplingRequest}.
 *
 * @stable
 */
export interface MCPSamplingResult {
  readonly role: 'assistant';
  readonly content: MCPSamplingContent;
  readonly model: string;
  readonly stopReason?: string;
}

/** Handler for server-initiated sampling requests. */
export type MCPSamplingHandler = (
  request: MCPSamplingRequest,
  opts: { readonly signal?: AbortSignal },
) => MCPSamplingResult | Promise<MCPSamplingResult>;

/**
 * Per-MCP-server `toTools()` options.
 *
 * @stable
 */
export interface MCPToToolsOptions {
  /** Filter the produced tools. */
  readonly filter?: (tool: MCPToolDefinition) => boolean;
  /** Tool-name namespace prepended to every produced tool. */
  readonly namespace?: string;
  /**
   * Per-server inbound prompt-injection sanitization policy override.
   * Defaults to `'detect-and-strip-and-wrap'` for MCP-derived tools.
   */
  readonly inboundSanitization?: InboundSanitizationPolicy;
  /**
   * Per-call timeout (ms) applied to every adapted tool's
   * `client.callTool` invocation (MC-3/MC-5). Default: the SDK default.
   */
  readonly callTimeoutMs?: number;
  /**
   * Operator-pinned definition fingerprints by MCP tool name (MC-6) -
   * the `__definitionHash` stamped on a previously approved snapshot.
   * A mismatch means the server changed the definition behind the name.
   */
  readonly pinnedFingerprints?: Readonly<Record<string, string>>;
  /**
   * What to do on a pinned-fingerprint mismatch (MC-6). `'warn'`
   * (default without a {@link pinStore}) audits
   * `mcp.tools.pin-mismatch.total` and continues; `'reject'` (the
   * default WHEN a `pinStore` is wired - a persisted first approval is
   * an explicit trust decision) throws `MCPToolPinningError`.
   *
   * W-079: `'accept-and-update'` is the documented operator path to
   * ACCEPT a legitimate catalogue change: after the comparison (and its
   * counters/logs) the store is overwritten with the current snapshot
   * (`mcp.tools.pins-updated.total`), so subsequent calls are clean -
   * an explicit re-trust decision, never a silent default.
   */
  readonly onPinMismatch?: 'warn' | 'reject' | 'accept-and-update';
  /**
   * C6: durable trust-on-first-use pin storage. On the first `toTools()`
   * the current definition fingerprints are RECORDED
   * (`mcp.tools.pins-recorded.total`); on every later call they are
   * COMPARED - drift is handled per {@link onPinMismatch}, which
   * defaults to `'reject'` when a store is present (the rug-pull
   * defense). Explicit `pinnedFingerprints` win over the store.
   */
  readonly pinStore?: MCPPinStore;
  /**
   * Per-server `defer_loading` override. When unset and
   * `listTools()` returns more than `deferLoadingThreshold` entries
   * the auto-default flips deferral on for every tool from this
   * server.
   */
  readonly defer_loading?: boolean;
  /** Auto-default trigger threshold. Defaults to `10`. */
  readonly deferLoadingThreshold?: number;
  /** Per-server token cap override applied at registration. */
  readonly maxResultTokens?: number;
  /** Per-server truncation strategy override applied at registration. */
  readonly truncationStrategy?: TruncationStrategy;
  /** Tool-name -> per-tool side-effect class override map. */
  readonly sideEffectClassByTool?: Readonly<Record<string, SideEffectClass>>;
  /** Tool-name -> per-tool preferred-model override map. */
  readonly preferredModelByTool?: Readonly<Record<string, ModelHint | ModelSpec>>;
}

/**
 * Single MCP tool descriptor returned by `listTools()`. Mirrors the
 * MCP spec subset we consume.
 *
 * @stable
 */
export interface MCPToolDefinition {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: Readonly<Record<string, unknown>>;
  readonly outputSchema?: Readonly<Record<string, unknown>>;
  readonly title?: string;
}

/** Resource descriptor returned by `listResources()`. */
export interface MCPResourceDefinition {
  readonly uri: string;
  readonly name?: string;
  readonly description?: string;
  readonly mimeType?: string;
}

/** Prompt descriptor returned by `listPrompts()`. */
export interface MCPPromptDefinition {
  readonly name: string;
  readonly description?: string;
  readonly arguments?: ReadonlyArray<{
    readonly name: string;
    readonly description?: string;
    readonly required?: boolean;
  }>;
}

/** Resource content returned by `readResource(...)`. */
export interface MCPResourceContent {
  readonly uri: string;
  readonly mimeType?: string;
  readonly text?: string;
  readonly blob?: string;
}

/** Tool result envelope returned by `callTool(...)`. */
export interface MCPCallToolResult {
  readonly content: ReadonlyArray<MCPContentPart>;
  readonly structuredContent?: Readonly<Record<string, unknown>>;
  readonly isError?: boolean;
}

/** Discriminated union over MCP content parts. */
export type MCPContentPart =
  | { readonly type: 'text'; readonly text: string }
  | { readonly type: 'image'; readonly data: string; readonly mimeType: string }
  | { readonly type: 'audio'; readonly data: string; readonly mimeType: string }
  | {
      readonly type: 'resource';
      readonly resource: {
        readonly uri: string;
        readonly text?: string;
        readonly blob?: string;
        readonly mimeType?: string;
      };
    }
  | {
      /**
       * A link to a resource the server can serve on demand (MCP
       * `resource_link`). Unlike an embedded `resource`, the body is
       * **not** inlined: the adapter surfaces a preview + the `uri` as a
       * result handle so the model fetches it via `read_result` only
       * when needed (WI-13 / P2-2, ties to WI-10 result handles).
       */
      readonly type: 'resource_link';
      readonly uri: string;
      readonly name: string;
      readonly title?: string;
      readonly description?: string;
      readonly mimeType?: string;
      readonly size?: number;
    };

/**
 * Public surface of an active MCP client.
 *
 * @stable
 */
export interface MCPClient {
  /** Stable identifier - derived from the transport. */
  readonly id: string;
  /** Server-advertised information from the `initialize` handshake. */
  readonly serverInfo: { readonly name: string; readonly version: string };
  /** Server identity descriptor consumed by the tool-registry resolver. */
  readonly serverIdentity: ServerIdentity;
  /** Per-client default collision strategy. */
  readonly collisionStrategy: CollisionStrategy;
  /** Per-client priority value used by the `'priority'` strategy. */
  readonly priority?: number;
  /**
   * Whether the Streamable HTTP server assigned an `Mcp-Session-Id`
   * at `initialize` time (MC-9). A session id means stateful routing -
   * it is NOT a replay guarantee: per the Streamable HTTP spec,
   * event replay is the SERVER's responsibility, and the SDK
   * transport already auto-reconnects with `Last-Event-ID` when the
   * server supports it.
   */
  readonly sessionIdPresent: boolean;
  /** @deprecated Alias of {@link sessionIdPresent} - same value, misleading name. */
  readonly resumable: boolean;

  listTools(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<MCPToolDefinition>>;
  listResources(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<MCPResourceDefinition>>;
  listPrompts(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<MCPPromptDefinition>>;
  callTool(
    name: string,
    args: unknown,
    opts?: { signal?: AbortSignal; timeoutMs?: number },
  ): Promise<MCPCallToolResult>;
  /**
   * First content item of the resource. mcp-skills-11: a multi-content
   * response (one URI can yield several items) is truncated to the
   * FIRST item - a WARN + counter fire when that happens; use
   * {@link readResourceContents} for the full array.
   */
  readResource(uri: string, opts?: { signal?: AbortSignal }): Promise<MCPResourceContent>;
  /** Every content item of the resource (mcp-skills-11). */
  readResourceContents(
    uri: string,
    opts?: { signal?: AbortSignal },
  ): Promise<ReadonlyArray<MCPResourceContent>>;
  getPrompt(
    name: string,
    args?: unknown,
    opts?: { signal?: AbortSignal },
  ): Promise<{ readonly messages: ReadonlyArray<MCPPromptMessage> }>;
  toTools(opts?: MCPToToolsOptions): Promise<ReadonlyArray<Tool>>;
  close(): Promise<void>;
}

/** Single prompt message returned by `getPrompt(...)`. */
export interface MCPPromptMessage {
  readonly role: 'user' | 'assistant';
  readonly content: MCPContentPart;
}

/**
 * C6: durable storage for trust-on-first-use MCP tool pins. Keyed by the
 * server identity id; values are `toolName -> sha256 fingerprint` maps
 * (the same shape as `pinnedFingerprints`). Implementations may be sync
 * or async - a JSON file, a SQLite table, a secret store.
 *
 * @stable
 */
export interface MCPPinStore {
  get(
    serverId: string,
  ):
    | Readonly<Record<string, string>>
    | undefined
    | Promise<Readonly<Record<string, string>> | undefined>;
  set(serverId: string, fingerprints: Readonly<Record<string, string>>): void | Promise<void>;
}
