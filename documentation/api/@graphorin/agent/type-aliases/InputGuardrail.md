[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / InputGuardrail

# Type Alias: InputGuardrail\&lt;TValue\&gt;

```ts
type InputGuardrail<TValue> = GuardrailDefinition<TValue> & {
  kind: "input";
};
```

Defined in: [packages/security/dist/guardrails/types.d.ts:85](https://github.com/o-stepper/graphorin/blob/main/packages/security/dist/guardrails/types.d.ts#L85)

Input guardrail discriminator.

## Type Declaration

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `kind` | `"input"` | [packages/security/dist/guardrails/types.d.ts:86](https://github.com/o-stepper/graphorin/blob/main/packages/security/dist/guardrails/types.d.ts#L86) |

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TValue` | `unknown` |

## Stable
