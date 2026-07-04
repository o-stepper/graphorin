[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentResult

# Interface: AgentResult\&lt;TOutput\&gt;

Defined in: packages/core/src/types/agent-event.ts:521

Final result of an agent run-loop invocation, returned by
`agent.run(...)` and carried by the `agent.end` event.

A failed run **resolves** with `status: 'failed'` and the error in
`error` — `agent.run(...)` does not reject on run failure (only on
configuration/usage errors thrown before the loop starts). A suspended
run resolves with `status: 'awaiting_approval'` and a resumable
`state` (AG-9).

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TOutput` | `string` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-error"></a> `error?` | `readonly` | [`RunError`](/api/@graphorin/core/interfaces/RunError.md) | Populated when the run failed; mirrors `RunState.error`. | packages/core/src/types/agent-event.ts:527 |
| <a id="property-output"></a> `output` | `readonly` | `TOutput` | - | packages/core/src/types/agent-event.ts:522 |
| <a id="property-state"></a> `state` | `readonly` | [`RunState`](/api/@graphorin/core/interfaces/RunState.md) | The run's final state. Resumable when `status === 'awaiting_approval'` — pass it back to `agent.run(...)` / `agent.stream(...)` (optionally round-tripped through `runStateToJSON`/`runStateFromJSON` for durability). Treat as an immutable snapshot. | packages/core/src/types/agent-event.ts:534 |
| <a id="property-status"></a> `status` | `readonly` | [`RunStatus`](/api/@graphorin/core/type-aliases/RunStatus.md) | Terminal status of this run-loop invocation. | packages/core/src/types/agent-event.ts:525 |
| <a id="property-usage"></a> `usage` | `readonly` | [`Usage`](/api/@graphorin/core/interfaces/Usage.md) | - | packages/core/src/types/agent-event.ts:523 |
