[**Graphorin API reference v0.13.9**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [progress](/api/@graphorin/agent/progress/index.md) / ProgressWriteOptions

# Interface: ProgressWriteOptions

Defined in: packages/agent/src/progress/index.ts:51

**`Stable`**

Per-call options for [ProgressIO.write](/api/@graphorin/agent/progress/interfaces/ProgressIO.md#write).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-role"></a> `role?` | `readonly` | `string` | - | packages/agent/src/progress/index.ts:52 |
| <a id="property-sensitivity"></a> `sensitivity?` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | - | packages/agent/src/progress/index.ts:55 |
| <a id="property-seq"></a> `seq?` | `readonly` | `number` | Explicit sequence number; default auto-increments per `(runId, role)`. | packages/agent/src/progress/index.ts:54 |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | - | packages/agent/src/progress/index.ts:56 |
