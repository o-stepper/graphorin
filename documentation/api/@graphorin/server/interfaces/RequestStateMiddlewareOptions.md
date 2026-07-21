[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / RequestStateMiddlewareOptions

# Interface: RequestStateMiddlewareOptions

Defined in: packages/server/src/middleware/request-state.ts:17

**`Stable`**

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-newrequestid"></a> `newRequestId?` | `readonly` | () => `string` | Override the request id generator. | packages/server/src/middleware/request-state.ts:21 |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | Override the wall clock; tests inject a fixed value. | packages/server/src/middleware/request-state.ts:19 |
| <a id="property-responseheader"></a> `responseHeader?` | `readonly` | `string` \| `false` | Echo the request id back to the client. Default `'X-Request-Id'`. | packages/server/src/middleware/request-state.ts:25 |
| <a id="property-trustproxy"></a> `trustProxy?` | `readonly` | `boolean` | Trust `X-Forwarded-For`/`X-Real-IP` for the client IP. Default false. | packages/server/src/middleware/request-state.ts:23 |
