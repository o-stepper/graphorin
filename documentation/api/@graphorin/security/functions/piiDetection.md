[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / piiDetection

# Function: piiDetection()

```ts
function piiDetection<TValue>(opts?): GuardrailDefinition<TValue>;
```

Defined in: packages/security/src/guardrails/builtins/pii-detection.ts:98

Construct the PII detection guardrail.

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

## Stable
