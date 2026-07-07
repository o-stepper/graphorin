[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / countMessageTokens

# Function: countMessageTokens()

```ts
function countMessageTokens(messages, counter): Promise<number>;
```

Defined in: [packages/memory/src/context-engine/token-counter.ts:97](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/token-counter.ts#L97)

Count tokens across a message list using a [TokenCounter](/api/@graphorin/core/interfaces/TokenCounter.md)
(or the heuristic fallback). Used by the trigger-evaluation hot
path of the auto-compaction subsystem (RB-46) at the top of every
step.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `messages` | readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[] |
| `counter` | \| [`ContextTokenCounter`](/api/@graphorin/memory/interfaces/ContextTokenCounter.md) \| [`TokenCounter`](/api/@graphorin/core/interfaces/TokenCounter.md) |

## Returns

`Promise`\&lt;`number`\&gt;

## Stable
