/**
 * `@graphorin/client` — reference TypeScript client for the
 * Graphorin standalone server.
 *
 * Wraps the WebSocket subprotocol `graphorin.protocol.v1` (with an
 * optional Server-Sent Events fallback for proxy-restricted
 * environments) behind an ergonomic {@link GraphorinClient} class:
 * `connect()`, `subscribe({ target, id })` returning an
 * async-iterable subscription, `cancel(runId, opts)`,
 * `disconnect()`. Handles the browser ticket flow, exponential-
 * backoff reconnect with `lastEventId` resume against the server
 * replay buffer, and Zod-validated frame parsing on both
 * directions.
 *
 * Browser-friendly: zero Node-only dependencies; the only runtime
 * dependencies are `@graphorin/protocol` and `zod`.
 *
 * @packageDocumentation
 */

/** Canonical version constant. Mirrors the `package.json` version. */
export const VERSION = '0.5.0';

export * from './errors.js';
export {
  GraphorinClient,
  type GraphorinClientOptions,
  type Subscription,
  type SubscriptionMetadata,
  type SubscriptionTarget,
  type TransportPreference,
} from './graphorin-client.js';
export {
  type BackoffPolicy,
  computeBackoffMs,
  sleep,
} from './reconnect.js';
export {
  openSseTransport,
  openWebSocketTransport,
  type Transport,
  type TransportAuth,
  type TransportCloseReason,
  type TransportKind,
  type TransportListeners,
  type TransportOptions,
} from './transport/index.js';
