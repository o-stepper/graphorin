[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / createReplayProvider

# Function: createReplayProvider()

```ts
function createReplayProvider(state, options?): Provider;
```

Defined in: [packages/agent/src/testing/replay-provider.ts:37](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/testing/replay-provider.ts#L37)

Build a Provider that serves the journaled step responses in order.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | [`RunState`](/api/@graphorin/core/interfaces/RunState.md) |
| `options` | [`ReplayProviderOptions`](/api/@graphorin/agent/interfaces/ReplayProviderOptions.md) |

## Returns

[`Provider`](/api/@graphorin/core/interfaces/Provider.md)

## Stable
