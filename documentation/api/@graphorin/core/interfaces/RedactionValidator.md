[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / RedactionValidator

# Interface: RedactionValidator

Defined in: packages/core/src/contracts/redaction-validator.ts:15

Wraps every observability exporter (OTLP, console, JSONL replay log,
…) and refuses to forward attributes that exceed the configured
sensitivity floor or that contain matched secret / PII patterns.

Concrete patterns and the default policy live in
`@graphorin/observability`; the interface lives here so every package
(server, agent, workflow, …) can require a `RedactionValidator` in its
config without taking an observability dependency.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | Identifier of the policy in use (`'default-deny-internal'`, …). | packages/core/src/contracts/redaction-validator.ts:17 |
| <a id="property-mintier"></a> `minTier` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | Lowest tier that may pass through the validator. | packages/core/src/contracts/redaction-validator.ts:19 |

## Methods

### validate()

```ts
validate(input): 
  | RedactionOutput
  | null;
```

Defined in: packages/core/src/contracts/redaction-validator.ts:24

Validate (and optionally rewrite) an attribute payload. Returns the
sanitized value or `null` if the entire record must be dropped.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`RedactionInput`](/api/@graphorin/core/interfaces/RedactionInput.md) |

#### Returns

  \| [`RedactionOutput`](/api/@graphorin/core/interfaces/RedactionOutput.md)
  \| `null`
