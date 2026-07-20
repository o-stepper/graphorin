[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / setGlobalTokenCounter

# Function: setGlobalTokenCounter()

```ts
function setGlobalTokenCounter(counter): void;
```

Defined in: packages/provider/src/counters/global.ts:19

**`Stable`**

Set the process-global counter. Called once at startup by user
code; passing `null` clears the slot.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `counter` | \| [`TokenCounter`](/api/@graphorin/core/interfaces/TokenCounter.md) \| `null` |

## Returns

`void`
