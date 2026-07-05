/**
 * `exportAudit(...)` - stream stored audit entries as JSONL.
 *
 * The function never loads the entire chain into memory; it writes
 * one canonical-JSON line per entry into the supplied writer.
 *
 * The exported `hash`/`prevHash` of an entry are only stable until the
 * next `pruneAudit(...)`: pruning reroots the surviving suffix and
 * recomputes every surviving entry's hash, so hashes archived from an
 * export taken before a prune will no longer match the live chain.
 * Anchor exports to an external timestamp/signature if you need them to
 * stay verifiable across a prune.
 *
 * @packageDocumentation
 */

import type { AuditDb } from './audit-db.js';
import { canonicalJson } from './canonical-json.js';
import type { StoredAuditEntry } from './types.js';

/**
 * Minimal writer abstraction. The framework deliberately does not
 * depend on Node's `stream` module here so consumers can pipe the
 * output to any sink (file, HTTP response, in-memory buffer).
 *
 * @stable
 */
export interface AuditExportWriter {
  readonly write: (line: string) => void | Promise<void>;
}

/**
 * Options for `exportAudit(...)`.
 *
 * @stable
 */
export interface ExportAuditOptions {
  readonly fromSeq?: number;
  readonly toSeq?: number;
  readonly writer: AuditExportWriter;
  /** Predicate to filter individual entries. */
  readonly include?: (entry: StoredAuditEntry) => boolean;
}

/**
 * Stream every entry in `[fromSeq, toSeq]` (inclusive) into `writer`
 * as JSONL. Each line is canonical JSON terminated by `\n`.
 *
 * Returns the number of lines written.
 *
 * @stable
 */
export async function exportAudit(
  db: AuditDb,
  options: ExportAuditOptions,
): Promise<{ readonly rows: number }> {
  let rows = 0;
  const bounds: { fromSeq?: number; toSeq?: number } = {};
  if (options.fromSeq !== undefined) bounds.fromSeq = options.fromSeq;
  if (options.toSeq !== undefined) bounds.toSeq = options.toSeq;
  for await (const entry of db.iterate(bounds)) {
    if (options.include !== undefined && !options.include(entry)) continue;
    await options.writer.write(`${canonicalJson(entry)}\n`);
    rows += 1;
  }
  return Object.freeze({ rows });
}
