[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / runConsolidatorDlqClear

# Function: runConsolidatorDlqClear()

```ts
function runConsolidatorDlqClear(options?): Promise<ConsolidatorDlqClearResult>;
```

Defined in: [packages/cli/src/commands/consolidator.ts:315](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/consolidator.ts#L315)

W-065: clear dead-letter batches. Defaults are conservative:
exhausted-only, all users, no age bound. The batch payload (message
ids) is lost on delete - that is the explicit point of the command.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`ConsolidatorDlqClearOptions`](/api/@graphorin/cli/interfaces/ConsolidatorDlqClearOptions.md) |

## Returns

`Promise`\&lt;[`ConsolidatorDlqClearResult`](/api/@graphorin/cli/interfaces/ConsolidatorDlqClearResult.md)\&gt;

## Stable
