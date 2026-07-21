[**Graphorin API reference v0.13.11**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [guardrails](/api/@graphorin/security/guardrails/index.md) / outputModeration

# Function: outputModeration()

```ts
function outputModeration<TValue>(opts): OutputGuardrail<TValue>;
```

Defined in: packages/security/src/guardrails/builtins/llm-moderation.ts:84

**`Stable`**

Construct an output-side moderation guardrail.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TValue` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`ModerationGuardrailOptions`](/api/@graphorin/security/interfaces/ModerationGuardrailOptions.md) |

## Returns

[`OutputGuardrail`](/api/@graphorin/security/type-aliases/OutputGuardrail.md)\&lt;`TValue`\&gt;
