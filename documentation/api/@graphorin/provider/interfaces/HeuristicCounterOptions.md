[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / HeuristicCounterOptions

# Interface: HeuristicCounterOptions

Defined in: packages/provider/src/counters/heuristic.ts:19

**`Stable`**

Options for [HeuristicCounter](/api/@graphorin/provider/classes/HeuristicCounter.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-charspertoken"></a> `charsPerToken?` | `readonly` | `number` | Average characters per token. Defaults to `4` (latin-1 estimate). | packages/provider/src/counters/heuristic.ts:21 |
| <a id="property-id"></a> `id?` | `readonly` | `string` | Identifier carried on the produced counter. | packages/provider/src/counters/heuristic.ts:23 |
| <a id="property-logger"></a> `logger?` | `readonly` | (`message`, `meta?`) => `void` | Optional sink. Defaults to `console.warn`. | packages/provider/src/counters/heuristic.ts:27 |
| <a id="property-modelid"></a> `modelId?` | `readonly` | `string` | Optional model hint surfaced in the WARN message. | packages/provider/src/counters/heuristic.ts:25 |
