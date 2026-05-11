/**
 * `ConsoleExporter` — pretty-prints finished spans to `console.log`.
 *
 * Useful for development and unit testing. Production deployments
 * should use {@link JSONLExporter} (for replay) or
 * {@link OTLPHttpExporter} (for remote OTLP collectors).
 *
 * @packageDocumentation
 */

import type { SpanRecord, TraceExporter } from './types.js';

/**
 * Configuration shape for {@link createConsoleExporter}.
 *
 * @stable
 */
export interface ConsoleExporterOptions {
  /** Identifier reported via `exporter.id`. Defaults to `'console'`. */
  readonly id?: string;
  /** When `true`, emit JSON pretty-printed across multiple lines. */
  readonly pretty?: boolean;
  /** Custom sink. Defaults to `console.log`. */
  readonly sink?: (line: string) => void;
}

/**
 * Build a console-based trace exporter. Call `withValidation(exporter)`
 * before passing the result to `createTracer({ exporters })`.
 *
 * @stable
 */
export function createConsoleExporter(opts: ConsoleExporterOptions = {}): TraceExporter {
  const id = opts.id ?? 'console';
  const pretty = opts.pretty === true;
  const sink = opts.sink ?? ((line: string) => console.log(line));

  let closed = false;
  return {
    id,
    async export(record: SpanRecord): Promise<void> {
      if (closed) return;
      const payload = pretty
        ? JSON.stringify(serializableRecord(record), null, 2)
        : JSON.stringify(serializableRecord(record));
      sink(payload);
    },
    async flush(): Promise<void> {
      // Console.log is synchronous on Node; nothing to flush.
    },
    async shutdown(): Promise<void> {
      closed = true;
    },
  };
}

/**
 * @internal
 */
export function serializableRecord(record: SpanRecord): Record<string, unknown> {
  return {
    type: record.type,
    id: record.id,
    traceId: record.traceId,
    ...(record.parentId === undefined ? {} : { parentId: record.parentId }),
    name: record.name,
    startUnixNano: record.startUnixNano,
    endUnixNano: record.endUnixNano,
    status: record.status,
    ...(record.statusMessage === undefined ? {} : { statusMessage: record.statusMessage }),
    attributes: record.attributes,
    events: record.events,
    ...(record.droppedReason === undefined ? {} : { droppedReason: record.droppedReason }),
  };
}
