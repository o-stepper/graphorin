[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / defineOutputGuardrail

# Function: defineOutputGuardrail()

```ts
function defineOutputGuardrail<TValue>(spec): OutputGuardrail<TValue>;
```

Defined in: [packages/security/src/guardrails/builders.ts:40](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/builders.ts#L40)

Create a typed output guardrail. Thin wrapper around the
declarative shape.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TValue` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `spec` | `Omit`\<[`OutputGuardrail`](/api/@graphorin/security/type-aliases/OutputGuardrail.md)\&lt;`TValue`\&gt;, `"kind"`\> |

## Returns

[`OutputGuardrail`](/api/@graphorin/security/type-aliases/OutputGuardrail.md)\&lt;`TValue`\&gt;

## Stable
