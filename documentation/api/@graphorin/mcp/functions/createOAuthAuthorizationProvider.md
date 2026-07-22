[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / createOAuthAuthorizationProvider

# Function: createOAuthAuthorizationProvider()

```ts
function createOAuthAuthorizationProvider(options): OAuthAuthorizationProvider;
```

Defined in: packages/mcp/src/oauth/bridge.ts:76

**`Stable`**

Build a provider that resolves the `Authorization` header value the
Streamable HTTP / SSE MCP transports send on every request.

The provider:

1. Loads the persisted session metadata from the supplied store.
2. Refreshes the session when it is within `refreshAheadMs` of
   expiry.
3. Wraps every refresh failure in [MCPAuthError](/api/@graphorin/mcp/errors/classes/MCPAuthError.md) carrying a
   `hint` that points the operator to the upcoming
   `graphorin auth refresh` CLI.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`OAuthAuthorizationProviderOptions`](/api/@graphorin/mcp/interfaces/OAuthAuthorizationProviderOptions.md) |

## Returns

[`OAuthAuthorizationProvider`](/api/@graphorin/mcp/interfaces/OAuthAuthorizationProvider.md)
