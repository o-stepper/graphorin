[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / PermissionHookInput

# Interface: PermissionHookInput

Defined in: packages/tools/src/executor/types.ts:380

**`Stable`**

Input handed to a [PermissionHook](/api/@graphorin/tools/type-aliases/PermissionHook.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-call"></a> `call` | `readonly` | [`ToolCall`](/api/@graphorin/core/interfaces/ToolCall.md) | The original wire-level call (raw model-generated args). | packages/tools/src/executor/types.ts:382 |
| <a id="property-runcontext"></a> `runContext` | `readonly` | [`RunContext`](/api/@graphorin/core/interfaces/RunContext.md) | - | packages/tools/src/executor/types.ts:389 |
| <a id="property-sensitivity"></a> `sensitivity?` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | - | packages/tools/src/executor/types.ts:388 |
| <a id="property-sideeffectclass"></a> `sideEffectClass` | `readonly` | [`SideEffectClass`](/api/@graphorin/core/type-aliases/SideEffectClass.md) | - | packages/tools/src/executor/types.ts:386 |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | - | packages/tools/src/executor/types.ts:385 |
| <a id="property-trustclass"></a> `trustClass` | `readonly` | [`ToolTrustClass`](/api/@graphorin/core/type-aliases/ToolTrustClass.md) | - | packages/tools/src/executor/types.ts:387 |
| <a id="property-validatedinput"></a> `validatedInput` | `readonly` | `unknown` | The schema-validated (possibly coerced) input the tool would execute on. | packages/tools/src/executor/types.ts:384 |
