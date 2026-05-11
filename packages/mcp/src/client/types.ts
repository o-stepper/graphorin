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

import type { EventStore } from '../event-store/index.js';
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
  /**
   * Pluggable {@link EventStore} for resumable Streamable HTTP
   * sessions. The default is the in-memory store with capacity
   * `1024`.
   */
  readonly eventStore?: EventStore;
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
}

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
  /** Per-call collision-strategy override. */
  readonly collisionStrategy?: CollisionStrategy;
  /** Per-call priority value used by the `'priority'` strategy. */
  readonly priority?: number;
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
    };

/**
 * Public surface of an active MCP client.
 *
 * @stable
 */
export interface MCPClient {
  /** Stable identifier — derived from the transport. */
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
   * Whether the connected server advertises Streamable HTTP session
   * support (resolved at `initialize` time).
   */
  readonly resumable: boolean;

  listTools(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<MCPToolDefinition>>;
  listResources(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<MCPResourceDefinition>>;
  listPrompts(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<MCPPromptDefinition>>;
  callTool(
    name: string,
    args: unknown,
    opts?: { signal?: AbortSignal; timeoutMs?: number },
  ): Promise<MCPCallToolResult>;
  readResource(uri: string, opts?: { signal?: AbortSignal }): Promise<MCPResourceContent>;
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
