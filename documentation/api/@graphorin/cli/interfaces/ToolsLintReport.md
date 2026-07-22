[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / ToolsLintReport

# Interface: ToolsLintReport

Defined in: packages/cli/src/commands/tools-lint.ts:117

**`Stable`**

Documented JSON shape emitted on `--format json`. The shape is
stable + forward-compatible with the `@eslint/mcp` industry
direction (per-finding `rule` / `severity` / `message` / `location`
mirror the ESLint LSP convention).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-summary"></a> `summary` | `readonly` | \{ `failed`: `number`; `passed`: `number`; `threshold`: `number`; `totalFindings`: `number`; `totalTools`: `number`; \} | packages/cli/src/commands/tools-lint.ts:118 |
| `summary.failed` | `readonly` | `number` | packages/cli/src/commands/tools-lint.ts:123 |
| `summary.passed` | `readonly` | `number` | packages/cli/src/commands/tools-lint.ts:122 |
| `summary.threshold` | `readonly` | `number` | packages/cli/src/commands/tools-lint.ts:121 |
| `summary.totalFindings` | `readonly` | `number` | packages/cli/src/commands/tools-lint.ts:120 |
| `summary.totalTools` | `readonly` | `number` | packages/cli/src/commands/tools-lint.ts:119 |
| <a id="property-tools"></a> `tools` | `readonly` | readonly [`ToolsLintReportTool`](/api/@graphorin/cli/interfaces/ToolsLintReportTool.md)[] | packages/cli/src/commands/tools-lint.ts:125 |
