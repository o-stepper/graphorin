/**
 * Pluggable event-store surface for `@graphorin/mcp`.
 *
 * @packageDocumentation
 */

export { InMemoryEventStore } from './in-memory.js';
export type {
  EventId,
  EventStore,
  JsonRpcMessage,
  ReplayEventsAfterOptions,
  StreamId,
} from './types.js';
