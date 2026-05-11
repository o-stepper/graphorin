/**
 * Tiny id helpers shared across middleware + routes.
 *
 * @internal
 */

import { randomUUID } from 'node:crypto';

/**
 * Generate an opaque per-request id. UUID v4 keeps the surface area
 * minimal — operators that already pin a different scheme (Datadog
 * trace ids, AWS request ids, …) can override the generator on
 * `createServer({ requestIdGenerator })`.
 */
export function newRequestId(): string {
  return randomUUID();
}
