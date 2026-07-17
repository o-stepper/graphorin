[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / IdempotencyRecord

# Interface: IdempotencyRecord

Defined in: [packages/store-sqlite/src/idempotency-store.ts:11](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/idempotency-store.ts#L11)

REST `Idempotency-Key` cache row. The key is the value sent by the
client; `requestHash` fingerprints the request body so a key reuse
with a different payload returns `409 Conflict` per the IETF
draft-07 (`DEC-142 / ADR-036`).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `number` | - | [packages/store-sqlite/src/idempotency-store.ts:19](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/idempotency-store.ts#L19) |
| <a id="property-expiresat"></a> `expiresAt` | `readonly` | `number` | - | [packages/store-sqlite/src/idempotency-store.ts:20](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/idempotency-store.ts#L20) |
| <a id="property-key"></a> `key` | `readonly` | `string` | - | [packages/store-sqlite/src/idempotency-store.ts:12](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/idempotency-store.ts#L12) |
| <a id="property-requesthash"></a> `requestHash` | `readonly` | `string` | - | [packages/store-sqlite/src/idempotency-store.ts:13](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/idempotency-store.ts#L13) |
| <a id="property-response"></a> `response` | `readonly` | `unknown` | Cached response body - adapter-specific encoding (JSON in v0.1). | [packages/store-sqlite/src/idempotency-store.ts:16](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/idempotency-store.ts#L16) |
| <a id="property-responseheaders"></a> `responseHeaders?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `string`\&gt;\> | - | [packages/store-sqlite/src/idempotency-store.ts:17](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/idempotency-store.ts#L17) |
| <a id="property-scope"></a> `scope?` | `readonly` | `string` | - | [packages/store-sqlite/src/idempotency-store.ts:18](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/idempotency-store.ts#L18) |
| <a id="property-statuscode"></a> `statusCode` | `readonly` | `number` | - | [packages/store-sqlite/src/idempotency-store.ts:14](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/idempotency-store.ts#L14) |
