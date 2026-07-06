[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / PhaseListener

# Type Alias: PhaseListener

```ts
type PhaseListener = (outcome) => void;
```

Defined in: packages/memory/src/consolidator/types.ts:350

Listener callback subscribed via
[Consolidator.onPhaseFinished](/api/@graphorin/memory/interfaces/Consolidator.md#onphasefinished). Useful for tests + observers.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `outcome` | [`PhaseOutcome`](/api/@graphorin/memory/interfaces/PhaseOutcome.md) & \{ `scope`: [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md); `trigger`: [`ConsolidatorTriggerReason`](/api/@graphorin/memory/interfaces/ConsolidatorTriggerReason.md); \} |

## Returns

`void`

## Stable
