[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / run-state

# run-state

`RunState` JSON serialization and rehydration.

The on-disk shape carries an explicit `version` field so future
schema bumps can detect older payloads. v0.1 ships
`'graphorin-run-state/1.0'` - additive fields that older readers
do not understand are ignored under the lenient-forward-parse
discipline.

## Interfaces

| Interface | Description |
| ------ | ------ |
| [SerializedPendingSubRun](/api/@graphorin/agent/run-state/interfaces/SerializedPendingSubRun.md) | Serialized twin of core's `PendingSubRun`: the parked child state travels as its own versioned [SerializedRunState](/api/@graphorin/agent/run-state/interfaces/SerializedRunState.md). |
| [SerializedRunState](/api/@graphorin/agent/run-state/interfaces/SerializedRunState.md) | On-disk payload returned by [serializeRunState](/api/@graphorin/agent/run-state/functions/serializeRunState.md) and accepted by [deserializeRunState](/api/@graphorin/agent/run-state/functions/deserializeRunState.md). The shape is JSON-stable: binary message/tool-outcome payloads appear in their `WireMessage` / `WireRunStep` (base64 / href envelope) form. |
| [SerializeRunStateOptions](/api/@graphorin/agent/run-state/interfaces/SerializeRunStateOptions.md) | Options accepted by [serializeRunState](/api/@graphorin/agent/run-state/functions/serializeRunState.md). |

## Variables

| Variable | Description |
| ------ | ------ |
| [RUN\_STATE\_SCHEMA\_MAJOR\_SUPPORTED](/api/@graphorin/agent/run-state/variables/RUN_STATE_SCHEMA_MAJOR_SUPPORTED.md) | Reader-supported schema id range. Major version 1 only for v0.1. |
| [RUN\_STATE\_SCHEMA\_VERSION](/api/@graphorin/agent/run-state/variables/RUN_STATE_SCHEMA_VERSION.md) | Canonical schema id for serialized [RunState](/api/@graphorin/core/interfaces/RunState.md) payloads. |

## Functions

| Function | Description |
| ------ | ------ |
| [addModelUsage](/api/@graphorin/agent/run-state/functions/addModelUsage.md) | Append a per-model usage entry to [RunState.usageByModel](/api/@graphorin/core/interfaces/RunState.md#property-usagebymodel). Mutates the supplied state in place - used by the agent runtime's per-step retry loop. Pure callers that need an immutable update should clone the state first. |
| [aggregateUsageFromByModel](/api/@graphorin/agent/run-state/functions/aggregateUsageFromByModel.md) | Recompute the aggregate usage from `usageByModel`. Returns the sum that callers can compare against `state.usage` to verify the per-step retry loop maintained the documented invariant. |
| [completedToolCallsFromState](/api/@graphorin/agent/run-state/functions/completedToolCallsFromState.md) | The "tools used" surface of a completed run. Cheap to compute from `RunState.steps`; surfaced as a stand-alone helper for Phase 17 example apps and operator-facing dashboards. |
| [createInitialRunState](/api/@graphorin/agent/run-state/functions/createInitialRunState.md) | Build a fresh, minimal [RunState](/api/@graphorin/core/interfaces/RunState.md) for a new run. Helper used by `createAgent({...})` so consumers can construct deterministic run state in tests. |
| [deserializeRunState](/api/@graphorin/agent/run-state/functions/deserializeRunState.md) | Rehydrate a [RunState](/api/@graphorin/core/interfaces/RunState.md) from the on-disk payload. Throws [RunStateVersionUnsupportedError](/api/@graphorin/agent/errors/classes/RunStateVersionUnsupportedError.md) when the payload version is from a future major; throws [RunStateMalformedError](/api/@graphorin/agent/errors/classes/RunStateMalformedError.md) when the payload is structurally invalid. |
| [runStateFromJSON](/api/@graphorin/agent/run-state/functions/runStateFromJSON.md) | Convenience JSON-string parser pairing with [runStateToJSON](/api/@graphorin/agent/run-state/functions/runStateToJSON.md). |
| [runStateToJSON](/api/@graphorin/agent/run-state/functions/runStateToJSON.md) | Render the canonical JSON string representation of the supplied [RunState](/api/@graphorin/core/interfaces/RunState.md). `JSON.stringify(serializeRunState(state))` - provided as a convenience. |
| [serializeRunState](/api/@graphorin/agent/run-state/functions/serializeRunState.md) | Render a JSON-stable snapshot of the supplied [RunState](/api/@graphorin/core/interfaces/RunState.md). The returned value is plain JSON (no `Map`, `Set`, `Date`, ...). |
