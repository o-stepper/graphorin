[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / RedactionValidatorInstance

# Interface: RedactionValidatorInstance

Defined in: [packages/observability/src/redaction/types.ts:111](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/redaction/types.ts#L111)

Concrete validator returned by [createRedactionValidator](/api/@graphorin/observability/functions/createRedactionValidator.md).

## Stable

## Extends

- [`RedactionValidator`](/api/@graphorin/observability/interfaces/RedactionValidator.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-counters"></a> `counters` | `readonly` | () => [`RedactionCounters`](/api/@graphorin/observability/interfaces/RedactionCounters.md) | Snapshot of internal counters. Returned object is a fresh copy. | - | [packages/observability/src/redaction/types.ts:113](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/redaction/types.ts#L113) |
| <a id="property-id"></a> `id` | `readonly` | `string` | Identifier of the policy in use (`'default-deny-internal'`, …). | [`RedactionValidator`](/api/@graphorin/observability/interfaces/RedactionValidator.md).[`id`](/api/@graphorin/observability/interfaces/RedactionValidator.md#property-id) | [packages/core/dist/contracts/redaction-validator.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/redaction-validator.d.ts) |
| <a id="property-mintier"></a> `minTier` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | Lowest tier that may pass through the validator. | [`RedactionValidator`](/api/@graphorin/observability/interfaces/RedactionValidator.md).[`minTier`](/api/@graphorin/observability/interfaces/RedactionValidator.md#property-mintier) | [packages/core/dist/contracts/redaction-validator.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/redaction-validator.d.ts) |
| <a id="property-resetcounters"></a> `resetCounters` | `readonly` | () => `void` | Reset all counters back to zero. | - | [packages/observability/src/redaction/types.ts:115](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/redaction/types.ts#L115) |

## Methods

### validate()

```ts
validate(input): 
  | RedactionOutput
  | null;
```

Defined in: [packages/core/dist/contracts/redaction-validator.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/redaction-validator.d.ts)

Validate (and optionally rewrite) an attribute payload. Returns the
sanitized value or `null` if the entire record must be dropped.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`RedactionInput`](/api/@graphorin/observability/interfaces/RedactionInput.md) |

#### Returns

  \| [`RedactionOutput`](/api/@graphorin/observability/interfaces/RedactionOutput.md)
  \| `null`

#### Inherited from

[`RedactionValidator`](/api/@graphorin/observability/interfaces/RedactionValidator.md).[`validate`](/api/@graphorin/observability/interfaces/RedactionValidator.md#validate)
