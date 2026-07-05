[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / maxLength

# Function: maxLength()

```ts
function maxLength<TValue>(opts): GuardrailDefinition<TValue>;
```

Defined in: packages/security/src/guardrails/builtins/max-length.ts:47

Construct a `maxLength` guardrail. Returns an input or output
variant depending on the `stage` option.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TValue` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`MaxLengthOptions`](/api/@graphorin/security/interfaces/MaxLengthOptions.md) |

## Returns

[`GuardrailDefinition`](/api/@graphorin/security/interfaces/GuardrailDefinition.md)\&lt;`TValue`\&gt;

## Stable
