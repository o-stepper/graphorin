[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / CassetteAuditRecord

# Interface: CassetteAuditRecord

Defined in: [packages/sessions/src/cassette/types.ts:167](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/cassette/types.ts#L167)

Audit row segment carried in the cassette so the chain-segment can
be verified post-mortem.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-action"></a> `action` | `readonly` | `string` | [packages/sessions/src/cassette/types.ts:169](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/cassette/types.ts#L169) |
| <a id="property-hash"></a> `hash?` | `readonly` | `string` | [packages/sessions/src/cassette/types.ts:172](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/cassette/types.ts#L172) |
| <a id="property-kind"></a> `kind` | `readonly` | `"audit"` | [packages/sessions/src/cassette/types.ts:168](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/cassette/types.ts#L168) |
| <a id="property-metadata"></a> `metadata?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | [packages/sessions/src/cassette/types.ts:170](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/cassette/types.ts#L170) |
| <a id="property-prevhash"></a> `prevHash?` | `readonly` | `string` | [packages/sessions/src/cassette/types.ts:171](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/cassette/types.ts#L171) |
