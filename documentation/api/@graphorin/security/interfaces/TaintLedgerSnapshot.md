[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / TaintLedgerSnapshot

# Interface: TaintLedgerSnapshot

Defined in: packages/security/src/dataflow/types.ts:170

**`Stable`**

Serializable coarse summary of a [TaintLedger](/api/@graphorin/security/interfaces/TaintLedger.md) - the trifecta-gate
flags only. Round-trips through `createTaintLedger({ initial })`. Carries no
untrusted text content, so it is safe to persist in a `RunState`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-sensitiveseen"></a> `sensitiveSeen` | `readonly` | `boolean` | - | packages/security/src/dataflow/types.ts:172 |
| <a id="property-spantilehashes"></a> `spanTileHashes?` | `readonly` | readonly `string`[] | C6: one-way FNV-1a hashes of non-overlapping normalized-text tiles of the tracked untrusted spans (stride = the probe window). Lets a resumed run re-arm the verbatim probe for content ingested BEFORE the suspend without persisting any untrusted text (hashes only). A rehydrated probe detects copies of at least `2*window-1` normalized chars; live spans recorded after the resume keep full stride-1 sensitivity. | packages/security/src/dataflow/types.ts:183 |
| <a id="property-untrustedseen"></a> `untrustedSeen` | `readonly` | `boolean` | - | packages/security/src/dataflow/types.ts:171 |
| <a id="property-untrustedsourcekinds"></a> `untrustedSourceKinds` | `readonly` | readonly `string`[] | - | packages/security/src/dataflow/types.ts:173 |
