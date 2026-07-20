[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / AgentFanOutOptions

# Interface: AgentFanOutOptions\&lt;TOutput\&gt;

Defined in: packages/agent/src/types.ts:821

**`Stable`**

Per-call shape accepted by `Agent.fanOut(...)`. Mirrors the
pure-function [FanOutOptions](/api/@graphorin/agent/fanout/interfaces/FanOutOptions.md) but omits the runtime-supplied
identifiers - the `Agent` instance carries those.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TOutput` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-children"></a> `children` | `readonly` | readonly \{ `agentId`: `string`; `historyAdjustment?`: `number`; `invoke`: () => `Promise`\&lt;`TOutput`\&gt;; `origin?`: [`ContentOriginKind`](/api/@graphorin/agent/type-aliases/ContentOriginKind.md); `trustClass?`: [`TrustClass`](/api/@graphorin/agent/type-aliases/TrustClass.md); \}[] | packages/agent/src/types.ts:822 |
| <a id="property-maxconcurrentchildren"></a> `maxConcurrentChildren?` | `readonly` | `number` | packages/agent/src/types.ts:823 |
| <a id="property-mergestrategy"></a> `mergeStrategy?` | `readonly` | [`MergeStrategy`](/api/@graphorin/agent/fanout/type-aliases/MergeStrategy.md)\&lt;`TOutput`\&gt; | packages/agent/src/types.ts:825 |
| <a id="property-perbudget"></a> `perBudget?` | `readonly` | [`PerChildBudget`](/api/@graphorin/agent/fanout/interfaces/PerChildBudget.md) | packages/agent/src/types.ts:824 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | packages/agent/src/types.ts:826 |
