[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / isStepCount

# Function: isStepCount()

```ts
function isStepCount(n): StopCondition;
```

Defined in: packages/core/src/types/stop-condition.ts:27

**`Stable`**

Stop after `n` total steps (`stepNumber >= n`). The default condition
for the agent runtime is `isStepCount(50)`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `n` | `number` |

## Returns

[`StopCondition`](/api/@graphorin/core/interfaces/StopCondition.md)
