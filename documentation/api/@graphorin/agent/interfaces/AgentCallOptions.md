[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / AgentCallOptions

# Interface: AgentCallOptions\&lt;TDeps\&gt;

Defined in: packages/agent/src/types.ts:630

**`Stable`**

Per-call options accepted by `agent.stream(...)` / `agent.run(...)`.

## Type Parameters

| Type Parameter |
| ------ |
| `TDeps` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-budget"></a> `budget?` | `readonly` | [`RunBudget`](/api/@graphorin/agent/interfaces/RunBudget.md) | Run-level budget: between-step enforcement against the run's accumulated usage, sub-agents included. See [RunBudget](/api/@graphorin/agent/interfaces/RunBudget.md). Not persisted in `RunState`: re-supply it when resuming a suspended run. | packages/agent/src/types.ts:641 |
| <a id="property-capability"></a> `capability?` | `readonly` | `"read-only"` | Per-run capability restriction - overrides [AgentConfig.capability](/api/@graphorin/agent/interfaces/AgentConfig.md#property-capability) for this invocation. See that field for semantics. Not persisted in `RunState`: re-supply it when resuming a suspended run. | packages/agent/src/types.ts:671 |
| <a id="property-deps"></a> `deps?` | `readonly` | `TDeps` | - | packages/agent/src/types.ts:631 |
| <a id="property-directive"></a> `directive?` | `readonly` | [`ResumeDirective`](/api/@graphorin/agent/interfaces/ResumeDirective.md) | HITL resume directive. Supplied alongside a `RunState` to resolve any approvals that were pending when the previous `agent.run(...)` call suspended. | packages/agent/src/types.ts:664 |
| <a id="property-inboundtaint"></a> `inboundTaint?` | `readonly` | [`InboundTaintSeed`](/api/@graphorin/agent/interfaces/InboundTaintSeed.md) | Stamp message-borne untrusted input into the run's taint ledger at init (see [InboundTaintSeed](/api/@graphorin/agent/interfaces/InboundTaintSeed.md)). No-op when the agent has no `dataFlowPolicy` configured. | packages/agent/src/types.ts:658 |
| <a id="property-parentspan"></a> `parentSpan?` | `readonly` | [`AISpan`](/api/@graphorin/core/interfaces/AISpan.md)\&lt;[`SpanType`](/api/@graphorin/core/type-aliases/SpanType.md)\&gt; | Parent span for this run's `agent.run` root span - a multi-agent invocation forms ONE trace tree (the child's run span parents under the caller's step/tool span). The runtime supplies it automatically for handoffs and `toTool` sub-agents. Like `capability`, it is NOT persisted in `RunState`: re-supply on resume when stitching matters. | packages/agent/src/types.ts:680 |
| <a id="property-pinnedprovider"></a> `pinnedProvider?` | `readonly` | [`Provider`](/api/@graphorin/core/interfaces/Provider.md) | Fail-closed per-run model pin. When set, every step of this run resolves to exactly this provider: it wins over `prepareStep` provider overrides and the whole preference ladder (`preferredModel` / tool hints / tier map), and the agent-level fallback chain is never consulted. Built for proactive fires - a heartbeat beat or cron fire must not silently escalate to a more expensive model through fallback. Not persisted in `RunState`: re-supply it when resuming a suspended run. | packages/agent/src/types.ts:652 |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | - | packages/agent/src/types.ts:633 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | - | packages/agent/src/types.ts:632 |
| <a id="property-userid"></a> `userId?` | `readonly` | `string` | - | packages/agent/src/types.ts:634 |
