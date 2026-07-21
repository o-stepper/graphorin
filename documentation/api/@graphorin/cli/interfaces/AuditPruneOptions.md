[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / AuditPruneOptions

# Interface: AuditPruneOptions

Defined in: packages/cli/src/commands/audit.ts:125

**`Stable`**

## Extends

- [`AuditCommonOptions`](/api/@graphorin/cli/interfaces/AuditCommonOptions.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-before"></a> `before` | `readonly` | `string` | ISO-8601 date / `YYYY-MM-DD` / millis-since-epoch. The helper drops entries older than this cutoff. | - | packages/cli/src/commands/audit.ts:130 |
| <a id="property-config"></a> `config?` | `readonly` | `string` | - | [`AuditCommonOptions`](/api/@graphorin/cli/interfaces/AuditCommonOptions.md).[`config`](/api/@graphorin/cli/interfaces/AuditCommonOptions.md#property-config) | packages/cli/src/commands/audit.ts:56 |
| <a id="property-json"></a> `json?` | `readonly` | `boolean` | Emit a structured JSON document instead of human-readable text. | [`AuditCommonOptions`](/api/@graphorin/cli/interfaces/AuditCommonOptions.md).[`json`](/api/@graphorin/cli/interfaces/AuditCommonOptions.md#property-json) | packages/cli/src/internal/output.ts:71 |
| <a id="property-jsonprint"></a> `jsonPrint?` | `readonly` | [`JsonSink`](/api/@graphorin/cli/type-aliases/JsonSink.md) | Test seam - capture JSON documents instead of writing to stdout. | [`AuditCommonOptions`](/api/@graphorin/cli/interfaces/AuditCommonOptions.md).[`jsonPrint`](/api/@graphorin/cli/interfaces/AuditCommonOptions.md#property-jsonprint) | packages/cli/src/internal/output.ts:77 |
| <a id="property-noninteractive"></a> `nonInteractive?` | `readonly` | `boolean` | Force `--non-interactive` semantics (skip prompts; require flags / env). | [`AuditCommonOptions`](/api/@graphorin/cli/interfaces/AuditCommonOptions.md).[`nonInteractive`](/api/@graphorin/cli/interfaces/AuditCommonOptions.md#property-noninteractive) | packages/cli/src/internal/output.ts:73 |
| <a id="property-print"></a> `print?` | `readonly` | [`PrintSink`](/api/@graphorin/cli/type-aliases/PrintSink.md) | Test seam - capture human lines instead of writing to stderr. | [`AuditCommonOptions`](/api/@graphorin/cli/interfaces/AuditCommonOptions.md).[`print`](/api/@graphorin/cli/interfaces/AuditCommonOptions.md#property-print) | packages/cli/src/internal/output.ts:75 |
| <a id="property-retain"></a> `retain?` | `readonly` | `number` | Minimum number of entries that must survive. Default `1`. | - | packages/cli/src/commands/audit.ts:132 |
