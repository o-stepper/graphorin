[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / partitionBySensitivity

# Function: partitionBySensitivity()

```ts
function partitionBySensitivity<TRecord>(records, context): PartitionResult<TRecord>;
```

Defined in: packages/memory/src/context-engine/privacy-filter.ts:165

Partition a record list against the supplied filter context.

## Type Parameters

| Type Parameter |
| ------ |
| `TRecord` *extends* \{ `sensitivity?`: [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md); \} |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `records` | readonly `TRecord`[] |
| `context` | [`PrivacyFilterContext`](/api/@graphorin/memory/interfaces/PrivacyFilterContext.md) |

## Returns

[`PartitionResult`](/api/@graphorin/memory/interfaces/PartitionResult.md)\&lt;`TRecord`\&gt;

## Stable
