[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / ServerRequestState

# Interface: ServerRequestState

Defined in: packages/server/src/internal/context.ts:31

Request-scoped variables surfaced through `c.var` in Hono. The
server's middleware populates these fields incrementally; route
handlers consume them through getRequestState.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-auth"></a> `auth` | `readonly` | `AuthState` | packages/server/src/internal/context.ts:35 |
| <a id="property-clientip"></a> `clientIp` | `readonly` | `string` \| `undefined` | packages/server/src/internal/context.ts:34 |
| <a id="property-idempotencykey"></a> `idempotencyKey?` | `readonly` | `string` | packages/server/src/internal/context.ts:36 |
| <a id="property-idempotencyreplay"></a> `idempotencyReplay?` | `readonly` | `boolean` | packages/server/src/internal/context.ts:37 |
| <a id="property-receivedat"></a> `receivedAt` | `readonly` | `number` | packages/server/src/internal/context.ts:33 |
| <a id="property-requestid"></a> `requestId` | `readonly` | `string` | packages/server/src/internal/context.ts:32 |
