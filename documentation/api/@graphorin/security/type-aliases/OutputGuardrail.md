[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / OutputGuardrail

# Type Alias: OutputGuardrail\&lt;TValue\&gt;

```ts
type OutputGuardrail<TValue> = GuardrailDefinition<TValue> & {
  kind: "output";
};
```

Defined in: packages/security/src/guardrails/types.ts:102

Output guardrail discriminator.

## Type Declaration

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `kind` | `"output"` | packages/security/src/guardrails/types.ts:103 |

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TValue` | `unknown` |

## Stable
