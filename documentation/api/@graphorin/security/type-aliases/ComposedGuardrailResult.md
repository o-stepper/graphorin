[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / ComposedGuardrailResult

# Type Alias: ComposedGuardrailResult\<TValue\>

```ts
type ComposedGuardrailResult<TValue> = 
  | {
  ok: true;
  value: TValue;
}
  | {
  action: GuardrailAction;
  message: string;
  name: string;
  ok: false;
  value: TValue;
  warnings: ReadonlyArray<{
     message: string;
     name: string;
  }>;
};
```

Defined in: packages/security/src/guardrails/types.ts:111

Result of running a sequence of guardrails through `composeGuardrails(...)`.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TValue` | `unknown` |

## Stable
