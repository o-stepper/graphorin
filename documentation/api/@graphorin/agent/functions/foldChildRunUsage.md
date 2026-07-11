[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / foldChildRunUsage

# Function: foldChildRunUsage()

```ts
function foldChildRunUsage(
   state, 
   usageAcc, 
   childState, 
   childName): void;
```

Defined in: [packages/agent/src/runtime/messages.ts:256](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/runtime/messages.ts#L256)

Fold a completed (or failed - tokens were spent either way) child
run's usage into the parent run's accounting: `state.usage`,
`state.usageByModel` and the run's [UsageAccumulator](/api/@graphorin/core/interfaces/UsageAccumulator.md) (W-033).
Children carrying a per-model breakdown fold model-by-model (each
child model entry counts as one attempt on the parent); a child
without `usageByModel` folds its aggregate under the synthetic id
`sub-agent:<name>`, skipped entirely when all-zero so phantom
entries never appear.

Must be called exactly once per child run at exactly one seam -
a second call double-counts (pinned by test).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | [`RunState`](/api/@graphorin/core/interfaces/RunState.md) |
| `usageAcc` | \| [`UsageAccumulator`](/api/@graphorin/core/interfaces/UsageAccumulator.md) \| `undefined` |
| `childState` | [`RunState`](/api/@graphorin/core/interfaces/RunState.md) |
| `childName` | `string` |

## Returns

`void`
