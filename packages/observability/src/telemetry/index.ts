/**
 * Zero-default telemetry stub.
 *
 * The framework promises to make zero outbound network calls without
 * an explicit user action. This module exists so consumers can:
 *
 * - inspect the telemetry posture from CLI / health endpoints,
 * - register the reserved `GRAPHORIN_TELEMETRY` / `GRAPHORIN_NO_PHONE_HOME`
 *   environment variables for forward compatibility,
 * - assert in tests that no implicit telemetry surface exists.
 *
 * Attempting to enable telemetry pre-v0.2 returns a sentinel result; it
 * never opens a socket.
 *
 * @packageDocumentation
 */

/**
 * Result returned by {@link getTelemetryStatus}.
 *
 * @stable
 */
export interface TelemetryStatus {
  /** Always `false` in v0.1. Reserved field. */
  readonly enabled: false;
  /** Plain-English explanation of the current state. */
  readonly reason: string;
  /** Resolved value of `GRAPHORIN_TELEMETRY` (if any). */
  readonly env?: string;
  /** Resolved value of `GRAPHORIN_NO_PHONE_HOME` (if any). */
  readonly noPhoneHome?: string;
}

/**
 * Snapshot of the telemetry posture. Reads from `process.env` once
 * unless `env` is provided.
 *
 * @stable
 */
export function getTelemetryStatus(env: NodeJS.ProcessEnv = process.env): TelemetryStatus {
  const telemetry = env.GRAPHORIN_TELEMETRY;
  const noPhoneHome = env.GRAPHORIN_NO_PHONE_HOME;
  return {
    enabled: false,
    reason: 'telemetry not yet implemented (v0.1 ships zero default telemetry)',
    ...(telemetry === undefined ? {} : { env: telemetry }),
    ...(noPhoneHome === undefined ? {} : { noPhoneHome }),
  };
}

/**
 * Best-effort enable hook. Always returns the sentinel
 * `{ status: 'disabled', reason: ... }` payload. Reserved for v0.2+.
 *
 * @stable
 */
export function enableTelemetry(): {
  readonly status: 'disabled';
  readonly reason: string;
} {
  return {
    status: 'disabled',
    reason: 'telemetry not yet implemented (v0.1 ships zero default telemetry)',
  };
}

/**
 * Detect the reserved env vars and emit one informational line per
 * process. Returns the lines as an array so callers can route them to
 * any sink they like (defaults to `console.info`).
 *
 * @stable
 */
export function announceTelemetryPosture(
  opts: { readonly env?: NodeJS.ProcessEnv; readonly sink?: (line: string) => void } = {},
): ReadonlyArray<string> {
  const env = opts.env ?? process.env;
  const sink = opts.sink ?? ((line: string) => console.info(line));
  const lines: string[] = [];
  if (env.GRAPHORIN_TELEMETRY !== undefined) {
    lines.push(
      `[graphorin/observability] info: GRAPHORIN_TELEMETRY=${env.GRAPHORIN_TELEMETRY} ` +
        '— acknowledged. Telemetry is hardcoded `disabled` in v0.1.',
    );
  }
  if (env.GRAPHORIN_NO_PHONE_HOME !== undefined) {
    lines.push(
      `[graphorin/observability] info: GRAPHORIN_NO_PHONE_HOME=${env.GRAPHORIN_NO_PHONE_HOME} ` +
        '— acknowledged. Graphorin already makes zero outbound calls without explicit user action.',
    );
  }
  for (const line of lines) sink(line);
  return lines;
}
