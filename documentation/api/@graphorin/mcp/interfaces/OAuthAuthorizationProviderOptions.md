[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / OAuthAuthorizationProviderOptions

# Interface: OAuthAuthorizationProviderOptions

Defined in: packages/mcp/src/oauth/bridge.ts:25

Options accepted by [createOAuthAuthorizationProvider](/api/@graphorin/mcp/functions/createOAuthAuthorizationProvider.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-refreshaheadms"></a> `refreshAheadMs?` | `readonly` | `number` | Time-to-refresh window in milliseconds. When the session is within `refreshAheadMs` of expiry the provider triggers a refresh on the next request. Defaults to 5 minutes. | packages/mcp/src/oauth/bridge.ts:35 |
| <a id="property-serverid"></a> `serverId` | `readonly` | `string` | Stable identifier of the persisted OAuth server (`serverId`). | packages/mcp/src/oauth/bridge.ts:27 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | Optional per-request `AbortSignal` (forwarded to refresh). | packages/mcp/src/oauth/bridge.ts:37 |
| <a id="property-storage"></a> `storage` | `readonly` | [`OAuthServerStore`](/api/@graphorin/core/interfaces/OAuthServerStore.md) | Persistent storage. | packages/mcp/src/oauth/bridge.ts:29 |
