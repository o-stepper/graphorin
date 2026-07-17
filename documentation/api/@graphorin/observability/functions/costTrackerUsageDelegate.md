[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / costTrackerUsageDelegate

# Function: costTrackerUsageDelegate()

```ts
function costTrackerUsageDelegate(tracker, ids): (info) => void;
```

Defined in: [packages/observability/src/cost/delegate.ts:63](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/cost/delegate.ts#L63)

Build an `onUsage` callback that records into `tracker`. Pass either
static ids (a provider instance bound to one session) or a resolver
invoked per call (a shared provider serving many runs). A zero
`costUsd` records token figures WITHOUT a cost so a price-less
middleware does not fabricate a $0 USD cost entry.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `tracker` | `Pick`\&lt;[`CostTracker`](/api/@graphorin/observability/interfaces/CostTracker.md), `"record"`\&gt; |
| `ids` | \| [`CostTrackerDelegateIds`](/api/@graphorin/observability/type-aliases/CostTrackerDelegateIds.md) \| ((`info`) => [`CostTrackerDelegateIds`](/api/@graphorin/observability/type-aliases/CostTrackerDelegateIds.md)) |

## Returns

(`info`) => `void`

## Stable
