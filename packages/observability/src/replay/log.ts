/**
 * `getTraceLog(...)` / `pruneTraces(...)` — minimal helpers for reading
 * back the JSONL files produced by {@link createJSONLExporter} and
 * pruning old files based on retention policy.
 *
 * @packageDocumentation
 */

import { readdir, readFile, stat, unlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import type { SpanRecord } from '../exporters/types.js';

/**
 * Read every span record from a JSONL trace log. Lines that fail to
 * parse are emitted as `null` events; callers can `filter(Boolean)` to
 * skip them.
 *
 * @stable
 */
export async function* getTraceLog(filePath: string): AsyncIterable<SpanRecord> {
  const data = await readFile(filePath, 'utf8');
  for (const line of data.split('\n')) {
    if (line.trim() === '') continue;
    try {
      const parsed = JSON.parse(line) as SpanRecord;
      yield parsed;
    } catch {
      // Skip malformed lines — replay must keep going.
    }
  }
}

/**
 * Configuration shape for {@link pruneTraces}.
 *
 * @stable
 */
export interface PruneTracesOptions {
  /** Root directory housing the JSONL files. */
  readonly root: string;
  /** Files older than `olderThanDays` are deleted. `0` keeps every file. */
  readonly olderThanDays: number;
  /**
   * Wall clock used to compute the threshold. Defaults to `Date.now`.
   *
   * @internal
   */
  readonly now?: () => number;
}

/**
 * Remove every JSONL file that is older than the configured retention
 * window. Returns the deleted files for caller-side accounting.
 *
 * @stable
 */
export async function pruneTraces(opts: PruneTracesOptions): Promise<ReadonlyArray<string>> {
  if (opts.olderThanDays <= 0) return [];

  const now = opts.now ?? (() => Date.now());
  const threshold = now() - opts.olderThanDays * 24 * 60 * 60 * 1000;
  const root = resolve(opts.root);
  const removed: string[] = [];

  for await (const filePath of walkJsonl(root)) {
    const info = await stat(filePath);
    if (info.mtimeMs < threshold) {
      await unlink(filePath);
      removed.push(filePath);
    }
  }

  return removed;
}

async function* walkJsonl(root: string): AsyncIterable<string> {
  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(root, entry.name);
    if (entry.isDirectory()) {
      yield* walkJsonl(full);
      continue;
    }
    if (entry.isFile() && full.endsWith('.jsonl')) {
      yield full;
    }
  }
}
