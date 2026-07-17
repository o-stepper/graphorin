[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / ServerRequestState

# Interface: ServerRequestState

Defined in: [packages/server/src/internal/context.ts:39](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/internal/context.ts#L39)

Request-scoped variables surfaced through `c.var` in Hono. The
server's middleware populates these fields incrementally; route
handlers consume them through `getRequestState`.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-auth"></a> `auth` | `readonly` | `AuthState` | [packages/server/src/internal/context.ts:43](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/internal/context.ts#L43) |
| <a id="property-clientip"></a> `clientIp` | `readonly` | `string` \| `undefined` | [packages/server/src/internal/context.ts:42](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/internal/context.ts#L42) |
| <a id="property-idempotencykey"></a> `idempotencyKey?` | `readonly` | `string` | [packages/server/src/internal/context.ts:44](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/internal/context.ts#L44) |
| <a id="property-idempotencyreplay"></a> `idempotencyReplay?` | `readonly` | `boolean` | [packages/server/src/internal/context.ts:45](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/internal/context.ts#L45) |
| <a id="property-receivedat"></a> `receivedAt` | `readonly` | `number` | [packages/server/src/internal/context.ts:41](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/internal/context.ts#L41) |
| <a id="property-requestid"></a> `requestId` | `readonly` | `string` | [packages/server/src/internal/context.ts:40](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/internal/context.ts#L40) |
