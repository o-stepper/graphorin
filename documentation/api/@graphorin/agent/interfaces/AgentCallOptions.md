[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / AgentCallOptions

# Interface: AgentCallOptions\&lt;TDeps\&gt;

Defined in: [packages/agent/src/types.ts:571](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L571)

Per-call options accepted by `agent.stream(...)` / `agent.run(...)`.

## Stable

## Type Parameters

| Type Parameter |
| ------ |
| `TDeps` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-budget"></a> `budget?` | `readonly` | [`RunBudget`](/api/@graphorin/agent/interfaces/RunBudget.md) | Run-level budget (C5): between-step enforcement against the run's accumulated usage, sub-agents included. See [RunBudget](/api/@graphorin/agent/interfaces/RunBudget.md). Not persisted in `RunState`: re-supply it when resuming a suspended run. | [packages/agent/src/types.ts:582](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L582) |
| <a id="property-capability"></a> `capability?` | `readonly` | `"read-only"` | Per-run capability restriction (D2) - overrides [AgentConfig.capability](/api/@graphorin/agent/interfaces/AgentConfig.md#property-capability) for this invocation. See that field for semantics. Not persisted in `RunState`: re-supply it when resuming a suspended run. | [packages/agent/src/types.ts:612](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L612) |
| <a id="property-deps"></a> `deps?` | `readonly` | `TDeps` | - | [packages/agent/src/types.ts:572](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L572) |
| <a id="property-directive"></a> `directive?` | `readonly` | [`ResumeDirective`](/api/@graphorin/agent/interfaces/ResumeDirective.md) | HITL resume directive. Supplied alongside a `RunState` to resolve any approvals that were pending when the previous `agent.run(...)` call suspended. | [packages/agent/src/types.ts:605](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L605) |
| <a id="property-inboundtaint"></a> `inboundTaint?` | `readonly` | [`InboundTaintSeed`](/api/@graphorin/agent/interfaces/InboundTaintSeed.md) | B1.5: stamp message-borne untrusted input into the run's taint ledger at init (see [InboundTaintSeed](/api/@graphorin/agent/interfaces/InboundTaintSeed.md)). No-op when the agent has no `dataFlowPolicy` configured. | [packages/agent/src/types.ts:599](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L599) |
| <a id="property-parentspan"></a> `parentSpan?` | `readonly` | [`AISpan`](/api/@graphorin/core/interfaces/AISpan.md)\&lt;[`SpanType`](/api/@graphorin/core/type-aliases/SpanType.md)\&gt; | W-036: parent span for this run's `agent.run` root span - a multi-agent invocation forms ONE trace tree (the child's run span parents under the caller's step/tool span). The runtime supplies it automatically for handoffs and `toTool` sub-agents. Like `capability`, it is NOT persisted in `RunState`: re-supply on resume when stitching matters. | [packages/agent/src/types.ts:621](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L621) |
| <a id="property-pinnedprovider"></a> `pinnedProvider?` | `readonly` | [`Provider`](/api/@graphorin/core/interfaces/Provider.md) | C1/C2: fail-closed per-run model pin. When set, every step of this run resolves to exactly this provider: it wins over `prepareStep` provider overrides and the whole preference ladder (`preferredModel` / tool hints / tier map), and the agent-level fallback chain is never consulted. Built for proactive fires - a heartbeat beat or cron fire must not silently escalate to a more expensive model through fallback. Not persisted in `RunState`: re-supply it when resuming a suspended run. | [packages/agent/src/types.ts:593](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L593) |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | - | [packages/agent/src/types.ts:574](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L574) |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | - | [packages/agent/src/types.ts:573](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L573) |
| <a id="property-userid"></a> `userId?` | `readonly` | `string` | - | [packages/agent/src/types.ts:575](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L575) |
