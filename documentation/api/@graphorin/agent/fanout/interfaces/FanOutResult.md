[**Graphorin API reference v0.13.6**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [fanout](/api/@graphorin/agent/fanout/index.md) / FanOutResult

# Interface: FanOutResult\&lt;TOutput\&gt;

Defined in: packages/agent/src/fanout/index.ts:96

**`Stable`**

Aggregate result returned by `Agent.fanOut(...)`.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TOutput` | `unknown` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-children"></a> `children` | `readonly` | readonly [`ChildResult`](/api/@graphorin/agent/fanout/interfaces/ChildResult.md)\&lt;`TOutput`\&gt;[] | - | packages/agent/src/fanout/index.ts:99 |
| <a id="property-fanoutid"></a> `fanOutId` | `readonly` | `string` | - | packages/agent/src/fanout/index.ts:97 |
| <a id="property-mergedurationms"></a> `mergeDurationMs` | `readonly` | `number` | - | packages/agent/src/fanout/index.ts:100 |
| <a id="property-output"></a> `output` | `readonly` | `TOutput` | - | packages/agent/src/fanout/index.ts:98 |
| <a id="property-usage"></a> `usage` | `readonly` | [`Usage`](/api/@graphorin/core/interfaces/Usage.md) | Sum of every usage-reporting child's usage; zero when no child reported. The fan-out helper never mutates the parent run's live state (it runs outside the loop and would race it) - folding this into the parent run's accounting is the caller's decision. | packages/agent/src/fanout/index.ts:107 |
