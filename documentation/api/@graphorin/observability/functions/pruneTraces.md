[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / pruneTraces

# Function: pruneTraces()

```ts
function pruneTraces(opts): Promise<readonly string[]>;
```

Defined in: packages/observability/src/replay/log.ts:58

**`Stable`**

Remove every JSONL file that is older than the configured retention
window. Returns the deleted files for caller-side accounting.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`PruneTracesOptions`](/api/@graphorin/observability/interfaces/PruneTracesOptions.md) |

## Returns

`Promise`\&lt;readonly `string`[]\&gt;
