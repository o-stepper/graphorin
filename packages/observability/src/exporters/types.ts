/**
 * Shared types for the exporter surface.
 *
 * @packageDocumentation
 */

import type { SpanAttributes, SpanAttributeValue, SpanStatus, SpanType } from '@graphorin/core';

/**
 * Discriminator marker - every exporter that has been wrapped via
 * `withValidation(...)` is branded with this symbol so the tracer can
 * fail-fast at startup when a raw exporter is registered.
 *
 * @stable
 */
export const VALIDATED_EXPORTER_BRAND: unique symbol = Symbol.for(
  'graphorin.observability.exporter.validated',
);

/**
 * Sanitized, JSON-serialisable representation of a finished span. The
 * exporters never see the live OTel span; the tracer materialises this
 * record once the span ends and runs it through the validator.
 *
 * @stable
 */
export interface SpanRecord<T extends SpanType = SpanType> {
  readonly type: T;
  readonly id: string;
  readonly traceId: string;
  readonly parentId?: string;
  readonly name: string;
  readonly startUnixNano: number;
  readonly endUnixNano: number;
  readonly status: SpanStatus;
  readonly statusMessage?: string;
  readonly attributes: SpanAttributes;
  readonly events: ReadonlyArray<SpanRecordEvent>;
  /** Optional per-attribute sensitivity map - see `setAttribute({ sensitivity })`. */
  readonly sensitivityByAttribute?: Readonly<Record<string, SpanAttributeValue>>;
  /** Set when the validator dropped the span entirely (replay marker). */
  readonly droppedReason?: string;
}

/**
 * Single span event carried alongside the span record.
 *
 * @stable
 */
export interface SpanRecordEvent {
  readonly name: string;
  readonly timeUnixNano: number;
  readonly attributes: SpanAttributes;
  /**
   * W-094: per-attribute sensitivity map recorded by
   * `addEvent(name, attrs, { sensitivity, sensitivityByAttribute })`.
   * Consumed by the validation exporter; absent ⇒ every attribute is
   * untagged (default-deny below the export floor).
   */
  readonly sensitivityByAttribute?: Readonly<Record<string, 'public' | 'internal' | 'secret'>>;
}

/**
 * A trace exporter contract. Exporters consume a stream of finished
 * spans and forward them to a sink (console, file, OTLP wire, …).
 *
 * @stable
 */
export interface TraceExporter {
  readonly id: string;
  /** Forward a finished span record. Implementations should be cheap. */
  export(record: SpanRecord): Promise<void>;
  /** Flush any buffered spans. Called on `tracer.shutdown()`. */
  flush(): Promise<void>;
  /** Close any underlying resources. Idempotent. */
  shutdown(): Promise<void>;
  /**
   * Branded-marker stub. Set by `withValidation(...)` to signal that the
   * exporter has been wrapped. Direct exporters omit the brand and the
   * tracer fails fast at startup.
   *
   * @internal
   */
  readonly [VALIDATED_EXPORTER_BRAND]?: true;
}
