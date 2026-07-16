[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / containsPii

# Function: containsPii()

```ts
function containsPii(text, patterns?): boolean;
```

Defined in: [packages/security/src/guardrails/builtins/pii-detection.ts:103](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/builtins/pii-detection.ts#L103)

SDF-8 / FIDES-lattice: does `text` contain any catalogued PII (email, SSN,
phone, Luhn-valid card, …)? A pure, allocation-light predicate that returns on
the first valid match and honours per-pattern `validate` (e.g. Luhn). Used to
feed user/PII content into the dataflow taint ledger's `sensitiveSeen` leg so
PII exfiltration trips the lethal-trifecta gate even without a `'secret'` tag.

## Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `text` | `string` | `undefined` |
| `patterns` | readonly [`PiiPattern`](/api/@graphorin/security/interfaces/PiiPattern.md)[] | `DEFAULT_PII_PATTERNS` |

## Returns

`boolean`

## Stable
