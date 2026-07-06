[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / runMemoryActivity

# Function: runMemoryActivity()

```ts
function runMemoryActivity(options?): Promise<MemoryActivityResult>;
```

Defined in: packages/cli/src/commands/memory.ts:471

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

`Promise`\<[`MemoryActivityResult`](/api/@graphorin/cli/interfaces/MemoryActivityResult.md)\>

## Stable
