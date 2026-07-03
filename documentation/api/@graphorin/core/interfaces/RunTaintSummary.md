[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / RunTaintSummary

# Interface: RunTaintSummary

Defined in: packages/core/src/types/run.ts:105

Coarse, serializable data-flow taint summary persisted in [RunState](/api/@graphorin/core/interfaces/RunState.md)
across suspend/resume (AG-19). Structurally identical to
`@graphorin/security`'s `TaintLedgerSnapshot`; carries no untrusted text.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-sensitiveseen"></a> `sensitiveSeen` | `readonly` | `boolean` | packages/core/src/types/run.ts:107 |
| <a id="property-untrustedseen"></a> `untrustedSeen` | `readonly` | `boolean` | packages/core/src/types/run.ts:106 |
| <a id="property-untrustedsourcekinds"></a> `untrustedSourceKinds` | `readonly` | readonly `string`[] | packages/core/src/types/run.ts:108 |
