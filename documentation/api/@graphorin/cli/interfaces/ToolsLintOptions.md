[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / ToolsLintOptions

# Interface: ToolsLintOptions

Defined in: packages/cli/src/commands/tools-lint.ts:85

**`Stable`**

## Extends

- `CommonOutputOptions`

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-config"></a> `config?` | `readonly` | `string` | Optional path to a `tsconfig.json` whose `include` overrides the file glob. | - | packages/cli/src/commands/tools-lint.ts:87 |
| <a id="property-countersink"></a> `counterSink?` | `readonly` | `ToolsLintCounterSink` | Optional sink for the `tool.lint.threshold.violations.total` counter. The CLI calls this once per below-threshold tool per invocation. Default: no-op. | - | packages/cli/src/commands/tools-lint.ts:106 |
| <a id="property-cwd"></a> `cwd?` | `readonly` | `string` | Override `cwd`. Default `process.cwd()`. | - | packages/cli/src/commands/tools-lint.ts:95 |
| <a id="property-format"></a> `format?` | `readonly` | `"json"` \| `"text"` | Output format. Default `'text'`. | - | packages/cli/src/commands/tools-lint.ts:91 |
| <a id="property-inlinesources"></a> `inlineSources?` | `readonly` | readonly \{ `file`: `string`; `source`: `string`; \}[] | Test seam - supply a list of `(file, source)` pairs directly so the test does not need to fish around the filesystem. | - | packages/cli/src/commands/tools-lint.ts:100 |
| <a id="property-json"></a> `json?` | `readonly` | `boolean` | Emit a structured JSON document instead of human-readable text. | `CommonOutputOptions.json` | packages/cli/src/internal/output.ts:71 |
| <a id="property-jsonprint"></a> `jsonPrint?` | `readonly` | `JsonSink` | Test seam - capture JSON documents instead of writing to stdout. | `CommonOutputOptions.jsonPrint` | packages/cli/src/internal/output.ts:77 |
| <a id="property-noninteractive"></a> `nonInteractive?` | `readonly` | `boolean` | Force `--non-interactive` semantics (skip prompts; require flags / env). | `CommonOutputOptions.nonInteractive` | packages/cli/src/internal/output.ts:73 |
| <a id="property-print"></a> `print?` | `readonly` | `PrintSink` | Test seam - capture human lines instead of writing to stderr. | `CommonOutputOptions.print` | packages/cli/src/internal/output.ts:75 |
| <a id="property-source"></a> `source?` | `readonly` | `string` | Optional override of the file glob pattern. | - | packages/cli/src/commands/tools-lint.ts:93 |
| <a id="property-threshold"></a> `threshold?` | `readonly` | `number` | Minimum acceptable per-tool score. Default `60`. | - | packages/cli/src/commands/tools-lint.ts:89 |
