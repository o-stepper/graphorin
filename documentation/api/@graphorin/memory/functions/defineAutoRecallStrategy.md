[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / defineAutoRecallStrategy

# Function: defineAutoRecallStrategy()

```ts
function defineAutoRecallStrategy(opts): AutoRecallStrategy & {
  id: string;
};
```

Defined in: [packages/memory/src/context-engine/auto-recall.ts:73](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/auto-recall.ts#L73)

Builder for application-supplied custom strategies. Accepts a
raw function and returns a tagged version so the engine can
surface the strategy name on spans.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | \{ `evaluate`: [`AutoRecallStrategy`](/api/@graphorin/memory/type-aliases/AutoRecallStrategy.md); `id`: `string`; \} |
| `opts.evaluate` | [`AutoRecallStrategy`](/api/@graphorin/memory/type-aliases/AutoRecallStrategy.md) |
| `opts.id` | `string` |

## Returns

[`AutoRecallStrategy`](/api/@graphorin/memory/type-aliases/AutoRecallStrategy.md) & \{
  `id`: `string`;
\}

## Stable
