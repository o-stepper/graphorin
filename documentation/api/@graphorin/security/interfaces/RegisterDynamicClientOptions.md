[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / RegisterDynamicClientOptions

# Interface: RegisterDynamicClientOptions

Defined in: packages/security/src/oauth/dynamic-client-registration.ts:71

**`Stable`**

Options accepted by [registerDynamicClient](/api/@graphorin/security/functions/registerDynamicClient.md).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-applicationtype"></a> `applicationType?` | `readonly` | `"native"` \| `"web"` | packages/security/src/oauth/dynamic-client-registration.ts:77 |
| <a id="property-clientname"></a> `clientName` | `readonly` | `string` | packages/security/src/oauth/dynamic-client-registration.ts:72 |
| <a id="property-extra"></a> `extra?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | packages/security/src/oauth/dynamic-client-registration.ts:78 |
| <a id="property-granttypes"></a> `grantTypes?` | `readonly` | readonly `string`[] | packages/security/src/oauth/dynamic-client-registration.ts:75 |
| <a id="property-redirecturis"></a> `redirectUris?` | `readonly` | readonly `string`[] | packages/security/src/oauth/dynamic-client-registration.ts:73 |
| <a id="property-scope"></a> `scope?` | `readonly` | `string` | packages/security/src/oauth/dynamic-client-registration.ts:74 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | packages/security/src/oauth/dynamic-client-registration.ts:79 |
| <a id="property-tokenendpointauthmethod"></a> `tokenEndpointAuthMethod?` | `readonly` | `string` | packages/security/src/oauth/dynamic-client-registration.ts:76 |
