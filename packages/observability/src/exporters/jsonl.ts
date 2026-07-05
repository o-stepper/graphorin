/**
 * `JSONLExporter` - append-only newline-delimited JSON output. Used as
 * the default trace replay log; encryption-at-rest is opt-in via the
 * encryption hook (Phase 16).
 *
 * The exporter:
 * - creates the target directory with mode `0700`,
 * - opens the per-session file with mode `0600`,
 * - rotates per UTC month + per session id (`YYYY-MM/<sessionId>.jsonl`),
 * - flushes every write (no internal buffer) so the file is suitable
 *   for tail-style replay even after a crash.
 *
 * The output is deterministic - see {@link serializableRecord}.
 *
 * @packageDocumentation
 */

import { mkdir, open } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { serializableRecord } from './console.js';
import type { SpanRecord, TraceExporter } from './types.js';

/** @internal - used by tests to override the date provider. */
export type DateProvider = () => Date;

/**
 * Configuration shape for {@link createJSONLExporter}.
 *
 * @stable
 */
export interface JSONLExporterOptions {
  /** Identifier reported via `exporter.id`. Defaults to `'jsonl'`. */
  readonly id?: string;
  /** Root directory for the trace files. Created if missing. */
  readonly path: string;
  /**
   * Resolver that picks the file path for a given span record. Defaults
   * to `<rootPath>/<YYYY-MM>/<sessionId>.jsonl` keyed off the
   * `graphorin.session.id` attribute (or `unsessioned.jsonl` when
   * absent).
   */
  readonly resolveFilePath?: (record: SpanRecord, root: string) => string;
  /**
   * Override the date used when picking the rotation directory. Defaults
   * to `() => new Date()`.
   *
   * @internal
   */
  readonly now?: DateProvider;
  /**
   * Upper bound on simultaneously-open file handles (RP-20). The pool keys
   * by `(session, UTC-month)`, so a long-living server would otherwise hold
   * one fd per pair forever; the least-recently-used handle is closed once
   * the cap is reached. Defaults to `64`.
   */
  readonly maxOpenHandles?: number;
}

/**
 * A JSONL exporter, plus an introspection seam for the bounded handle pool.
 *
 * @stable
 */
export interface JSONLExporter extends TraceExporter {
  /** Number of file handles currently open in the pool (RP-20). */
  openHandleCount(): number;
}

/**
 * Build a JSONL trace exporter. Call `withValidation(exporter)` before
 * passing the result to `createTracer({ exporters })`.
 *
 * @stable
 */
export function createJSONLExporter(opts: JSONLExporterOptions): JSONLExporter {
  const id = opts.id ?? 'jsonl';
  const root = opts.path;
  const now = opts.now ?? (() => new Date());
  const resolveFilePath = opts.resolveFilePath ?? defaultPathResolver(now);
  const maxOpenHandles = Math.max(1, opts.maxOpenHandles ?? 64);

  // Pool of file handles, keyed by absolute path. Each handle is opened
  // in append mode the first time we touch the path; subsequent exports
  // re-use the existing handle. The pool is LRU-bounded (RP-20) - the Map's
  // insertion order is the recency order, so the first entry is the LRU.
  const handles = new Map<string, FileHandleEntry>();
  let closed = false;

  return {
    id,
    async export(record: SpanRecord): Promise<void> {
      if (closed) return;
      const filePath = resolveFilePath(record, root);
      const entry = await openOrReuse(handles, filePath, maxOpenHandles);
      const line = `${JSON.stringify(serializableRecord(record))}\n`;
      await entry.handle.write(line, null, 'utf8');
    },
    async flush(): Promise<void> {
      for (const entry of handles.values()) {
        await entry.handle.datasync();
      }
    },
    async shutdown(): Promise<void> {
      closed = true;
      for (const entry of handles.values()) {
        await entry.handle.close();
      }
      handles.clear();
    },
    openHandleCount(): number {
      return handles.size;
    },
  };
}

interface FileHandleEntry {
  readonly handle: import('node:fs/promises').FileHandle;
}

async function openOrReuse(
  pool: Map<string, FileHandleEntry>,
  filePath: string,
  maxOpenHandles: number,
): Promise<FileHandleEntry> {
  const cached = pool.get(filePath);
  if (cached !== undefined) {
    // Mark most-recently-used by re-inserting at the tail of the Map.
    pool.delete(filePath);
    pool.set(filePath, cached);
    return cached;
  }

  // RP-20: evict least-recently-used handles before exceeding the cap so the
  // open-fd count stays bounded. An evicted path simply re-opens (append mode)
  // on its next export - no data is lost.
  while (pool.size >= maxOpenHandles) {
    const lruKey = pool.keys().next().value;
    if (lruKey === undefined) break;
    const lru = pool.get(lruKey);
    pool.delete(lruKey);
    if (lru !== undefined) {
      try {
        await lru.handle.close();
      } catch {
        // Best-effort - a failed close must not block the new open.
      }
    }
  }

  await mkdir(dirname(filePath), { recursive: true, mode: 0o700 });
  const handle = await open(filePath, 'a', 0o600);
  const entry: FileHandleEntry = { handle };
  pool.set(filePath, entry);
  return entry;
}

function defaultPathResolver(now: DateProvider) {
  return (record: SpanRecord, root: string): string => {
    const sessionAttr = record.attributes['graphorin.session.id'];
    const sessionId = typeof sessionAttr === 'string' ? sessionAttr : 'unsessioned';
    const date = now();
    const yyyy = String(date.getUTCFullYear());
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const safeSession = sessionId.replace(/[^A-Za-z0-9._-]/g, '_');
    return join(root, `${yyyy}-${mm}`, `${safeSession}.jsonl`);
  };
}
