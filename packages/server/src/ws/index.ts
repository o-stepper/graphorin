/**
 * `@graphorin/server/ws` - WebSocket protocol implementation for
 * the Graphorin standalone server. Combines the dispatcher (which
 * fans events out to subscribers + applies the delivery-layer
 * commentary sanitization), the in-memory ticket store (browser
 * single-use ticket flow), the per-subject replay buffer, the strict
 * subject grammar parser + scope check, and the `@hono/node-ws`
 * upgrade handler.
 *
 * @packageDocumentation
 */

export {
  type BareEventFrame,
  createWsDispatcher,
  type SubscribeResult,
  type WsDispatcher,
  type WsDispatcherOptions,
  type WsDispatcherWarning,
  type WsSubscriberHandle,
  type WsSubscriptionSnapshot,
} from './dispatcher.js';
export {
  createReplayBuffer,
  type ReplayBuffer,
  type ReplayBufferOptions,
  type ReplayBufferSlice,
} from './replay-buffer.js';
export {
  isSubjectAllowed,
  type ParsedSubject,
  type ParseSubjectResult,
  requiredScopeFor,
  tryParseSubject,
} from './subjects.js';
export {
  createWsTicketStore,
  type WsTicket,
  type WsTicketConsumeResult,
  type WsTicketStore,
  type WsTicketStoreOptions,
} from './ticket.js';
export { createWsUpgradeEvents, type WsUpgradeOptions } from './upgrade.js';
