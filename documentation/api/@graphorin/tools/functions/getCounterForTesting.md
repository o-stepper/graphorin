[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / getCounterForTesting

# Function: getCounterForTesting()

```ts
function getCounterForTesting(name, labels?): number;
```

Defined in: packages/tools/src/audit/counters.ts:158

**`Experimental`**

Read a single counter (returns `0` when absent). Used by tests to
make assertions on specific counter increments.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| `labels?` | `Readonly`\<`Record`\&lt;`string`, `string` \| `number` \| `boolean`\&gt;\> |

## Returns

`number`
