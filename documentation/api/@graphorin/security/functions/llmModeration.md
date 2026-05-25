[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / llmModeration

# Function: llmModeration()

```ts
function llmModeration<TValue>(opts): InputGuardrail<TValue>;
```

Defined in: packages/security/src/guardrails/builtins/llm-moderation.ts:73

Construct an input-side moderation guardrail.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TValue` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`ModerationGuardrailOptions`](/api/@graphorin/security/interfaces/ModerationGuardrailOptions.md) |

## Returns

[`InputGuardrail`](/api/@graphorin/security/type-aliases/InputGuardrail.md)\&lt;`TValue`\&gt;

## Stable
