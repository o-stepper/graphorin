[**Graphorin API reference v0.13.5**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [progress](/api/@graphorin/agent/progress/index.md) / ProgressIOConfig

# Interface: ProgressIOConfig

Defined in: packages/agent/src/progress/index.ts:37

**`Stable`**

Optional configuration accepted by [createProgressIO](/api/@graphorin/agent/progress/functions/createProgressIO.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-artifactroot"></a> `artifactRoot?` | `readonly` | `string` | Filesystem root under which `<runId>/progress/<role>.<seq>.txt` files live. | packages/agent/src/progress/index.ts:39 |
| <a id="property-defaultsensitivity"></a> `defaultSensitivity?` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | Default `Sensitivity` applied when the caller does not override. | packages/agent/src/progress/index.ts:41 |
| <a id="property-redact"></a> `redact?` | `readonly` | (`content`) => `string` | Optional redaction transform applied to content before write. | packages/agent/src/progress/index.ts:43 |
