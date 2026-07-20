[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / OAuthStrategy

# Interface: OAuthStrategy

Defined in: packages/security/src/oauth/types.ts:293

**`Stable`**

Strategy hook contract for per-provider quirks (e.g. Slack
`client_secret` rotation, Linear refresh-token rotation per use).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | Match against `serverUrl` or `serverId`. | packages/security/src/oauth/types.ts:295 |
| <a id="property-matchid"></a> `matchId?` | `readonly` | `RegExp` | Optional regex applied to `serverId`. | packages/security/src/oauth/types.ts:299 |
| <a id="property-matchurl"></a> `matchUrl?` | `readonly` | `RegExp` | Optional regex applied to `serverUrl`. | packages/security/src/oauth/types.ts:297 |
| <a id="property-onrefreshfailure"></a> `onRefreshFailure?` | `readonly` | (`event`) => `void` \| `Promise`\&lt;`void`\&gt; | Called when a refresh fails. | packages/security/src/oauth/types.ts:306 |
| <a id="property-ontokenrotation"></a> `onTokenRotation?` | `readonly` | (`event`) => `void` \| `Promise`\&lt;`void`\&gt; | Called after a successful token rotation (refresh + DCR). Lets the strategy update the persisted registration / token refs. | packages/security/src/oauth/types.ts:304 |
