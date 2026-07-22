[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / SessionExportFooterRecord

# Interface: SessionExportFooterRecord

Defined in: packages/sessions/src/export/types.ts:186

**`Stable`**

Sentinel footer (always last line).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentcount"></a> `agentCount` | `readonly` | `number` | - | packages/sessions/src/export/types.ts:191 |
| <a id="property-checksum"></a> `checksum?` | `readonly` | `string` | SHA-256 of the body lines (everything between header + footer), only when `--hash`. | packages/sessions/src/export/types.ts:193 |
| <a id="property-cipher"></a> `cipher?` | `readonly` | `"aes256gcm"` \| `"chacha20-poly1305"` | When `--encrypt`, the cipher used so importers can fail fast. | packages/sessions/src/export/types.ts:196 |
| <a id="property-handoffcount"></a> `handoffCount` | `readonly` | `number` | - | packages/sessions/src/export/types.ts:190 |
| <a id="property-kind"></a> `kind` | `readonly` | `"footer"` | - | packages/sessions/src/export/types.ts:187 |
| <a id="property-messagecount"></a> `messageCount` | `readonly` | `number` | - | packages/sessions/src/export/types.ts:189 |
| <a id="property-recordcount"></a> `recordCount` | `readonly` | `number` | - | packages/sessions/src/export/types.ts:188 |
| <a id="property-writtenatiso"></a> `writtenAtIso` | `readonly` | `string` | - | packages/sessions/src/export/types.ts:194 |
