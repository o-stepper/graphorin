/**
 * Stable id helpers used by the sessions package.
 *
 * @packageDocumentation
 */

import { randomUUID } from 'node:crypto';

/**
 * Generate a fresh prefixed UUID. The prefix is a short slug for
 * readability in logs; the rest is a 32-char hex UUID without
 * dashes.
 *
 * @stable
 */
export function newId(prefix: string): string {
  const uuid = randomUUID().replace(/-/g, '');
  return `${prefix}-${uuid}`;
}
