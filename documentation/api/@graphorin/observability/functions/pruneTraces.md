[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / pruneTraces

# Function: pruneTraces()

```ts
function pruneTraces(opts): Promise<readonly string[]>;
```

Defined in: [packages/observability/src/replay/log.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/replay/log.ts#L58)

Remove every JSONL file that is older than the configured retention
window. Returns the deleted files for caller-side accounting.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`PruneTracesOptions`](/api/@graphorin/observability/interfaces/PruneTracesOptions.md) |

## Returns

`Promise`\&lt;readonly `string`[]\&gt;

## Stable
