[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / injectionClassifierOutputGuardrail

# Function: injectionClassifierOutputGuardrail()

```ts
function injectionClassifierOutputGuardrail(classifier, options?): OutputGuardrail<unknown>;
```

Defined in: packages/security/src/inspect/injection-classifier.ts:94

**`Stable`**

Adapter for the output-guardrail surface: wrap a classifier
as an `OutputGuardrail` and add it to
`createAgent({ guardrails: { output: [...] } })`. Non-string
outputs pass through; classifier errors pass through (resilience
contract).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `classifier` | [`InjectionClassifier`](/api/@graphorin/security/interfaces/InjectionClassifier.md) |
| `options` | [`InjectionClassifierGuardrailOptions`](/api/@graphorin/security/interfaces/InjectionClassifierGuardrailOptions.md) |

## Returns

[`OutputGuardrail`](/api/@graphorin/security/type-aliases/OutputGuardrail.md)\&lt;`unknown`\&gt;
