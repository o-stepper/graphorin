[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / AuthorizeDeviceOptions

# Interface: AuthorizeDeviceOptions

Defined in: packages/security/src/oauth/types.ts:201

Options accepted by `OAuthClient.authorizeDevice(...)`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-onusercode"></a> `onUserCode?` | `readonly` | (`info`) => `void` | Hook called once the device authorization response arrives. The UI / CLI prints the user code + verification URL. | packages/security/src/oauth/types.ts:209 |
| <a id="property-scope"></a> `scope?` | `readonly` | `string` | - | packages/security/src/oauth/types.ts:202 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | Cancellation. | packages/security/src/oauth/types.ts:211 |
| <a id="property-timeoutms"></a> `timeoutMs?` | `readonly` | `number` | Maximum time spent polling. Defaults to the server's `expires_in`. | packages/security/src/oauth/types.ts:204 |
