[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / testkit

# testkit

`@graphorin/channels/testkit` - conformance suite + in-memory
building blocks for adapter authors and application tests.

## Interfaces

| Interface | Description |
| ------ | ------ |
| [ConformanceHarness](/api/@graphorin/channels/testkit/interfaces/ConformanceHarness.md) | Hooks the suite uses to drive the adapter under test. `sendInbound` must make the adapter produce ONE inbound message (for a real vendor adapter: through the vendor fake; the loopback adapter's `inject` satisfies it directly). |
| [ConformanceTestApi](/api/@graphorin/channels/testkit/interfaces/ConformanceTestApi.md) | The subset of the vitest/jest API the conformance suite needs - injected so this module has no test-framework dependency. |
| [LoopbackAdapter](/api/@graphorin/channels/testkit/interfaces/LoopbackAdapter.md) | The in-memory loopback adapter: a full `ChannelAdapter` whose transport is the test itself. Tests `inject()` inbound messages and read `deliveries` for what the gateway sent back. |
| [LoopbackAdapterOptions](/api/@graphorin/channels/testkit/interfaces/LoopbackAdapterOptions.md) | Options for [createLoopbackAdapter](/api/@graphorin/channels/testkit/functions/createLoopbackAdapter.md). |
| [LoopbackInboundInput](/api/@graphorin/channels/testkit/interfaces/LoopbackInboundInput.md) | Convenience shape for [LoopbackAdapter.inject](/api/@graphorin/channels/testkit/interfaces/LoopbackAdapter.md#inject). |

## Functions

| Function | Description |
| ------ | ------ |
| [createInMemoryPairingStore](/api/@graphorin/channels/testkit/functions/createInMemoryPairingStore.md) | In-memory `PairingStore` for tests and single-process prototypes. Mirrors the sqlite implementation's semantics (one pending request per peer, per-channel code uniqueness by construction). |
| [createLoopbackAdapter](/api/@graphorin/channels/testkit/functions/createLoopbackAdapter.md) | Build a loopback adapter for tests and prototypes. |
| [describeChannelAdapterConformance](/api/@graphorin/channels/testkit/functions/describeChannelAdapterConformance.md) | Register the conformance suite against a harness. |
