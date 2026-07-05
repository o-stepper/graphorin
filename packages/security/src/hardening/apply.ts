/**
 * `applyProcessHardening(...)` - startup helper that:
 *
 *  - refuses to run as `root` on POSIX hosts (DEC-135);
 *  - sets `process.umask(0o077)` early so subsequent file creates
 *    inherit `0600` modes;
 *  - records the resolution as a structured event so the caller can
 *    forward to the audit log.
 *
 * The function is idempotent: calling it a second time with the same
 * options is a no-op (subject to `process.umask(...)` returning the
 * previous value).
 *
 * The host (the agent runtime in Phase 12 / the server in Phase 14)
 * calls this helper inside its `beforeStart` lifecycle hook. The CLI
 * (Phase 15) calls it at startup of every command that touches the
 * `~/.graphorin/` directory.
 *
 * @packageDocumentation
 */

import { RefuseToRunAsRootError } from './errors.js';

/**
 * Options for `applyProcessHardening(...)`.
 *
 * @stable
 */
export interface ApplyProcessHardeningOptions {
  /**
   * Refuse to run as root on POSIX hosts. Defaults to `true`. The
   * framework deliberately makes the safe path the default.
   */
  readonly refuseRoot?: boolean;
  /** Override the default umask (`0o077`). */
  readonly umask?: number;
  /**
   * Allow the framework to run as root even when `refuseRoot` is
   * `true`. Operators must opt in deliberately after reviewing
   * DEC-135.
   */
  readonly allowRoot?: boolean;
  /**
   * When the host process started with `--permission`, prefer
   * `fs.fchmod()` over `fs.chmod()` (CVE-2024-36137). The flag is
   * mostly informational here; downstream `ensureFileMode(...)`
   * reads the field via `getHardeningStatus(...)`.
   */
  readonly preferFchmod?: boolean;
  /** Optional WARN logger. */
  readonly warn?: (message: string) => void;
}

/**
 * Snapshot of the current hardening posture. Returned by
 * `applyProcessHardening(...)` and queryable later via
 * `getHardeningStatus(...)`.
 *
 * @stable
 */
export interface HardeningStatus {
  readonly platform: NodeJS.Platform;
  readonly euid: number | undefined;
  readonly previousUmask: number;
  readonly umask: number;
  readonly refuseRoot: boolean;
  readonly preferFchmod: boolean;
  readonly appliedAt: number;
  /** True only after `applyProcessHardening` ran in this process. */
  readonly applied: true;
}

let active: HardeningStatus | undefined;

/**
 * Apply process-level hardening. The function returns the resolved
 * status so consumers can record it (e.g. forward to the audit log).
 * Calling it more than once returns the same status; the umask is
 * not changed on subsequent calls.
 *
 * @stable
 */
export function applyProcessHardening(opts: ApplyProcessHardeningOptions = {}): HardeningStatus {
  if (active !== undefined) return active;

  const refuseRoot = opts.refuseRoot ?? true;
  const desiredUmask = opts.umask ?? 0o077;
  const preferFchmod = opts.preferFchmod ?? hostStartedWithPermissionFlag();
  const platform = process.platform;
  const euid = readEuid();

  if (refuseRoot && opts.allowRoot !== true && platform !== 'win32' && euid === 0) {
    throw new RefuseToRunAsRootError();
  }

  if (refuseRoot && opts.allowRoot === true && platform !== 'win32' && euid === 0) {
    opts.warn?.(
      '@graphorin/security: applyProcessHardening({ allowRoot: true }) is enabled while running as root; review DEC-135 and prefer a non-root user.',
    );
  }

  const previousUmask = process.umask(desiredUmask);

  active = Object.freeze({
    platform,
    euid,
    previousUmask,
    umask: desiredUmask,
    refuseRoot,
    preferFchmod,
    appliedAt: Date.now(),
    applied: true as const,
  });

  return active;
}

/**
 * Read the resolved hardening status. Returns `undefined` when
 * `applyProcessHardening(...)` has not been called yet.
 *
 * @stable
 */
export function getHardeningStatus(): HardeningStatus | undefined {
  return active;
}

/**
 * Reset internal state. Used by tests.
 *
 * @experimental
 */
export function _resetHardeningStatusForTesting(): void {
  active = undefined;
}

function readEuid(): number | undefined {
  if (typeof process.geteuid === 'function') return process.geteuid();
  return undefined;
}

function hostStartedWithPermissionFlag(): boolean {
  try {
    const argv = process.execArgv ?? [];
    return argv.some(
      (a) =>
        a === '--permission' || a.startsWith('--allow-fs') || a.startsWith('--allow-child-process'),
    );
  } catch {
    return false;
  }
}
