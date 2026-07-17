[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / SessionMetadata

# Interface: SessionMetadata

Defined in: [packages/core/src/contracts/session-store.ts:11](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/session-store.ts#L11)

Lightweight session metadata persisted by the sessions package. The
actual `session_messages` rows are owned by `MemoryStore` (single source
of truth - the sessions package delegates message CRUD to memory).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | [packages/core/src/contracts/session-store.ts:14](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/session-store.ts#L14) |
| <a id="property-closedat"></a> `closedAt?` | `readonly` | `string` | [packages/core/src/contracts/session-store.ts:18](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/session-store.ts#L18) |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `string` | [packages/core/src/contracts/session-store.ts:16](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/session-store.ts#L16) |
| <a id="property-id"></a> `id` | `readonly` | `string` | [packages/core/src/contracts/session-store.ts:12](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/session-store.ts#L12) |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | [packages/core/src/contracts/session-store.ts:19](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/session-store.ts#L19) |
| <a id="property-title"></a> `title?` | `readonly` | `string` | [packages/core/src/contracts/session-store.ts:15](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/session-store.ts#L15) |
| <a id="property-updatedat"></a> `updatedAt?` | `readonly` | `string` | [packages/core/src/contracts/session-store.ts:17](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/session-store.ts#L17) |
| <a id="property-userid"></a> `userId` | `readonly` | `string` | [packages/core/src/contracts/session-store.ts:13](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/session-store.ts#L13) |
