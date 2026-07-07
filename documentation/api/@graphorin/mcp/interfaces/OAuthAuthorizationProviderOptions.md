[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / OAuthAuthorizationProviderOptions

# Interface: OAuthAuthorizationProviderOptions

Defined in: [packages/mcp/src/oauth/bridge.ts:25](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/oauth/bridge.ts#L25)

Options accepted by [createOAuthAuthorizationProvider](/api/@graphorin/mcp/functions/createOAuthAuthorizationProvider.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-refreshaheadms"></a> `refreshAheadMs?` | `readonly` | `number` | Time-to-refresh window in milliseconds. When the session is within `refreshAheadMs` of expiry the provider triggers a refresh on the next request. Defaults to 5 minutes. | [packages/mcp/src/oauth/bridge.ts:40](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/oauth/bridge.ts#L40) |
| <a id="property-secretsstore"></a> `secretsStore?` | `readonly` | [`SecretsStore`](/api/@graphorin/core/interfaces/SecretsStore.md) | Secrets store the persisted tokens resolve from (SPL-1) - with it, the bridge issues Authorization headers across process restarts. | [packages/mcp/src/oauth/bridge.ts:30](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/oauth/bridge.ts#L30) |
| <a id="property-serverid"></a> `serverId` | `readonly` | `string` | Stable identifier of the persisted OAuth server (`serverId`). | [packages/mcp/src/oauth/bridge.ts:32](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/oauth/bridge.ts#L32) |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | Optional per-request `AbortSignal` (forwarded to refresh). | [packages/mcp/src/oauth/bridge.ts:42](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/oauth/bridge.ts#L42) |
| <a id="property-storage"></a> `storage` | `readonly` | [`OAuthServerStore`](/api/@graphorin/core/interfaces/OAuthServerStore.md) | Persistent storage. | [packages/mcp/src/oauth/bridge.ts:34](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/oauth/bridge.ts#L34) |
