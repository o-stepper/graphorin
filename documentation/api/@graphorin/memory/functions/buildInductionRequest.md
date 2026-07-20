[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / buildInductionRequest

# Function: buildInductionRequest()

```ts
function buildInductionRequest(trajectory, options?): ProviderRequest;
```

Defined in: packages/memory/src/consolidator/phases/induce.ts:136

Build the (pure) induction request. Renders the trajectory as numbered
steps; caps the rendered steps to keep the prompt bounded.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `trajectory` | [`Trajectory`](/api/@graphorin/memory/interfaces/Trajectory.md) |
| `options` | [`WorkflowInductionOptions`](/api/@graphorin/memory/interfaces/WorkflowInductionOptions.md) |

## Returns

[`ProviderRequest`](/api/@graphorin/core/interfaces/ProviderRequest.md)
