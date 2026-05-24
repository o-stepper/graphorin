[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / OutputGuardrail

# Type Alias: OutputGuardrail\&lt;TOutput\&gt;

```ts
type OutputGuardrail<TOutput> = (output) => 
  | Promise<GuardrailVerdict>
  | GuardrailVerdict;
```

Defined in: packages/agent/src/types.ts:93

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TOutput` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `output` | `TOutput` |

## Returns

  \| `Promise`\&lt;[`GuardrailVerdict`](/api/@graphorin/agent/type-aliases/GuardrailVerdict.md)\&gt;
  \| [`GuardrailVerdict`](/api/@graphorin/agent/type-aliases/GuardrailVerdict.md)

## Stable
