[**Graphorin API reference v0.13.0**](../../../index.md)

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

Defined in: [packages/security/dist/guardrails/types.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/security/dist/guardrails/types.d.ts)

**`Stable`**

Result of a single guardrail check.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TValue` | `unknown` |
