[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / GuardrailDefinition

# Interface: GuardrailDefinition\&lt;TValue\&gt;

Defined in: [packages/security/src/guardrails/types.ts:79](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/types.ts#L79)

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
| <a id="property-check"></a> `check` | `readonly` | (`value`, `ctx`) => \| [`GuardrailResult`](/api/@graphorin/security/type-aliases/GuardrailResult.md)\&lt;`TValue`\&gt; \| `Promise`\<[`GuardrailResult`](/api/@graphorin/security/type-aliases/GuardrailResult.md)\&lt;`TValue`\&gt;\> | [packages/security/src/guardrails/types.ts:82](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/types.ts#L82) |
| <a id="property-kind"></a> `kind` | `readonly` | `"input"` \| `"output"` | [packages/security/src/guardrails/types.ts:80](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/types.ts#L80) |
| <a id="property-name"></a> `name` | `readonly` | `string` | [packages/security/src/guardrails/types.ts:81](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/types.ts#L81) |
