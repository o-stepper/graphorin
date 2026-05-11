[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / compareSensitivityTiers

# Function: compareSensitivityTiers()

```ts
function compareSensitivityTiers(a, b): number;
```

Defined in: packages/observability/src/redaction/validator.ts:285

Quickly compute the relative ordering of two sensitivity tiers.
Exposed because the tracer + replay layers need it without taking a
full dependency on the validator implementation.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `a` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) |
| `b` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) |

## Returns

`number`

## Stable
