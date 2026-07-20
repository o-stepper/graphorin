[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / LoginInteractiveOptions

# Interface: LoginInteractiveOptions

Defined in: packages/security/src/oauth/library.ts:29

**`Stable`**

Options accepted by [loginInteractive](/api/@graphorin/security/functions/loginInteractive.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-authorizecode"></a> `authorizeCode?` | `readonly` | [`AuthorizeCodeOptions`](/api/@graphorin/security/interfaces/AuthorizeCodeOptions.md) | Forwarded to the chosen flow. | packages/security/src/oauth/library.ts:44 |
| <a id="property-authorizedevice"></a> `authorizeDevice?` | `readonly` | [`AuthorizeDeviceOptions`](/api/@graphorin/security/interfaces/AuthorizeDeviceOptions.md) | - | packages/security/src/oauth/library.ts:45 |
| <a id="property-clientid"></a> `clientId?` | `readonly` | `string` | Pre-existing client identifier; skips DCR when supplied. | packages/security/src/oauth/library.ts:41 |
| <a id="property-deviceflow"></a> `deviceFlow?` | `readonly` | `boolean` | Default `false` - Authorization Code is the default. | packages/security/src/oauth/library.ts:39 |
| <a id="property-metadata"></a> `metadata?` | `readonly` | [`DiscoveredMetadata`](/api/@graphorin/security/interfaces/DiscoveredMetadata.md) | - | packages/security/src/oauth/library.ts:46 |
| <a id="property-scope"></a> `scope?` | `readonly` | `string` | - | packages/security/src/oauth/library.ts:42 |
| <a id="property-secretsstore"></a> `secretsStore?` | `readonly` | [`SecretsStore`](/api/@graphorin/core/interfaces/SecretsStore.md) | Secrets store the session tokens are persisted into so the login survives the process. | packages/security/src/oauth/library.ts:34 |
| <a id="property-serverid"></a> `serverId` | `readonly` | `string` | - | packages/security/src/oauth/library.ts:35 |
| <a id="property-serverurl"></a> `serverUrl` | `readonly` | `string` | - | packages/security/src/oauth/library.ts:36 |
| <a id="property-storage"></a> `storage` | `readonly` | [`OAuthServerStore`](/api/@graphorin/core/interfaces/OAuthServerStore.md) | - | packages/security/src/oauth/library.ts:37 |
