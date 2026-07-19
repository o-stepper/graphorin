[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / pause

# Function: pause()

```ts
function pause<TValue, TResume>(value): TResume;
```

Defined in: packages/core/src/channels/pause.ts:181

**`Stable`**

Programmatically suspend the current workflow node. The `value` is
surfaced to callers via the `WorkflowSuspendedEvent.value` field; the
eventual `Directive({ resume })` is delivered as the return value of
this call once the runtime resumes the thread.

Implementation note: when the call is made outside a runtime-managed
resume scope, `pause(...)` throws a fresh [PauseSignal](/api/@graphorin/core/classes/PauseSignal.md) so the
engine can catch it, persist state, and suspend. When the runtime
later resumes the node body, it wraps the second invocation in
[runWithPauseResume](/api/@graphorin/core/functions/runWithPauseResume.md), which causes the same `pause(...)` call to
return the operator-supplied resume value instead of throwing.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TValue` | - |
| `TResume` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TValue` |

## Returns

`TResume`
