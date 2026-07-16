[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / runMemoryActivity

# Function: runMemoryActivity()

```ts
function runMemoryActivity(options?): Promise<MemoryActivityResult>;
```

Defined in: [packages/cli/src/commands/memory.ts:601](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L601)

`graphorin memory activity` - a store-wide view of what the
consolidator and reflection passes have been doing: how many facts /
episodes / insights currently sit in quarantine, the most recent
audit-log events (supersede / validate / quarantine / archive), and
the most recent conflict decisions. Pure read-only inspection.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`MemoryActivityOptions`](/api/@graphorin/cli/interfaces/MemoryActivityOptions.md) |

## Returns

`Promise`\&lt;[`MemoryActivityResult`](/api/@graphorin/cli/interfaces/MemoryActivityResult.md)\&gt;

## Stable
