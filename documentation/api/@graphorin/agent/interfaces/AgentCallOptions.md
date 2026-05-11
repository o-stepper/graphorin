[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / AgentCallOptions

# Interface: AgentCallOptions\&lt;TDeps\&gt;

Defined in: packages/agent/src/types.ts:215

Per-call options accepted by `agent.stream(...)` / `agent.run(...)`.

## Stable

## Type Parameters

| Type Parameter |
| ------ |
| `TDeps` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-deps"></a> `deps?` | `readonly` | `TDeps` | - | packages/agent/src/types.ts:216 |
| <a id="property-directive"></a> `directive?` | `readonly` | [`ResumeDirective`](/api/@graphorin/agent/interfaces/ResumeDirective.md) | HITL resume directive. Supplied alongside a `RunState` to resolve any approvals that were pending when the previous `agent.run(...)` call suspended. | packages/agent/src/types.ts:225 |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | - | packages/agent/src/types.ts:218 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | - | packages/agent/src/types.ts:217 |
| <a id="property-userid"></a> `userId?` | `readonly` | `string` | - | packages/agent/src/types.ts:219 |
