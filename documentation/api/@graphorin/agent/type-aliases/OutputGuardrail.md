[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / OutputGuardrail

# Type Alias: OutputGuardrail\&lt;TValue\&gt;

```ts
type OutputGuardrail<TValue> = GuardrailDefinition<TValue> & {
  kind: "output";
};
```

Defined in: [packages/security/dist/guardrails/types.d.ts:93](https://github.com/o-stepper/graphorin/blob/main/packages/security/dist/guardrails/types.d.ts#L93)

Output guardrail discriminator.

## Type Declaration

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `kind` | `"output"` | [packages/security/dist/guardrails/types.d.ts:94](https://github.com/o-stepper/graphorin/blob/main/packages/security/dist/guardrails/types.d.ts#L94) |

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TValue` | `unknown` |

## Stable
