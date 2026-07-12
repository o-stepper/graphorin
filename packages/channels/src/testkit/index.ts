/**
 * `@graphorin/channels/testkit` - conformance suite + in-memory
 * building blocks for adapter authors and application tests.
 *
 * @packageDocumentation
 */

export {
  type ConformanceHarness,
  type ConformanceTestApi,
  describeChannelAdapterConformance,
} from './conformance.js';
export { createInMemoryPairingStore } from './in-memory-pairing-store.js';
export {
  createLoopbackAdapter,
  type LoopbackAdapter,
  type LoopbackAdapterOptions,
  type LoopbackInboundInput,
} from './loopback-adapter.js';
