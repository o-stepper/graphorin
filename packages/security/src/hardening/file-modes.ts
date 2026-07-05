/**
 * POSIX file-mode utilities. The framework uses `0700` on
 * `~/.graphorin/` and `0600` on every sensitive file inside.
 * `ensureFileMode(...)` and `ensureDirMode(...)` apply the mode and
 * verify the post-condition; `verifyFileMode(...)` is a read-only
 * check used by `graphorin doctor` (Phase 15).
 *
 * The helpers prefer `fs.fchmod()` when the host process started
 * with `--permission` (CVE-2024-36137) per DEC-135.
 *
 * On Windows the helpers degrade to no-ops with a WARN since POSIX
 * modes are not honoured by NTFS. The doctor surfaces this gap and
 * recommends FDE.
 *
 * References:
 *  - DEC-135 - process hardening (mandatory POSIX modes).
 *  - RB-22 - file perms / umask / dump prevention.
 *
 * @packageDocumentation
 */

import {
  chmod as chmodCb,
  type FileHandle,
  lstat as lstatCb,
  mkdir as mkdirCb,
  open as openCb,
} from 'node:fs/promises';
import { getHardeningStatus } from './apply.js';
import { FileModeMismatchError } from './errors.js';

const POSIX_MASK = 0o777;

/**
 * Ensure a file is at the supplied POSIX mode. The function:
 *
 *  - On Windows / non-POSIX hosts, calls `warn(...)` and returns.
 *  - Else opens the file, runs `fchmod` if the process started with
 *    `--permission`, otherwise plain `chmod`.
 *  - Verifies the mode via `lstat` and throws
 *    `FileModeMismatchError` if the post-condition fails.
 *
 * @stable
 */
export async function ensureFileMode(
  path: string,
  mode: number,
  opts?: { readonly warn?: (message: string) => void },
): Promise<void> {
  if (process.platform === 'win32') {
    opts?.warn?.(
      `ensureFileMode: POSIX modes are not honoured on Windows; ${path} is left at the inherited ACL.`,
    );
    return;
  }
  const preferFchmod = getHardeningStatus()?.preferFchmod === true;
  if (preferFchmod) {
    let handle: FileHandle | undefined;
    try {
      handle = await openCb(path, 'r');
      await handle.chmod(mode);
    } finally {
      await handle?.close();
    }
  } else {
    await chmodCb(path, mode);
  }
  await verifyOrThrow(path, mode);
}

/**
 * Ensure a directory exists at the supplied POSIX mode. Creates the
 * directory recursively when it does not exist.
 *
 * @stable
 */
export async function ensureDirMode(
  path: string,
  mode: number,
  opts?: { readonly warn?: (message: string) => void },
): Promise<void> {
  if (process.platform === 'win32') {
    await mkdirCb(path, { recursive: true });
    opts?.warn?.(
      `ensureDirMode: POSIX modes are not honoured on Windows; ${path} is left at the inherited ACL.`,
    );
    return;
  }
  await mkdirCb(path, { recursive: true, mode });
  await ensureFileMode(path, mode, opts);
}

/**
 * Read the current POSIX mode and report whether it matches.
 *
 * @stable
 */
export async function verifyFileMode(
  path: string,
  expected: number,
): Promise<{ readonly ok: boolean; readonly actual: number }> {
  if (process.platform === 'win32') return { ok: true, actual: expected };
  const stats = await lstatCb(path);
  const actual = stats.mode & POSIX_MASK;
  return { ok: actual === expected, actual };
}

async function verifyOrThrow(path: string, expected: number): Promise<void> {
  const result = await verifyFileMode(path, expected);
  if (!result.ok) {
    throw new FileModeMismatchError(path, expected, result.actual);
  }
}
