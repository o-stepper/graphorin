/**
 * `OTLPHttpExporter` — reference implementation that POSTs span
 * records to an OpenTelemetry HTTP endpoint.
 *
 * The exporter is deliberately minimal: production hardening (retry
 * logic, batching policy tuning, gzip compression, bearer-token auth
 * rotation) is left to operators. The wire format follows the OTLP
 * `traces` resource shape and is compatible with collectors that accept
 * the `application/json` content type.
 *
 * Operators wanting the upstream OpenTelemetry SDK exporter
 * (`@opentelemetry/exporter-trace-otlp-http`) can adapt
 * {@link toOtlpEnvelope} into their own wrapper — the helper is
 * exported so the OTel adapter does not need to duplicate the wire
 * shape.
 *
 * @packageDocumentation
 */

import type { SpanAttributes, SpanAttributeValue, SpanType } from '@graphorin/core';

import type { SpanRecord, SpanRecordEvent, TraceExporter } from './types.js';

/**
 * Configuration shape for {@link createOTLPHttpExporter}.
 *
 * @stable
 */
export interface OTLPHttpExporterOptions {
  /** Identifier reported via `exporter.id`. Defaults to `'otlp-http'`. */
  readonly id?: string;
  /** OTLP collector URL (e.g. `http://localhost:4318/v1/traces`). */
  readonly url: string;
  /** Optional headers (auth, tenant id, …). Avoid passing secrets in plain. */
  readonly headers?: Readonly<Record<string, string>>;
  /** Service name embedded in the OTLP `Resource`. */
  readonly serviceName?: string;
  /** Optional `fetch` override — useful for testing without the network. */
  readonly fetchImpl?: typeof fetch;
  /** Optional timeout (ms). Defaults to 10000. */
  readonly timeoutMs?: number;
}

/**
 * Build a minimal OTLP-over-HTTP trace exporter. Call
 * `withValidation(exporter)` before passing the result to
 * `createTracer({ exporters })`.
 *
 * The implementation issues one `POST` per finished span — no
 * batching. Operators wanting batching should wrap this exporter
 * with their own queue or use a sidecar collector.
 *
 * @stable
 */
export function createOTLPHttpExporter(opts: OTLPHttpExporterOptions): TraceExporter {
  const id = opts.id ?? 'otlp-http';
  const url = opts.url;
  const headers = opts.headers ?? {};
  const serviceName = opts.serviceName ?? 'graphorin';
  const fetchImpl = opts.fetchImpl ?? globalThis.fetch;
  const timeoutMs = opts.timeoutMs ?? 10_000;
  let closed = false;

  if (typeof fetchImpl !== 'function') {
    throw new TypeError(
      'createOTLPHttpExporter: no fetch implementation available. Provide ' +
        '`fetchImpl` explicitly or run on a Node.js version with global fetch ' +
        '(>= 18).',
    );
  }

  return {
    id,
    async export(record: SpanRecord): Promise<void> {
      if (closed) return;
      const body = toOtlpEnvelope(record, serviceName);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetchImpl(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json', ...headers },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error(`OTLP exporter received HTTP ${res.status} ${res.statusText}`);
        }
      } finally {
        clearTimeout(timer);
      }
    },
    async flush(): Promise<void> {
      // No internal queue; each export() awaits the POST already.
    },
    async shutdown(): Promise<void> {
      closed = true;
    },
  };
}

/**
 * @internal — exposed for unit tests
 */
export function toOtlpEnvelope(record: SpanRecord, serviceName: string): unknown {
  const otelStatus = record.status === 'ok' ? 1 : record.status === 'error' ? 2 : 0;
  return {
    resourceSpans: [
      {
        resource: {
          attributes: [
            { key: 'service.name', value: { stringValue: serviceName } },
            { key: 'graphorin.framework.version', value: { stringValue: '0.4.0' } },
          ],
        },
        scopeSpans: [
          {
            scope: { name: '@graphorin/observability', version: '0.4.0' },
            spans: [
              {
                traceId: record.traceId,
                spanId: record.id,
                ...(record.parentId === undefined ? {} : { parentSpanId: record.parentId }),
                name: record.name,
                kind: spanKindFor(record.type),
                startTimeUnixNano: String(record.startUnixNano),
                endTimeUnixNano: String(record.endUnixNano),
                attributes: toOtlpAttributes(record.attributes),
                events: record.events.map(toOtlpEvent),
                status: {
                  code: otelStatus,
                  ...(record.statusMessage === undefined ? {} : { message: record.statusMessage }),
                },
              },
            ],
          },
        ],
      },
    ],
  };
}

function spanKindFor(type: SpanType): number {
  // OTel SpanKind enum: 0 unspecified, 1 internal, 2 server, 3 client, 4 producer, 5 consumer.
  if (type === 'provider.generate' || type === 'provider.stream' || type === 'mcp.call') return 3;
  if (type === 'tool.execute' || type === 'memory.embed') return 1;
  return 1;
}

function toOtlpAttributes(attrs: SpanAttributes): unknown[] {
  return Object.entries(attrs).map(([k, v]) => ({ key: k, value: toOtlpAttributeValue(v) }));
}

function toOtlpEvent(event: SpanRecordEvent): unknown {
  return {
    timeUnixNano: String(event.timeUnixNano),
    name: event.name,
    attributes: toOtlpAttributes(event.attributes),
  };
}

function toOtlpAttributeValue(v: SpanAttributeValue): unknown {
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'number') {
    return Number.isInteger(v) ? { intValue: String(v) } : { doubleValue: v };
  }
  if (typeof v === 'boolean') return { boolValue: v };
  if (v === null) return { stringValue: '' };
  if (Array.isArray(v)) {
    return {
      arrayValue: {
        values: v.map((item) => toOtlpAttributeValue(item as SpanAttributeValue)),
      },
    };
  }
  return { stringValue: String(v) };
}
