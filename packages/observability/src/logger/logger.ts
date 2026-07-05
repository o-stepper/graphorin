/**
 * `createLogger(...)` - structured logger with optional span correlation.
 *
 * The logger is a thin wrapper around `console.{log,info,warn,error}`
 * that adds:
 *
 * - structured fields,
 * - JSON or pretty rendering,
 * - automatic correlation with the current Graphorin span (the
 *   {@link CurrentSpanContext} helper carries the live trace + span ids),
 * - sensitivity-aware redaction via the supplied
 *   {@link RedactionValidatorInstance}.
 *
 * @packageDocumentation
 */

import type { AISpan, LogFields, Logger, LogLevel, Sensitivity } from '@graphorin/core';

import { createAsyncContext } from '@graphorin/core';

import type { RedactionValidatorInstance } from '../redaction/types.js';

/**
 * @stable
 */
export type LoggerFormat = 'json' | 'pretty';

/**
 * Configuration shape for {@link createLogger}.
 *
 * @stable
 */
export interface LoggerOptions {
  readonly level?: LogLevel;
  readonly format?: LoggerFormat;
  /** Optional validator. Logger fields flow through `validate(...)`. */
  readonly redaction?: RedactionValidatorInstance;
  /** Default sensitivity tier for fields. Defaults to `'internal'`. */
  readonly defaultTier?: Sensitivity;
  /**
   * Sink that receives the rendered line. Defaults to writing to the
   * appropriate `console.*` method.
   */
  readonly sink?: (level: LogLevel, line: string) => void;
}

const LEVELS: ReadonlyArray<LogLevel> = ['trace', 'debug', 'info', 'warn', 'error'] as const;

/**
 * @internal - context used to thread the current span id through nested
 * async calls. Exposed via {@link withCurrentSpan} below.
 */
const SPAN_CONTEXT = createAsyncContext<{ traceId: string; spanId: string }>(
  'graphorin.observability.current-span',
);

/**
 * Run `fn` with the supplied span as the "current" log-correlation
 * span. The logger picks up the trace + span ids automatically.
 *
 * @stable
 */
export function withCurrentSpan<R>(
  span: AISpan | undefined,
  fn: () => R | Promise<R>,
): R | Promise<R> {
  if (span === undefined) return fn();
  return SPAN_CONTEXT.runAsync({ traceId: span.traceId, spanId: span.id }, async () => fn());
}

/**
 * Read the current span context (if any). Useful for callers that
 * want to attach span metadata to bespoke records.
 *
 * @stable
 */
export function getCurrentSpanContext():
  | { readonly traceId: string; readonly spanId: string }
  | undefined {
  return SPAN_CONTEXT.get();
}

/**
 * Build a {@link Logger} configured against the supplied options.
 *
 * @stable
 */
export function createLogger(opts: LoggerOptions = {}): Logger {
  const minLevel = LEVELS.indexOf(opts.level ?? 'info');
  const format = opts.format ?? 'json';
  const redaction = opts.redaction;
  const defaultTier: Sensitivity = opts.defaultTier ?? 'internal';
  const sink = opts.sink ?? defaultSink;

  function emit(level: LogLevel, message: string, fields?: LogFields): void {
    const idx = LEVELS.indexOf(level);
    if (idx < minLevel) return;

    const span = SPAN_CONTEXT.get();
    const safeFields = sanitizeFields(fields, redaction, defaultTier);

    const payload: Record<string, unknown> = {
      level,
      time: new Date().toISOString(),
      message,
      ...safeFields,
    };
    if (span !== undefined) {
      payload.traceId = span.traceId;
      payload.spanId = span.spanId;
    }

    const line = format === 'json' ? JSON.stringify(payload) : prettyRender(payload);
    sink(level, line);
  }

  return {
    trace: (message, fields) => emit('trace', message, fields),
    debug: (message, fields) => emit('debug', message, fields),
    info: (message, fields) => emit('info', message, fields),
    warn: (message, fields) => emit('warn', message, fields),
    error: (message, fields) => emit('error', message, fields),
    child(_bindings: LogFields): Logger {
      const inherited = sanitizeFields(_bindings, redaction, defaultTier);
      const parent = createLogger(opts);
      return {
        trace: (m, f) => parent.trace(m, { ...inherited, ...f }),
        debug: (m, f) => parent.debug(m, { ...inherited, ...f }),
        info: (m, f) => parent.info(m, { ...inherited, ...f }),
        warn: (m, f) => parent.warn(m, { ...inherited, ...f }),
        error: (m, f) => parent.error(m, { ...inherited, ...f }),
        child(b: LogFields): Logger {
          return parent.child({ ...inherited, ...b });
        },
      };
    },
  };
}

function sanitizeFields(
  fields: LogFields | undefined,
  validator: RedactionValidatorInstance | undefined,
  tier: Sensitivity,
): LogFields {
  if (fields === undefined) return {};
  if (validator === undefined) return { ...fields };
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    const result = validator.validate({ value: v, tier, context: { attribute: k } });
    if (result === null) continue;
    out[k] = result.value;
  }
  return out;
}

function defaultSink(level: LogLevel, line: string): void {
  switch (level) {
    case 'trace':
    case 'debug':
      console.debug(line);
      return;
    case 'info':
      console.info(line);
      return;
    case 'warn':
      console.warn(line);
      return;
    case 'error':
      console.error(line);
      return;
  }
}

function prettyRender(payload: Record<string, unknown>): string {
  const { level, time, message, ...rest } = payload;
  const fields = Object.keys(rest).length === 0 ? '' : ` ${JSON.stringify(rest)}`;
  return `[${String(time)}] ${String(level).toUpperCase()} ${String(message)}${fields}`;
}
