[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / ToolArgumentPolicyFacts

# Interface: ToolArgumentPolicyFacts

Defined in: [packages/tools/src/executor/types.ts:327](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/types.ts#L327)

Facts a policy guard decides over (shared by both evaluation shapes).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-args"></a> `args` | `readonly` | `unknown` | - | [packages/tools/src/executor/types.ts:336](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/types.ts#L336) |
| <a id="property-sensitive"></a> `sensitive` | `readonly` | `boolean` | - | [packages/tools/src/executor/types.ts:330](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/types.ts#L330) |
| <a id="property-sideeffectclass"></a> `sideEffectClass` | `readonly` | [`SideEffectClass`](/api/@graphorin/core/type-aliases/SideEffectClass.md) | - | [packages/tools/src/executor/types.ts:329](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/types.ts#L329) |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | - | [packages/tools/src/executor/types.ts:328](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/types.ts#L328) |
| <a id="property-trustclass"></a> `trustClass` | `readonly` | [`ToolTrustClass`](/api/@graphorin/core/type-aliases/ToolTrustClass.md) | Trust class of the tool under evaluation (W-101) - lets guards enforce trust-taxonomy rules (Rule-of-Two `untrustedInput`). | [packages/tools/src/executor/types.ts:335](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/types.ts#L335) |
