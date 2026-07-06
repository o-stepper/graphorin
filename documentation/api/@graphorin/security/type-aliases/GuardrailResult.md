[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / GuardrailResult

# Type Alias: GuardrailResult\<TValue\>

```ts
type GuardrailResult<TValue> = 
  | {
  ok: true;
}
  | {
  action: GuardrailAction;
  message: string;
  metadata?: Readonly<Record<string, unknown>>;
  ok: false;
  rewrite?: TValue;
};
```

Defined in: packages/security/src/guardrails/types.ts:62

Result of a single guardrail check.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TValue` | `unknown` |

## Stable
