[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / mcpAuthLogin

# Function: mcpAuthLogin()

```ts
function mcpAuthLogin(options): Promise<LoginInteractiveResult>;
```

Defined in: [packages/mcp/src/oauth/library.ts:27](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/oauth/library.ts#L27)

Drive `graphorin auth login --mcp <id>`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`LoginInteractiveOptions`](/api/@graphorin/security/interfaces/LoginInteractiveOptions.md) |

## Returns

`Promise`\&lt;[`LoginInteractiveResult`](/api/@graphorin/security/interfaces/LoginInteractiveResult.md)\&gt;
