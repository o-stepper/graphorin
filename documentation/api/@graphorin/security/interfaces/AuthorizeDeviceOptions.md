[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / AuthorizeDeviceOptions

# Interface: AuthorizeDeviceOptions

Defined in: [packages/security/src/oauth/types.ts:216](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/types.ts#L216)

Options accepted by `OAuthClient.authorizeDevice(...)`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-onusercode"></a> `onUserCode?` | `readonly` | (`info`) => `void` | Hook called once the device authorization response arrives. The UI / CLI prints the user code + verification URL. | [packages/security/src/oauth/types.ts:224](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/types.ts#L224) |
| <a id="property-scope"></a> `scope?` | `readonly` | `string` | - | [packages/security/src/oauth/types.ts:217](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/types.ts#L217) |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | Cancellation. | [packages/security/src/oauth/types.ts:226](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/types.ts#L226) |
| <a id="property-timeoutms"></a> `timeoutMs?` | `readonly` | `number` | Maximum time spent polling. Defaults to the server's `expires_in`. | [packages/security/src/oauth/types.ts:219](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/types.ts#L219) |
