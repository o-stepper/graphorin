[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / CassetteAuditRecord

# Interface: CassetteAuditRecord

Defined in: packages/sessions/src/cassette/types.ts:167

**`Stable`**

Audit row segment carried in the cassette so the chain-segment can
be verified post-mortem.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-action"></a> `action` | `readonly` | `string` | packages/sessions/src/cassette/types.ts:169 |
| <a id="property-hash"></a> `hash?` | `readonly` | `string` | packages/sessions/src/cassette/types.ts:172 |
| <a id="property-kind"></a> `kind` | `readonly` | `"audit"` | packages/sessions/src/cassette/types.ts:168 |
| <a id="property-metadata"></a> `metadata?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | packages/sessions/src/cassette/types.ts:170 |
| <a id="property-prevhash"></a> `prevHash?` | `readonly` | `string` | packages/sessions/src/cassette/types.ts:171 |
