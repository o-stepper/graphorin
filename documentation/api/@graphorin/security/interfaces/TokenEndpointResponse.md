[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / TokenEndpointResponse

# Interface: TokenEndpointResponse

Defined in: [packages/security/src/oauth/token-endpoint.ts:21](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/token-endpoint.ts#L21)

Internal HTTP-style response shape consumed by the higher-level flows.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-body"></a> `body` | `readonly` | [`TokenEndpointBody`](/api/@graphorin/security/interfaces/TokenEndpointBody.md) | [packages/security/src/oauth/token-endpoint.ts:25](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/token-endpoint.ts#L25) |
| <a id="property-ok"></a> `ok` | `readonly` | `boolean` | [packages/security/src/oauth/token-endpoint.ts:22](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/token-endpoint.ts#L22) |
| <a id="property-status"></a> `status` | `readonly` | `number` | [packages/security/src/oauth/token-endpoint.ts:23](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/token-endpoint.ts#L23) |
| <a id="property-statustext"></a> `statusText?` | `readonly` | `string` | [packages/security/src/oauth/token-endpoint.ts:24](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/token-endpoint.ts#L24) |
