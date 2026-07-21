[**Graphorin API reference v0.13.10**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [fanout](/api/@graphorin/agent/fanout/index.md) / FanOutOptions

# Interface: FanOutOptions\&lt;TOutput\&gt;

Defined in: packages/agent/src/fanout/index.ts:115

**`Stable`**

Per-call options accepted by `Agent.fanOut(...)`.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TOutput` | `unknown` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | - | packages/agent/src/fanout/index.ts:162 |
| <a id="property-children"></a> `children` | `readonly` | readonly \{ `agentId`: `string`; `historyAdjustment?`: `number`; `invoke`: () => `Promise`\&lt;`TOutput`\&gt;; `origin?`: [`ContentOriginKind`](/api/@graphorin/agent/type-aliases/ContentOriginKind.md); `trustClass?`: [`TrustClass`](/api/@graphorin/agent/type-aliases/TrustClass.md); \}[] | The sub-agents to invoke. Each entry is invoked as a function returning a `Promise<TOutput>` - the fan-out helper does not impose an `Agent` shape on the children so the runtime can adapt any callable surface. | packages/agent/src/fanout/index.ts:122 |
| <a id="property-emit"></a> `emit?` | `readonly` | (`event`) => `void` | Optional event emitter for `agent.fanout.spawned / merged`. | packages/agent/src/fanout/index.ts:149 |
| <a id="property-fanoutid"></a> `fanOutId?` | `readonly` | `string` | Default - generated from `runId + Date.now()`. | packages/agent/src/fanout/index.ts:164 |
| <a id="property-maxconcurrentchildren"></a> `maxConcurrentChildren?` | `readonly` | `number` | Default `4` per the canonical 2026 production lesson. | packages/agent/src/fanout/index.ts:140 |
| <a id="property-mergeguard"></a> `mergeGuard?` | `readonly` | [`MergeGuardConfig`](/api/@graphorin/agent/interfaces/MergeGuardConfig.md) | Sideways-injection merge guard: on `'judge-merge'` the fan-out scores each child's source trust and contribution weight against the judge's merged output; a biased merge emits `agent.lateral-leak.detected` (vector `sideways-injection`) and - under `strictness: 'detect-and-block'` - throws [MergeBlockedError](/api/@graphorin/agent/errors/classes/MergeBlockedError.md). | packages/agent/src/fanout/index.ts:158 |
| <a id="property-mergestrategy"></a> `mergeStrategy?` | `readonly` | [`MergeStrategy`](/api/@graphorin/agent/fanout/type-aliases/MergeStrategy.md)\&lt;`TOutput`\&gt; | Default `{ kind: 'concat' }`. | packages/agent/src/fanout/index.ts:144 |
| <a id="property-onchildresult"></a> `onChildResult?` | `readonly` | (`result`) => `void` | Optional callback for per-child completion observability. | packages/agent/src/fanout/index.ts:147 |
| <a id="property-perbudget"></a> `perBudget?` | `readonly` | [`PerChildBudget`](/api/@graphorin/agent/fanout/interfaces/PerChildBudget.md) | Per-child budget; default unset. | packages/agent/src/fanout/index.ts:142 |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | Identifiers required to populate the events. | packages/agent/src/fanout/index.ts:160 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | - | packages/agent/src/fanout/index.ts:161 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | - | packages/agent/src/fanout/index.ts:145 |
