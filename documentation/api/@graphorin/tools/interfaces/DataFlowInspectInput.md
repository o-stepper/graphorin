[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / DataFlowInspectInput

# Interface: DataFlowInspectInput

Defined in: packages/tools/src/executor/types.ts:220

Input to [DataFlowGuard.inspect](/api/@graphorin/tools/interfaces/DataFlowGuard.md#inspect).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-args"></a> `args` | `readonly` | `unknown` | Raw-shaped POST-REPAIR arguments (stringified by the guard for probing): what the approval gate saw and what the validate phase derives the executed input from. Bytes-equal to the model's `call.args` when no repair hook ran. Residual limitation: probed before schema coercion, so spans introduced purely by Zod `transform`/`default` are not visible to the verbatim probe. | packages/tools/src/executor/types.ts:234 |
| <a id="property-runcontext"></a> `runContext` | `readonly` | [`RunContext`](/api/@graphorin/core/interfaces/RunContext.md) | - | packages/tools/src/executor/types.ts:235 |
| <a id="property-sensitivity"></a> `sensitivity?` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | - | packages/tools/src/executor/types.ts:224 |
| <a id="property-sideeffectclass"></a> `sideEffectClass` | `readonly` | [`SideEffectClass`](/api/@graphorin/core/type-aliases/SideEffectClass.md) | - | packages/tools/src/executor/types.ts:222 |
| <a id="property-source"></a> `source?` | `readonly` | [`ToolSource`](/api/@graphorin/core/type-aliases/ToolSource.md) | - | packages/tools/src/executor/types.ts:225 |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | - | packages/tools/src/executor/types.ts:221 |
| <a id="property-trustclass"></a> `trustClass` | `readonly` | [`ToolTrustClass`](/api/@graphorin/core/type-aliases/ToolTrustClass.md) | - | packages/tools/src/executor/types.ts:223 |
