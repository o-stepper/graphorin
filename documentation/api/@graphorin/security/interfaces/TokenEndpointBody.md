[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / TokenEndpointBody

# Interface: TokenEndpointBody

Defined in: [packages/security/src/oauth/token-endpoint.ts:34](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/token-endpoint.ts#L34)

Parsed body returned by the token endpoint. Mirrors the shape
defined by RFC 6749 § 5.1 + the device-flow extension.

## Stable

## Indexable

```ts
[extra: string]: unknown
```

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-access_token"></a> `access_token?` | `readonly` | `string` | [packages/security/src/oauth/token-endpoint.ts:35](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/token-endpoint.ts#L35) |
| <a id="property-error"></a> `error?` | `readonly` | `string` | [packages/security/src/oauth/token-endpoint.ts:41](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/token-endpoint.ts#L41) |
| <a id="property-error_description"></a> `error_description?` | `readonly` | `string` | [packages/security/src/oauth/token-endpoint.ts:42](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/token-endpoint.ts#L42) |
| <a id="property-error_uri"></a> `error_uri?` | `readonly` | `string` | [packages/security/src/oauth/token-endpoint.ts:43](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/token-endpoint.ts#L43) |
| <a id="property-expires_in"></a> `expires_in?` | `readonly` | `number` | [packages/security/src/oauth/token-endpoint.ts:39](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/token-endpoint.ts#L39) |
| <a id="property-id_token"></a> `id_token?` | `readonly` | `string` | [packages/security/src/oauth/token-endpoint.ts:37](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/token-endpoint.ts#L37) |
| <a id="property-interval"></a> `interval?` | `readonly` | `number` | [packages/security/src/oauth/token-endpoint.ts:44](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/token-endpoint.ts#L44) |
| <a id="property-refresh_token"></a> `refresh_token?` | `readonly` | `string` | [packages/security/src/oauth/token-endpoint.ts:36](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/token-endpoint.ts#L36) |
| <a id="property-scope"></a> `scope?` | `readonly` | `string` | [packages/security/src/oauth/token-endpoint.ts:40](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/token-endpoint.ts#L40) |
| <a id="property-token_type"></a> `token_type?` | `readonly` | `string` | [packages/security/src/oauth/token-endpoint.ts:38](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/token-endpoint.ts#L38) |
