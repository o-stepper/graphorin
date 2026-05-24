[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / SessionExportAuditRecord

# Interface: SessionExportAuditRecord

Defined in: packages/sessions/src/export/types.ts:166

Single audit row. Includes the audit-chain `prevHash` / `hash` when
the row was sourced from a tamper-evident audit DB so importers can
verify the chain segment.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-action"></a> `action` | `readonly` | `string` | packages/sessions/src/export/types.ts:169 |
| <a id="property-actor"></a> `actor?` | `readonly` | \{ `id`: `string`; `kind`: `string`; `label?`: `string`; \} | packages/sessions/src/export/types.ts:171 |
| `actor.id` | `readonly` | `string` | packages/sessions/src/export/types.ts:173 |
| `actor.kind` | `readonly` | `string` | packages/sessions/src/export/types.ts:172 |
| `actor.label?` | `readonly` | `string` | packages/sessions/src/export/types.ts:174 |
| <a id="property-at"></a> `at` | `readonly` | `string` | packages/sessions/src/export/types.ts:170 |
| <a id="property-hash"></a> `hash?` | `readonly` | `string` | packages/sessions/src/export/types.ts:178 |
| <a id="property-kind"></a> `kind` | `readonly` | `"audit"` | packages/sessions/src/export/types.ts:167 |
| <a id="property-metadata"></a> `metadata?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | packages/sessions/src/export/types.ts:176 |
| <a id="property-prevhash"></a> `prevHash?` | `readonly` | `string` | packages/sessions/src/export/types.ts:177 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | packages/sessions/src/export/types.ts:168 |
