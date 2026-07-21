[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / piiDetection

# Function: piiDetection()

```ts
function piiDetection<TValue>(opts?): GuardrailDefinition<TValue>;
```

Defined in: packages/security/src/guardrails/builtins/pii-detection.ts:153

**`Stable`**

Construct the PII detection guardrail.

Note on normalization: the boolean detect predicate
([containsPii](/api/@graphorin/security/functions/containsPii.md)) matches against the NFKC + zero-width-stripped
form of the text, so cheap character-injection obfuscation cannot
dodge detection. The guardrail's REWRITE path (`redactText` /
`redactValue`) deliberately keeps matching the raw text: offset-based
replacement needs the original string, and a normalized-offset remap
is not worth the complexity for a best-effort redactor.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TValue` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`PiiDetectionOptions`](/api/@graphorin/security/interfaces/PiiDetectionOptions.md) |

## Returns

[`GuardrailDefinition`](/api/@graphorin/security/interfaces/GuardrailDefinition.md)\&lt;`TValue`\&gt;
