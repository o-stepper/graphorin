[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / mcpAuthStatus

# Function: mcpAuthStatus()

```ts
function mcpAuthStatus(storage): Promise<OAuthStatusSnapshot>;
```

Defined in: [packages/mcp/src/oauth/library.ts:59](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/oauth/library.ts#L59)

Drive `graphorin auth status --mcp`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `storage` | [`OAuthServerStore`](/api/@graphorin/core/interfaces/OAuthServerStore.md) |

## Returns

`Promise`\&lt;[`OAuthStatusSnapshot`](/api/@graphorin/security/interfaces/OAuthStatusSnapshot.md)\&gt;
