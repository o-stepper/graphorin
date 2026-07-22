[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / ComposedGuardrailResult

# Type Alias: ComposedGuardrailResult\&lt;TValue\&gt;

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

**`Stable`**

Result of running a sequence of guardrails through `composeGuardrails(...)`.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TValue` | `unknown` |
