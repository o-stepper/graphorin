/**
 * Trace and span ID generators. The tracer prefers `crypto.randomUUID()`
 * over a custom RNG for parity with the OpenTelemetry SDK behaviour and
 * to avoid pulling another runtime dependency.
 *
 * @packageDocumentation
 */

import { randomBytes } from 'node:crypto';

/**
 * Generate a 32-hex-character (16-byte) trace id.
 *
 * @stable
 */
export function newTraceId(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Generate a 16-hex-character (8-byte) span id.
 *
 * @stable
 */
export function newSpanId(): string {
  return randomBytes(8).toString('hex');
}
