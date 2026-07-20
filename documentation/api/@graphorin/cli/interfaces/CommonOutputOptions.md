[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / CommonOutputOptions

# Interface: CommonOutputOptions

Defined in: packages/cli/src/internal/output.ts:69

**`Stable`**

Common output options every Phase 15 command honours.

## Extended by

- [`AuditCommonOptions`](/api/@graphorin/cli/interfaces/AuditCommonOptions.md)
- [`AuthCommonOptions`](/api/@graphorin/cli/interfaces/AuthCommonOptions.md)
- [`ConsolidatorCommonOptions`](/api/@graphorin/cli/interfaces/ConsolidatorCommonOptions.md)
- [`DoctorCommandOptions`](/api/@graphorin/cli/interfaces/DoctorCommandOptions.md)
- [`GuardCommonOptions`](/api/@graphorin/cli/interfaces/GuardCommonOptions.md)
- [`MemoryCommonOptions`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md)
- [`MigrateConfigOptions`](/api/@graphorin/cli/interfaces/MigrateConfigOptions.md)
- [`MigrateExportOptions`](/api/@graphorin/cli/interfaces/MigrateExportOptions.md)
- [`PricingCommonOptions`](/api/@graphorin/cli/interfaces/PricingCommonOptions.md)
- [`SecretsCommonOptions`](/api/@graphorin/cli/interfaces/SecretsCommonOptions.md)
- [`SkillsCommonOptions`](/api/@graphorin/cli/interfaces/SkillsCommonOptions.md)
- [`StorageCommonOptions`](/api/@graphorin/cli/interfaces/StorageCommonOptions.md)
- [`TokenCommonOptions`](/api/@graphorin/cli/interfaces/TokenCommonOptions.md)
- [`TokenVerifyOptions`](/api/@graphorin/cli/interfaces/TokenVerifyOptions.md)
- [`ToolsLintOptions`](/api/@graphorin/cli/interfaces/ToolsLintOptions.md)
- [`TracesCommonOptions`](/api/@graphorin/cli/interfaces/TracesCommonOptions.md)
- [`TriggersCommonOptions`](/api/@graphorin/cli/interfaces/TriggersCommonOptions.md)
- [`WorkflowCommonOptions`](/api/@graphorin/cli/interfaces/WorkflowCommonOptions.md)

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-json"></a> `json?` | `readonly` | `boolean` | Emit a structured JSON document instead of human-readable text. | packages/cli/src/internal/output.ts:71 |
| <a id="property-jsonprint"></a> `jsonPrint?` | `readonly` | [`JsonSink`](/api/@graphorin/cli/type-aliases/JsonSink.md) | Test seam - capture JSON documents instead of writing to stdout. | packages/cli/src/internal/output.ts:77 |
| <a id="property-noninteractive"></a> `nonInteractive?` | `readonly` | `boolean` | Force `--non-interactive` semantics (skip prompts; require flags / env). | packages/cli/src/internal/output.ts:73 |
| <a id="property-print"></a> `print?` | `readonly` | [`PrintSink`](/api/@graphorin/cli/type-aliases/PrintSink.md) | Test seam - capture human lines instead of writing to stderr. | packages/cli/src/internal/output.ts:75 |
