import { readFile, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { isAbsolute, resolve } from 'node:path';

import type { SecretResolver } from '@graphorin/core/contracts';

import { SecretResolutionError } from '../errors.js';
import { getQueryParam, type ParsedSecretRef } from '../secret-ref.js';
import { SecretValue } from '../secret-value.js';

/**
 * Expand a leading `~` into the user's home directory. Anything else
 * is returned verbatim.
 */
function expandTilde(p: string): string {
  if (p === '~') return homedir();
  if (p.startsWith('~/')) return resolve(homedir(), p.slice(2));
  return p;
}

/**
 * Resolver for the `file:` scheme. Reads a plaintext file and returns
 * the trimmed content as a `SecretValue`.
 *
 * The resolver enforces `chmod 0600` on POSIX systems and emits a
 * single console warning per process when the file is found at a wider
 * mode (heuristic: any group/other read or write bits set). Set
 * `?warnOnPermissions=0` in the URI to opt out — typical when reading
 * Docker `*_FILE` mounts that intentionally use a tmpfs with a wider
 * mode.
 *
 * @stable
 */
export const fileResolver: SecretResolver = {
  scheme: 'file',
  async resolve(ref) {
    const parsed = ref as ParsedSecretRef;
    if (parsed.path.length === 0) {
      throw new SecretResolutionError(
        'file',
        parsed.raw,
        "file: ref must include a path (e.g. 'file:/abs/path' or 'file:./relative').",
      );
    }
    const path = expandTilde(parsed.path);
    const encoding = (getQueryParam(parsed, 'encoding') as BufferEncoding | undefined) ?? 'utf8';
    const warnOnPermissions = getQueryParam(parsed, 'warnOnPermissions') !== '0';
    let absolute = path;
    if (!isAbsolute(absolute)) {
      // Per RFC 3986, file URIs without `//` may be relative — we
      // resolve them against the current working directory and warn
      // because relative paths in production config are a smell.
      absolute = resolve(process.cwd(), absolute);
      if (process.env.GRAPHORIN_QUIET_RELATIVE_FILE_REFS !== '1') {
        emitOnce(
          'graphorin:file-resolver:relative',
          `[graphorin/security] file: SecretRef resolved a relative path '${parsed.path}' against the current working directory; prefer absolute paths or 'file:///abs/path'.`,
        );
      }
    }
    let content: Buffer;
    try {
      content = await readFile(absolute);
    } catch (err) {
      throw new SecretResolutionError('file', parsed.raw, (err as Error).message ?? 'read failed', {
        cause: err,
      });
    }
    if (warnOnPermissions && process.platform !== 'win32') {
      try {
        const info = await stat(absolute);
        const mode = info.mode & 0o777;
        if ((mode & 0o077) !== 0) {
          emitOnce(
            `graphorin:file-resolver:perm:${absolute}`,
            `[graphorin/security] file: SecretRef '${parsed.raw}' is at mode 0o${mode.toString(8)}; recommended mode is 0600. Append '?warnOnPermissions=0' to silence.`,
          );
        }
      } catch {
        // Permission check is best-effort; ignore stat failures.
      }
    }
    return SecretValue.fromBuffer(toDecodedBuffer(content, encoding), {
      source: { resolver: 'file', ref: parsed.raw },
    });
  },
};

const warnedOnce = new Set<string>();
function emitOnce(key: string, message: string): void {
  if (warnedOnce.has(key)) return;
  warnedOnce.add(key);
  // Documented WARN-once channel. Until the framework-wide structured
  // logger lands, fall back to the standard error stream so consumers
  // still receive the warning at a sensible level.
  console.warn(message);
}

/**
 * Tests reset the WARN-once registry to keep fixtures isolated.
 *
 * @experimental
 */
export function _resetFileResolverWarningsForTesting(): void {
  warnedOnce.clear();
}

function toDecodedBuffer(buf: Buffer, encoding: BufferEncoding): Buffer {
  // `?encoding=utf8` (default) — treat the file as UTF-8 text and trim
  // the trailing newline that most editors insert.
  if (encoding === 'utf8' || encoding === 'utf-8') {
    return Buffer.from(buf.toString('utf8').trimEnd(), 'utf8');
  }
  // `?encoding=base64` / `?encoding=hex` — the file contains the
  // encoded form of an arbitrary byte string; decode it into a Buffer
  // and surface the raw bytes through SecretValue.useBuffer / .use.
  return Buffer.from(buf.toString('utf8').trimEnd(), encoding);
}
