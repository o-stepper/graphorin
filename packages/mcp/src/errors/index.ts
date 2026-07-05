/**
 * Typed error union for the `@graphorin/mcp` package.
 *
 * Every error carries a stable lowercase {@link MCPErrorKind}
 * discriminator, an actionable {@link MCPError.hint} field where
 * applicable, and an optional structured `metadata` bag the audit
 * emitter persists alongside the standard `runId` / `sessionId`
 * context.
 *
 * @packageDocumentation
 */

/**
 * Discriminator union for every error class produced by
 * `@graphorin/mcp`. New kinds extend this union; never throw plain
 * `Error` from framework code.
 *
 * @stable
 */
export type MCPErrorKind =
  | 'connection-failed'
  | 'protocol-error'
  | 'auth-error'
  | 'tool-not-found'
  | 'tool-execution'
  | 'pin-mismatch'
  | 'call-timeout'
  | 'cancelled'
  | 'invalid-config'
  | 'session-lost'
  | 'transport-not-supported'
  | 'transport-resumable-not-supported';

/** Common metadata bag attached to every {@link MCPError}. */
export interface MCPErrorMetadata {
  readonly server?: string;
  readonly tool?: string;
  readonly transport?: 'stdio' | 'streamable-http' | 'sse';
  readonly cause?: unknown;
  readonly httpStatus?: number;
  readonly sessionId?: string;
  readonly lastEventId?: string;
}

/**
 * Base class for every typed error produced by `@graphorin/mcp`.
 *
 * @stable
 */
export abstract class GraphorinMCPError extends Error {
  /** Lowercase discriminator. */
  public abstract readonly kind: MCPErrorKind;
  /** Optional remediation hint surfaced in CLI output. */
  public readonly hint?: string;
  /** Sanitized metadata; never carries secret material. */
  public readonly metadata: Readonly<MCPErrorMetadata>;
  /** Underlying cause (chained errors). */
  public override readonly cause?: unknown;

  public constructor(
    message: string,
    opts: {
      readonly hint?: string;
      readonly metadata?: MCPErrorMetadata;
      readonly cause?: unknown;
    } = {},
  ) {
    super(message);
    this.name = new.target.name;
    if (opts.hint !== undefined) this.hint = opts.hint;
    this.metadata = Object.freeze({ ...(opts.metadata ?? {}) });
    if (opts.cause !== undefined) this.cause = opts.cause;
  }
}

/** Raised when a transport fails to connect or is dropped unexpectedly. */
export class MCPConnectionError extends GraphorinMCPError {
  public readonly kind = 'connection-failed' as const;
}

/** Raised on JSON-RPC / MCP protocol-level errors. */
export class MCPProtocolError extends GraphorinMCPError {
  public readonly kind = 'protocol-error' as const;
}

/** Raised when an authentication / authorization step fails. */
export class MCPAuthError extends GraphorinMCPError {
  public readonly kind = 'auth-error' as const;
}

/** Raised when {@link MCPClient.callTool} is invoked for an unknown tool. */
export class MCPToolNotFoundError extends GraphorinMCPError {
  public readonly kind = 'tool-not-found' as const;
}

/**
 * Raised when a pinned tool-definition fingerprint does not match the
 * server's current definition and `onPinMismatch: 'reject'` is set
 * (MC-6) - the approve-then-swap rug-pull posture.
 */
export class MCPToolPinningError extends GraphorinMCPError {
  public readonly kind = 'pin-mismatch' as const;
}

/**
 * Raised when the MCP server reports a tool-level failure
 * (`CallToolResult.isError === true`, MC-4). The server's content text
 * rides in the message so the model keeps its self-correction signal -
 * while the executor records a real tool FAILURE (audit, retry and
 * error policies all engage) instead of a fake success.
 */
export class MCPToolExecutionError extends GraphorinMCPError {
  public readonly kind = 'tool-execution' as const;
}

/** Raised when a tool call exceeds its configured timeout / aborts. */
export class MCPCallTimeoutError extends GraphorinMCPError {
  public readonly kind: 'call-timeout' | 'session-lost' = 'call-timeout';

  public constructor(
    message: string,
    opts: {
      readonly hint?: string;
      readonly metadata?: MCPErrorMetadata;
      readonly cause?: unknown;
      readonly variant?: 'call-timeout' | 'session-lost';
    },
  ) {
    super(message, opts);
    if (opts.variant !== undefined) {
      this.kind = opts.variant;
    }
  }
}

/** Raised when an in-flight call is cancelled by an `AbortSignal`. */
export class MCPCancelledError extends GraphorinMCPError {
  public readonly kind = 'cancelled' as const;
}

/** Raised on invalid `createMCPClient(...)` configuration. */
export class MCPInvalidConfigError extends GraphorinMCPError {
  public readonly kind = 'invalid-config' as const;
}

/**
 * Raised when an operator requests a transport / capability that the
 * runtime does not support (e.g. `resumable: true` on `stdio`).
 *
 * @stable
 */
export class MCPTransportNotSupportedError extends GraphorinMCPError {
  public readonly kind: 'transport-not-supported' | 'transport-resumable-not-supported' =
    'transport-not-supported';

  public constructor(
    message: string,
    opts: {
      readonly hint?: string;
      readonly metadata?: MCPErrorMetadata;
      readonly cause?: unknown;
      readonly variant?: 'transport-not-supported' | 'transport-resumable-not-supported';
    },
  ) {
    super(message, opts);
    if (opts.variant !== undefined) {
      this.kind = opts.variant;
    }
  }
}
