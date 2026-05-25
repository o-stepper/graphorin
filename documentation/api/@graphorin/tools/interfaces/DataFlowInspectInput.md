[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / DataFlowInspectInput

# Interface: DataFlowInspectInput

Defined in: packages/tools/src/executor/executor.ts:196

Input to [DataFlowGuard.inspect](/api/@graphorin/tools/interfaces/DataFlowGuard.md#inspect).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-args"></a> `args` | `readonly` | `unknown` | The raw tool-call arguments (stringified by the guard for probing). | packages/tools/src/executor/executor.ts:203 |
| <a id="property-runcontext"></a> `runContext` | `readonly` | [`RunContext`](/api/@graphorin/core/interfaces/RunContext.md) | - | packages/tools/src/executor/executor.ts:204 |
| <a id="property-sensitivity"></a> `sensitivity?` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | - | packages/tools/src/executor/executor.ts:200 |
| <a id="property-sideeffectclass"></a> `sideEffectClass` | `readonly` | [`SideEffectClass`](/api/@graphorin/core/type-aliases/SideEffectClass.md) | - | packages/tools/src/executor/executor.ts:198 |
| <a id="property-source"></a> `source?` | `readonly` | [`ToolSource`](/api/@graphorin/core/type-aliases/ToolSource.md) | - | packages/tools/src/executor/executor.ts:201 |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | - | packages/tools/src/executor/executor.ts:197 |
| <a id="property-trustclass"></a> `trustClass` | `readonly` | [`ToolTrustClass`](/api/@graphorin/core/type-aliases/ToolTrustClass.md) | - | packages/tools/src/executor/executor.ts:199 |
