/**
 * Default human-readable span name per {@link SpanType}. Operators
 * can override the name by passing `name` through a custom
 * `setAttributes(...)` call after `startSpan(...)` returns.
 *
 * @packageDocumentation
 */

import type { SpanType } from '@graphorin/core';

/**
 * @stable
 */
export function spanNameFor(type: SpanType): string {
  return type;
}
