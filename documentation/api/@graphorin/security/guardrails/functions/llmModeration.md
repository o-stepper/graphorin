[**Graphorin API reference v0.7.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [guardrails](/api/@graphorin/security/guardrails/index.md) / llmModeration

# Function: llmModeration()

```ts
function llmModeration<TValue>(opts): InputGuardrail<TValue>;
```

Defined in: [packages/security/src/guardrails/builtins/llm-moderation.ts:73](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/builtins/llm-moderation.ts#L73)

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
