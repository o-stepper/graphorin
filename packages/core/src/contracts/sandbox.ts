/**
 * Pluggable sandbox interface for tool / skill execution. Concrete
 * implementations live in `@graphorin/security` (worker-threads,
 * isolated-vm, docker, none).
 *
 * @stable
 */
export interface Sandbox {
  /** Identifier of the sandbox flavor (`'worker-threads'`, `'isolated-vm'`, …). */
  readonly id: string;
  run<TInput, TOutput>(
    code: SandboxCode,
    opts: SandboxRunOptions<TInput>,
  ): Promise<SandboxResult<TOutput>>;
}

/**
 * Description of the code to run in the sandbox. Either a JS source
 * string, a path to a JS file, or a fully-qualified handler reference
 * resolved by the sandbox implementation.
 *
 * @stable
 */
export type SandboxCode =
  | { readonly kind: 'source'; readonly source: string; readonly filename?: string }
  | { readonly kind: 'file'; readonly path: string }
  | { readonly kind: 'handler'; readonly module: string; readonly export: string };

/**
 * Per-call sandbox options.
 *
 * @stable
 */
export interface SandboxRunOptions<TInput = unknown> {
  readonly input: TInput;
  readonly timeoutMs?: number;
  readonly maxMemoryMb?: number;
  /**
   * Allowlist of environment variables visible inside the sandbox.
   * Sandboxed code never inherits the host `process.env`; entries
   * given here are the only ones defined.
   */
  readonly env?: Readonly<Record<string, string>>;
  readonly allowNetwork?: boolean;
  readonly allowFs?: boolean;
  readonly signal?: AbortSignal;
}

/**
 * Result of a sandboxed run. The shape mirrors the `ToolOutcome` union —
 * the runtime maps `SandboxResult` to `ToolOutcome` after the call.
 *
 * @stable
 */
export type SandboxResult<TOutput = unknown> =
  | { readonly ok: true; readonly output: TOutput; readonly durationMs: number }
  | {
      readonly ok: false;
      readonly error: {
        readonly kind:
          | 'timeout'
          | 'memory-exceeded'
          | 'sandbox-violation'
          | 'aborted'
          | 'execution-failed';
        readonly message: string;
        readonly cause?: unknown;
      };
      readonly durationMs: number;
    };
