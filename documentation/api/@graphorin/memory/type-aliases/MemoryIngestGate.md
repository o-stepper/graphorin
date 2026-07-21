[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / MemoryIngestGate

# Type Alias: MemoryIngestGate

```ts
type MemoryIngestGate = (record) => boolean;
```

Defined in: packages/memory/src/consolidator/types.ts:39

**`Stable`**

Deterministic pre-extraction admission gate. Runs on
every fetched [SessionMessageRecord](/api/@graphorin/memory/interfaces/SessionMessageRecord.md) BEFORE noise filtering on
both consolidator batch paths (runtime dispatch pre-fetch and the
standard phase's self-fetch). Return `true` to admit the record
into extraction. Excluded records still advance the idempotency
cursor - a blocked turn can never wedge consolidation. A throwing
gate excludes the record (fail-closed).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | [`SessionMessageRecord`](/api/@graphorin/memory/interfaces/SessionMessageRecord.md) |

## Returns

`boolean`
