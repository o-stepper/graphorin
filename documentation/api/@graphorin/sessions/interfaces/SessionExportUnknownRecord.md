[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / SessionExportUnknownRecord

# Interface: SessionExportUnknownRecord

Defined in: packages/sessions/src/export/types.ts:219

Forward-parse-resilient wrapper. Unknown record kinds are surfaced
via this shape so consumers can WARN + skip.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-kind"></a> `kind` | `readonly` | `"unknown"` | packages/sessions/src/export/types.ts:220 |
| <a id="property-raw"></a> `raw` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | packages/sessions/src/export/types.ts:221 |
