/**
 * Host-bridged source execution - the sandbox primitive behind
 * code-mode / programmatic tool calling (P1-2).
 *
 * The four built-in adapters ({@link createNoneSandbox} et al.) run a
 * **pre-registered handler** (`code.kind === 'handler'`): a module +
 * export resolved inside the worker, invoked once with a single
 * structured-cloneable `input`, returning a single value. That model
 * cannot express "run this model-written script, and while it runs let
 * it call back out to a fixed set of host tools, keeping every
 * intermediate value inside the sandbox."
 *
 * `runBridgedSource(...)` adds exactly that, as a **separate** surface so
 * the audited handler runtimes stay byte-identical. It spawns a
 * `node:worker_threads` `Worker`, evaluates the supplied source as the
 * body of an `async (tools) => { … }` function, and exposes `tools` as a
 * set of async functions - one per allowed name - that round-trip each
 * call to the parent over the worker `MessagePort`. The parent services
 * the call via the injected {@link BridgedSourceOptions.dispatch} hook
 * (the agent wires this to the real {@link ToolExecutor}, so per-tool
 * ACL / sanitization / truncation still apply). Only the script's final
 * return value crosses back; intermediate values never leave the worker.
 *
 * Isolation is the `worker-threads` tier's: a fresh V8 isolate per run,
 * an empty environment (the worker is constructed with `env: {}` and the
 * runtime scrubs `process.env` before user code runs, so host secrets
 * are not visible - TL-9), best-effort `node:fs` / `node:net` import
 * blocking and a `fetch` refusal (reused from
 * {@link createWorkerThreadsSandbox}), a hard wall-clock timeout via
 * `worker.terminate()`, an optional memory ceiling, and `AbortSignal`
 * cancellation. The **only** channel from the
 * worker to the host is the tool-call RPC, and it serves none but the
 * `allowedTools` names - there is no way to obtain a reference to the
 * executor, the registry, or any other host object (functions do not
 * survive `structuredClone`). As with `createWorkerThreadsSandbox`, this
 * is defence in depth, not a guarantee against process-level mischief by
 * hostile code; deployments that need V8-grade isolation should layer
 * `isolated-vm` / `docker` underneath (host-bridging those tiers is a
 * follow-up).
 *
 * @packageDocumentation
 */

import { Worker } from 'node:worker_threads';

/** A single tool invocation the sandboxed script asked the host to run. */
export interface BridgedToolCall {
  /** Registered tool name the script invoked via `tools.<name>(args)`. */
  readonly name: string;
  /** The arguments object the script passed; structured-clone safe. */
  readonly args: unknown;
}

/** Options for {@link runBridgedSource}. */
export interface BridgedSourceOptions {
  /**
   * Model-written JavaScript, evaluated as the body of an
   * `async (tools) => { … }` function. A top-level `return` yields the
   * final result; the value must be structured-clone safe.
   */
  readonly source: string;
  /** Names the script may call as `tools.<name>(args)`. */
  readonly allowedTools: ReadonlyArray<string>;
  /**
   * Host bridge invoked for each `tools.<name>(args)` call. Resolve with
   * the tool's output (structured-clone safe) or reject to surface an
   * error to the script. Calls for a name not in `allowedTools` are
   * rejected by the runner before `dispatch` is consulted.
   */
  readonly dispatch: (call: BridgedToolCall) => Promise<unknown>;
  /** Hard wall-clock timeout (ms) for the whole script. Default 30000. */
  readonly timeoutMs?: number;
  /** Memory ceiling (MB) for the worker. Omitted ⇒ Node default. */
  readonly maxMemoryMb?: number;
  /** Block outbound network (`fetch` + `node:http`/`net`/…). Default true. */
  readonly noNetwork?: boolean;
  /** Block filesystem (`node:fs`/…) imports. Default true. */
  readonly noFilesystem?: boolean;
  /** Cancellation signal; aborts the run and terminates the worker. */
  readonly signal?: AbortSignal;
  /** Ceiling on bridged tool calls per run. Default 64. */
  readonly maxToolCalls?: number;
  /** Grace (ms) after abort before forcible `terminate()`. Default 100. */
  readonly abortGraceMs?: number;
  /** Optional WARN logger. */
  readonly warn?: (message: string) => void;
}

/** Outcome of a {@link runBridgedSource} run. */
export type BridgedSourceResult =
  | {
      readonly ok: true;
      /** The script's final return value (structured-clone safe). */
      readonly output: unknown;
      /** Number of bridged tool calls the script made. */
      readonly toolCalls: number;
      readonly durationMs: number;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly kind: 'timeout' | 'sandbox-violation' | 'aborted' | 'execution-failed';
        readonly message: string;
      };
      readonly toolCalls: number;
      readonly durationMs: number;
    };

/**
 * E3 (item 13, step 1): the code-mode RUNTIME contract - the seam
 * through which a harness substitutes WHERE model-written code
 * executes (a different worker pool, a subprocess, a remote runner).
 * {@link runBridgedSource} is the built-in `worker_threads`
 * implementation; a provider conforms by accepting the same options
 * and settling with the same result union.
 *
 * Invariant (fixed): the options carry ONLY the script source, the
 * allowed tool names, the host `dispatch` bridge, the cancellation
 * signal and resource limits. Credentials, `RunState` and policy stay
 * on the harness side - every in-script `tools.<name>(args)` call
 * routes back through `dispatch` into the host's tool executor, where
 * ACL / sanitization / taint / permission governance applies. A
 * provider therefore never needs (and must never be handed) secret
 * material or run internals.
 *
 * @stable
 */
export type CodeModeRunner = (options: BridgedSourceOptions) => Promise<BridgedSourceResult>;

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_ABORT_GRACE_MS = 100;
const DEFAULT_MAX_TOOL_CALLS = 64;

/**
 * Inline worker runtime for host-bridged source. Plain JS (no
 * ESM/CJS-transform headache for consumers running under vitest / tsx).
 * The fs / network blocking mirrors {@link createWorkerThreadsSandbox}'s
 * runtime verbatim; the rest is the tool-call RPC pump.
 *
 * All worker-side strings use `+` concatenation (no inner template
 * literals) to keep this outer template literal free of `\${` escapes.
 */
const BRIDGED_RUNTIME = `
const { parentPort, workerData } = require('node:worker_threads');
const data = workerData;
if (data && data.env) {
  for (const k of Object.keys(data.env)) process.env[k] = data.env[k];
}

// D4 / tools-05 (SDF-9 parity with worker-threads.ts): process-level
// escapes are ALWAYS blocked - child_process, vm, worker_threads
// (nested), cluster, inspector each trivially defeat the no-fs /
// no-network flags. Defence in depth; worker threads remain a fault
// boundary, not a security boundary.
const ESCAPE_MODULES = ['node:child_process', 'child_process',
  'node:vm', 'vm', 'node:worker_threads', 'worker_threads',
  'node:cluster', 'cluster', 'node:inspector', 'inspector'];
const blocked = [...ESCAPE_MODULES];
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
    "    const isNet = spec.indexOf('http') >= 0 || spec.indexOf('net') >= 0 || spec.indexOf('tls') >= 0 || spec.indexOf('dgram') >= 0;" +
    "    const kind = isFs ? 'filesystem' : isNet ? 'network' : 'module';" +
    "    const err = new Error(kind + ' access denied by sandbox policy: ' + spec);" +
    "    err.name = isFs ? 'SandboxFsAccessDenied' : isNet ? 'SandboxNetworkAccessDenied' : 'SandboxModuleAccessDenied';" +
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
// construction; safe after register() - the loader thread captured
// GRAPHORIN_SANDBOX_BLOCKED during the synchronous registration.
const allowedEnv = (data && data.env) || {};
for (const k of Object.keys(process.env)) {
  if (!Object.prototype.hasOwnProperty.call(allowedEnv, k)) delete process.env[k];
}

// D4 / tools-05: the ESM resolve hook does not see CJS require() - patch
// Module._load so a createRequire()-based require('child_process') /
// require('vm') inside bridged code is denied too.
{
  const Module = require('node:module');
  const blockedSet = new Set(blocked);
  const originalLoad = Module._load;
  Module._load = function (request, parent, isMain) {
    if (blockedSet.has(request)) {
      const isFs = request === 'node:fs' || request === 'fs'
        || request === 'node:fs/promises' || request === 'fs/promises';
      const err = new Error(
        (isFs ? 'filesystem' : 'module') + ' access denied by sandbox policy: ' + request);
      err.name = isFs ? 'SandboxFsAccessDenied' : 'SandboxModuleAccessDenied';
      throw err;
    }
    return originalLoad.call(this, request, parent, isMain);
  };
}

let __seq = 0;
let __toolCalls = 0;
const __pending = new Map();
const __maxToolCalls = data.maxToolCalls;

parentPort.on('message', (msg) => {
  if (!msg || msg.type !== 'tool-result') return;
  const p = __pending.get(msg.id);
  if (!p) return;
  __pending.delete(msg.id);
  if (msg.ok) p.resolve(msg.value);
  else p.reject(new Error(msg.error || ('tool call failed: ' + msg.id)));
});

function __call(name, args) {
  if (__toolCalls >= __maxToolCalls) {
    return Promise.reject(new Error('code-mode tool-call budget exceeded (' + __maxToolCalls + ')'));
  }
  __toolCalls += 1;
  const id = ++__seq;
  return new Promise((resolve, reject) => {
    __pending.set(id, { resolve: resolve, reject: reject });
    try {
      parentPort.postMessage({ type: 'tool-call', id: id, name: name, args: args });
    } catch (err) {
      __pending.delete(id);
      reject(new Error('tool arguments are not serialisable: ' + (err && err.message ? err.message : String(err))));
    }
  });
}

const tools = Object.create(null);
for (const name of data.allowedTools) {
  tools[name] = function (args) { return __call(name, args); };
}
Object.freeze(tools);

(async () => {
  try {
    const factory = new Function('tools', '"use strict"; return (async function () {\\n' + data.source + '\\n})();');
    const output = await factory(tools);
    parentPort.postMessage({ type: 'done', ok: true, output: output, toolCalls: __toolCalls });
  } catch (err) {
    const nm = err && err.name;
    const kind = (nm === 'SandboxFsAccessDenied' || nm === 'SandboxNetworkAccessDenied'
      || nm === 'SandboxModuleAccessDenied')
      ? 'sandbox-violation' : 'execution-failed';
    parentPort.postMessage({
      type: 'done', ok: false, toolCalls: __toolCalls,
      error: { kind: kind, message: err && err.message ? err.message : String(err) },
    });
  }
})();
`;

interface WorkerOutbound {
  readonly type: 'tool-call' | 'done';
  readonly id?: number;
  readonly name?: string;
  readonly args?: unknown;
  readonly ok?: boolean;
  readonly output?: unknown;
  readonly toolCalls?: number;
  readonly error?: { readonly kind: BridgedFailKind; readonly message: string };
}

type BridgedFailKind = 'timeout' | 'sandbox-violation' | 'aborted' | 'execution-failed';

/**
 * Run model-written source in a worker, bridging `tools.<name>(args)`
 * calls back to the host. See the module docstring for the isolation
 * contract.
 *
 * @stable
 */
export async function runBridgedSource(opts: BridgedSourceOptions): Promise<BridgedSourceResult> {
  const startedAt = performance.now();
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const abortGraceMs = opts.abortGraceMs ?? DEFAULT_ABORT_GRACE_MS;
  const noNetwork = opts.noNetwork ?? true;
  const noFilesystem = opts.noFilesystem ?? true;
  const maxToolCalls = opts.maxToolCalls ?? DEFAULT_MAX_TOOL_CALLS;
  const allowed = new Set(opts.allowedTools);

  const elapsed = (): number => performance.now() - startedAt;

  if (opts.signal?.aborted === true) {
    return {
      ok: false,
      error: { kind: 'aborted', message: 'aborted before code-mode dispatch' },
      toolCalls: 0,
      durationMs: elapsed(),
    };
  }

  const worker = new Worker(BRIDGED_RUNTIME, {
    eval: true,
    // The worker must not inherit the host process.env - the source is
    // model-written, and `return process.env` would exfiltrate host
    // secrets into the conversation (TL-9).
    env: {},
    workerData: {
      source: opts.source,
      allowedTools: opts.allowedTools,
      noNetwork,
      noFilesystem,
      maxToolCalls,
    },
    ...(opts.maxMemoryMb !== undefined
      ? { resourceLimits: { maxOldGenerationSizeMb: opts.maxMemoryMb } }
      : {}),
  });

  let toolCalls = 0;
  let timer: NodeJS.Timeout | undefined;
  let graceTimer: NodeJS.Timeout | undefined;
  let abortListener: (() => void) | undefined;

  const result = await new Promise<BridgedSourceResult>((resolve) => {
    let settled = false;
    const settle = (r: BridgedSourceResult): void => {
      if (settled) return;
      settled = true;
      resolve(r);
    };

    worker.on('message', (message: WorkerOutbound) => {
      if (message.type === 'tool-call') {
        toolCalls += 1;
        const id = message.id;
        const name = message.name ?? '';
        if (!allowed.has(name)) {
          // Defence in depth: the worker only ever advertises allowed
          // names, but never trust the channel - refuse anything else.
          worker.postMessage({
            type: 'tool-result',
            id,
            ok: false,
            error: `tool not available in code-mode: ${name}`,
          });
          return;
        }
        void opts.dispatch({ name, args: message.args }).then(
          (value) => {
            try {
              worker.postMessage({ type: 'tool-result', id, ok: true, value });
            } catch (err) {
              worker.postMessage({
                type: 'tool-result',
                id,
                ok: false,
                error: `tool result is not serialisable: ${
                  err instanceof Error ? err.message : String(err)
                }`,
              });
            }
          },
          (err: unknown) => {
            worker.postMessage({
              type: 'tool-result',
              id,
              ok: false,
              error: err instanceof Error ? err.message : String(err),
            });
          },
        );
        return;
      }
      // type === 'done'
      if (message.ok === true) {
        settle({
          ok: true,
          output: message.output,
          toolCalls: message.toolCalls ?? toolCalls,
          durationMs: elapsed(),
        });
      } else {
        settle({
          ok: false,
          error: {
            kind: message.error?.kind ?? 'execution-failed',
            message: message.error?.message ?? 'unknown code-mode error',
          },
          toolCalls: message.toolCalls ?? toolCalls,
          durationMs: elapsed(),
        });
      }
    });

    worker.once('error', (error) => {
      settle({
        ok: false,
        error: {
          kind: 'execution-failed',
          message: error instanceof Error ? error.message : String(error),
        },
        toolCalls,
        durationMs: elapsed(),
      });
    });

    worker.once('exit', (exitCode) => {
      // Settle on ANY exit that beats the 'done' message: a script that
      // calls process.exit(0) (or a worker that drains without posting)
      // exits 0, and without this settle the run would hang until the
      // wall-clock timeout (or forever when timeoutMs <= 0). Node emits
      // queued 'message' events before 'exit', so a posted result wins.
      settle({
        ok: false,
        error: {
          kind: 'execution-failed',
          message:
            exitCode === 0
              ? 'code-mode worker exited before producing a result'
              : `code-mode worker exited with code ${exitCode}`,
        },
        toolCalls,
        durationMs: elapsed(),
      });
    });

    if (timeoutMs > 0) {
      timer = setTimeout(() => {
        opts.warn?.(`code-mode: timed out after ${timeoutMs} ms`);
        settle({
          ok: false,
          error: { kind: 'timeout', message: `code-mode: timed out after ${timeoutMs} ms` },
          toolCalls,
          durationMs: elapsed(),
        });
        void worker.terminate();
      }, timeoutMs);
      // Deliberately ref'd: while a run is pending the timer must be
      // able to keep a draining host event loop alive so the timeout
      // can still settle; it is cleared as soon as the run settles.
    }

    if (opts.signal) {
      abortListener = (): void => {
        graceTimer = setTimeout(() => void worker.terminate(), abortGraceMs);
        graceTimer.unref?.();
        settle({
          ok: false,
          error: { kind: 'aborted', message: 'aborted by AbortSignal' },
          toolCalls,
          durationMs: elapsed(),
        });
      };
      if (opts.signal.aborted) abortListener();
      else opts.signal.addEventListener('abort', abortListener, { once: true });
    }
  });

  if (timer) clearTimeout(timer);
  if (graceTimer) clearTimeout(graceTimer);
  if (abortListener && opts.signal && !opts.signal.aborted) {
    opts.signal.removeEventListener('abort', abortListener);
  }
  void worker.terminate();
  return result;
}
