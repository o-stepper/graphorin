/**
 * Severity levels supported by the project logger. Mirrors the canonical
 * `trace < debug < info < warn < error` hierarchy used by every common
 * structured logger.
 *
 * @stable
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

/**
 * Free-form structured fields that accompany a log record. Values must be
 * JSON-serializable; concrete loggers redact `SecretValue` and other
 * sensitive shapes per the framework's redaction policy.
 *
 * @stable
 */
export type LogFields = Readonly<Record<string, unknown>>;

/**
 * Pluggable logger contract consumed by every `@graphorin/*` runtime
 * package. The concrete implementation lives in `@graphorin/observability`
 * - declaring the interface here keeps level-zero packages free of an
 * observability dependency.
 *
 * Loggers are intentionally **structured** and **side-effect-free** in the
 * type contract: the `info(msg, fields?)` signature is a hint, not a
 * mandate to actually emit anything. Implementations may sample, drop, or
 * batch.
 *
 * @stable
 */
export interface Logger {
  trace(message: string, fields?: LogFields): void;
  debug(message: string, fields?: LogFields): void;
  info(message: string, fields?: LogFields): void;
  warn(message: string, fields?: LogFields): void;
  error(message: string, fields?: LogFields): void;
  /**
   * Return a child logger with `fields` merged into every record's
   * structured payload. Useful for binding `runId` / `sessionId` /
   * `agentId` once at the top of a request.
   */
  child(fields: LogFields): Logger;
}

/**
 * Minimal no-op logger. Useful as a typed default when downstream code
 * needs a non-null `Logger` without taking the observability dependency.
 *
 * @stable
 */
export const NOOP_LOGGER: Logger = {
  trace(): void {},
  debug(): void {},
  info(): void {},
  warn(): void {},
  error(): void {},
  child(): Logger {
    return NOOP_LOGGER;
  },
};
