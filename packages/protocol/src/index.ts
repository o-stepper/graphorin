/**
 * `@graphorin/protocol` - wire-format contract for the Graphorin
 * WebSocket subprotocol.
 *
 * The package is the **single source of truth** for the shape of
 * every frame exchanged over `wss://.../v1/ws`. Both
 * `@graphorin/server` and `@graphorin/client` import their schemas
 * from here so the two implementations cannot drift.
 *
 * Browser-friendly: the only runtime dependency is
 * [`zod`](https://zod.dev). No Node-only imports, no DOM-only
 * imports.
 *
 * @packageDocumentation
 */

/** Canonical version constant. Mirrors the `package.json` version. */
export const VERSION = '0.5.0';

export * from './client-message.js';
export * from './close-codes.js';
export * from './server-message.js';
export * from './subprotocol.js';
