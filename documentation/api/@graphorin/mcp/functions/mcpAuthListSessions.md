[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / mcpAuthListSessions

# Function: mcpAuthListSessions()

```ts
function mcpAuthListSessions(storage): Promise<readonly OAuthSessionMetadata[]>;
```

Defined in: [packages/mcp/src/oauth/library.ts:34](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/oauth/library.ts#L34)

Drive `graphorin auth list --mcp`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `storage` | [`OAuthServerStore`](/api/@graphorin/core/interfaces/OAuthServerStore.md) |

## Returns

`Promise`\&lt;readonly [`OAuthSessionMetadata`](/api/@graphorin/security/interfaces/OAuthSessionMetadata.md)[]\&gt;
