[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / TerminalRunInfo

# Interface: TerminalRunInfo

Defined in: packages/server/src/runtime/run-state.ts:65

**`Stable`**

Payload handed to the [RunStateTracker](/api/@graphorin/server/classes/RunStateTracker.md) `onTerminal` callback
the first time a run reaches a terminal state. The server turns this into
the `graphorin_agent_runs_total` counter + `graphorin_agent_run_duration_seconds`
summary. `durationMs` is omitted for a run that was aborted before it ever
started (no meaningful wall-clock).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-durationms"></a> `durationMs?` | `readonly` | `number` | packages/server/src/runtime/run-state.ts:68 |
| <a id="property-kind"></a> `kind` | `readonly` | [`RunKind`](/api/@graphorin/server/type-aliases/RunKind.md) | packages/server/src/runtime/run-state.ts:67 |
| <a id="property-status"></a> `status` | `readonly` | [`TerminalRunStatus`](/api/@graphorin/server/type-aliases/TerminalRunStatus.md) | packages/server/src/runtime/run-state.ts:66 |
