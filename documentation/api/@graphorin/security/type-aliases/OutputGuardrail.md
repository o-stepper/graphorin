[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / OutputGuardrail

# Type Alias: OutputGuardrail\&lt;TValue\&gt;

```ts
type OutputGuardrail<TValue> = GuardrailDefinition<TValue> & {
  kind: "output";
};
```

Defined in: [packages/security/src/guardrails/types.ts:102](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/types.ts#L102)

Output guardrail discriminator.

## Type Declaration

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `kind` | `"output"` | [packages/security/src/guardrails/types.ts:103](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/types.ts#L103) |

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TValue` | `unknown` |

## Stable
