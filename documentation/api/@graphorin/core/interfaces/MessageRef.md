[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / MessageRef

# Interface: MessageRef

Defined in: packages/core/src/contracts/memory-store.ts:98

**`Stable`**

Reference returned by `SessionMemoryStore.push(...)`. Carries the
persisted message id and a sequence number for ordering.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-messageid"></a> `messageId` | `readonly` | `string` | packages/core/src/contracts/memory-store.ts:99 |
| <a id="property-persistedat"></a> `persistedAt` | `readonly` | `string` | packages/core/src/contracts/memory-store.ts:101 |
| <a id="property-sequence"></a> `sequence` | `readonly` | `number` | packages/core/src/contracts/memory-store.ts:100 |
