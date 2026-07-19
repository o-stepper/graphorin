[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / OutputGuardrail

# Type Alias: OutputGuardrail\&lt;TValue\&gt;

```ts
type OutputGuardrail<TValue> = GuardrailDefinition<TValue> & {
  kind: "output";
};
```

Defined in: packages/security/dist/guardrails/types.d.ts:93

**`Stable`**

Output guardrail discriminator.

## Type Declaration

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `kind` | `"output"` | packages/security/dist/guardrails/types.d.ts:94 |

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TValue` | `unknown` |
