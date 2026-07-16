[**Graphorin API reference v0.10.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [testkit](/api/@graphorin/channels/testkit/index.md) / createInMemoryPairingStore

# Function: createInMemoryPairingStore()

```ts
function createInMemoryPairingStore(): PairingStore;
```

Defined in: [packages/channels/src/testkit/in-memory-pairing-store.ts:19](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/testkit/in-memory-pairing-store.ts#L19)

In-memory `PairingStore` for tests and single-process prototypes.
Mirrors the sqlite implementation's semantics (one pending request
per peer, per-channel code uniqueness by construction).

## Returns

[`PairingStore`](/api/@graphorin/core/interfaces/PairingStore.md)

## Stable
