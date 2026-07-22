[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / ArgsTaintProbe

# Interface: ArgsTaintProbe

Defined in: packages/security/src/dataflow/types.ts:102

**`Stable`**

Result of probing a candidate sink's arguments against a
[TaintLedger](/api/@graphorin/security/interfaces/TaintLedger.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-carriesuntrustedverbatim"></a> `carriesUntrustedVerbatim` | `readonly` | `boolean` | `true` when the serialized arguments share a substantial verbatim span with previously-recorded untrusted output (best-effort: catches verbatim / near-verbatim forwarding, not paraphrase). | packages/security/src/dataflow/types.ts:108 |
| <a id="property-matchedsourcekinds"></a> `matchedSourceKinds` | `readonly` | readonly `string`[] | Untrusted source kinds whose recorded output matched the arguments. | packages/security/src/dataflow/types.ts:110 |
