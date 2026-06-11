/**
 * `WorkerThreadsSandbox` — the default adapter for user-defined tools
 * per DEC-148. Runs the supplied code inside a `node:worker_threads`
 * `Worker`. The adapter:
 *
 * - Spawns a fresh worker per `run(...)` call (the warm pool sits
 *   above this in the dispatcher and is opt-in for v0.1).
 * - Does **not** inherit the host `process.env`: the worker is
 *   constructed with `env: {}` and the runtime scrubs the environment
 *   before the handler runs, so only the explicit
 *   `SandboxRunOptions.env` allowlist is visible (TL-9).
 * - Enforces a hard wall-clock timeout via `worker.terminate()`.
 * - Honours `AbortSignal` cancellation; on abort the worker is
 *   terminated after a configurable grace period.
 * - Optionally blocks `node:fs` / `node:fs/promises` /
 *   `node:http` / `node:https` / `node:net` / `node:tls` /
 *   `node:dgram` imports through Node 22's stable
 *   `module.register(...)` resolver hook, plus refuses
 *   `globalThis.fetch` calls. The block is best-effort defence in
 *   depth; deployments that need full V8 isolation use
 *   `IsolatedVMSandbox` or `DockerSandbox` (DEC-148).
 *
 * The runtime is dispatched as an inline JS string via
 * `Worker(code, { eval: true })` so the package does not require a
 * separate compiled artifact at runtime.
 *
 * @packageDocumentation
 */

import { Worker } from 'node:worker_threads';

import type {
  SandboxCapabilities,
  SandboxCode,
  SandboxImpl,
  SandboxResult,
  SandboxRunOptions,
} from './sandbox.js';

const CAPABILITIES: SandboxCapabilities = Object.freeze({
  canBlockNetwork: true,
  canBlockFilesystem: true,
  canEnforceTimeout: true,
  canEnforceMemoryLimit: true,
});

/**
 * Worker pool sizing options. Reserved for the post-MVP warm-pool
 * implementation; the v0.1 adapter spawns a fresh worker per call.
 */
export interface WorkerPoolOptions {
  readonly min?: number;
  readonly max?: number;
  readonly idleTimeoutMs?: number;
}

/**
 * Options for `createWorkerThreadsSandbox(...)`.
 *
 * @stable
 */
export interface WorkerThreadsSandboxOptions {
  /**
   * Default wall-clock timeout, in milliseconds. Per-call values from
   * `SandboxRunOptions.timeoutMs` override this default.
   */
  readonly defaultTimeoutMs?: number;
  /**
   * Grace period (ms) after `signal.abort()` before the worker is
   * forcibly terminated. Defaults to 100 ms.
   */
  readonly abortGraceMs?: number;
  /**
   * Default block on outbound network. Per-call values from
   * `SandboxRunOptions.allowNetwork === false` are honoured first.
   */
  readonly noNetwork?: boolean;
  /**
   * Default block on filesystem access. Per-call values from
   * `SandboxRunOptions.allowFs === false` are honoured first.
   */
  readonly noFilesystem?: boolean;
  /** Optional WARN logger. */
  readonly warn?: (message: string) => void;
  /** Reserved for a post-MVP warm-pool implementation. */
  readonly pool?: WorkerPoolOptions;
}

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_ABORT_GRACE_MS = 100;

/**
 * Inline worker runtime. Runs inside a freshly-spawned worker thread
 * via `Worker(code, { eval: true })`. The runtime is plain JS so it
 * avoids the ESM/CJS-transform headache that would otherwise plague
 * package consumers running the source with vitest / tsx / ts-node.
 *
 * The runtime:
 *  1. Reads `workerData` for the dispatch envelope.
 *  2. Installs a `module.register(...)` resolver hook that throws on
 *     blocklisted specifiers when `noFilesystem` / `noNetwork` is set.
 *  3. Replaces `globalThis.fetch` with a thrower when `noNetwork` is
 *     set so cached references taken at import time still refuse.
 *  4. Dynamically imports the handler module and invokes the named
 *     export with the provided input.
 *  5. Forwards the result to the parent thread via `parentPort.postMessage`.
 */
const WORKER_RUNTIME = `
const { parentPort, workerData } = require('node:worker_threads');

const data = workerData;
if (data && data.env) {
  for (const k of Object.keys(data.env)) process.env[k] = data.env[k];
}

const blocked = [];
if (data.noFilesystem) blocked.push('node:fs', 'fs', 'node:fs/promises', 'fs/promises');
if (data.noNetwork) blocked.push('node:http', 'http', 'node:https', 'https',
  'node:net', 'net', 'node:dgram', 'dgram', 'node:tls', 'tls');

if (blocked.length) {
  const { register } = require('node:module');
  const { pathToFileURL } = require('node:url');
  process.env.GRAPHORIN_SANDBOX_BLOCKED = JSON.stringify(blocked);
  const loaderSrc =
    "const blocked = new Set(JSON.parse(process.env.GRAPHORIN_SANDBOX_BLOCKED || '[]'));" +
    "export async function resolve(spec, ctx, next) {" +
    "  if (blocked.has(spec)) {" +
    "    const isFs = spec === 'node:fs' || spec === 'fs' || spec === 'node:fs/promises' || spec === 'fs/promises';" +
    "    const err = new Error((isFs ? 'filesystem' : 'network') + ' access denied by sandbox policy: ' + spec);" +
    "    err.name = isFs ? 'SandboxFsAccessDenied' : 'SandboxNetworkAccessDenied';" +
    "    throw err;" +
    "  }" +
    "  return next(spec, ctx);" +
    "}";
  const dataUrl = 'data:text/javascript;base64,' + Buffer.from(loaderSrc, 'utf8').toString('base64');
  register(dataUrl, pathToFileURL(process.cwd() + '/'));
}

if (data.noNetwork) {
  const refusal = () => {
    const err = new Error('network access denied by sandbox policy: fetch');
    err.name = 'SandboxNetworkAccessDenied';
    throw err;
  };
  if (typeof globalThis.fetch === 'function') {
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true, enumerable: false, writable: false, value: refusal,
    });
  }
}

// Scrub the environment before user code runs: keep only the explicit
// data.env allowlist. Defence in depth on top of the Worker's env: {}
// construction; safe after register() — the loader thread captured
// GRAPHORIN_SANDBOX_BLOCKED during the synchronous registration.
const allowedEnv = (data && data.env) || {};
for (const k of Object.keys(process.env)) {
  if (!Object.prototype.hasOwnProperty.call(allowedEnv, k)) delete process.env[k];
}

(async () => {
  try {
    if (data.code.kind !== 'handler') {
      parentPort.postMessage({
        ok: false,
        error: { kind: 'sandbox-violation', message:
          'worker-threads-runtime only accepts pre-registered handlers' },
      });
      return;
    }
    // \`import()\` in ESM context requires a URL when the specifier is
    // not a bare module identifier. On POSIX an absolute path like
    // \`/abs/foo.mjs\` happens to be accepted, but on Windows the
    // OS-native form \`C:\\abs\\foo.mjs\` is parsed as scheme \`C\`
    // and \`import()\` throws \`Only URLs with a scheme in: file,
    // data, ... are supported\`. Normalise to a \`file://\` URL via
    // \`pathToFileURL\` so callers can keep passing OS-native paths.
    const { pathToFileURL: __ptfu } = require('node:url');
    const __moduleSpec = String(data.code.module);
    const __moduleUrl =
      __moduleSpec.startsWith('file:') ||
      __moduleSpec.startsWith('data:') ||
      __moduleSpec.startsWith('node:') ||
      (!__moduleSpec.startsWith('/') && !/^[A-Za-z]:[\\\\/]/.test(__moduleSpec))
        ? __moduleSpec
        : __ptfu(__moduleSpec).href;
    const mod = await import(__moduleUrl);
    const fn = mod[data.code.export];
    if (typeof fn !== 'function') {
      parentPort.postMessage({
        ok: false,
        error: { kind: 'sandbox-violation', message:
          'worker-threads-runtime: ' + data.code.module + '#' + data.code.export +
          ' is not a function' },
      });
      return;
    }
    const out = await fn(data.input);
    parentPort.postMessage({ ok: true, output: out });
  } catch (err) {
    const name = err && err.name;
    const kind = (name === 'SandboxFsAccessDenied' || name === 'SandboxNetworkAccessDenied')
      ? 'sandbox-violation' : 'execution-failed';
    parentPort.postMessage({
      ok: false,
      error: {
        kind: kind,
        message: err && err.message ? err.message : String(err),
        stack: err && err.stack ? err.stack : undefined,
      },
    });
  }
})();
`;

interface WorkerMessage {
  readonly ok: boolean;
  readonly output?: unknown;
  readonly error?: {
    readonly kind:
      | 'execution-failed'
      | 'sandbox-violation'
      | 'memory-exceeded'
      | 'timeout'
      | 'aborted';
    readonly message: string;
    readonly stack?: string;
  };
}

/**
 * Construct a `WorkerThreadsSandbox` instance.
 *
 * @stable
 */
export function createWorkerThreadsSandbox(opts: WorkerThreadsSandboxOptions = {}): SandboxImpl {
  const defaults = Object.freeze({
    timeoutMs: opts.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS,
    abortGraceMs: opts.abortGraceMs ?? DEFAULT_ABORT_GRACE_MS,
    noNetwork: opts.noNetwork ?? false,
    noFilesystem: opts.noFilesystem ?? false,
  });

  return Object.freeze({
    id: 'worker-threads',
    kind: 'worker-threads',
    capabilities: CAPABILITIES,
    run: async <TInput, TOutput>(
      code: SandboxCode,
      runOpts: SandboxRunOptions<TInput>,
    ): Promise<SandboxResult<TOutput>> => runOnce<TInput, TOutput>(code, runOpts, defaults),
  });
}

interface ResolvedDefaults {
  readonly timeoutMs: number;
  readonly abortGraceMs: number;
  readonly noNetwork: boolean;
  readonly noFilesystem: boolean;
}

async function runOnce<TInput, TOutput>(
  code: SandboxCode,
  runOpts: SandboxRunOptions<TInput>,
  defaults: ResolvedDefaults,
): Promise<SandboxResult<TOutput>> {
  const startedAt = performance.now();
  const timeoutMs = runOpts.timeoutMs ?? defaults.timeoutMs;
  const noNetwork = runOpts.allowNetwork === undefined ? defaults.noNetwork : !runOpts.allowNetwork;
  const noFilesystem = runOpts.allowFs === undefined ? defaults.noFilesystem : !runOpts.allowFs;

  if (runOpts.signal?.aborted === true) {
    return {
      ok: false,
      error: { kind: 'aborted', message: 'aborted before WorkerThreadsSandbox dispatch' },
      durationMs: performance.now() - startedAt,
    };
  }

  const workerData: Record<string, unknown> = {
    code,
    input: runOpts.input,
    env: runOpts.env ?? {},
    noNetwork,
    noFilesystem,
  };

  const resourceLimits =
    runOpts.maxMemoryMb !== undefined ? { maxOldGenerationSizeMb: runOpts.maxMemoryMb } : undefined;

  const worker = new Worker(WORKER_RUNTIME, {
    eval: true,
    // The worker must not inherit the host process.env (TL-9); the
    // runtime applies the `workerData.env` allowlist on top.
    env: {},
    workerData,
    ...(resourceLimits ? { resourceLimits } : {}),
  });

  let timer: NodeJS.Timeout | undefined;
  let graceTimer: NodeJS.Timeout | undefined;
  let abortListener: (() => void) | undefined;

  const result = await new Promise<SandboxResult<TOutput>>((resolve) => {
    let settled = false;
    const settle = (r: SandboxResult<TOutput>): void => {
      if (settled) return;
      settled = true;
      resolve(r);
    };

    worker.once('message', (message: WorkerMessage) => {
      if (message.ok) {
        settle({
          ok: true,
          output: message.output as TOutput,
          durationMs: performance.now() - startedAt,
        });
      } else {
        settle({
          ok: false,
          error: {
            kind: message.error?.kind ?? 'execution-failed',
            message: message.error?.message ?? 'unknown sandbox error',
            ...(message.error?.stack ? { cause: { stack: message.error.stack } } : {}),
          },
          durationMs: performance.now() - startedAt,
        });
      }
    });

    worker.once('error', (error) => {
      settle({
        ok: false,
        error: {
          kind: 'execution-failed',
          message: error instanceof Error ? error.message : String(error),
          cause: error,
        },
        durationMs: performance.now() - startedAt,
      });
    });

    worker.once('exit', (exitCode) => {
      if (exitCode !== 0) {
        settle({
          ok: false,
          error: {
            kind: 'execution-failed',
            message: `worker exited with code ${exitCode}`,
          },
          durationMs: performance.now() - startedAt,
        });
      }
    });

    if (timeoutMs > 0) {
      timer = setTimeout(() => {
        settle({
          ok: false,
          error: {
            kind: 'timeout',
            message: `WorkerThreadsSandbox: timed out after ${timeoutMs} ms`,
          },
          durationMs: performance.now() - startedAt,
        });
        void worker.terminate();
      }, timeoutMs);
      timer.unref?.();
    }

    if (runOpts.signal) {
      abortListener = (): void => {
        graceTimer = setTimeout(() => void worker.terminate(), defaults.abortGraceMs);
        graceTimer.unref?.();
        settle({
          ok: false,
          error: { kind: 'aborted', message: 'aborted by AbortSignal' },
          durationMs: performance.now() - startedAt,
        });
      };
      if (runOpts.signal.aborted) {
        abortListener();
      } else {
        runOpts.signal.addEventListener('abort', abortListener, { once: true });
      }
    }
  });

  if (timer) clearTimeout(timer);
  if (graceTimer) clearTimeout(graceTimer);
  if (abortListener && runOpts.signal && !runOpts.signal.aborted) {
    runOpts.signal.removeEventListener('abort', abortListener);
  }
  void worker.terminate();
  return result;
}
