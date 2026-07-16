[**Graphorin API reference v0.10.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [fanout](/api/@graphorin/agent/fanout/index.md) / runFanOut

# Function: runFanOut()

```ts
function runFanOut<TOutput>(opts): Promise<FanOutResult<TOutput>>;
```

Defined in: [packages/agent/src/fanout/index.ts:361](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/fanout/index.ts#L361)

Run a fan-out and produce the aggregate [FanOutResult](/api/@graphorin/agent/fanout/interfaces/FanOutResult.md).
Pure with respect to side effects - the runtime emits events /
audit rows / counter increments via the supplied `emit` callback.

## Type Parameters

| Type Parameter |
| ------ |
| `TOutput` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`FanOutOptions`](/api/@graphorin/agent/fanout/interfaces/FanOutOptions.md)\&lt;`TOutput`\&gt; |

## Returns

`Promise`\<[`FanOutResult`](/api/@graphorin/agent/fanout/interfaces/FanOutResult.md)\&lt;`TOutput`\&gt;\>

## Stable
