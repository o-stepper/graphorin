[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / runTokenRotate

# Function: runTokenRotate()

```ts
function runTokenRotate(options): Promise<TokenCreateResult>;
```

Defined in: [packages/cli/src/commands/token.ts:205](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/token.ts#L205)

Revoke an existing token and immediately mint a fresh one with the
same scopes. Returns the new raw token bytes once.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`TokenRotateOptions`](/api/@graphorin/cli/interfaces/TokenRotateOptions.md) |

## Returns

`Promise`\&lt;[`TokenCreateResult`](/api/@graphorin/cli/interfaces/TokenCreateResult.md)\&gt;

## Stable
