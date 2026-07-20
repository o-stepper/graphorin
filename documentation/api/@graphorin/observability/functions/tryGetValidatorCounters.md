[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / tryGetValidatorCounters

# Function: tryGetValidatorCounters()

```ts
function tryGetValidatorCounters(validator): RedactionCounters;
```

Defined in: packages/observability/src/exporters/with-validation.ts:212

**`Stable`**

Pull the counters out of any exporter wrapped by [withValidation](/api/@graphorin/observability/functions/withValidation.md).
Returns `null` for exporters that were never wrapped.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `validator` | [`RedactionValidatorInstance`](/api/@graphorin/observability/interfaces/RedactionValidatorInstance.md) |

## Returns

[`RedactionCounters`](/api/@graphorin/observability/interfaces/RedactionCounters.md)
