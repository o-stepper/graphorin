[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / TaintLedgerSnapshot

# Interface: TaintLedgerSnapshot

Defined in: packages/security/src/dataflow/types.ts:140

Serializable coarse summary of a [TaintLedger](/api/@graphorin/security/interfaces/TaintLedger.md) — the trifecta-gate
flags only. Round-trips through `createTaintLedger({ initial })`. Carries no
untrusted text content, so it is safe to persist in a `RunState`.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-sensitiveseen"></a> `sensitiveSeen` | `readonly` | `boolean` | packages/security/src/dataflow/types.ts:142 |
| <a id="property-untrustedseen"></a> `untrustedSeen` | `readonly` | `boolean` | packages/security/src/dataflow/types.ts:141 |
| <a id="property-untrustedsourcekinds"></a> `untrustedSourceKinds` | `readonly` | readonly `string`[] | packages/security/src/dataflow/types.ts:143 |
