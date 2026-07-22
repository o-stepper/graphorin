[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / trajectoryFromRunState

# Function: trajectoryFromRunState()

```ts
function trajectoryFromRunState(run): Trajectory;
```

Defined in: packages/memory/src/consolidator/phases/induce.ts:299

Distil a [RunState](/api/@graphorin/core/interfaces/RunState.md) into the minimal [Trajectory](/api/@graphorin/memory/interfaces/Trajectory.md) the inducer
needs. Pure - consumes the agent's already-emitted run state, so capturing
a trajectory + its success signal needs no agent-loop change. The success
signal is `status === 'completed'`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `run` | [`RunState`](/api/@graphorin/core/interfaces/RunState.md) |

## Returns

[`Trajectory`](/api/@graphorin/memory/interfaces/Trajectory.md)
