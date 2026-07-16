[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / RegisterDynamicClientOptions

# Interface: RegisterDynamicClientOptions

Defined in: [packages/security/src/oauth/dynamic-client-registration.ts:71](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/dynamic-client-registration.ts#L71)

Options accepted by [registerDynamicClient](/api/@graphorin/security/functions/registerDynamicClient.md).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-applicationtype"></a> `applicationType?` | `readonly` | `"native"` \| `"web"` | [packages/security/src/oauth/dynamic-client-registration.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/dynamic-client-registration.ts#L77) |
| <a id="property-clientname"></a> `clientName` | `readonly` | `string` | [packages/security/src/oauth/dynamic-client-registration.ts:72](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/dynamic-client-registration.ts#L72) |
| <a id="property-extra"></a> `extra?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | [packages/security/src/oauth/dynamic-client-registration.ts:78](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/dynamic-client-registration.ts#L78) |
| <a id="property-granttypes"></a> `grantTypes?` | `readonly` | readonly `string`[] | [packages/security/src/oauth/dynamic-client-registration.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/dynamic-client-registration.ts#L75) |
| <a id="property-redirecturis"></a> `redirectUris?` | `readonly` | readonly `string`[] | [packages/security/src/oauth/dynamic-client-registration.ts:73](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/dynamic-client-registration.ts#L73) |
| <a id="property-scope"></a> `scope?` | `readonly` | `string` | [packages/security/src/oauth/dynamic-client-registration.ts:74](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/dynamic-client-registration.ts#L74) |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | [packages/security/src/oauth/dynamic-client-registration.ts:79](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/dynamic-client-registration.ts#L79) |
| <a id="property-tokenendpointauthmethod"></a> `tokenEndpointAuthMethod?` | `readonly` | `string` | [packages/security/src/oauth/dynamic-client-registration.ts:76](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/dynamic-client-registration.ts#L76) |
