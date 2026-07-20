[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / hasToolCall

# Function: hasToolCall()

```ts
function hasToolCall(toolName): StopCondition;
```

Defined in: packages/core/src/types/stop-condition.ts:43

**`Stable`**

Stop as soon as the most recent assistant message contains a tool call
with the given name.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `toolName` | `string` |

## Returns

[`StopCondition`](/api/@graphorin/core/interfaces/StopCondition.md)
