[**Graphorin API reference v0.13.10**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [run-state](/api/@graphorin/agent/run-state/index.md) / completedToolCallsFromState

# Function: completedToolCallsFromState()

```ts
function completedToolCallsFromState(state): readonly CompletedToolCall<unknown>[];
```

Defined in: packages/agent/src/run-state/index.ts:643

**`Stable`**

The "tools used" surface of a completed run. Cheap to compute
from `RunState.steps`; surfaced as a stand-alone helper for
Phase 17 example apps and operator-facing dashboards.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | [`RunState`](/api/@graphorin/core/interfaces/RunState.md) |

## Returns

readonly [`CompletedToolCall`](/api/@graphorin/core/interfaces/CompletedToolCall.md)\&lt;`unknown`\&gt;[]
