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
      const sanitized = sanitizeRecord(record, validator);
      // Drop the record entirely when the validator could not sanitize
      // it (tier exceeded the floor on at least one attribute).
      if (sanitized === null || sanitized.droppedReason !== undefined) return;
      await exporter.export(sanitized);
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
): SpanRecord | null {
  const sensitivities = record.sensitivityByAttribute ?? {};

  const sanitizedAttrs = sanitizeAttributes(
    record.attributes,
    sensitivities,
    validator,
    record.type,
  );
  if (sanitizedAttrs === null) {
    return {
      ...record,
      droppedReason: 'sensitivity-tier-exceeded',
    };
  }

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
): SpanAttributes | null {
  const out: Record<string, SpanAttributeValue> = {};
  for (const [key, value] of Object.entries(attrs)) {
    const tier = readTier(sensitivities[key]);
    const result = validator.validate({
      value,
      tier,
      context: spanType === undefined ? { attribute: key } : { attribute: key, spanType },
    });
    if (result === null) {
      // Tier exceeded the floor on this single attribute — drop the
      // whole record per the default-deny posture.
      return null;
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
    if (sanitizedAttrs === null) continue;
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
