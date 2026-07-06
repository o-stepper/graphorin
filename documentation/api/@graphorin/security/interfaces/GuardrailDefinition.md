[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / GuardrailDefinition

# Interface: GuardrailDefinition\<TValue\>

Defined in: packages/security/src/guardrails/types.ts:79

Definition of a single guardrail. The `kind` discriminator lets
downstream code tell input from output guardrails without juggling
separate registries.

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TValue` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-check"></a> `check` | `readonly` | (`value`, `ctx`) => \| [`GuardrailResult`](/api/@graphorin/security/type-aliases/GuardrailResult.md)\<`TValue`\> \| `Promise`\<[`GuardrailResult`](/api/@graphorin/security/type-aliases/GuardrailResult.md)\<`TValue`\>\> | packages/security/src/guardrails/types.ts:82 |
| <a id="property-kind"></a> `kind` | `readonly` | `"input"` \| `"output"` | packages/security/src/guardrails/types.ts:80 |
| <a id="property-name"></a> `name` | `readonly` | `string` | packages/security/src/guardrails/types.ts:81 |
