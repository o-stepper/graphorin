[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / incrementCounter

# Function: incrementCounter()

```ts
function incrementCounter(
   name, 
   labels?, 
   by?): void;
```

Defined in: packages/tools/src/audit/counters.ts:58

**`Stable`**

Increment a counter (or initialise to `1`). Multi-label invocations
are keyed by sorted label name + value pairs to keep the snapshot
deterministic.

## Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `name` | `string` | `undefined` |
| `labels?` | `Readonly`\<`Record`\&lt;`string`, `string` \| `number` \| `boolean`\&gt;\> | `undefined` |
| `by?` | `number` | `1` |

## Returns

`void`
