[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / outputModeration

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
