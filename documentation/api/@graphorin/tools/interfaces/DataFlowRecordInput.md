[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / DataFlowRecordInput

# Interface: DataFlowRecordInput

Defined in: packages/tools/src/executor/executor.ts:218

Input to [DataFlowGuard.record](/api/@graphorin/tools/interfaces/DataFlowGuard.md#record).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-outputtext"></a> `outputText` | `readonly` | `string` | The (sanitized) output text the model will see. | packages/tools/src/executor/executor.ts:224 |
| <a id="property-runcontext"></a> `runContext` | `readonly` | [`RunContext`](/api/@graphorin/core/interfaces/RunContext.md) | - | packages/tools/src/executor/executor.ts:225 |
| <a id="property-sensitivity"></a> `sensitivity?` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | - | packages/tools/src/executor/executor.ts:221 |
| <a id="property-source"></a> `source?` | `readonly` | [`ToolSource`](/api/@graphorin/core/type-aliases/ToolSource.md) | - | packages/tools/src/executor/executor.ts:222 |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | - | packages/tools/src/executor/executor.ts:219 |
| <a id="property-trustclass"></a> `trustClass` | `readonly` | [`ToolTrustClass`](/api/@graphorin/core/type-aliases/ToolTrustClass.md) | - | packages/tools/src/executor/executor.ts:220 |
