/**
 * Identifier helpers used by `@graphorin/workflow`. The runtime
 * generates short UUIDs for thread / checkpoint / task ids; the
 * caller can override every one of these via the public API.
 *
 * @packageDocumentation
 */

import { randomUUID } from 'node:crypto';

/**
 * Generate a fresh prefixed UUID. The prefix is a short slug for
 * readability in logs; the rest is a 32-char hex UUID without
 * dashes.
 *
 * @internal
 */
export function newId(prefix: string): string {
  const uuid = randomUUID().replace(/-/g, '');
  return `${prefix}-${uuid}`;
}
