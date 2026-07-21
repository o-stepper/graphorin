[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / RunTaintSummary

# Interface: RunTaintSummary

Defined in: packages/core/src/types/run.ts:232

**`Stable`**

Coarse, serializable data-flow taint summary persisted in [RunState](/api/@graphorin/core/interfaces/RunState.md)
across suspend/resume. Structurally identical to
`@graphorin/security`'s `TaintLedgerSnapshot`; carries no untrusted text.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-sensitiveseen"></a> `sensitiveSeen` | `readonly` | `boolean` | - | packages/core/src/types/run.ts:234 |
| <a id="property-spantilehashes"></a> `spanTileHashes?` | `readonly` | readonly `string`[] | One-way FNV-1a hashes of normalized untrusted-span tiles. Re-arms the verbatim-carry probe after a resume at tile granularity. Hashes only - no untrusted text is ever persisted (the invariant above holds). | packages/core/src/types/run.ts:242 |
| <a id="property-untrustedseen"></a> `untrustedSeen` | `readonly` | `boolean` | - | packages/core/src/types/run.ts:233 |
| <a id="property-untrustedsourcekinds"></a> `untrustedSourceKinds` | `readonly` | readonly `string`[] | - | packages/core/src/types/run.ts:235 |
