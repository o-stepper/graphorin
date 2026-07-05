/**
 * `IsolatedVMSandbox` - opt-in adapter that runs `code.kind === 'source'`
 * inside a fresh V8 isolate via the optional `isolated-vm` peer
 * dependency. The adapter offers stronger isolation than
 * `WorkerThreadsSandbox` at the cost of a more demanding install
 * footprint.
 *
 * The peer dependency historically has built issues on certain
 * platforms (notably ARM64 macOS / Node 22+); per DEC-148 the
 * adapter auto-falls back to `WorkerThreadsSandbox` and emits one
 * WARN per process when the peer cannot be loaded. Production
 * deployments that load untrusted skills must verify the peer is
 * installed via `graphorin doctor` (Phase 15).
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

/**
 * Minimal subset of the `isolated-vm` peer-dep public surface used by
 * the adapter. Declared inline so `@graphorin/security` does not
 * require type definitions for the optional peer at compile time.
 */
interface IsolatedVMPeerModule {
  readonly Isolate: {
    new (opts: { memoryLimit?: number }): IsolatedVMIsolate;
  };
}

interface IsolatedVMIsolate {
  readonly createContext: () => Promise<IsolatedVMContext>;
  readonly compileScript: (source: string) => Promise<IsolatedVMScript>;
  readonly dispose: () => void;
}

interface IsolatedVMContext {
  readonly global: { readonly setSync: (name: string, value: unknown) => void };
  readonly release: () => void;
}

interface IsolatedVMScript {
  readonly run: (
    context: IsolatedVMContext,
    opts?: { readonly timeout?: number; readonly promise?: boolean; readonly copy?: boolean },
  ) => Promise<unknown>;
  readonly release: () => void;
}

const CAPABILITIES: SandboxCapabilities = Object.freeze({
  canBlockNetwork: true,
  canBlockFilesystem: true,
  canEnforceTimeout: true,
  canEnforceMemoryLimit: true,
});

/**
 * Options for `createIsolatedVMSandbox(...)`.
 *
 * @stable
 */
export interface IsolatedVMSandboxOptions {
  /** Memory limit forwarded to `new Isolate({ memoryLimit })`. Defaults to 128 MB per DEC-148. */
  readonly memoryLimitMb?: number;
  /** Default wall-clock timeout (ms). Defaults to 5000. */
  readonly defaultTimeoutMs?: number;
  /**
   * Adapter to use if the `isolated-vm` peer is unavailable. Defaults
   * to `'fallback-to-worker-threads'`. Set to `'throw'` for production
   * builds that must refuse to start when the peer is missing.
   */
  readonly fallback?: 'fallback-to-worker-threads' | 'throw';
  /** Worker-threads adapter to fall back to. Required when `fallback === 'fallback-to-worker-threads'`. */
  readonly fallbackAdapter?: SandboxImpl;
  /** Optional WARN logger called once per process when the fallback engages. */
  readonly warn?: (message: string) => void;
  /**
   * Override the peer-dep loader. Tests pass a stub here so the
   * adapter can run without the native binary.
   */
  readonly peerLoader?: () => Promise<IsolatedVMPeerModule>;
}

/**
 * Construct an `IsolatedVMSandbox`. The adapter resolves the peer
 * lazily on the first `run(...)` call so the package can be imported
 * even on hosts that cannot install `isolated-vm`.
 *
 * @stable
 */
export function createIsolatedVMSandbox(opts: IsolatedVMSandboxOptions = {}): SandboxImpl {
  const memoryLimitMb = opts.memoryLimitMb ?? 128;
  const defaultTimeoutMs = opts.defaultTimeoutMs ?? 5_000;
  const fallback = opts.fallback ?? 'fallback-to-worker-threads';
  const peerLoader = opts.peerLoader ?? defaultPeerLoader;

  let warnedFallback = false;
  let cachedPeer: IsolatedVMPeerModule | null | 'unavailable' = null;

  const getPeer = async (): Promise<IsolatedVMPeerModule | undefined> => {
    if (cachedPeer === 'unavailable') return undefined;
    if (cachedPeer !== null) return cachedPeer;
    try {
      cachedPeer = await peerLoader();
      return cachedPeer;
    } catch {
      cachedPeer = 'unavailable';
      return undefined;
    }
  };

  return Object.freeze({
    id: 'isolated-vm',
    kind: 'isolated-vm',
    capabilities: CAPABILITIES,
    run: async <TInput, TOutput>(
      code: SandboxCode,
      runOpts: SandboxRunOptions<TInput>,
    ): Promise<SandboxResult<TOutput>> => {
      const startedAt = performance.now();

      const peer = await getPeer();
      if (!peer) {
        if (fallback === 'throw' || !opts.fallbackAdapter) {
          return {
            ok: false,
            error: {
              kind: 'sandbox-violation',
              message:
                "isolated-vm peer dependency is not installed; install it with `pnpm add isolated-vm` or set fallback: 'fallback-to-worker-threads'",
            },
            durationMs: performance.now() - startedAt,
          };
        }
        if (!warnedFallback) {
          warnedFallback = true;
          opts.warn?.(
            'IsolatedVMSandbox: isolated-vm peer dependency is unavailable; falling back to WorkerThreadsSandbox (DEC-148)',
          );
        }
        return opts.fallbackAdapter.run<TInput, TOutput>(code, runOpts);
      }

      if (code.kind !== 'source') {
        return {
          ok: false,
          error: {
            kind: 'sandbox-violation',
            message: `IsolatedVMSandbox only accepts code.kind === 'source'; got ${code.kind}`,
          },
          durationMs: performance.now() - startedAt,
        };
      }

      let isolate: IsolatedVMIsolate | undefined;
      let context: IsolatedVMContext | undefined;
      let script: IsolatedVMScript | undefined;

      try {
        isolate = new peer.Isolate({ memoryLimit: memoryLimitMb });
        context = await isolate.createContext();
        // Expose input as a JSON string; the user code reads
        // `globalThis.__GRAPHORIN_INPUT__` and returns a JSON-able value.
        context.global.setSync('__GRAPHORIN_INPUT__', JSON.stringify(runOpts.input ?? null));
        script = await isolate.compileScript(code.source);
        const output = (await script.run(context, {
          timeout: runOpts.timeoutMs ?? defaultTimeoutMs,
          promise: true,
          copy: true,
        })) as TOutput;
        return {
          ok: true,
          output,
          durationMs: performance.now() - startedAt,
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        const kind = msg.toLowerCase().includes('timed out')
          ? 'timeout'
          : msg.toLowerCase().includes('memory')
            ? 'memory-exceeded'
            : 'execution-failed';
        return {
          ok: false,
          error: { kind, message: msg, cause: error },
          durationMs: performance.now() - startedAt,
        };
      } finally {
        try {
          script?.release();
        } catch {
          /* noop - best effort cleanup */
        }
        try {
          context?.release();
        } catch {
          /* noop */
        }
        try {
          isolate?.dispose();
        } catch {
          /* noop */
        }
      }
    },
  });
}

async function defaultPeerLoader(): Promise<IsolatedVMPeerModule> {
  const mod = (await import('isolated-vm' as string)) as unknown as IsolatedVMPeerModule;
  return mod;
}
