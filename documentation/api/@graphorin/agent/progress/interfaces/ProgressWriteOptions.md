[**Graphorin API reference v0.12.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [progress](/api/@graphorin/agent/progress/index.md) / ProgressWriteOptions

# Interface: ProgressWriteOptions

Defined in: [packages/agent/src/progress/index.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/progress/index.ts#L51)

Per-call options for [ProgressIO.write](/api/@graphorin/agent/progress/interfaces/ProgressIO.md#write).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-role"></a> `role?` | `readonly` | `string` | - | [packages/agent/src/progress/index.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/progress/index.ts#L52) |
| <a id="property-sensitivity"></a> `sensitivity?` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | - | [packages/agent/src/progress/index.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/progress/index.ts#L55) |
| <a id="property-seq"></a> `seq?` | `readonly` | `number` | Explicit sequence number; default auto-increments per `(runId, role)`. | [packages/agent/src/progress/index.ts:54](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/progress/index.ts#L54) |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | - | [packages/agent/src/progress/index.ts:56](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/progress/index.ts#L56) |
