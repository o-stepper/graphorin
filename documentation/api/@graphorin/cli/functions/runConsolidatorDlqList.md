[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / runConsolidatorDlqList

# Function: runConsolidatorDlqList()

```ts
function runConsolidatorDlqList(options?): Promise<readonly ConsolidatorDlqEntry[]>;
```

Defined in: packages/cli/src/commands/consolidator.ts:232

**`Stable`**

Make the permanent `dead-letter queue: N` status warning
actionable. Operator-level (DB-wide) view, like the `dlqSize`
counter in `runConsolidatorStatus` - `listFailedBatches` on the
store is scoped to one `SessionScope.userId`, which a CLI does not
have; use `--user` to narrow.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`ConsolidatorDlqListOptions`](/api/@graphorin/cli/interfaces/ConsolidatorDlqListOptions.md) |

## Returns

`Promise`\&lt;readonly [`ConsolidatorDlqEntry`](/api/@graphorin/cli/interfaces/ConsolidatorDlqEntry.md)[]\&gt;
