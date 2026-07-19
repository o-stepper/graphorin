[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / InputGuardrail

# Type Alias: InputGuardrail\&lt;TValue\&gt;

```ts
type InputGuardrail<TValue> = GuardrailDefinition<TValue> & {
  kind: "input";
};
```

Defined in: packages/security/src/guardrails/types.ts:93

**`Stable`**

Input guardrail discriminator.

## Type Declaration

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `kind` | `"input"` | packages/security/src/guardrails/types.ts:94 |

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TValue` | `unknown` |
