[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / VerificationResult

# Interface: VerificationResult

Defined in: packages/memory/src/consolidator/phases/induce.ts:113

Result of self-verifying a reuse against an induced procedure's criteria.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-unmet"></a> `unmet` | `readonly` | readonly `string`[] | Criteria not satisfied by the observed signals. | packages/memory/src/consolidator/phases/induce.ts:117 |
| <a id="property-verified"></a> `verified` | `readonly` | `boolean` | True only when the procedure has criteria and every one is met. | packages/memory/src/consolidator/phases/induce.ts:115 |
