[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / ServerRequestState

# Interface: ServerRequestState

Defined in: packages/server/src/internal/context.ts:39

**`Stable`**

Request-scoped variables surfaced through `c.var` in Hono. The
server's middleware populates these fields incrementally; route
handlers consume them through `getRequestState`.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-auth"></a> `auth` | `readonly` | [`AuthState`](/api/@graphorin/server/type-aliases/AuthState.md) | packages/server/src/internal/context.ts:43 |
| <a id="property-clientip"></a> `clientIp` | `readonly` | `string` \| `undefined` | packages/server/src/internal/context.ts:42 |
| <a id="property-idempotencykey"></a> `idempotencyKey?` | `readonly` | `string` | packages/server/src/internal/context.ts:44 |
| <a id="property-idempotencyreplay"></a> `idempotencyReplay?` | `readonly` | `boolean` | packages/server/src/internal/context.ts:45 |
| <a id="property-receivedat"></a> `receivedAt` | `readonly` | `number` | packages/server/src/internal/context.ts:41 |
| <a id="property-requestid"></a> `requestId` | `readonly` | `string` | packages/server/src/internal/context.ts:40 |
