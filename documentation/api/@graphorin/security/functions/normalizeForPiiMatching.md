[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / normalizeForPiiMatching

# Function: normalizeForPiiMatching()

```ts
function normalizeForPiiMatching(text): string;
```

Defined in: [packages/security/src/guardrails/normalize.ts:41](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/normalize.ts#L41)

Case-preserving variant of [normalizeForMatching](/api/@graphorin/security/functions/normalizeForMatching.md) for the PII
catalogue (W-150): NFKC + zero-width strip WITHOUT lowercasing.
Several PII patterns are case-sensitive by design (IBAN's
`[A-Z]{2}\d{2}`, base58 BTC addresses), so the injection
catalogue's lowercase fold would break them. Both catalogues share
the same threat rationale - cheap character-injection obfuscation -
and now share the same Unicode pre-pass, differing only in case
handling.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |

## Returns

`string`

## Stable
