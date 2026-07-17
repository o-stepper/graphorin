[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / LoginInteractiveOptions

# Interface: LoginInteractiveOptions

Defined in: [packages/security/src/oauth/library.ts:29](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/library.ts#L29)

Options accepted by [loginInteractive](/api/@graphorin/security/functions/loginInteractive.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-authorizecode"></a> `authorizeCode?` | `readonly` | [`AuthorizeCodeOptions`](/api/@graphorin/security/interfaces/AuthorizeCodeOptions.md) | Forwarded to the chosen flow. | [packages/security/src/oauth/library.ts:44](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/library.ts#L44) |
| <a id="property-authorizedevice"></a> `authorizeDevice?` | `readonly` | [`AuthorizeDeviceOptions`](/api/@graphorin/security/interfaces/AuthorizeDeviceOptions.md) | - | [packages/security/src/oauth/library.ts:45](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/library.ts#L45) |
| <a id="property-clientid"></a> `clientId?` | `readonly` | `string` | Pre-existing client identifier; skips DCR when supplied. | [packages/security/src/oauth/library.ts:41](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/library.ts#L41) |
| <a id="property-deviceflow"></a> `deviceFlow?` | `readonly` | `boolean` | Default `false` - Authorization Code is the default. | [packages/security/src/oauth/library.ts:39](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/library.ts#L39) |
| <a id="property-metadata"></a> `metadata?` | `readonly` | [`DiscoveredMetadata`](/api/@graphorin/security/interfaces/DiscoveredMetadata.md) | - | [packages/security/src/oauth/library.ts:46](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/library.ts#L46) |
| <a id="property-scope"></a> `scope?` | `readonly` | `string` | - | [packages/security/src/oauth/library.ts:42](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/library.ts#L42) |
| <a id="property-secretsstore"></a> `secretsStore?` | `readonly` | [`SecretsStore`](/api/@graphorin/core/interfaces/SecretsStore.md) | Secrets store the session tokens are persisted into (SPL-1) so the login survives the process. | [packages/security/src/oauth/library.ts:34](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/library.ts#L34) |
| <a id="property-serverid"></a> `serverId` | `readonly` | `string` | - | [packages/security/src/oauth/library.ts:35](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/library.ts#L35) |
| <a id="property-serverurl"></a> `serverUrl` | `readonly` | `string` | - | [packages/security/src/oauth/library.ts:36](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/library.ts#L36) |
| <a id="property-storage"></a> `storage` | `readonly` | [`OAuthServerStore`](/api/@graphorin/core/interfaces/OAuthServerStore.md) | - | [packages/security/src/oauth/library.ts:37](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/library.ts#L37) |
