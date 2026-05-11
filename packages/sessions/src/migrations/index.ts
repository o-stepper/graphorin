/**
 * Migration registry for the JSONL session-export schema. v0.1 ships
 * MAJOR `1` only; the registry exists so future MAJOR bumps can plug
 * a migrator in without forking this package.
 *
 * Each migrator is a pure function that takes the parsed records of a
 * MAJOR `N` file and returns the parsed records as MAJOR `N+1`. The
 * runtime CLI (`graphorin migrate-export <input> --to-schema 2.0`)
 * walks the chain.
 *
 * @packageDocumentation
 */

import type { SessionExportParsedRecord, SessionExportRecord } from '../export/types.js';

/**
 * Migrator entry. Both sides of the version pair are
 * `'MAJOR.MINOR'` strings.
 *
 * @stable
 */
export interface ExportMigrator {
  readonly fromVersion: string;
  readonly toVersion: string;
  readonly description?: string;
  migrate(records: ReadonlyArray<SessionExportParsedRecord>): ReadonlyArray<SessionExportRecord>;
}

const REGISTRY: ExportMigrator[] = [];

/**
 * Register a migrator. Idempotent on the `(fromVersion, toVersion)`
 * pair — re-registering replaces the prior entry.
 *
 * @stable
 */
export function registerExportMigrator(migrator: ExportMigrator): void {
  const idx = REGISTRY.findIndex(
    (m) => m.fromVersion === migrator.fromVersion && m.toVersion === migrator.toVersion,
  );
  if (idx >= 0) REGISTRY[idx] = migrator;
  else REGISTRY.push(migrator);
}

/**
 * Snapshot of the registry. Sorted by `fromVersion`.
 *
 * @stable
 */
export function listExportMigrators(): ReadonlyArray<ExportMigrator> {
  return [...REGISTRY].sort((a, b) => a.fromVersion.localeCompare(b.fromVersion));
}

/**
 * Walk the registered migrators to advance `records` from
 * `fromVersion` to `toVersion`. Throws when no chain exists.
 *
 * @stable
 */
export function migrateExport(
  records: ReadonlyArray<SessionExportParsedRecord>,
  fromVersion: string,
  toVersion: string,
): ReadonlyArray<SessionExportRecord> {
  if (fromVersion === toVersion) return records.filter(filterKnown);
  let current: ReadonlyArray<SessionExportParsedRecord> = records;
  let cursor = fromVersion;
  const visited = new Set<string>([cursor]);
  while (cursor !== toVersion) {
    const next = REGISTRY.find((m) => m.fromVersion === cursor);
    if (next === undefined) {
      throw new Error(
        `[graphorin/sessions] no migrator registered to advance from schema ${cursor}.`,
      );
    }
    if (visited.has(next.toVersion)) {
      throw new Error(`[graphorin/sessions] migrator chain cycle detected at ${next.toVersion}.`);
    }
    visited.add(next.toVersion);
    current = next.migrate(current);
    cursor = next.toVersion;
  }
  return current.filter(filterKnown);
}

function filterKnown(record: SessionExportParsedRecord): record is SessionExportRecord {
  return record.kind !== 'unknown';
}

/**
 * Reset the registry. Test-only.
 *
 * @internal
 */
export function _resetExportMigratorsForTesting(): void {
  REGISTRY.length = 0;
}
