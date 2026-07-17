[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / RunTaintSummary

# Interface: RunTaintSummary

Defined in: [packages/core/src/types/run.ts:225](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L225)

Coarse, serializable data-flow taint summary persisted in [RunState](/api/@graphorin/core/interfaces/RunState.md)
across suspend/resume (AG-19). Structurally identical to
`@graphorin/security`'s `TaintLedgerSnapshot`; carries no untrusted text.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-sensitiveseen"></a> `sensitiveSeen` | `readonly` | `boolean` | - | [packages/core/src/types/run.ts:227](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L227) |
| <a id="property-spantilehashes"></a> `spanTileHashes?` | `readonly` | readonly `string`[] | C6: one-way FNV-1a hashes of normalized untrusted-span tiles. Re-arms the verbatim-carry probe after a resume at tile granularity. Hashes only - no untrusted text is ever persisted (the invariant above holds). | [packages/core/src/types/run.ts:235](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L235) |
| <a id="property-untrustedseen"></a> `untrustedSeen` | `readonly` | `boolean` | - | [packages/core/src/types/run.ts:226](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L226) |
| <a id="property-untrustedsourcekinds"></a> `untrustedSourceKinds` | `readonly` | readonly `string`[] | - | [packages/core/src/types/run.ts:228](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L228) |
