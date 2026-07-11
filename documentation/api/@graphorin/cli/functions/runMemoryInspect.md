[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / runMemoryInspect

# Function: runMemoryInspect()

```ts
function runMemoryInspect(options): Promise<MemoryInspectResult>;
```

Defined in: [packages/cli/src/commands/memory.ts:272](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L272)

`graphorin memory inspect <factId>` - surface everything the store
knows about one fact: its retrieval-trust status + provenance, the
full bi-temporal supersede chain it belongs to, the audit-log events
recorded against it, the conflict decisions that referenced it, and
the (quarantined) insights that cite it. Pure read-only inspection.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`MemoryInspectOptions`](/api/@graphorin/cli/interfaces/MemoryInspectOptions.md) |

## Returns

`Promise`\&lt;[`MemoryInspectResult`](/api/@graphorin/cli/interfaces/MemoryInspectResult.md)\&gt;

## Stable
