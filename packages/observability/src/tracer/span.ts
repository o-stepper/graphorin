/**
 * Concrete `AISpan<T>` implementation. The span is intentionally
 * decoupled from `@opentelemetry/api`: the tracer materialises a
 * {@link SpanRecord} on `end()` and lets exporters do the rest.
 *
 * @packageDocumentation
 */

import type {
  AddEventOptions,
  AISpan,
  Sensitivity,
  SpanAttributes,
  SpanAttributeValue,
  SpanStatus,
  SpanType,
} from '@graphorin/core';

import type { SpanRecord } from '../exporters/types.js';

/**
 * Optional metadata accepted by `setAttribute(...)` to declare the
 * sensitivity of a single attribute. The validator uses the declared
 * tier when deciding whether to drop the attribute.
 *
 * @stable
 */
export interface SetAttributeOptions {
  readonly sensitivity?: Sensitivity;
}

/**
 * The internal span carries the convenience `setAttribute(...)` method
 * exposed by the tracer surface (per-attribute sensitivity tagging) on
 * top of the standard {@link AISpan} contract.
 *
 * @stable
 */
export interface GraphorinSpan<T extends SpanType = SpanType> extends AISpan<T> {
  setAttribute(name: string, value: SpanAttributeValue, opts?: SetAttributeOptions): void;
}

/**
 * @internal - sink invoked when a span ends.
 */
export type SpanSink = (record: SpanRecord) => void;

/**
 * @internal - parameters passed by the tracer to {@link createSpan}.
 */
export interface SpanCreateInput<T extends SpanType = SpanType> {
  readonly type: T;
  readonly name: string;
  readonly traceId: string;
  readonly id: string;
  readonly parentId?: string;
  readonly attrs?: SpanAttributes;
  readonly attrSensitivities?: Readonly<Record<string, Sensitivity>>;
  readonly sink: SpanSink;
  readonly now: () => number;
  readonly recordEvent: (name: string) => boolean;
}

/**
 * @internal
 */
export function createSpan<T extends SpanType>(input: SpanCreateInput<T>): GraphorinSpan<T> {
  const startUnixNano = Math.floor(input.now() * 1_000_000);
  const attributes: Record<string, SpanAttributeValue> = { ...(input.attrs ?? {}) };
  const sensitivities: Record<string, Sensitivity> = { ...(input.attrSensitivities ?? {}) };
  const events: SpanRecord['events'][number][] = [];
  let status: SpanStatus = 'ok';
  let statusMessage: string | undefined;
  let ended = false;

  const span: GraphorinSpan<T> = {
    type: input.type,
    id: input.id,
    traceId: input.traceId,
    ...(input.parentId === undefined ? {} : { parentId: input.parentId }),
    setAttributes(attrs: SpanAttributes): void {
      if (ended) return;
      for (const [k, v] of Object.entries(attrs)) {
        attributes[k] = v;
      }
    },
    setAttribute(name: string, value: SpanAttributeValue, opts?: SetAttributeOptions): void {
      if (ended) return;
      attributes[name] = value;
      if (opts?.sensitivity !== undefined) {
        sensitivities[name] = opts.sensitivity;
      }
    },
    addEvent(name: string, attrs?: SpanAttributes, opts?: AddEventOptions): void {
      if (ended) return;
      if (!input.recordEvent(name)) return;
      // W-094: resolve the event default + per-attribute overrides into
      // one map the validation exporter consumes. Untagged attributes
      // stay untagged - default-deny below the floor is preserved.
      const eventSensitivities: Record<string, 'public' | 'internal' | 'secret'> = {};
      if (opts?.sensitivity !== undefined) {
        for (const key of Object.keys(attrs ?? {})) {
          eventSensitivities[key] = opts.sensitivity;
        }
      }
      for (const [key, tier] of Object.entries(opts?.sensitivityByAttribute ?? {})) {
        eventSensitivities[key] = tier;
      }
      events.push({
        name,
        timeUnixNano: Math.floor(input.now() * 1_000_000),
        attributes: Object.freeze({ ...(attrs ?? {}) }) as SpanAttributes,
        ...(Object.keys(eventSensitivities).length > 0
          ? { sensitivityByAttribute: Object.freeze(eventSensitivities) }
          : {}),
      });
    },
    recordException(err: unknown): void {
      if (ended) return;
      const e = err as { name?: unknown; message?: unknown; stack?: unknown };
      const attrs: SpanAttributes = {
        'exception.type': typeof e?.name === 'string' && e.name.length > 0 ? e.name : 'Error',
        'exception.message': typeof e?.message === 'string' ? e.message : String(err),
        ...(typeof e?.stack === 'string' ? { 'exception.stacktrace': e.stack } : {}),
      };
      events.push({
        name: 'exception',
        timeUnixNano: Math.floor(input.now() * 1_000_000),
        attributes: attrs,
        // W-094: the CLASS NAME of an error is safe and load-bearing for
        // out-of-the-box error dashboards - tag it 'public'. Message +
        // stacktrace stay 'internal' (paritous with the un-sanitized
        // statusMessage; the PII patterns still apply at that floor).
        sensitivityByAttribute: Object.freeze({
          'exception.type': 'public',
          'exception.message': 'internal',
          'exception.stacktrace': 'internal',
        }),
      });
    },
    setStatus(s: SpanStatus, message?: string): void {
      if (ended) return;
      status = s;
      if (message !== undefined) statusMessage = message;
    },
    end(): void {
      if (ended) return;
      ended = true;
      const endUnixNano = Math.floor(input.now() * 1_000_000);
      const record: SpanRecord<T> = {
        type: input.type,
        id: input.id,
        traceId: input.traceId,
        ...(input.parentId === undefined ? {} : { parentId: input.parentId }),
        name: input.name,
        startUnixNano,
        endUnixNano,
        status,
        ...(statusMessage === undefined ? {} : { statusMessage }),
        attributes: Object.freeze({ ...attributes }) as SpanAttributes,
        events: Object.freeze([...events]) as SpanRecord['events'],
        ...(Object.keys(sensitivities).length === 0
          ? {}
          : {
              sensitivityByAttribute: Object.freeze({ ...sensitivities }) as Readonly<
                Record<string, SpanAttributeValue>
              >,
            }),
      };
      input.sink(record);
    },
  };

  return span;
}
