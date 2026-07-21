[**Graphorin API reference v0.13.11**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [run-state](/api/@graphorin/agent/run-state/index.md) / addModelUsage

# Function: addModelUsage()

```ts
function addModelUsage(
   state, 
   modelId, 
   delta): void;
```

Defined in: packages/agent/src/run-state/index.ts:547

**`Stable`**

Append a per-model usage entry to [RunState.usageByModel](/api/@graphorin/core/interfaces/RunState.md#property-usagebymodel).
Mutates the supplied state in place - used by the agent runtime's
per-step retry loop. Pure callers that need an immutable update
should clone the state first.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | [`RunState`](/api/@graphorin/core/interfaces/RunState.md) |
| `modelId` | `string` |
| `delta` | [`Usage`](/api/@graphorin/core/interfaces/Usage.md) |

## Returns

`void`
