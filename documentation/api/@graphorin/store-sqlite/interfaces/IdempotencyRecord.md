[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / IdempotencyRecord

# Interface: IdempotencyRecord

Defined in: packages/store-sqlite/src/idempotency-store.ts:11

REST `Idempotency-Key` cache row. The key is the value sent by the
client; `requestHash` fingerprints the request body so a key reuse
with a different payload returns `409 Conflict` per the IETF
draft-07 (`DEC-142 / ADR-036`).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `number` | - | packages/store-sqlite/src/idempotency-store.ts:19 |
| <a id="property-expiresat"></a> `expiresAt` | `readonly` | `number` | - | packages/store-sqlite/src/idempotency-store.ts:20 |
| <a id="property-key"></a> `key` | `readonly` | `string` | - | packages/store-sqlite/src/idempotency-store.ts:12 |
| <a id="property-requesthash"></a> `requestHash` | `readonly` | `string` | - | packages/store-sqlite/src/idempotency-store.ts:13 |
| <a id="property-response"></a> `response` | `readonly` | `unknown` | Cached response body - adapter-specific encoding (JSON in v0.1). | packages/store-sqlite/src/idempotency-store.ts:16 |
| <a id="property-responseheaders"></a> `responseHeaders?` | `readonly` | `Readonly`\&lt;`Record`\&lt;`string`, `string`\&gt;\&gt; | - | packages/store-sqlite/src/idempotency-store.ts:17 |
| <a id="property-scope"></a> `scope?` | `readonly` | `string` | - | packages/store-sqlite/src/idempotency-store.ts:18 |
| <a id="property-statuscode"></a> `statusCode` | `readonly` | `number` | - | packages/store-sqlite/src/idempotency-store.ts:14 |
