/**
 * `NoneSandbox` - direct in-process execution. The framework only
 * dispatches built-in trusted tools through this adapter (DEC-148).
 *
 * The adapter exists so `Sandbox.run<T>(...)` is callable with a
 * uniform interface across every trust tier; the cost is one extra
 * function call.
 *
 * @packageDocumentation
 */

import type {
  SandboxCapabilities,
  SandboxCode,
  SandboxImpl,
  SandboxResult,
  SandboxRunOptions,
} from './sandbox.js';

const CAPABILITIES: SandboxCapabilities = Object.freeze({
  canBlockNetwork: false,
  canBlockFilesystem: false,
  canEnforceTimeout: false,
  canEnforceMemoryLimit: false,
});

/**
 * Direct caller for `code.kind === 'handler'`. The handler is looked
 * up in the supplied registry; built-in trusted tools register their
 * handlers at startup.
 *
 * @stable
 */
export type NoneSandboxHandler<TInput = unknown, TOutput = unknown> = (
  input: TInput,
  signal: AbortSignal | undefined,
) => Promise<TOutput> | TOutput;

/**
 * Options for `NoneSandbox`. Hosting code passes a registry of
 * handlers; lookups are by `module + export` for `'handler'` codes
 * and by `'inline'` key for `'source'` / `'file'` codes (which the
 * adapter rejects - directly executing JS source bypasses the trust
 * tier the user explicitly opted out of).
 *
 * @stable
 */
export interface NoneSandboxOptions {
  /**
   * Resolver for `code.kind === 'handler'` invocations. The framework
   * default registers built-in trusted tool handlers at startup.
   */
  readonly resolveHandler: (
    code: Extract<SandboxCode, { kind: 'handler' }>,
  ) => NoneSandboxHandler | undefined;
}

/**
 * Construct a `NoneSandbox` instance.
 *
 * @stable
 */
export function createNoneSandbox(opts: NoneSandboxOptions): SandboxImpl {
  return Object.freeze({
    id: 'none',
    kind: 'none',
    capabilities: CAPABILITIES,
    run: async <TInput, TOutput>(
      code: SandboxCode,
      runOpts: SandboxRunOptions<TInput>,
    ): Promise<SandboxResult<TOutput>> => {
      const startedAt = performance.now();
      if (code.kind !== 'handler') {
        return {
          ok: false,
          error: {
            kind: 'sandbox-violation',
            message:
              'NoneSandbox only accepts pre-registered handlers; refusing to run inline source / file code',
          },
          durationMs: performance.now() - startedAt,
        };
      }
      const handler = opts.resolveHandler(code);
      if (!handler) {
        return {
          ok: false,
          error: {
            kind: 'sandbox-violation',
            message: `NoneSandbox: no registered handler for ${code.module}#${code.export}`,
          },
          durationMs: performance.now() - startedAt,
        };
      }
      try {
        if (runOpts.signal?.aborted === true) {
          return {
            ok: false,
            error: { kind: 'aborted', message: 'aborted before NoneSandbox dispatch' },
            durationMs: performance.now() - startedAt,
          };
        }
        const output = (await handler(runOpts.input, runOpts.signal)) as TOutput;
        return {
          ok: true,
          output,
          durationMs: performance.now() - startedAt,
        };
      } catch (error) {
        const isAbort =
          (error as { name?: string } | null | undefined)?.name === 'AbortError' ||
          runOpts.signal?.aborted === true;
        return {
          ok: false,
          error: {
            kind: isAbort ? 'aborted' : 'execution-failed',
            message: error instanceof Error ? error.message : String(error),
            cause: error,
          },
          durationMs: performance.now() - startedAt,
        };
      }
    },
  });
}
