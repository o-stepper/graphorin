[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / GuardrailDefinition

# Interface: GuardrailDefinition\<TValue\>

Defined in: packages/security/dist/guardrails/types.d.ts:75

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
| <a id="property-check"></a> `check` | `readonly` | (`value`, `ctx`) => \| [`GuardrailResult`](/api/@graphorin/agent/type-aliases/GuardrailResult.md)\<`TValue`\> \| `Promise`\<[`GuardrailResult`](/api/@graphorin/agent/type-aliases/GuardrailResult.md)\<`TValue`\>\> | packages/security/dist/guardrails/types.d.ts:78 |
| <a id="property-kind"></a> `kind` | `readonly` | `"output"` \| `"input"` | packages/security/dist/guardrails/types.d.ts:76 |
| <a id="property-name"></a> `name` | `readonly` | `string` | packages/security/dist/guardrails/types.d.ts:77 |
