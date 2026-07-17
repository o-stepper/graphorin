[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / MemoryMigrateOptions

# Interface: MemoryMigrateOptions

Defined in: [packages/cli/src/commands/memory.ts:116](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L116)

## Stable

## Extends

- [`MemoryCommonOptions`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-batchsize"></a> `batchSize?` | `readonly` | `number` | Rows per re-embed batch (wave-D D5). Default `512`. | - | [packages/cli/src/commands/memory.ts:131](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L131) |
| <a id="property-config"></a> `config?` | `readonly` | `string` | - | [`MemoryCommonOptions`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md).[`config`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md#property-config) | [packages/cli/src/commands/memory.ts:39](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L39) |
| <a id="property-embeddersmodule"></a> `embeddersModule?` | `readonly` | `string` | Path to a JS module exporting an `embedders` object keyed by canonical embedder id, each value a zero-arg factory returning an `EmbedderProvider` (sync or promise). The CLI imports this module so it can construct the source / target embedder instances the runner needs (DEC-154: the framework never downloads models implicitly). Without the module the command exits `2` with a pointer. | - | [packages/cli/src/commands/memory.ts:129](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L129) |
| <a id="property-from"></a> `from` | `readonly` | `string` | - | - | [packages/cli/src/commands/memory.ts:117](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L117) |
| <a id="property-json"></a> `json?` | `readonly` | `boolean` | Emit a structured JSON document instead of human-readable text. | [`MemoryCommonOptions`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md).[`json`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md#property-json) | [packages/cli/src/internal/output.ts:71](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L71) |
| <a id="property-jsonprint"></a> `jsonPrint?` | `readonly` | `JsonSink` | Test seam - capture JSON documents instead of writing to stdout. | [`MemoryCommonOptions`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md).[`jsonPrint`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md#property-jsonprint) | [packages/cli/src/internal/output.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L77) |
| <a id="property-noninteractive"></a> `nonInteractive?` | `readonly` | `boolean` | Force `--non-interactive` semantics (skip prompts; require flags / env). | [`MemoryCommonOptions`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md).[`nonInteractive`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md#property-noninteractive) | [packages/cli/src/internal/output.ts:73](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L73) |
| <a id="property-print"></a> `print?` | `readonly` | `PrintSink` | Test seam - capture human lines instead of writing to stderr. | [`MemoryCommonOptions`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md).[`print`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md#property-print) | [packages/cli/src/internal/output.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L75) |
| <a id="property-reclaim"></a> `reclaim?` | `readonly` | `boolean` | After a committed migration, drop the RETIRED embedders' vector sidecar tables and run `PRAGMA incremental_vacuum` (wave-D D5 space reclaim). Default `false`. | - | [packages/cli/src/commands/memory.ts:137](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L137) |
| <a id="property-strategy"></a> `strategy` | `readonly` | `"lock-on-first"` \| `"auto-migrate"` \| `"multi-active"` | - | - | [packages/cli/src/commands/memory.ts:119](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L119) |
| <a id="property-to"></a> `to` | `readonly` | `string` | - | - | [packages/cli/src/commands/memory.ts:118](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L118) |
