/**
 * RP-17: durable span persistence on top of the `spans` table (migration 024).
 *
 * - {@link createSqliteSpanExporter} is a `@graphorin/observability`
 *   `TraceExporter` that writes finished spans into SQLite. Wrap it in
 *   `withValidation(...)` (like every exporter) before handing it to
 *   `createTracer({ exporters })`.
 * - {@link traceSourceForSession} reads a session's spans back as an ordered
 *   `AsyncIterable<SpanRecord>` - exactly the `traceSource` shape
 *   `Session.replay()` and the `graphorin memory why` CLI consume.
 *
 * The import of `SpanRecord` / `TraceExporter` is type-only; `@graphorin/core`
 * already underpins both packages, so there is no runtime coupling and no
 * dependency cycle (observability does not depend on store-sqlite).
 *
 * @packageDocumentation
 */

import type { SpanRecord, TraceExporter } from '@graphorin/observability';
import type { SqliteConnection } from './connection.js';

/** The span attribute the exporter keys session-scoped rows off. */
export const SPAN_SESSION_ATTRIBUTE = 'graphorin.session.id';

interface SpanRow {
  readonly span_id: string;
  readonly trace_id: string;
  readonly parent_id: string | null;
  readonly type: string;
  readonly name: string;
  readonly start_unix_nano: number;
  readonly end_unix_nano: number;
  readonly status: string;
  readonly status_message: string | null;
  readonly attributes_json: string;
  readonly events_json: string;
  readonly sensitivity_json: string | null;
  readonly session_id: string | null;
}

const INSERT_SQL = `INSERT OR REPLACE INTO spans (
  span_id, trace_id, parent_id, type, name, start_unix_nano, end_unix_nano,
  status, status_message, attributes_json, events_json, sensitivity_json, session_id
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

/**
 * Build a `TraceExporter` that persists finished spans into the `spans` table.
 * Each row records the `graphorin.session.id` attribute (when present) so a
 * session's spans can be read back in order.
 *
 * @stable
 */
export function createSqliteSpanExporter(
  conn: SqliteConnection,
  options: { readonly id?: string } = {},
): TraceExporter {
  const id = options.id ?? 'sqlite-spans';
  let closed = false;
  return {
    id,
    async export(record: SpanRecord): Promise<void> {
      if (closed) return;
      const sessionAttr = record.attributes[SPAN_SESSION_ATTRIBUTE];
      const sessionId = typeof sessionAttr === 'string' ? sessionAttr : null;
      conn.run(INSERT_SQL, [
        record.id,
        record.traceId,
        record.parentId ?? null,
        record.type,
        record.name,
        record.startUnixNano,
        record.endUnixNano,
        record.status,
        record.statusMessage ?? null,
        JSON.stringify(record.attributes),
        JSON.stringify(record.events),
        record.sensitivityByAttribute !== undefined
          ? JSON.stringify(record.sensitivityByAttribute)
          : null,
        sessionId,
      ]);
    },
    async flush(): Promise<void> {
      // Writes are synchronous + autocommitted; nothing to flush.
    },
    async shutdown(): Promise<void> {
      closed = true;
    },
  };
}

/**
 * Read a session's persisted spans back as an ordered
 * `AsyncIterable<SpanRecord>` - the `traceSource` shape `Session.replay()` and
 * the `graphorin memory why` CLI consume. Spans are ordered by start time
 * (then span id) so replay reproduces the original run order.
 *
 * @stable
 */
export async function* traceSourceForSession(
  conn: SqliteConnection,
  sessionId: string,
): AsyncIterable<SpanRecord> {
  const rows = conn
    .prepare(`SELECT * FROM spans WHERE session_id = ? ORDER BY start_unix_nano ASC, span_id ASC`)
    .all(sessionId) as SpanRow[];
  for (const row of rows) {
    yield rowToSpanRecord(row);
  }
}

function rowToSpanRecord(row: SpanRow): SpanRecord {
  const record: Record<string, unknown> = {
    type: row.type,
    id: row.span_id,
    traceId: row.trace_id,
    name: row.name,
    startUnixNano: row.start_unix_nano,
    endUnixNano: row.end_unix_nano,
    status: row.status,
    attributes: JSON.parse(row.attributes_json),
    events: JSON.parse(row.events_json),
  };
  if (row.parent_id !== null) record.parentId = row.parent_id;
  if (row.status_message !== null) record.statusMessage = row.status_message;
  if (row.sensitivity_json !== null) {
    record.sensitivityByAttribute = JSON.parse(row.sensitivity_json);
  }
  return Object.freeze(record) as unknown as SpanRecord;
}
