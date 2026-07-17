[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / mcpAuthRevoke

# Function: mcpAuthRevoke()

```ts
function mcpAuthRevoke(
   storage, 
   serverId, 
options?): Promise<void>;
```

Defined in: [packages/mcp/src/oauth/library.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/oauth/library.ts#L55)

Drive `graphorin auth revoke --mcp <id>`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `storage` | [`OAuthServerStore`](/api/@graphorin/core/interfaces/OAuthServerStore.md) | - |
| `serverId` | `string` | - |
| `options` | \{ `reason?`: `string`; `secretsStore?`: [`SecretsStore`](/api/@graphorin/core/interfaces/SecretsStore.md); `signal?`: `AbortSignal`; \} | - |
| `options.reason?` | `string` | - |
| `options.secretsStore?` | [`SecretsStore`](/api/@graphorin/core/interfaces/SecretsStore.md) | SPL-1: resolves the persisted tokens so RFC 7009 actually fires. |
| `options.signal?` | `AbortSignal` | - |

## Returns

`Promise`\&lt;`void`\&gt;
