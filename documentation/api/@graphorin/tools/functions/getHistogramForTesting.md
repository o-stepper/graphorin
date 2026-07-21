[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / getHistogramForTesting

# Function: getHistogramForTesting()

```ts
function getHistogramForTesting(name, labels?): readonly number[];
```

Defined in: packages/tools/src/audit/counters.ts:170

**`Experimental`**

Read a single histogram observation list (returns `[]` when absent).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| `labels?` | `Readonly`\<`Record`\&lt;`string`, `string` \| `number` \| `boolean`\&gt;\> |

## Returns

readonly `number`[]
