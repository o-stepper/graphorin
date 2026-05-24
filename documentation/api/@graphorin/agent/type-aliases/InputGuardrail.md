[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / InputGuardrail

# Type Alias: InputGuardrail

```ts
type InputGuardrail = (input) => 
  | Promise<GuardrailVerdict>
  | GuardrailVerdict;
```

Defined in: packages/agent/src/types.ts:90

Input guardrail predicate.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`AgentInput`](/api/@graphorin/agent/type-aliases/AgentInput.md) |

## Returns

  \| `Promise`\&lt;[`GuardrailVerdict`](/api/@graphorin/agent/type-aliases/GuardrailVerdict.md)\&gt;
  \| [`GuardrailVerdict`](/api/@graphorin/agent/type-aliases/GuardrailVerdict.md)

## Stable
