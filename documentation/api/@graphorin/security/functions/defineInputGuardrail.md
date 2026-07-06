[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / defineInputGuardrail

# Function: defineInputGuardrail()

```ts
function defineInputGuardrail<TValue>(spec): InputGuardrail<TValue>;
```

Defined in: packages/security/src/guardrails/builders.ts:28

Create a typed input guardrail. Thin wrapper around the
declarative shape - the helper exists so call-sites stay
declarative.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TValue` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `spec` | `Omit`\&lt;[`InputGuardrail`](/api/@graphorin/security/type-aliases/InputGuardrail.md)\&lt;`TValue`\&gt;, `"kind"`\&gt; |

## Returns

[`InputGuardrail`](/api/@graphorin/security/type-aliases/InputGuardrail.md)\&lt;`TValue`\&gt;

## Stable
