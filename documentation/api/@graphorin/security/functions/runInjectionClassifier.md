[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / runInjectionClassifier

# Function: runInjectionClassifier()

```ts
function runInjectionClassifier(classifier, input): Promise<
  | InjectionClassification
| null>;
```

Defined in: packages/security/src/inspect/injection-classifier.ts:64

**`Stable`**

Resilient invocation helper: `undefined` classifier, a rejected
promise or a thrown error all yield `null` - the calling surface
proceeds on its regex verdict alone. This is the ONLY sanctioned
way framework surfaces consult a classifier.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `classifier` | \| [`InjectionClassifier`](/api/@graphorin/security/interfaces/InjectionClassifier.md) \| `null` \| `undefined` |
| `input` | [`InjectionClassifierInput`](/api/@graphorin/security/interfaces/InjectionClassifierInput.md) |

## Returns

`Promise`\<
  \| [`InjectionClassification`](/api/@graphorin/security/interfaces/InjectionClassification.md)
  \| `null`\>
