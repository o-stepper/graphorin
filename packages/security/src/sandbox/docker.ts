/**
 * `DockerSandbox` - opt-in adapter that runs a sandboxed container
 * via the optional `dockerode` peer dependency. Suitable for
 * heavyweight tools or for executions where kernel-level isolation
 * is required.
 *
 * The adapter is intentionally minimal - it spawns a one-shot
 * container from an operator-supplied image, mounts an empty tmpfs at
 * `/work`, embeds the `input` payload as JSON inside the `node -e`
 * wrapper script, reads JSON back from the container's demultiplexed
 * stdout log stream, and tears the container down. Production
 * deployments that need volume mounts, custom networking, GPU
 * devices, or persistent containers should configure the adapter
 * accordingly via a custom `peerLoader`.
 *
 * `SandboxRunOptions` contract notes (deep-retest-0.13.9 P1):
 *
 * - `input` is visible to `kind: 'source'` code as the `__INPUT__`
 *   global (JSON-embedded in the wrapper); `kind: 'handler'` exports
 *   receive it as their single argument.
 * - `env` entries are forwarded as the container's `Env`. Unlike the
 *   worker-threads adapter the image's own baseline environment
 *   (`PATH`, `HOME`, ... from the image config) cannot be removed -
 *   the allowlist is additive on top of that baseline.
 * - `maxMemoryMb` overrides the constructor-level `memoryLimitMb`
 *   for the call; `signal` force-removes the container and resolves
 *   with `kind: 'aborted'`; the wrapper's stderr is captured
 *   separately and reported in the failure `cause`.
 *
 * The `dockerode` peer dependency is declared as **optional**; the
 * adapter resolves it lazily on the first `run(...)` call so the
 * package can be imported on hosts without Docker.
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
 * Structural view of a `dockerode` container instance.
 *
 * @stable
 */
export interface DockerodeContainer {
  readonly id: string;
  readonly start: () => Promise<void>;
  readonly wait: () => Promise<{ readonly StatusCode: number }>;
  readonly logs: (opts: {
    readonly stdout: boolean;
    readonly stderr: boolean;
  }) => Promise<Buffer | NodeJS.ReadableStream>;
  readonly remove: (opts?: { readonly force?: boolean }) => Promise<void>;
  readonly attach: (opts: {
    readonly stream: boolean;
    readonly stdin: boolean;
    readonly stdout: boolean;
    readonly stderr: boolean;
  }) => Promise<NodeJS.ReadWriteStream>;
}

/**
 * Structural view of a `dockerode` client instance.
 *
 * @stable
 */
export interface DockerodeClient {
  readonly createContainer: (opts: Record<string, unknown>) => Promise<DockerodeContainer>;
  readonly modem?: {
    readonly demuxStream?: (
      raw: NodeJS.ReadableStream,
      out: NodeJS.WritableStream,
      err: NodeJS.WritableStream,
    ) => void;
  };
}

/**
 * Structural view of the `dockerode` module returned by
 * `DockerSandboxOptions.peerLoader`.
 *
 * @stable
 */
export interface DockerodeModule {
  default?: new (opts?: { readonly socketPath?: string }) => DockerodeClient;
}

const CAPABILITIES: SandboxCapabilities = Object.freeze({
  canBlockNetwork: true,
  canBlockFilesystem: true,
  canEnforceTimeout: true,
  canEnforceMemoryLimit: true,
});

/**
 * Options for `createDockerSandbox(...)`.
 *
 * @stable
 */
export interface DockerSandboxOptions {
  /**
   * Container image. Defaults to a no-op stub the operator must
   * override; the framework deliberately does not ship an image.
   */
  readonly image?: string;
  /**
   * Hostname for the Docker daemon socket. Forwarded to `new
   * Dockerode({ socketPath })`. Defaults to the platform default.
   */
  readonly socketPath?: string;
  /** Default wall-clock timeout (ms). Defaults to 30000. */
  readonly defaultTimeoutMs?: number;
  /** Memory limit (MB). Defaults to 512. */
  readonly memoryLimitMb?: number;
  /**
   * Override the peer-dep loader. Tests inject a stub here.
   */
  readonly peerLoader?: () => Promise<DockerodeModule>;
}

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MEMORY_LIMIT_MB = 512;

/**
 * Construct a `DockerSandbox` instance. The adapter resolves the
 * peer dependency lazily on the first `run(...)` call.
 *
 * @stable
 */
export function createDockerSandbox(opts: DockerSandboxOptions = {}): SandboxImpl {
  const image = opts.image ?? 'graphorin-sandbox:latest';
  const defaultTimeoutMs = opts.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
  const memoryLimitMb = opts.memoryLimitMb ?? DEFAULT_MEMORY_LIMIT_MB;
  const peerLoader = opts.peerLoader ?? defaultPeerLoader;

  let cachedClient: DockerodeClient | null | 'unavailable' = null;

  const getClient = async (): Promise<DockerodeClient | undefined> => {
    if (cachedClient === 'unavailable') return undefined;
    if (cachedClient !== null) return cachedClient;
    try {
      const mod = await peerLoader();
      const Ctor = mod.default;
      if (!Ctor) throw new Error('dockerode default export missing');
      cachedClient = new Ctor(opts.socketPath ? { socketPath: opts.socketPath } : undefined);
      return cachedClient;
    } catch {
      cachedClient = 'unavailable';
      return undefined;
    }
  };

  return Object.freeze({
    id: 'docker',
    kind: 'docker',
    capabilities: CAPABILITIES,
    run: async <TInput, TOutput>(
      code: SandboxCode,
      runOpts: SandboxRunOptions<TInput>,
    ): Promise<SandboxResult<TOutput>> => {
      const startedAt = performance.now();

      if (runOpts.signal?.aborted === true) {
        return {
          ok: false,
          error: { kind: 'aborted', message: 'DockerSandbox: aborted before start' },
          durationMs: performance.now() - startedAt,
        };
      }

      const client = await getClient();
      if (!client) {
        return {
          ok: false,
          error: {
            kind: 'sandbox-violation',
            message:
              'DockerSandbox: dockerode peer dependency or local Docker daemon is not available; install with `pnpm add dockerode` and ensure Docker is running',
          },
          durationMs: performance.now() - startedAt,
        };
      }

      if (code.kind !== 'handler' && code.kind !== 'source') {
        return {
          ok: false,
          error: {
            kind: 'sandbox-violation',
            message: `DockerSandbox: unsupported code kind: ${code.kind}`,
          },
          durationMs: performance.now() - startedAt,
        };
      }

      const command = ['node', '-e', wrapperScript(code, runOpts.input)];

      let container: DockerodeContainer | undefined;
      let abortListener: (() => void) | undefined;
      try {
        container = await client.createContainer({
          Image: image,
          Cmd: command,
          // deep-retest-0.13.9 P1: the SandboxRunOptions.env allowlist
          // must actually reach the container. The image baseline env
          // (PATH etc.) remains; the allowlist is additive on top.
          Env: Object.entries(runOpts.env ?? {}).map(([k, v]) => `${k}=${v}`),
          AttachStdin: true,
          AttachStdout: true,
          AttachStderr: true,
          OpenStdin: true,
          StdinOnce: true,
          Tty: false,
          NetworkDisabled: runOpts.allowNetwork !== true,
          HostConfig: {
            // Per-call ceiling wins over the constructor default.
            Memory: (runOpts.maxMemoryMb ?? memoryLimitMb) * 1024 * 1024,
            ReadonlyRootfs: runOpts.allowFs !== true,
            Tmpfs: { '/work': 'rw,size=64m' },
            AutoRemove: false,
            CapDrop: ['ALL'],
            SecurityOpt: ['no-new-privileges'],
          },
        });

        await container.start();

        const timeoutMs = runOpts.timeoutMs ?? defaultTimeoutMs;
        const waitPromise = container.wait();
        // The race can be decided by timeout/abort while wait() is
        // still pending; the force-remove in the finally block then
        // settles it unobserved, which must not surface as an
        // unhandled rejection.
        void Promise.resolve(waitPromise).catch(() => {});
        const timeoutPromise = new Promise<{
          readonly StatusCode: number;
          readonly timedOut: true;
        }>((resolve) => {
          const t = setTimeout(() => resolve({ StatusCode: 124, timedOut: true }), timeoutMs);
          t.unref?.();
        });
        const abortPromise = new Promise<{ readonly StatusCode: number; readonly aborted: true }>(
          (resolve) => {
            if (runOpts.signal === undefined) return;
            // An abort that raced createContainer/start would otherwise
            // be missed - a listener added to an already-aborted signal
            // never fires.
            if (runOpts.signal.aborted) {
              resolve({ StatusCode: 137, aborted: true });
              return;
            }
            abortListener = () => resolve({ StatusCode: 137, aborted: true });
            runOpts.signal.addEventListener('abort', abortListener, { once: true });
          },
        );

        const result = (await Promise.race([waitPromise, timeoutPromise, abortPromise])) as {
          readonly StatusCode: number;
          readonly timedOut?: true;
          readonly aborted?: true;
        };

        if (result.aborted === true) {
          return {
            ok: false,
            error: {
              kind: 'aborted',
              message: 'DockerSandbox: aborted by signal',
            },
            durationMs: performance.now() - startedAt,
          };
        }

        if (result.timedOut === true) {
          return {
            ok: false,
            error: {
              kind: 'timeout',
              message: `DockerSandbox: timed out after ${timeoutMs} ms`,
            },
            durationMs: performance.now() - startedAt,
          };
        }

        const logs = await container.logs({ stdout: true, stderr: true });
        const raw =
          typeof logs === 'string'
            ? Buffer.from(logs, 'utf8')
            : Buffer.isBuffer(logs)
              ? logs
              : await readStream(logs);
        const { stdout: text, stderr: errText } = demuxDockerStreams(raw);

        if (result.StatusCode !== 0) {
          // deep-retest-0.13.9 P1: the wrapper reports the actual
          // exception on stderr - surface its first line in the
          // message and the full text in the cause.
          const firstErrLine = errText.trim().split('\n')[0] ?? '';
          return {
            ok: false,
            error: {
              kind: 'execution-failed',
              message:
                `DockerSandbox: container exited with status ${result.StatusCode}` +
                (firstErrLine !== '' ? ` - ${firstErrLine.slice(0, 300)}` : ''),
              cause: { stdout: text, stderr: errText },
            },
            durationMs: performance.now() - startedAt,
          };
        }

        const trimmed = text.trim();
        const output = trimmed === '' ? undefined : (JSON.parse(trimmed) as TOutput);
        return {
          ok: true,
          output: output as TOutput,
          durationMs: performance.now() - startedAt,
        };
      } catch (error) {
        return {
          ok: false,
          error: {
            kind: 'execution-failed',
            message: error instanceof Error ? error.message : String(error),
            cause: error,
          },
          durationMs: performance.now() - startedAt,
        };
      } finally {
        if (abortListener !== undefined) {
          runOpts.signal?.removeEventListener('abort', abortListener);
        }
        try {
          await container?.remove({ force: true });
        } catch {
          /* noop - best-effort cleanup */
        }
      }
    },
  });
}

function wrapperScript(code: SandboxCode, input: unknown): string {
  const payload = JSON.stringify(input ?? null);
  if (code.kind === 'source') {
    return [
      `const __INPUT__=${payload};`,
      `Promise.resolve((async () => { ${code.source} })()).then((out) => {`,
      `  process.stdout.write(JSON.stringify(out ?? null));`,
      `}).catch((err) => {`,
      `  process.stderr.write(err && err.stack ? err.stack : String(err));`,
      `  process.exit(1);`,
      `});`,
    ].join('\n');
  }
  if (code.kind === 'handler') {
    return [
      `const __INPUT__=${payload};`,
      `import(${JSON.stringify(code.module)}).then(async (m) => {`,
      `  const fn = m[${JSON.stringify(code.export)}];`,
      `  if (typeof fn !== 'function') throw new Error('export not callable');`,
      `  const out = await fn(__INPUT__);`,
      `  process.stdout.write(JSON.stringify(out ?? null));`,
      `}).catch((err) => {`,
      `  process.stderr.write(err && err.stack ? err.stack : String(err));`,
      `  process.exit(1);`,
      `});`,
    ].join('\n');
  }
  return '';
}

async function readStream(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer | string>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/**
 * With `Tty: false` the daemon multiplexes the log stream into
 * 8-byte-framed records - `[streamType, 0, 0, 0, payloadSizeBE32]`
 * followed by the payload, where type 1 is stdout and type 2 stderr -
 * so the raw bytes must be demultiplexed before `JSON.parse`. Strips
 * the frame headers and splits the payloads by stream: stdout stays
 * the JSON channel, stderr carries the wrapper's exception report
 * (deep-retest-0.13.9 P1). Buffers that do not start with a
 * well-formed frame header (TTY containers, test stubs returning
 * plain text) pass through unchanged as stdout; JSON output can never
 * be mistaken for a frame because it cannot start with a byte in the
 * 0x00-0x02 range.
 */
function demuxDockerStreams(raw: Buffer): { stdout: string; stderr: string } {
  const stdout: Buffer[] = [];
  const stderr: Buffer[] = [];
  let offset = 0;
  while (offset + 8 <= raw.length) {
    const streamType = raw[offset];
    const framed =
      (streamType === 0 || streamType === 1 || streamType === 2) &&
      raw[offset + 1] === 0 &&
      raw[offset + 2] === 0 &&
      raw[offset + 3] === 0;
    if (!framed) return { stdout: raw.toString('utf8'), stderr: '' };
    const size = raw.readUInt32BE(offset + 4);
    const start = offset + 8;
    const payload = raw.subarray(start, Math.min(start + size, raw.length));
    if (streamType === 1) stdout.push(payload);
    else if (streamType === 2) stderr.push(payload);
    offset = start + size;
  }
  // offset === 0: shorter than one frame header - treat as plain text.
  if (offset === 0) return { stdout: raw.toString('utf8'), stderr: '' };
  return {
    stdout: Buffer.concat(stdout).toString('utf8'),
    stderr: Buffer.concat(stderr).toString('utf8'),
  };
}

async function defaultPeerLoader(): Promise<DockerodeModule> {
  const mod = (await import('dockerode' as string)) as unknown as DockerodeModule;
  return mod;
}
