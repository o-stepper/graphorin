[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / ToolCassetteUnknownRecord

# Interface: ToolCassetteUnknownRecord

Defined in: packages/sessions/src/cassette/types.ts:210

Forward-parse-resilient wrapper. Unknown record kinds are surfaced
via this shape so callers can WARN + skip.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-kind"></a> `kind` | `readonly` | `"unknown"` | packages/sessions/src/cassette/types.ts:211 |
| <a id="property-raw"></a> `raw` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | packages/sessions/src/cassette/types.ts:212 |
