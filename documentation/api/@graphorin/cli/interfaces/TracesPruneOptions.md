[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / TracesPruneOptions

# Interface: TracesPruneOptions

Defined in: packages/cli/src/commands/traces.ts:96

**`Stable`**

## Extends

- [`TracesCommonOptions`](/api/@graphorin/cli/interfaces/TracesCommonOptions.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-before"></a> `before` | `readonly` | `string` | ISO date / epoch ms cutoff. Required so the helper never silently empties the table. | - | packages/cli/src/commands/traces.ts:99 |
| <a id="property-config"></a> `config?` | `readonly` | `string` | - | [`TracesCommonOptions`](/api/@graphorin/cli/interfaces/TracesCommonOptions.md).[`config`](/api/@graphorin/cli/interfaces/TracesCommonOptions.md#property-config) | packages/cli/src/commands/traces.ts:33 |
| <a id="property-json"></a> `json?` | `readonly` | `boolean` | Emit a structured JSON document instead of human-readable text. | [`TracesCommonOptions`](/api/@graphorin/cli/interfaces/TracesCommonOptions.md).[`json`](/api/@graphorin/cli/interfaces/TracesCommonOptions.md#property-json) | packages/cli/src/internal/output.ts:71 |
| <a id="property-jsonprint"></a> `jsonPrint?` | `readonly` | [`JsonSink`](/api/@graphorin/cli/type-aliases/JsonSink.md) | Test seam - capture JSON documents instead of writing to stdout. | [`TracesCommonOptions`](/api/@graphorin/cli/interfaces/TracesCommonOptions.md).[`jsonPrint`](/api/@graphorin/cli/interfaces/TracesCommonOptions.md#property-jsonprint) | packages/cli/src/internal/output.ts:77 |
| <a id="property-noninteractive"></a> `nonInteractive?` | `readonly` | `boolean` | Force `--non-interactive` semantics (skip prompts; require flags / env). | [`TracesCommonOptions`](/api/@graphorin/cli/interfaces/TracesCommonOptions.md).[`nonInteractive`](/api/@graphorin/cli/interfaces/TracesCommonOptions.md#property-noninteractive) | packages/cli/src/internal/output.ts:73 |
| <a id="property-print"></a> `print?` | `readonly` | [`PrintSink`](/api/@graphorin/cli/type-aliases/PrintSink.md) | Test seam - capture human lines instead of writing to stderr. | [`TracesCommonOptions`](/api/@graphorin/cli/interfaces/TracesCommonOptions.md).[`print`](/api/@graphorin/cli/interfaces/TracesCommonOptions.md#property-print) | packages/cli/src/internal/output.ts:75 |
