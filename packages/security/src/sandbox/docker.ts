/**
 * `DockerSandbox` - opt-in adapter that runs a sandboxed container
 * via the optional `dockerode` peer dependency. Suitable for
 * heavyweight tools or for executions where kernel-level isolation
 * is required.
 *
 * The adapter is intentionally minimal - it spawns a one-shot
 * container from an operator-supplied image, mounts an empty tmpfs at
 * `/work`, writes the `input` payload as JSON onto stdin, reads JSON
 * back from stdout, and tears the container down. Production
 * deployments that need volume mounts, custom networking, GPU
 * devices, or persistent containers should configure the adapter
 * accordingly via a custom `peerLoader`.
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

interface DockerodeContainer {
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

interface DockerodeClient {
  readonly createContainer: (opts: Record<string, unknown>) => Promise<DockerodeContainer>;
  readonly modem?: {
    readonly demuxStream?: (
      raw: NodeJS.ReadableStream,
      out: NodeJS.WritableStream,
      err: NodeJS.WritableStream,
    ) => void;
  };
}

interface DockerodeModule {
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
      try {
        container = await client.createContainer({
          Image: image,
          Cmd: command,
          AttachStdin: true,
          AttachStdout: true,
          AttachStderr: true,
          OpenStdin: true,
          StdinOnce: true,
          Tty: false,
          NetworkDisabled: runOpts.allowNetwork !== true,
          HostConfig: {
            Memory: memoryLimitMb * 1024 * 1024,
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
        const timeoutPromise = new Promise<{
          readonly StatusCode: number;
          readonly timedOut: true;
        }>((resolve) => {
          const t = setTimeout(() => resolve({ StatusCode: 124, timedOut: true }), timeoutMs);
          t.unref?.();
        });

        const result = (await Promise.race([waitPromise, timeoutPromise])) as {
          readonly StatusCode: number;
          readonly timedOut?: true;
        };

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

        const logs = await container.logs({ stdout: true, stderr: false });
        const text =
          typeof logs === 'string'
            ? logs
            : Buffer.isBuffer(logs)
              ? logs.toString('utf8')
              : await readStream(logs);

        if (result.StatusCode !== 0) {
          return {
            ok: false,
            error: {
              kind: 'execution-failed',
              message: `DockerSandbox: container exited with status ${result.StatusCode}`,
              cause: { stdout: text },
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

async function readStream(stream: NodeJS.ReadableStream): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer | string>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function defaultPeerLoader(): Promise<DockerodeModule> {
  const mod = (await import('dockerode' as string)) as unknown as DockerodeModule;
  return mod;
}
