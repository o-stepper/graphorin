[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / verdictIngestGate

# Function: verdictIngestGate()

```ts
function verdictIngestGate(record): boolean;
```

Defined in: packages/memory/src/consolidator/types.ts:50

**`Stable`**

The canonical verdict-driven ingest gate: excludes turns whose
persisted [SessionMessageRecord.verdict](/api/@graphorin/memory/interfaces/SessionMessageRecord.md#property-verdict) says an input/output
guardrail BLOCKED the turn or the lateral-leak defense withheld it.
Rewritten turns pass - the stored message already carries the
rewritten text. Records without a verdict pass untouched.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | [`SessionMessageRecord`](/api/@graphorin/memory/interfaces/SessionMessageRecord.md) |

## Returns

`boolean`
