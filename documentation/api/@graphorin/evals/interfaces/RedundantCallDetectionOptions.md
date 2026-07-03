[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / RedundantCallDetectionOptions

# Interface: RedundantCallDetectionOptions

Defined in: evals/src/scorers/trajectory/redundant-call-detection.ts:16

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-ignore"></a> `ignore?` | `readonly` | readonly `string`[] | Tool names exempt from the check (legitimately repeatable). | evals/src/scorers/trajectory/redundant-call-detection.ts:20 |
| <a id="property-maxredundant"></a> `maxRedundant?` | `readonly` | `number` | Maximum tolerated redundant repeats before the scorer fails. Default `0`. | evals/src/scorers/trajectory/redundant-call-detection.ts:18 |
| <a id="property-name"></a> `name?` | `readonly` | `string` | Optional name override. | evals/src/scorers/trajectory/redundant-call-detection.ts:22 |
