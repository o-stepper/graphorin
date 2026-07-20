[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / createRedactionValidator

# Function: createRedactionValidator()

```ts
function createRedactionValidator(opts?): RedactionValidatorInstance;
```

Defined in: packages/observability/src/redaction/validator.ts:186

**`Stable`**

Create a [RedactionValidator](/api/@graphorin/observability/interfaces/RedactionValidator.md) configured against the supplied
options. The result implements both the `RedactionValidator`
contract from `@graphorin/core` and the
[RedactionValidatorInstance](/api/@graphorin/observability/interfaces/RedactionValidatorInstance.md) extension surface (counters +
reset).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`RedactionValidatorOptions`](/api/@graphorin/observability/interfaces/RedactionValidatorOptions.md) |

## Returns

[`RedactionValidatorInstance`](/api/@graphorin/observability/interfaces/RedactionValidatorInstance.md)
