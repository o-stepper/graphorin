/**
 * Reader for result handles produced by the `'spill-to-file'` truncation
 * path. Pairs with {@link createDefaultSpillWriter} (`./spill.ts`): given a
 * `graphorin-spill:<rel>` handle URI it resolves the artifact **within the
 * configured root only** and returns a bounded byte- or line-range, so the
 * built-in `read_result` tool can page through a large spilled result
 * without inlining the whole blob (P1-4).
 *
 * Security: the handle is opaque and resolution is confined to
 * `artifactRoot`; any URI that resolves outside the root (e.g. via `..`)
 * is rejected, so a model — even one steered by injected content — cannot
 * read arbitrary files. Non-`graphorin-spill:` schemes are rejected
 * (MCP `resource_link` resolution is reserved for WI-13).
 *
 * @packageDocumentation
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

import { sidecarPathFor } from './spill.js';

/** The only handle scheme this reader resolves. */
export const SPILL_HANDLE_SCHEME = 'graphorin-spill:';

/**
 * Range selector for {@link ResultReader.read}. A line range
 * (`startLine`/`endLine`, 1-based inclusive) takes precedence over a byte
 * range (`offset`/`length`) when both are supplied. `maxBytes` caps the
 * returned slice regardless of mode.
 *
 * @stable
 */
export interface ResultReadRange {
  /** Byte offset into the artifact (byte mode). Default `0`. */
  readonly offset?: number;
  /** Byte length to return (byte mode). Default: to end (subject to `maxBytes`). */
  readonly length?: number;
  /** First line to return, 1-based inclusive (line mode). */
  readonly startLine?: number;
  /** Last line to return, 1-based inclusive (line mode). */
  readonly endLine?: number;
  /** Hard cap on returned bytes. */
  readonly maxBytes?: number;
}

/**
 * Outcome of {@link ResultReader.read}.
 *
 * @stable
 */
export interface ResultReadOutcome {
  /** The requested slice of the artifact. */
  readonly content: string;
  /** Byte length of {@link content}. */
  readonly bytes: number;
  /** Total byte size of the full artifact. */
  readonly totalBytes: number;
  /** `true` when {@link content} reaches the end of the artifact (no more to read). */
  readonly eof: boolean;
  /**
   * Trust class of the producer of the resolved artifact, when the
   * reader knows it (TL-6) — e.g. the MCP resource reader always
   * reports `'mcp-derived'`, and the file reader recovers it from the
   * artifact's taint sidecar (tools-03). The executor re-applies
   * inbound sanitization + dataflow provenance by this class.
   */
  readonly producerTrustClass?: import('@graphorin/core').ToolTrustClass;
  /** Source of the producing tool, when the reader knows it (tools-03). */
  readonly producerSource?: import('@graphorin/core').ToolSource;
  /** Sensitivity of the produced content, when the reader knows it (tools-03). */
  readonly producerSensitivity?: import('@graphorin/core').Sensitivity;
}

/**
 * Resolves result handles to (ranges of) their backing artifact.
 *
 * @stable
 */
export interface ResultReader {
  read(uri: string, range?: ResultReadRange): Promise<ResultReadOutcome>;
}

/** Configuration for {@link createFileResultReader}. */
export interface FileResultReaderOptions {
  /** Root the spill writer writes under (e.g. `SpillWriter.artifactRoot`). */
  readonly artifactRoot: string;
  /** Default `maxBytes` when the caller omits one. Default `65536`. */
  readonly maxBytes?: number;
}

/**
 * Build a filesystem-backed {@link ResultReader} confined to `artifactRoot`.
 *
 * @stable
 */
export function createFileResultReader(opts: FileResultReaderOptions): ResultReader {
  const root = path.resolve(opts.artifactRoot);
  const defaultMaxBytes = opts.maxBytes ?? 65_536;
  return {
    async read(uri, range): Promise<ResultReadOutcome> {
      const resolved = resolveHandle(root, uri);
      const buf = await fs.readFile(resolved);
      const totalBytes = buf.byteLength;
      const cap = Math.max(0, range?.maxBytes ?? defaultMaxBytes);
      // tools-03: recover the producer's taint from the sidecar the
      // writer persisted next to the artifact. The executor's in-memory
      // taint map covers neither a second executor sharing the spill
      // root (code-mode) nor a resumed process — the sidecar does.
      const taint = await readSidecarTaint(resolved);

      // Line mode wins when a line bound is supplied.
      if (range?.startLine !== undefined || range?.endLine !== undefined) {
        const lines = buf.toString('utf8').split('\n');
        const start = Math.max(1, range.startLine ?? 1);
        const end = Math.min(lines.length, range.endLine ?? lines.length);
        const selected = start <= end ? lines.slice(start - 1, end).join('\n') : '';
        const content = capBytes(selected, cap);
        const capped = Buffer.byteLength(selected, 'utf8') > cap;
        return Object.freeze({
          content,
          bytes: Buffer.byteLength(content, 'utf8'),
          totalBytes,
          eof: end >= lines.length && !capped,
          ...taint,
        });
      }

      // Byte mode.
      const offset = clamp(range?.offset ?? 0, 0, totalBytes);
      const requested = range?.length ?? totalBytes - offset;
      const rawEnd = clamp(offset + Math.max(0, requested), offset, totalBytes);
      const end = Math.min(rawEnd, offset + cap);
      const slice = buf.subarray(offset, end);
      return Object.freeze({
        content: slice.toString('utf8'),
        bytes: slice.byteLength,
        totalBytes,
        eof: end >= totalBytes,
        ...taint,
      });
    },
  };
}

/**
 * Read the taint sidecar for an artifact, if present. Absent / corrupt
 * sidecars (artifacts written before tools-03, foreign writers) yield
 * an empty record — the executor then falls back to its in-memory map
 * or the reading tool's own class, exactly the pre-sidecar behaviour.
 */
async function readSidecarTaint(artifactPath: string): Promise<{
  readonly producerTrustClass?: import('@graphorin/core').ToolTrustClass;
  readonly producerSource?: import('@graphorin/core').ToolSource;
  readonly producerSensitivity?: import('@graphorin/core').Sensitivity;
}> {
  let raw: string;
  try {
    raw = await fs.readFile(sidecarPathFor(artifactPath), 'utf8');
  } catch {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as {
      readonly producerTrustClass?: unknown;
      readonly source?: unknown;
      readonly sensitivity?: unknown;
    };
    const sourceIsToolSource =
      typeof parsed.source === 'object' &&
      parsed.source !== null &&
      typeof (parsed.source as { readonly kind?: unknown }).kind === 'string';
    return {
      ...(typeof parsed.producerTrustClass === 'string'
        ? {
            producerTrustClass:
              parsed.producerTrustClass as import('@graphorin/core').ToolTrustClass,
          }
        : {}),
      ...(sourceIsToolSource
        ? { producerSource: parsed.source as import('@graphorin/core').ToolSource }
        : {}),
      ...(typeof parsed.sensitivity === 'string'
        ? { producerSensitivity: parsed.sensitivity as import('@graphorin/core').Sensitivity }
        : {}),
    };
  } catch {
    return {};
  }
}

/**
 * Resolve a `graphorin-spill:` handle to an absolute path inside `root`,
 * rejecting unsupported schemes and any path that escapes the root.
 */
function resolveHandle(root: string, uri: string): string {
  if (!uri.startsWith(SPILL_HANDLE_SCHEME)) {
    throw new Error(
      `Unsupported result handle scheme: ${JSON.stringify(uri)} (expected "${SPILL_HANDLE_SCHEME}…").`,
    );
  }
  const relative = uri.slice(SPILL_HANDLE_SCHEME.length);
  if (relative.length === 0) throw new Error('Empty result handle.');
  const resolved = path.resolve(root, ...relative.split('/'));
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    throw new Error(`Result handle escapes the artifact root: ${JSON.stringify(uri)}.`);
  }
  return resolved;
}

function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

/** Truncate `s` to at most `maxBytes` UTF-8 bytes (tolerating a split trailing char). */
function capBytes(s: string, maxBytes: number): string {
  if (Buffer.byteLength(s, 'utf8') <= maxBytes) return s;
  return Buffer.from(s, 'utf8').subarray(0, maxBytes).toString('utf8');
}
