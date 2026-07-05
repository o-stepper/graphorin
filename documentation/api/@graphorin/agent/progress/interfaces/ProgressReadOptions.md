[**Graphorin API reference v0.6.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [progress](/api/@graphorin/agent/progress/index.md) / ProgressReadOptions

# Interface: ProgressReadOptions

Defined in: packages/agent/src/progress/index.ts:64

Per-call options for [ProgressIO.read](/api/@graphorin/agent/progress/interfaces/ProgressIO.md#read).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-maxartifacts"></a> `maxArtifacts?` | `readonly` | `number` | Default `100`. | packages/agent/src/progress/index.ts:70 |
| <a id="property-role"></a> `role?` | `readonly` | `string` | - | packages/agent/src/progress/index.ts:66 |
| <a id="property-runid"></a> `runId?` | `readonly` | `string` | - | packages/agent/src/progress/index.ts:65 |
| <a id="property-sinceseq"></a> `sinceSeq?` | `readonly` | `number` | Skip artifacts whose `seq <= sinceSeq`. | packages/agent/src/progress/index.ts:68 |
