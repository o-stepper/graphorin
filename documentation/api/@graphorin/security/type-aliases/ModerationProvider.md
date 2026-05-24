[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / ModerationProvider

# Type Alias: ModerationProvider

```ts
type ModerationProvider = (value) => 
  | Promise<ModerationDecision>
  | ModerationDecision;
```

Defined in: packages/security/src/guardrails/builtins/llm-moderation.ts:46

Provider callback. The runtime injects an async function that
forwards the value to a moderation service and returns the
decision.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` |

## Returns

  \| `Promise`\&lt;[`ModerationDecision`](/api/@graphorin/security/interfaces/ModerationDecision.md)\&gt;
  \| [`ModerationDecision`](/api/@graphorin/security/interfaces/ModerationDecision.md)

## Stable
