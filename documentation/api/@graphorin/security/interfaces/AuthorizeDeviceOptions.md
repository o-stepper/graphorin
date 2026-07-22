[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / AuthorizeDeviceOptions

# Interface: AuthorizeDeviceOptions

Defined in: packages/security/src/oauth/types.ts:216

**`Stable`**

Options accepted by `OAuthClient.authorizeDevice(...)`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-onusercode"></a> `onUserCode?` | `readonly` | (`info`) => `void` | Hook called once the device authorization response arrives. The UI / CLI prints the user code + verification URL. | packages/security/src/oauth/types.ts:224 |
| <a id="property-scope"></a> `scope?` | `readonly` | `string` | - | packages/security/src/oauth/types.ts:217 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | Cancellation. | packages/security/src/oauth/types.ts:226 |
| <a id="property-timeoutms"></a> `timeoutMs?` | `readonly` | `number` | Maximum time spent polling. Defaults to the server's `expires_in`. | packages/security/src/oauth/types.ts:219 |
