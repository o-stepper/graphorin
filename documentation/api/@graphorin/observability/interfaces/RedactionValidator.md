[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / RedactionValidator

# Interface: RedactionValidator

Defined in: [packages/core/dist/contracts/redaction-validator.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/redaction-validator.d.ts)

**`Stable`**

Wraps every observability exporter (OTLP, console, JSONL replay log,
…) and refuses to forward attributes that exceed the configured
sensitivity floor or that contain matched secret / PII patterns.

Concrete patterns and the default policy live in
`@graphorin/observability`; the interface lives here so every package
(server, agent, workflow, …) can require a `RedactionValidator` in its
config without taking an observability dependency.

## Extended by

- [`RedactionValidatorInstance`](/api/@graphorin/observability/interfaces/RedactionValidatorInstance.md)

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | Identifier of the policy in use (`'default-deny-internal'`, …). | [packages/core/dist/contracts/redaction-validator.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/redaction-validator.d.ts) |
| <a id="property-mintier"></a> `minTier` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | Lowest tier that may pass through the validator. | [packages/core/dist/contracts/redaction-validator.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/redaction-validator.d.ts) |

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
