[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / OAuthAuthorizationProvider

# Interface: OAuthAuthorizationProvider

Defined in: packages/mcp/src/oauth/bridge.ts:52

**`Stable`**

Live authorization-header provider returned by
[createOAuthAuthorizationProvider](/api/@graphorin/mcp/functions/createOAuthAuthorizationProvider.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-serverid"></a> `serverId` | `readonly` | `string` | Persist the most recently observed expiry timestamp. | packages/mcp/src/oauth/bridge.ts:58 |

## Methods

### refresh()

```ts
refresh(): Promise<OAuthSession>;
```

Defined in: packages/mcp/src/oauth/bridge.ts:56

Force a refresh, regardless of expiry.

#### Returns

`Promise`\&lt;[`OAuthSession`](/api/@graphorin/security/interfaces/OAuthSession.md)\&gt;

***

### resolveHeader()

```ts
resolveHeader(): Promise<string>;
```

Defined in: packages/mcp/src/oauth/bridge.ts:54

Resolve an `Authorization: Bearer ...` header.

#### Returns

`Promise`\&lt;`string`\&gt;
