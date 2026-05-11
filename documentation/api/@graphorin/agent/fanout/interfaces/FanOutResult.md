[**Graphorin API reference v0.1.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [fanout](/api/@graphorin/agent/fanout/index.md) / FanOutResult

# Interface: FanOutResult\&lt;TOutput\&gt;

Defined in: packages/agent/src/fanout/index.ts:70

Aggregate result returned by `Agent.fanOut(...)`.

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TOutput` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-children"></a> `children` | `readonly` | readonly [`ChildResult`](/api/@graphorin/agent/fanout/interfaces/ChildResult.md)\&lt;`TOutput`\&gt;[] | packages/agent/src/fanout/index.ts:73 |
| <a id="property-fanoutid"></a> `fanOutId` | `readonly` | `string` | packages/agent/src/fanout/index.ts:71 |
| <a id="property-mergedurationms"></a> `mergeDurationMs` | `readonly` | `number` | packages/agent/src/fanout/index.ts:74 |
| <a id="property-output"></a> `output` | `readonly` | `TOutput` | packages/agent/src/fanout/index.ts:72 |
