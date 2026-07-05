[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / AgentCallOptions

# Interface: AgentCallOptions\&lt;TDeps\&gt;

Defined in: packages/agent/src/types.ts:426

Per-call options accepted by `agent.stream(...)` / `agent.run(...)`.

## Stable

## Type Parameters

| Type Parameter |
| ------ |
| `TDeps` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-capability"></a> `capability?` | `readonly` | `"read-only"` | Per-run capability restriction (D2) - overrides [AgentConfig.capability](/api/@graphorin/agent/interfaces/AgentConfig.md#property-capability) for this invocation. See that field for semantics. Not persisted in `RunState`: re-supply it when resuming a suspended run. | packages/agent/src/types.ts:443 |
| <a id="property-deps"></a> `deps?` | `readonly` | `TDeps` | - | packages/agent/src/types.ts:427 |
| <a id="property-directive"></a> `directive?` | `readonly` | [`ResumeDirective`](/api/@graphorin/agent/interfaces/ResumeDirective.md) | HITL resume directive. Supplied alongside a `RunState` to resolve any approvals that were pending when the previous `agent.run(...)` call suspended. | packages/agent/src/types.ts:436 |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | - | packages/agent/src/types.ts:429 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | - | packages/agent/src/types.ts:428 |
| <a id="property-userid"></a> `userId?` | `readonly` | `string` | - | packages/agent/src/types.ts:430 |
