/**
 * Thin wrapper around the 1Password CLI (`op`). Spawns `op` with the
 * canonical `read` subcommand, captures stdout, and surfaces typed
 * errors for the most common operator-fixable failure modes.
 *
 * The wrapper is split out so the resolver can be unit-tested without
 * touching the real `op` binary — tests inject a stub `OpCli`
 * implementation through {@link createOnePasswordResolver}.
 *
 * @packageDocumentation
 */

import { spawn } from 'node:child_process';

/** @stable */
export interface OpCliReadResult {
  readonly value: string;
  readonly exitCode: number;
  readonly durationMs: number;
}

/** @stable */
export interface OpCli {
  /**
   * Resolve a single `op://...` reference. Returns the **trimmed**
   * stdout. Throws {@link OpCliError} when the binary is missing, the
   * user is signed out, the reference does not resolve, or the call
   * exceeds the timeout.
   */
  read(uri: string, options?: OpCliReadOptions): Promise<OpCliReadResult>;
}

/** @stable */
export interface OpCliReadOptions {
  /** Override the binary path. Default `'op'` (looked up on `$PATH`). */
  readonly binary?: string;
  /** Hard timeout in milliseconds. Default `15000`. */
  readonly timeoutMs?: number;
  /** Override `process.env`. Default forwards the parent process. */
  readonly env?: Readonly<Record<string, string | undefined>>;
  /** Optional 1Password Connect / Service-Account token forwarding. */
  readonly serviceAccountToken?: string;
  /**
   * Optional 1Password Connect host + token tuple. When set the
   * resolver wires them through the `OP_CONNECT_HOST` /
   * `OP_CONNECT_TOKEN` env vars (the canonical Connect-mode contract
   * documented by 1Password).
   */
  readonly connect?: { readonly host: string; readonly token: string };
  /**
   * Optional `--account` override forwarded to the CLI. Useful when
   * the operator is signed in to multiple 1Password accounts.
   */
  readonly account?: string;
  /**
   * Optional `--no-color` flag suppression. The resolver always sets
   * `--no-color` so terminal colour codes do not leak into the
   * resolved value; pass `true` to opt out.
   */
  readonly preserveColor?: boolean;
}

/**
 * Typed error raised by the CLI wrapper. Carries a `kind` so callers
 * can distinguish operator-fixable failure modes.
 *
 * @stable
 */
export class OpCliError extends Error {
  override readonly name = 'OpCliError';
  readonly kind: OpCliErrorKind;
  readonly exitCode?: number;
  readonly stderr?: string;
  readonly hint?: string;

  constructor(
    kind: OpCliErrorKind,
    message: string,
    options?: {
      cause?: unknown;
      exitCode?: number;
      stderr?: string;
      hint?: string;
    },
  ) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.kind = kind;
    if (options?.exitCode !== undefined) this.exitCode = options.exitCode;
    if (options?.stderr !== undefined) this.stderr = options.stderr;
    if (options?.hint !== undefined) this.hint = options.hint;
  }
}

/** @stable */
export type OpCliErrorKind =
  | 'binary-missing'
  | 'signed-out'
  | 'reference-not-found'
  | 'timeout'
  | 'unknown';

/**
 * Default {@link OpCli} implementation. Spawns `op read --no-color
 * --reveal '<uri>'` with the configured timeout and inherits the
 * parent environment.
 *
 * @stable
 */
export function createDefaultOpCli(): OpCli {
  return createOpCli();
}

/**
 * Grace period after SIGTERM before escalating to SIGKILL (SPL-22). A
 * well-behaved `op` exits on SIGTERM well within this window; a wedged one
 * (ignoring SIGTERM in an uninterruptible read) is force-killed so the hard
 * timeout actually settles the promise.
 */
const SIGKILL_GRACE_MS = 1_000;

/**
 * {@link OpCli} factory with an injectable `spawn` (for tests). Production
 * code uses {@link createDefaultOpCli}.
 *
 * @stable
 */
export function createOpCli(deps: { readonly spawn?: typeof spawn } = {}): OpCli {
  const spawnFn = deps.spawn ?? spawn;
  return {
    async read(uri: string, options: OpCliReadOptions = {}): Promise<OpCliReadResult> {
      const binary = options.binary ?? 'op';
      const timeoutMs = options.timeoutMs ?? 15_000;
      const args = ['read', '--reveal'];
      if (options.preserveColor !== true) args.push('--no-color');
      if (options.account !== undefined && options.account.length > 0) {
        args.push('--account', options.account);
      }
      args.push(uri);
      const env: Record<string, string> = {};
      const baseEnv = options.env ?? process.env;
      for (const [k, v] of Object.entries(baseEnv)) {
        if (typeof v === 'string') env[k] = v;
      }
      if (options.serviceAccountToken !== undefined) {
        env.OP_SERVICE_ACCOUNT_TOKEN = options.serviceAccountToken;
      }
      if (options.connect !== undefined) {
        env.OP_CONNECT_HOST = options.connect.host;
        env.OP_CONNECT_TOKEN = options.connect.token;
      }
      const started = performance.now();
      return new Promise<OpCliReadResult>((resolve, reject) => {
        let stdout = '';
        let stderr = '';
        let killedByTimeout = false;
        let proc: ReturnType<typeof spawn>;
        try {
          proc = spawnFn(binary, args, { env, stdio: ['ignore', 'pipe', 'pipe'] });
        } catch (err) {
          reject(
            new OpCliError(
              'binary-missing',
              `'${binary}' is not installed or not on PATH. Install the 1Password CLI: https://developer.1password.com/docs/cli/get-started`,
              { cause: err, hint: 'install the 1Password CLI' },
            ),
          );
          return;
        }
        let graceTimer: ReturnType<typeof setTimeout> | undefined;
        const timer = setTimeout(() => {
          killedByTimeout = true;
          try {
            proc.kill('SIGTERM');
          } catch {
            // best-effort
          }
          // SPL-22: SIGTERM alone can hang forever if `op` ignores it. Escalate
          // to SIGKILL after a short grace AND reject from the timer, so the
          // promise settles even when `close` never fires.
          graceTimer = setTimeout(() => {
            try {
              proc.kill('SIGKILL');
            } catch {
              // best-effort
            }
            reject(
              new OpCliError(
                'timeout',
                `op CLI timed out after ${timeoutMs} ms while resolving '${uri}' and did not exit on SIGTERM.`,
                { stderr, hint: 'increase --op-timeout-ms or check 1Password connectivity' },
              ),
            );
          }, SIGKILL_GRACE_MS);
          graceTimer.unref?.();
        }, timeoutMs);
        timer.unref?.();
        proc.stdout?.on('data', (chunk: Buffer) => {
          stdout += chunk.toString('utf8');
        });
        proc.stderr?.on('data', (chunk: Buffer) => {
          stderr += chunk.toString('utf8');
        });
        proc.on('error', (err) => {
          clearTimeout(timer);
          if (graceTimer !== undefined) clearTimeout(graceTimer);
          if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
            reject(
              new OpCliError(
                'binary-missing',
                `'${binary}' is not installed or not on PATH. Install the 1Password CLI: https://developer.1password.com/docs/cli/get-started`,
                { cause: err, hint: 'install the 1Password CLI' },
              ),
            );
            return;
          }
          reject(
            new OpCliError('unknown', `op CLI invocation failed: ${err.message}`, {
              cause: err,
            }),
          );
        });
        proc.on('close', (code) => {
          clearTimeout(timer);
          if (graceTimer !== undefined) clearTimeout(graceTimer);
          const durationMs = performance.now() - started;
          if (killedByTimeout) {
            reject(
              new OpCliError(
                'timeout',
                `op CLI timed out after ${timeoutMs} ms while resolving '${uri}'.`,
                { stderr, hint: 'increase --op-timeout-ms or check 1Password connectivity' },
              ),
            );
            return;
          }
          if (code !== 0) {
            const kind = classifyExitError(code ?? -1, stderr);
            reject(
              new OpCliError(
                kind,
                `op CLI exited with code ${code} for '${uri}'${stderr.length > 0 ? `: ${stderr.trim()}` : ''}`,
                {
                  ...(code !== null ? { exitCode: code } : {}),
                  stderr,
                  hint: hintForExitKind(kind),
                },
              ),
            );
            return;
          }
          resolve(Object.freeze({ value: stdout.replace(/\r?\n$/, ''), exitCode: 0, durationMs }));
        });
      });
    },
  };
}

function classifyExitError(_code: number, stderr: string): OpCliErrorKind {
  const lower = stderr.toLowerCase();
  if (
    lower.includes('not signed in') ||
    lower.includes('please sign in') ||
    lower.includes('not authenticated') ||
    lower.includes('session expired')
  ) {
    return 'signed-out';
  }
  if (
    lower.includes("couldn't find") ||
    lower.includes('does not exist') ||
    lower.includes('item not found') ||
    lower.includes('field not found') ||
    lower.includes('reference not found')
  ) {
    return 'reference-not-found';
  }
  return 'unknown';
}

function hintForExitKind(kind: OpCliErrorKind): string {
  switch (kind) {
    case 'signed-out':
      return "run 'eval $(op signin)' (interactive) or set OP_SERVICE_ACCOUNT_TOKEN (headless).";
    case 'reference-not-found':
      return "verify the reference with 'op item get <item> --vault <vault>' before retrying.";
    case 'timeout':
      return 'check 1Password connectivity / increase --op-timeout-ms.';
    case 'binary-missing':
      return 'install the 1Password CLI: https://developer.1password.com/docs/cli/get-started';
    default:
      return 'check the op CLI stderr output for details.';
  }
}
