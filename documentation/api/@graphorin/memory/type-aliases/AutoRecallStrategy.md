[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / AutoRecallStrategy

# Type Alias: AutoRecallStrategy

```ts
type AutoRecallStrategy = (ctx) => AutoRecallTriggerResult;
```

Defined in: packages/memory/src/context-engine/auto-recall.ts:43

**`Stable`**

Pluggable strategy signature.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `ctx` | [`AutoRecallStrategyContext`](/api/@graphorin/memory/interfaces/AutoRecallStrategyContext.md) |

## Returns

[`AutoRecallTriggerResult`](/api/@graphorin/memory/interfaces/AutoRecallTriggerResult.md)
