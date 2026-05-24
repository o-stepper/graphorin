[**Graphorin API reference v0.3.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [fanout](/api/@graphorin/agent/fanout/index.md) / FanOutOptions

# Interface: FanOutOptions\&lt;TOutput\&gt;

Defined in: packages/agent/src/fanout/index.ts:82

Per-call options accepted by `Agent.fanOut(...)`.

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TOutput` | `unknown` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | - | packages/agent/src/fanout/index.ts:107 |
| <a id="property-children"></a> `children` | `readonly` | readonly \{ `agentId`: `string`; `invoke`: () => `Promise`\&lt;`TOutput`\&gt;; \}[] | The sub-agents to invoke. Each entry is invoked as a function returning a `Promise<TOutput>` — the fan-out helper does not impose an `Agent` shape on the children so the runtime can adapt any callable surface. | packages/agent/src/fanout/index.ts:89 |
| <a id="property-emit"></a> `emit?` | `readonly` | (`event`) => `void` | Optional event emitter for `agent.fanout.spawned / merged`. | packages/agent/src/fanout/index.ts:103 |
| <a id="property-fanoutid"></a> `fanOutId?` | `readonly` | `string` | Default — generated from `runId + Date.now()`. | packages/agent/src/fanout/index.ts:109 |
| <a id="property-maxconcurrentchildren"></a> `maxConcurrentChildren?` | `readonly` | `number` | Default `4` per the canonical 2026 production lesson. | packages/agent/src/fanout/index.ts:94 |
| <a id="property-mergestrategy"></a> `mergeStrategy?` | `readonly` | [`MergeStrategy`](/api/@graphorin/agent/fanout/type-aliases/MergeStrategy.md)\&lt;`TOutput`\&gt; | Default `{ kind: 'concat' }`. | packages/agent/src/fanout/index.ts:98 |
| <a id="property-onchildresult"></a> `onChildResult?` | `readonly` | (`result`) => `void` | Optional callback for per-child completion observability. | packages/agent/src/fanout/index.ts:101 |
| <a id="property-perbudget"></a> `perBudget?` | `readonly` | [`PerChildBudget`](/api/@graphorin/agent/fanout/interfaces/PerChildBudget.md) | Per-child budget; default unset. | packages/agent/src/fanout/index.ts:96 |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | Identifiers required to populate the events. | packages/agent/src/fanout/index.ts:105 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | - | packages/agent/src/fanout/index.ts:106 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | - | packages/agent/src/fanout/index.ts:99 |
