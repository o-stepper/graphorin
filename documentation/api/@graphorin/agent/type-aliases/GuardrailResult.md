[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / GuardrailResult

# Type Alias: GuardrailResult\&lt;TValue\&gt;

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

Defined in: [packages/security/dist/guardrails/types.d.ts:59](https://github.com/o-stepper/graphorin/blob/main/packages/security/dist/guardrails/types.d.ts#L59)

Result of a single guardrail check.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TValue` | `unknown` |

## Stable
