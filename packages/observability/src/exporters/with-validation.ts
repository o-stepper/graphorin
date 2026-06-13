/**
 * `withValidation(exporter, opts)` — the **mandatory wrapper** applied
 * to every exporter. Forwards each span record through a
 * `RedactionValidator` first; drops + counts when a value exceeds the
 * configured tier floor or matches a secret / PII pattern.
 *
 * @packageDocumentation
 */

import type { Sensitivity, SpanAttributes, SpanAttributeValue } from '@graphorin/core';
import type {
  RedactionCounters,
  RedactionValidatorInstance,
  RedactionValidatorOptions,
} from '../redaction/types.js';
import { createRedactionValidator } from '../redaction/validator.js';

import { type SpanRecord, type TraceExporter, VALIDATED_EXPORTER_BRAND } from './types.js';

const DEFAULT_ATTR_SENSITIVITY: Sensitivity = 'internal';

/**
 * Options for {@link withValidation}.
 *
 * @stable
 */
export interface WithValidationOptions extends RedactionValidatorOptions {
  /**
   * Optional pre-built validator. When supplied, the rest of the
   * options on this object are ignored and the supplied validator is
   * reused — useful for sharing one validator across multiple exporters.
   */
  readonly validator?: RedactionValidatorInstance;
}

/**
 * Wrap an exporter so every span flows through a {@link RedactionValidator}
 * before reaching the sink. Exporters that are not wrapped are rejected
 * by the tracer at startup.
 *
 * @stable
 */
export function withValidation<E extends TraceExporter>(
  exporter: E,
  opts: WithValidationOptions = {},
): TraceExporter {
  const validator = opts.validator ?? createRedactionValidator(opts);
  const wrapped: TraceExporter = {
    id: `${exporter.id}+validated`,
    [VALIDATED_EXPORTER_BRAND]: true,
    async export(record: SpanRecord): Promise<void> {
      // RP-18: the validator strips offending attributes (counting each drop)
      // and always returns an exportable record — a single untagged or
      // over-tier attribute no longer makes the whole span vanish from every
      // exporter.
      await exporter.export(sanitizeRecord(record, validator));
    },
    flush: () => exporter.flush(),
    shutdown: () => exporter.shutdown(),
  };
  return wrapped;
}

/**
 * @internal
 */
export function sanitizeRecord(
  record: SpanRecord,
  validator: RedactionValidatorInstance,
): SpanRecord {
  const sensitivities = record.sensitivityByAttribute ?? {};
  // RP-18: attribute-granular sanitization. Offending attributes are stripped
  // (and counted by the validator); the span itself always survives so
  // framework spans carrying untagged attributes still reach every exporter.
  const sanitizedAttrs = sanitizeAttributes(
    record.attributes,
    sensitivities,
    validator,
    record.type,
  );
  const sanitizedEvents = sanitizeEvents(record.events, validator, record.type);
  return {
    ...record,
    attributes: sanitizedAttrs,
    events: sanitizedEvents,
  };
}

/**
 * @internal
 */
export function sanitizeAttributes(
  attrs: SpanAttributes,
  sensitivities: Readonly<Record<string, SpanAttributeValue>>,
  validator: RedactionValidatorInstance,
  spanType?: string,
): SpanAttributes {
  const out: Record<string, SpanAttributeValue> = {};
  for (const [key, value] of Object.entries(attrs)) {
    const tier = readTier(sensitivities[key]);
    const result = validator.validate({
      value,
      tier,
      context: spanType === undefined ? { attribute: key } : { attribute: key, spanType },
    });
    if (result === null) {
      // RP-18: this single attribute exceeded the floor (or matched a secret
      // pattern). Strip it — the validator has already counted the drop — and
      // keep the rest of the span rather than discarding the whole record.
      continue;
    }
    out[key] = result.value as SpanAttributeValue;
  }
  return Object.freeze(out) as SpanAttributes;
}

/**
 * @internal
 */
export function sanitizeEvents(
  events: SpanRecord['events'],
  validator: RedactionValidatorInstance,
  spanType?: string,
): SpanRecord['events'] {
  const out: SpanRecord['events'][number][] = [];
  for (const event of events) {
    const sanitizedAttrs = sanitizeAttributes(event.attributes, {}, validator, spanType);
    out.push({ name: event.name, timeUnixNano: event.timeUnixNano, attributes: sanitizedAttrs });
  }
  return out;
}

function readTier(value: SpanAttributeValue | undefined): Sensitivity {
  if (value === 'public' || value === 'internal' || value === 'secret') return value;
  return DEFAULT_ATTR_SENSITIVITY;
}

/**
 * Quickly check whether an exporter is the result of a previous
 * {@link withValidation} call. The tracer uses this to fail fast at
 * startup.
 *
 * @stable
 */
export function isValidatedExporter(exporter: TraceExporter): boolean {
  return exporter[VALIDATED_EXPORTER_BRAND] === true;
}

/**
 * Pull the counters out of any exporter wrapped by {@link withValidation}.
 * Returns `null` for exporters that were never wrapped.
 *
 * @stable
 */
export function tryGetValidatorCounters(validator: RedactionValidatorInstance): RedactionCounters {
  return validator.counters();
}
