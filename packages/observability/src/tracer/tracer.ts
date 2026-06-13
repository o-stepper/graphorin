/**
 * `createTracer(...)` — the public entry point for the observability
 * tracer. Wires together the {@link Sampler}, the
 * {@link RedactionValidator}, and the registered {@link TraceExporter}s.
 *
 * @packageDocumentation
 */

import type {
  AISpan,
  Sensitivity,
  SpanAttributeValue,
  SpanType,
  StartSpanOptions,
  Tracer,
} from '@graphorin/core';

import { createConsoleExporter } from '../exporters/console.js';
import type { SpanRecord, TraceExporter } from '../exporters/types.js';
import { isValidatedExporter, withValidation } from '../exporters/with-validation.js';
import { UnvalidatedExporterError } from '../redaction/errors.js';
import type { RedactionValidatorInstance, RedactionValidatorOptions } from '../redaction/types.js';
import { createRedactionValidator } from '../redaction/validator.js';

import { newSpanId, newTraceId } from './ids.js';
import { createSampler, type SamplingOptions } from './sampling.js';
import { createSpan, type GraphorinSpan } from './span.js';
import { spanNameFor } from './span-names.js';

/**
 * Configuration shape consumed by {@link createTracer}.
 *
 * @stable
 */
export interface TracerOptions {
  /** Logical service name. Embedded in the OTLP `Resource`. */
  readonly serviceName?: string;
  /**
   * Configured exporters. Each exporter MUST be wrapped via
   * `withValidation(...)` before reaching the tracer — pass them
   * through unwrapped to use the tracer-managed validator (set by
   * `validation`) or pass already-wrapped exporters when you want
   * per-exporter policies.
   */
  readonly exporters: ReadonlyArray<TraceExporter>;
  /**
   * Tracer-managed validator policy.
   *
   * - `RedactionValidatorOptions` (default): the tracer auto-wraps any
   *   un-wrapped exporter with `withValidation(...)` using these
   *   options.
   * - `'off'`: NOT recommended. Skips auto-wrap, and the tracer logs a
   *   startup WARN to the supplied {@link warnSink}. Pre-wrapped
   *   exporters still flow through their validators.
   *
   * @default `{ minTier: 'public', failOnUnredactedSensitive: false }`
   */
  readonly validation?: RedactionValidatorOptions | 'off';
  /** Sampler configuration. */
  readonly sampling?: SamplingOptions;
  /**
   * Default sensitivity for attributes that omit `setAttribute(_, _, { sensitivity })`.
   * Defaults to `'internal'` per the default-deny non-public posture.
   */
  readonly defaultAttributeSensitivity?: Sensitivity;
  /**
   * Sink used for startup WARNings. Defaults to `console.warn`.
   *
   * @internal
   */
  readonly warnSink?: (line: string) => void;
  /**
   * Override the wall clock used for span timestamps. Returns
   * milliseconds-since-epoch as a `number`. Default: `Date.now`.
   *
   * @internal
   */
  readonly now?: () => number;
}

/**
 * The {@link createTracer} return value extends the standard
 * {@link Tracer} contract from `@graphorin/core` with introspection
 * helpers (counter snapshots, validator handle).
 *
 * @stable
 */
export interface GraphorinTracer extends Tracer {
  /** Service name embedded in the OTLP resource. */
  readonly serviceName: string;
  /**
   * Snapshot of the redaction counters (`droppedTotal`,
   * `droppedByReason`, `matchesByPattern`) maintained by the
   * tracer-managed validator.
   */
  getMetrics(): import('../redaction/types.js').RedactionCounters;
  /** The tracer-managed validator. `null` when `validation: 'off'`. */
  readonly validator: RedactionValidatorInstance | null;
  /** Force-flush every registered exporter. */
  flush(): Promise<void>;
}

const DEFAULT_VALIDATION: RedactionValidatorOptions = Object.freeze({
  minTier: 'public',
  failOnUnredactedSensitive: false,
});

/**
 * Build a {@link GraphorinTracer} from the supplied options. Every
 * exporter passed in must already be wrapped via
 * `withValidation(...)` OR `validation` must be set to a concrete
 * options object so the tracer can auto-wrap on your behalf.
 * Registering a raw exporter while `validation: 'off'` triggers an
 * {@link UnvalidatedExporterError} at startup.
 *
 * @stable
 */
export function createTracer(opts: TracerOptions): GraphorinTracer {
  const serviceName = opts.serviceName ?? 'graphorin';
  const sampler = createSampler(opts.sampling ?? {});
  const warnSink = opts.warnSink ?? ((line: string) => console.warn(line));
  const now = opts.now ?? (() => Date.now());
  const defaultAttrSensitivity: Sensitivity = opts.defaultAttributeSensitivity ?? 'internal';

  const validationMode = opts.validation ?? DEFAULT_VALIDATION;

  let validator: RedactionValidatorInstance | null = null;
  let exporters: TraceExporter[] = [];

  if (validationMode === 'off') {
    warnSink(
      "[graphorin/observability] WARN: validation: 'off' — exporters are NOT " +
        'auto-wrapped. Every exporter must call withValidation(...) explicitly. ' +
        'See ADR-035: OTLP RedactionValidator + default-deny non-public.',
    );
    for (const exporter of opts.exporters) {
      if (!isValidatedExporter(exporter)) {
        throw new UnvalidatedExporterError(exporter.id);
      }
      exporters.push(exporter);
    }
  } else {
    validator = createRedactionValidator(validationMode);
    for (const exporter of opts.exporters) {
      exporters.push(
        isValidatedExporter(exporter) ? exporter : withValidation(exporter, { validator }),
      );
    }
  }

  if (exporters.length === 0) {
    // The tracer is still useful (it emits records to /dev/null) but
    // we want to surface that explicitly so consumers don't think the
    // logger is broken.
    const fallback = withValidation(createConsoleExporter({ id: 'console-fallback' }), {
      validator: validator ?? createRedactionValidator(DEFAULT_VALIDATION),
    });
    warnSink(
      '[graphorin/observability] WARN: createTracer() received zero exporters. ' +
        'Falling back to a sanitized ConsoleExporter so spans are not lost.',
    );
    exporters = [fallback];
  }

  // RP-20: sink() exports are fire-and-forget; hold each promise so flush()
  // can await it. Without this a span emitted moments before shutdown is lost
  // when the exporter's closed-guard trips before its export() resolves.
  const inFlight = new Set<Promise<void>>();

  function sink(record: SpanRecord): void {
    for (const exporter of exporters) {
      const p = Promise.resolve()
        .then(() => exporter.export(record))
        .catch((err: unknown) => {
          warnSink(
            `[graphorin/observability] WARN: exporter ${exporter.id} failed: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
        });
      inFlight.add(p);
      void p.finally(() => {
        inFlight.delete(p);
      });
    }
  }

  function startSpan<T extends SpanType>(spec: StartSpanOptions<T>): AISpan<T> {
    const traceId = spec.parent?.traceId ?? newTraceId();
    const id = newSpanId();
    const parentId = spec.parent?.id;
    // RP-19: a real parent-sampled flag for `'parent-based'` sampling. An
    // unsampled parent is a noop span (no `setAttribute`), so `asGraphorinSpan`
    // returns null — `parentId !== undefined` used to treat that as
    // parent-sampled and record the child as an orphan.
    const parentSampled =
      spec.parent === undefined ? undefined : asGraphorinSpan(spec.parent) !== null;
    const sampled = sampler.shouldSample(spec.type, parentSampled);
    if (!sampled) {
      return noopSpan<T>(spec.type, traceId, id, parentId);
    }
    const sensitivities = readAttrSensitivities(spec.attrs);
    return createSpan<T>({
      type: spec.type,
      name: spanNameFor(spec.type),
      traceId,
      id,
      ...(parentId === undefined ? {} : { parentId }),
      ...(spec.attrs === undefined ? {} : { attrs: spec.attrs }),
      ...(sensitivities === undefined ? {} : { attrSensitivities: sensitivities }),
      sink,
      now,
      recordEvent: (name) => sampler.shouldRecordEvent(name),
    }) as unknown as AISpan<T>;
  }

  async function span<T extends SpanType, R>(
    spec: StartSpanOptions<T>,
    fn: (s: AISpan<T>) => R | Promise<R>,
  ): Promise<R> {
    const s = startSpan(spec);
    try {
      const out = await fn(s);
      s.setStatus('ok');
      return out;
    } catch (err) {
      s.recordException(err);
      s.setStatus('error', err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      s.end();
    }
  }

  async function flush(): Promise<void> {
    // RP-20: drain in-flight fire-and-forget exports first, then flush.
    while (inFlight.size > 0) {
      await Promise.all([...inFlight]);
    }
    await Promise.all(exporters.map((e) => e.flush()));
  }

  async function shutdown(): Promise<void> {
    await flush();
    await Promise.all(exporters.map((e) => e.shutdown()));
  }

  return {
    startSpan,
    span,
    flush,
    shutdown,
    serviceName,
    getMetrics: () =>
      validator?.counters() ?? {
        droppedTotal: 0,
        droppedByReason: Object.freeze({}),
        matchesByPattern: Object.freeze({}),
      },
    validator,
  };

  function readAttrSensitivities(
    attrs: undefined | Readonly<Record<string, SpanAttributeValue>>,
  ): Readonly<Record<string, Sensitivity>> | undefined {
    if (attrs === undefined) return undefined;
    // RP-19: initial attrs that omit an explicit `setAttribute(_, _, {
    // sensitivity })` default to `defaultAttributeSensitivity`. Threading it
    // here makes the knob effective — untagged framework attributes carry the
    // configured tier instead of the validator's hardcoded fallback.
    const out: Record<string, Sensitivity> = {};
    for (const key of Object.keys(attrs)) out[key] = defaultAttrSensitivity;
    return Object.freeze(out);
  }

  function noopSpan<T extends SpanType>(
    type: T,
    traceId: string,
    id: string,
    parentId?: string,
  ): AISpan<T> {
    const stub: AISpan<T> = {
      type,
      id,
      traceId,
      ...(parentId === undefined ? {} : { parentId }),
      setAttributes() {},
      addEvent() {},
      recordException() {},
      setStatus() {},
      end() {},
    };
    return stub;
  }
}

/**
 * Returns the underlying {@link GraphorinSpan} when `span` is a Graphorin
 * span. Useful when callers want to reach the per-attribute sensitivity
 * helper from a generic `AISpan<T>`.
 *
 * @stable
 */
export function asGraphorinSpan<T extends SpanType>(span: AISpan<T>): GraphorinSpan<T> | null {
  if (typeof (span as Partial<GraphorinSpan<T>>).setAttribute === 'function') {
    return span as GraphorinSpan<T>;
  }
  return null;
}
