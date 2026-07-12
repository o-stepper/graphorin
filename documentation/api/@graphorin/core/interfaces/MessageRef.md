[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / MessageRef

# Interface: MessageRef

Defined in: [packages/core/src/contracts/memory-store.ts:89](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/memory-store.ts#L89)

Reference returned by `SessionMemoryStore.push(...)`. Carries the
persisted message id and a sequence number for ordering.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-messageid"></a> `messageId` | `readonly` | `string` | [packages/core/src/contracts/memory-store.ts:90](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/memory-store.ts#L90) |
| <a id="property-persistedat"></a> `persistedAt` | `readonly` | `string` | [packages/core/src/contracts/memory-store.ts:92](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/memory-store.ts#L92) |
| <a id="property-sequence"></a> `sequence` | `readonly` | `number` | [packages/core/src/contracts/memory-store.ts:91](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/memory-store.ts#L91) |
