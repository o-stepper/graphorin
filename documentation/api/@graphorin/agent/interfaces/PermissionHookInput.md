[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / PermissionHookInput

# Interface: PermissionHookInput

Defined in: [packages/tools/dist/executor/types.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/tools/dist/executor/types.d.ts)

**`Stable`**

Input handed to a [PermissionHook](/api/@graphorin/agent/type-aliases/PermissionHook.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-call"></a> `call` | `readonly` | [`ToolCall`](/api/@graphorin/core/interfaces/ToolCall.md) | The original wire-level call (raw model-generated args). | [packages/tools/dist/executor/types.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/tools/dist/executor/types.d.ts) |
| <a id="property-runcontext"></a> `runContext` | `readonly` | [`RunContext`](/api/@graphorin/core/interfaces/RunContext.md) | - | [packages/tools/dist/executor/types.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/tools/dist/executor/types.d.ts) |
| <a id="property-sensitivity"></a> `sensitivity?` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | - | [packages/tools/dist/executor/types.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/tools/dist/executor/types.d.ts) |
| <a id="property-sideeffectclass"></a> `sideEffectClass` | `readonly` | [`SideEffectClass`](/api/@graphorin/core/type-aliases/SideEffectClass.md) | - | [packages/tools/dist/executor/types.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/tools/dist/executor/types.d.ts) |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | - | [packages/tools/dist/executor/types.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/tools/dist/executor/types.d.ts) |
| <a id="property-trustclass"></a> `trustClass` | `readonly` | [`ToolTrustClass`](/api/@graphorin/core/type-aliases/ToolTrustClass.md) | - | [packages/tools/dist/executor/types.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/tools/dist/executor/types.d.ts) |
| <a id="property-validatedinput"></a> `validatedInput` | `readonly` | `unknown` | The schema-validated (possibly coerced) input the tool would execute on. | [packages/tools/dist/executor/types.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/tools/dist/executor/types.d.ts) |
