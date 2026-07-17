[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / promptInjectionHeuristics

# Function: promptInjectionHeuristics()

```ts
function promptInjectionHeuristics<TValue>(opts?): InputGuardrail<TValue>;
```

Defined in: [packages/security/src/guardrails/builtins/prompt-injection-heuristics.ts:65](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/builtins/prompt-injection-heuristics.ts#L65)

Construct the heuristics input guardrail.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TValue` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`PromptInjectionHeuristicsOptions`](/api/@graphorin/security/interfaces/PromptInjectionHeuristicsOptions.md) |

## Returns

[`InputGuardrail`](/api/@graphorin/security/type-aliases/InputGuardrail.md)\&lt;`TValue`\&gt;

## Stable
